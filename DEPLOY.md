# Deploying the Blog app to the Contabo VPS

Runs the NestJS backend + Next.js frontend in Docker (with Redis + Qdrant
containers; MongoDB is **Atlas**, external), bound to localhost and fronted by
the existing nginx on two subdomains:

```
blog.shehzaib.com     -> frontend  (Next.js, 127.0.0.1:8082)
blogapi.shehzaib.com  -> backend   (NestJS + websockets, 127.0.0.1:3002)
                          backend -> Redis + Qdrant (containers) + MongoDB Atlas (external)
```

The two repos must be cloned **side by side** (the compose file references the
frontend at `../Blog-Application-Frontend`).

---

## 1. DNS (Namecheap → shehzaib.com → Advanced DNS)

Add **two** A records, both pointing at the VPS:

| Type | Host | Value |
|------|--------|-----------------|
| A | `blog` | `109.123.244.167` |
| A | `blogapi` | `109.123.244.167` |

Verify before requesting certs:
```bash
dig +short blog.shehzaib.com
dig +short blogapi.shehzaib.com
```

## 2. MongoDB Atlas — allowlist the VPS

Atlas → **Network Access** → add IP `109.123.244.167` (or confirm `0.0.0.0/0`),
otherwise the backend can't connect.

## 3. Clone both repos (side by side)

```bash
mkdir -p /opt/blog && cd /opt/blog
git clone https://github.com/muhammadshehzaib/Blog-Application.git
git clone https://github.com/muhammadshehzaib/Blog-Application-Frontend.git
cd /opt/blog/Blog-Application
```

## 4. Configure `.env`

```bash
cd /opt/blog/Blog-Application
cp .env.example .env
nano .env
```
Fill in:
- `DBURI` — your Atlas connection string
- `JWT_SECRET` — generate a strong one: `openssl rand -base64 48`
- `DEPLOYMENTLINK=https://blog.shehzaib.com` (frontend origin, for CORS)
- `FRONTEND_API_URL=https://blogapi.shehzaib.com` (public backend URL, baked into the frontend)
- `CLOUDINARY_*` (required)
- `EMAIL` / `PASSWORD` (Gmail app password, optional)
- `AI_API_KEY` (**required** — backend won't boot without it), plus `AI_BASE_URL` / `AI_MODEL` / `AI_EMBEDDING_MODEL`

> `FRONTEND_API_URL` is baked into the frontend at build time. If you change it
> later, rebuild: `docker compose up -d --build frontend`.

## 5. Build & start

```bash
cd /opt/blog/Blog-Application
docker compose up -d --build
docker compose ps
curl -s http://127.0.0.1:3002/health; echo     # backend health
curl -sI http://127.0.0.1:8082 | head -1        # frontend -> HTTP 200
```
If the backend isn't healthy: `docker compose logs backend --tail 50`.

## 6. nginx — two server blocks

**Backend (`blogapi.shehzaib.com`) — needs websocket upgrade for Socket.IO:**
```bash
cat > /etc/nginx/sites-available/blogapi.shehzaib.com <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name blogapi.shehzaib.com;

    client_max_body_size 25m;   # image uploads

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_read_timeout 3600s;   # keep websockets alive
    }
}
EOF
```

**Frontend (`blog.shehzaib.com`):**
```bash
cat > /etc/nginx/sites-available/blog.shehzaib.com <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name blog.shehzaib.com;

    location / {
        proxy_pass http://127.0.0.1:8082;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
    }
}
EOF
```

Enable + reload:
```bash
ln -s /etc/nginx/sites-available/blogapi.shehzaib.com /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/blog.shehzaib.com    /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## 7. HTTPS (snap certbot — apt is currently broken on this box)

```bash
certbot --version || snap install --classic certbot
ln -s /snap/bin/certbot /usr/bin/certbot 2>/dev/null
certbot --nginx -d blog.shehzaib.com -d blogapi.shehzaib.com
```
Choose redirect (HTTP→HTTPS).

## 8. Verify

- `https://blog.shehzaib.com` loads, shows blogs (data from Atlas via the API)
- Sign up / log in works (CORS + JWT)
- Real-time comments/reactions update live (websocket via blogapi)
- `https://shehzaib.com` and `https://apico.shehzaib.com` still fine

## Update later
```bash
cd /opt/blog/Blog-Application && git pull
cd /opt/blog/Blog-Application-Frontend && git pull
cd /opt/blog/Blog-Application && docker compose up -d --build
```

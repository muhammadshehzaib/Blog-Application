/**
 * Seed script — generates 1000 unique blog posts.
 *
 * Run with:  npm run seed
 *
 * 50 topics x 20 angles = 1000 distinct (topic, angle) pairs.
 * Every title is unique. Each body mixes angle-specific framing
 * with topic-specific technical sections, rotated so no two posts
 * share the same combination of sections.
 *
 * Connects to DBURI, ensures categories + a "seed-bot" author + three
 * test users (admin / writer / reader) exist, wipes previously seeded
 * posts, and inserts the new set.
 */
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import mongoose, { Schema } from 'mongoose';

dotenv.config();

const DBURI = process.env.DBURI;
const TOTAL_ANGLES = 20;
const SEED_AUTHOR = 'seed-bot';

if (!DBURI) {
  console.error('✗ DBURI is not set. Add it to your .env file.');
  process.exit(1);
}

// ─────────────────────────── loose models ───────────────────────────
const AuthModel = mongoose.model(
  'Auth',
  new Schema({}, { strict: false, collection: 'auths' }),
);
const CategoryModel = mongoose.model(
  'BlogsCategories',
  new Schema({}, { strict: false, collection: 'blogscategories' }),
);
const BlogModel = mongoose.model(
  'Blog',
  new Schema({}, { strict: false, collection: 'blogs' }),
);

// ─────────────────────────── content data ───────────────────────────
interface Section {
  h: string;
  p: string;
}

interface Topic {
  name: string;
  category: string;
  blurb: string;
  sections: Section[]; // 6 unique sections per topic
}

interface Angle {
  prefix: string; // title prefix, e.g. "A practical guide to"
  intro: string; // body intro paragraph, uses {topic} and {blurb}
  sections: Section[]; // 6 generic sections, use {topic} placeholder
}

const TOPICS: Topic[] = [
  {
    name: 'JavaScript closures',
    category: 'Programming Languages',
    blurb: 'functions that remember the scope they were created in',
    sections: [
      { h: 'The capture rule', p: 'A closure captures variables by reference, not by value. Mutating the captured variable from the outer scope changes what the inner function sees on its next call.' },
      { h: 'Loop variable gotcha', p: 'Closures created inside a var-based for loop all share the same counter. Using let creates a fresh binding per iteration and fixes the surprise.' },
      { h: 'Private state', p: 'A closure is the simplest way to keep state truly private. The outer function returns getters; the variable itself is never exposed.' },
      { h: 'Memory implications', p: 'Closures hold references to their entire enclosing scope. A long-lived closure over a large object keeps it from being garbage collected.' },
      { h: 'Currying with closures', p: 'Partial application uses nested closures to remember earlier arguments. Each call returns a new function that closes over the args so far.' },
      { h: 'Module pattern', p: 'Before ES modules, IIFEs wrapped in closures gave us private and public APIs. The pattern is still useful for one-off encapsulation.' },
    ],
  },
  {
    name: 'TypeScript generics',
    category: 'Programming Languages',
    blurb: 'type-level parameters that flow through your code',
    sections: [
      { h: 'Inference beats annotation', p: 'Generics get inferred from arguments most of the time. Annotating them explicitly is usually redundant and makes code noisier.' },
      { h: 'Constraints with extends', p: 'A generic with extends restricts what types are allowed in. It also unlocks property access inside the generic function body.' },
      { h: 'Conditional types', p: 'T extends U ? X : Y lets the type system branch. This is how utility types like ReturnType and Exclude are built.' },
      { h: 'Mapped types', p: 'Iterating over keys with [K in keyof T] derives one type from another. Readonly, Partial, and Pick are mapped types under the hood.' },
      { h: 'Variance pitfalls', p: 'TypeScript is bivariant on method parameters by default. Strict function types reveals real variance errors that would otherwise hide.' },
      { h: 'Avoid any, prefer unknown', p: 'unknown forces a narrowing check before use; any disables type checking entirely. The cost of any is invisible bugs.' },
    ],
  },
  {
    name: 'Python decorators',
    category: 'Programming Languages',
    blurb: 'callable wrappers that modify or annotate functions',
    sections: [
      { h: 'The wrapper pattern', p: 'A decorator is a function that takes a function and returns a function. It runs once at definition time, not on every call.' },
      { h: 'functools.wraps', p: 'Wrapping a function changes its name and docstring. wraps copies the metadata back so introspection still works.' },
      { h: 'Parametrised decorators', p: 'A decorator with arguments is a function that returns a decorator. The extra layer is what trips most people up first.' },
      { h: 'Class decorators', p: 'Decorating a class lets you register, modify, or wrap it. dataclass is the most familiar example.' },
      { h: 'Stacking order', p: 'Multiple decorators apply bottom-up at definition time and outer-in at call time. The order changes behaviour and matters.' },
      { h: 'Use sparingly', p: 'Decorators hide control flow. Reach for one when the wrapping behaviour is reused; otherwise a plain function call is clearer.' },
    ],
  },
  {
    name: 'Go goroutines',
    category: 'Programming Languages',
    blurb: 'lightweight concurrent functions managed by the runtime',
    sections: [
      { h: 'Cheap to launch', p: 'A goroutine starts with a tiny stack and grows as needed. Spawning thousands of them is normal and expected.' },
      { h: 'Channels coordinate', p: 'Sharing memory through channels avoids most race conditions. The mantra "do not communicate by sharing memory" lives here.' },
      { h: 'Context for cancellation', p: 'Pass a context.Context to every goroutine that does I/O. Cancelling the context stops the work cleanly.' },
      { h: 'WaitGroup for fan-out', p: 'Use sync.WaitGroup to wait for a known set of goroutines. Add before launching, Done in the goroutine, Wait in the parent.' },
      { h: 'Goroutine leaks', p: 'A goroutine blocked on a channel that no one will ever send to leaks forever. Always provide a way out.' },
      { h: 'Scheduler awareness', p: 'GOMAXPROCS controls how many OS threads run goroutines. The runtime schedules cooperatively at function calls and I/O points.' },
    ],
  },
  {
    name: 'Rust ownership',
    category: 'Programming Languages',
    blurb: "the compile-time discipline that gives Rust its safety story",
    sections: [
      { h: 'One owner', p: 'Every value has exactly one owner. When the owner goes out of scope, the value is dropped immediately.' },
      { h: 'Borrowing rules', p: 'You can have many shared references or one mutable reference, never both. The borrow checker enforces this at compile time.' },
      { h: 'Move vs copy', p: 'Assigning a non-Copy value transfers ownership. Trying to use the original afterwards is a compile error, not a runtime crash.' },
      { h: 'Lifetimes', p: 'Lifetime annotations describe how long a reference is valid. The compiler infers most of them; you write them when ambiguity arises.' },
      { h: 'Rc and Arc', p: 'When ownership truly must be shared, Rc (single-thread) or Arc (multi-thread) gives you reference-counted ownership.' },
      { h: 'Drop trait', p: 'Custom destructors live in Drop. RAII patterns from C++ map cleanly: a guard goes out of scope, the resource releases.' },
    ],
  },
  {
    name: 'React hooks',
    category: 'Frontend',
    blurb: 'function-component primitives for state and effects',
    sections: [
      { h: 'Rules of hooks', p: 'Call hooks at the top level of a component, never inside conditionals or loops. The order is how React identifies them between renders.' },
      { h: 'useState semantics', p: 'Updaters can be a value or a function. Use the function form when the next value depends on the previous one.' },
      { h: 'useEffect timing', p: 'Effects run after commit, not during render. Cleanup runs before the next effect and before unmount.' },
      { h: 'useMemo and useRef', p: 'useMemo caches an expensive computation; useRef holds a mutable value that survives renders without triggering them.' },
      { h: 'Custom hooks', p: 'Pull repeated state-and-effect logic into a hook. The convention of starting names with use unlocks lint rules.' },
      { h: 'Dependency arrays', p: 'Missing dependencies cause stale closures; extra ones cause loops. The exhaustive-deps lint rule catches both.' },
    ],
  },
  {
    name: 'Next.js App Router',
    category: 'Frontend',
    blurb: 'the file-system routing model built on React Server Components',
    sections: [
      { h: 'Server-first defaults', p: 'Components render on the server by default. Mark them with "use client" only when they need browser APIs or state.' },
      { h: 'Streaming with Suspense', p: 'Loading boundaries stream chunks of HTML as data resolves. Time to first byte improves without losing interactivity.' },
      { h: 'Layouts persist', p: 'Layouts wrap pages and survive navigation. State inside a layout outlives a route change beneath it.' },
      { h: 'Server Actions', p: 'A function with "use server" runs on the server when called from a client component. It is a typed RPC without the boilerplate.' },
      { h: 'Caching layers', p: 'fetch cache, full route cache, and React cache all interact. Understanding the precedence prevents surprising staleness.' },
      { h: 'Parallel and intercepting routes', p: 'Parallel slots and route interception unlock modals and split views. They take some experimentation to internalise.' },
    ],
  },
  {
    name: 'Vue reactivity',
    category: 'Frontend',
    blurb: 'a Proxy-based dependency-tracking system',
    sections: [
      { h: 'ref vs reactive', p: 'ref wraps a value with .value; reactive turns an object into a deep proxy. Use ref for primitives, reactive for object trees.' },
      { h: 'computed is cached', p: 'computed values only re-evaluate when their tracked deps change. Use it instead of a method when the cost is real.' },
      { h: 'watch and watchEffect', p: 'watch is explicit about sources; watchEffect collects deps automatically by running once. Choose by readability of the call site.' },
      { h: 'Effect scope', p: 'effectScope groups reactive effects so they can be disposed together. Useful for plugins that own a lifetime.' },
      { h: 'Reactivity pitfalls', p: 'Destructuring a reactive object loses reactivity. toRefs gives you back refs that stay connected.' },
      { h: 'shallowRef and shallowReactive', p: 'When deep proxies are too expensive, shallow variants stop at one level. Pair with manual triggerRef when something deeper changes.' },
    ],
  },
  {
    name: 'Svelte stores',
    category: 'Frontend',
    blurb: "Svelte's reactive containers for cross-component state",
    sections: [
      { h: 'writable and readable', p: 'A writable store has set, update, and subscribe; readable exposes only subscribe. Pick based on who owns mutations.' },
      { h: 'derived stores', p: 'derived computes a new store from one or more inputs. It re-evaluates when any input changes.' },
      { h: 'Auto-subscriptions', p: 'Prefixing a store with $ inside a component subscribes and unsubscribes for you. The store value reads like a plain variable.' },
      { h: 'Custom stores', p: 'Any object with a subscribe method is a store. Wrap subscribe and expose your own API for domain logic.' },
      { h: 'Contextual stores', p: 'Putting a store in setContext gives sub-trees scoped state. Avoid global stores when scope makes more sense.' },
      { h: 'Runes era', p: 'Svelte 5 runes overlap with stores conceptually but live in components. The two coexist; pick by where the state belongs.' },
    ],
  },
  {
    name: 'CSS container queries',
    category: 'Frontend',
    blurb: "responsive styles based on a component's own size",
    sections: [
      { h: 'Set a containment context', p: 'A parent declares container-type: inline-size to expose its width to children. Children query against the container, not the viewport.' },
      { h: 'Naming containers', p: 'Name a container with container-name so children can target a specific ancestor. Useful when components nest.' },
      { h: 'Units cqi, cqb, cqw, cqh', p: 'Container query units scale to the container, not the viewport. Typography that adapts to the slot is finally easy.' },
      { h: 'Component-driven design', p: 'A card can look one way in a sidebar and another in a grid, without per-page overrides. The styles live with the component.' },
      { h: 'Browser support', p: 'Support is now broad in evergreen browsers. Pair with feature queries if you still target older ones.' },
      { h: 'Style queries', p: 'Style container queries let you react to custom properties. The pattern is younger but unlocks theme-aware components.' },
    ],
  },
  {
    name: 'Node.js event loop',
    category: 'Backend',
    blurb: "the cooperative scheduler at the heart of Node",
    sections: [
      { h: 'Phases in order', p: 'Timers, pending callbacks, poll, check, close. Knowing the phase order explains why some callbacks run before others.' },
      { h: 'Microtasks first', p: 'process.nextTick and Promise.then callbacks run between phases. They can starve the loop if you queue them in a hot path.' },
      { h: 'Blocking is forever', p: 'A CPU-bound for loop blocks the entire process. Move heavy work to a worker thread or a child process.' },
      { h: 'I/O is non-blocking', p: 'libuv hands off filesystem and network operations and resumes the callback when done. The loop is free for other work meanwhile.' },
      { h: 'Worker threads', p: 'Workers share memory through SharedArrayBuffer and communicate via messages. They are the right answer for CPU work in Node.' },
      { h: 'Inspecting with --trace-event-categories', p: 'Tracing surfaces what the loop is actually doing. Combine with clinic.js or 0x for flame graphs.' },
    ],
  },
  {
    name: 'NestJS dependency injection',
    category: 'Backend',
    blurb: 'a decorator-driven DI container for TypeScript backends',
    sections: [
      { h: 'Providers and tokens', p: 'A provider can be a class, value, factory, or async factory. The token decides what gets injected; the class name is the default.' },
      { h: 'Module scoping', p: 'A provider is private to its module unless exported. Re-exporting elsewhere is what makes shared services available.' },
      { h: 'Request-scoped providers', p: 'Setting scope to Request creates a fresh instance per request. Useful for per-request state, costly if abused.' },
      { h: 'Circular dependencies', p: 'forwardRef breaks cycles between providers. Better to refactor; cycles are usually a design smell.' },
      { h: 'Testing with the module', p: 'Test.createTestingModule lets you override providers cleanly. Mock dependencies at the DI boundary, not inside the SUT.' },
      { h: 'Dynamic modules', p: 'forRoot and forRootAsync configure a module at registration time. The pattern is how every official Nest module ships.' },
    ],
  },
  {
    name: 'Express middleware',
    category: 'Backend',
    blurb: 'a pipeline of functions wrapping every request',
    sections: [
      { h: 'Order matters', p: 'Middleware runs in the order it was registered. Auth before parsing means parsed bodies are never reached on unauthorised paths.' },
      { h: 'Error-handling signature', p: 'An error middleware takes four arguments. Express identifies it by arity and only routes errors through it.' },
      { h: 'Async errors', p: 'Async functions must catch and forward errors to next. Wrappers like express-async-errors automate the boilerplate.' },
      { h: 'Composing routers', p: 'app.use mounts a sub-router under a path prefix. Routers themselves chain their own middleware.' },
      { h: 'Performance ceiling', p: 'Every middleware adds latency on every request. Profile before adding global cross-cutting middleware.' },
      { h: 'Locals on res', p: 'res.locals carries data through the middleware chain for the current request. It is the safe alternative to mutating req.' },
    ],
  },
  {
    name: 'GraphQL N+1',
    category: 'Backend',
    blurb: 'the classic data-loading problem in resolver-per-field APIs',
    sections: [
      { h: 'Where it shows up', p: 'A list of posts each resolving author triggers one author query per post. Latency explodes with list size.' },
      { h: 'DataLoader batches', p: 'DataLoader collects keys within a tick and runs one batched query. Per-request loaders avoid cross-request leakage.' },
      { h: 'Cache scope', p: "Loaders cache by request, not globally. Sharing one across requests is a footgun for user-specific data." },
      { h: 'Projection-aware fetching', p: 'Resolvers can inspect the GraphQL info object to fetch only requested fields. Worth the complexity for hot paths.' },
      { h: 'Persisted queries', p: 'Pinning a known set of queries lets the server pre-plan loading strategies. Latency and security both benefit.' },
      { h: 'Federation pitfalls', p: 'Subgraph calls amplify N+1 across services. Reference resolvers must batch or the gateway becomes a bottleneck.' },
    ],
  },
  {
    name: 'gRPC streaming',
    category: 'Backend',
    blurb: 'bidirectional message streams over HTTP/2',
    sections: [
      { h: 'Four call shapes', p: 'Unary, server-streaming, client-streaming, and bidirectional. Pick the shape that matches the data flow, not the request count.' },
      { h: 'Backpressure', p: 'Streams must respect flow control. Writers should pause when readers fall behind, not buffer unbounded.' },
      { h: 'Deadline propagation', p: 'A deadline travels through nested calls automatically. Setting deadlines at the edge prevents runaway chains.' },
      { h: 'Schema evolution', p: 'Proto3 makes nearly every field optional, so adding fields is safe. Removing or renumbering is the trap.' },
      { h: 'Errors as status', p: 'gRPC has a fixed status code set. Map application errors to those codes rather than hiding them in metadata.' },
      { h: 'Browser support', p: 'Native gRPC needs HTTP/2 trailers, which browsers do not expose. grpc-web is the bridge for browser clients.' },
    ],
  },
  {
    name: 'MongoDB aggregation pipelines',
    category: 'Databases',
    blurb: 'a chained set of stages that transform documents',
    sections: [
      { h: 'Pipeline order', p: 'Each stage produces a new document stream for the next. Putting $match early shrinks downstream work dramatically.' },
      { h: '$lookup is a join', p: '$lookup joins collections by foreign key. Use it sparingly; nothing kills aggregation performance like joining huge collections.' },
      { h: '$facet for multiplexing', p: '$facet runs sub-pipelines in parallel on the same input. Dashboards built with one round-trip use $facet.' },
      { h: 'Indexes still apply', p: 'Early $match and $sort use indexes when possible. Pipeline explain output shows which stages did.' },
      { h: 'Memory limits', p: 'Stages have a 100MB memory cap. allowDiskUse spills to disk; better to reshape the pipeline first.' },
      { h: 'Aggregation expressions', p: '$expr in $match unlocks the full aggregation expression language. Useful in find queries too, since 3.6.' },
    ],
  },
  {
    name: 'PostgreSQL indexes',
    category: 'Databases',
    blurb: 'the data structures that turn slow scans into fast lookups',
    sections: [
      { h: 'B-tree default', p: 'B-tree indexes handle equality and range. Most other index types exist for specific workloads.' },
      { h: 'Partial indexes', p: 'An index with a WHERE clause covers only the rows you query. Smaller index, faster updates.' },
      { h: 'Covering indexes', p: 'INCLUDE clauses store extra columns in the index. Index-only scans avoid touching the heap.' },
      { h: 'GIN for arrays and JSONB', p: 'GIN indexes match contains-style queries over composite values. Build time is heavier than B-tree.' },
      { h: 'BRIN for huge tables', p: 'BRIN summarises ranges of rows. Cheap to maintain on append-only or naturally ordered data.' },
      { h: 'EXPLAIN ANALYZE', p: 'The query planner picks the index it thinks is cheapest. ANALYZE keeps statistics fresh so it picks well.' },
    ],
  },
  {
    name: 'Redis pipelines',
    category: 'Databases',
    blurb: 'batching multiple commands in a single round-trip',
    sections: [
      { h: 'Round-trip dominates', p: 'Network latency is usually the bottleneck. Pipelining 100 small commands often beats clever single-command tricks.' },
      { h: 'Not a transaction', p: 'Pipelines do not provide atomicity. Use MULTI/EXEC if you need all-or-nothing semantics.' },
      { h: 'Memory cost', p: 'The server buffers replies until the pipeline ends. Massive pipelines pressure server memory.' },
      { h: 'Client libraries', p: 'Most clients expose pipelining. ioredis groups by default when many calls fire on the same tick.' },
      { h: 'Cluster considerations', p: 'In Cluster mode, all keys in a pipeline must hash to the same slot. Hash tags let you control that.' },
      { h: 'Pub/sub bypasses', p: 'Subscribers receive messages out-of-band. They are not affected by pipelined publish commands the same way.' },
    ],
  },
  {
    name: 'SQLite WAL mode',
    category: 'Databases',
    blurb: 'write-ahead logging for high-concurrency SQLite',
    sections: [
      { h: 'Readers do not block writers', p: 'WAL lets readers see a snapshot while a writer appends. Concurrency improves dramatically over rollback journals.' },
      { h: 'Checkpoint cadence', p: 'The WAL grows until a checkpoint folds it back. Aggressive checkpoints prevent unbounded growth.' },
      { h: 'Single writer still', p: 'WAL allows one writer at a time. Long write transactions stall everyone else.' },
      { h: 'Network filesystem caveat', p: 'WAL relies on shared memory for locking. NFS and similar will misbehave; use rollback journal there.' },
      { h: 'fsync settings', p: 'synchronous=NORMAL is the recommended pairing with WAL. FULL is safer but slower; OFF risks corruption.' },
      { h: 'Read-only replicas', p: 'Pointing read-only processes at a WAL file requires their own connections. Sharing a handle across processes is unsafe.' },
    ],
  },
  {
    name: 'Cassandra partitioning',
    category: 'Databases',
    blurb: 'consistent-hashing-based data distribution across nodes',
    sections: [
      { h: 'Partition key picks the node', p: 'The partition key hashes to a token, which maps to a node. Bad keys create hotspots; good keys spread load.' },
      { h: 'Wide rows', p: 'Clustering columns sort data within a partition. Wide rows are fine; unbounded wide rows are a footprint problem.' },
      { h: 'Tombstones', p: 'Deletes write tombstones, not blank rows. Tombstone-heavy queries are slow and trigger warnings.' },
      { h: 'Repair is required', p: 'Anti-entropy repair keeps replicas consistent. Skip it and you risk resurrecting deleted data.' },
      { h: 'No multi-partition transactions', p: 'Transactions span only a single partition. Model your data around that constraint.' },
      { h: 'LWT cost', p: 'Lightweight transactions use Paxos. Use them sparingly; they undo most of the latency win.' },
    ],
  },
  {
    name: 'Kafka consumer groups',
    category: 'Backend',
    blurb: 'parallel consumption with at-least-once delivery',
    sections: [
      { h: 'One partition, one consumer', p: 'Within a group, each partition is owned by at most one consumer. More consumers than partitions means some idle.' },
      { h: 'Rebalance storms', p: 'Joining or leaving triggers a rebalance. Cooperative rebalancing minimises the disruption to running consumers.' },
      { h: 'Offset commits', p: 'Commit offsets after successful processing, not before. Failure between read and commit replays on next start.' },
      { h: 'Idempotent processing', p: 'At-least-once means duplicates happen. Idempotent handlers are the price for not losing messages.' },
      { h: 'Lag is the metric', p: 'Consumer lag tells you how far behind you are. Alert on it; let throughput take care of itself.' },
      { h: 'Static membership', p: 'group.instance.id pins members across restarts. Fewer rebalances on rolling deploys.' },
    ],
  },
  {
    name: 'RabbitMQ exchanges',
    category: 'Backend',
    blurb: 'the routing layer between publishers and queues',
    sections: [
      { h: 'Four exchange types', p: 'Direct, topic, fanout, and headers. Topic is the most expressive; fanout is the simplest.' },
      { h: 'Bindings are routing rules', p: 'A queue binds to an exchange with a routing key pattern. The pattern decides which messages flow in.' },
      { h: 'Dead-letter exchanges', p: 'Rejected or expired messages can re-route to a DLX. Pair with a TTL queue for retry-with-backoff.' },
      { h: 'Publisher confirms', p: 'Confirms make publishing reliable end-to-end. Without them, broker crashes silently drop messages.' },
      { h: 'Mirrored vs quorum queues', p: 'Quorum queues are the modern choice for HA. Classic mirrored queues are being retired.' },
      { h: 'Prefetch tuning', p: 'channel.prefetch controls how many unacked messages a consumer holds. Too high causes uneven load; too low underutilises.' },
    ],
  },
  {
    name: 'BullMQ retries',
    category: 'Backend',
    blurb: "BullMQ's strategies for failing safely and retrying intelligently",
    sections: [
      { h: 'Attempts and backoff', p: 'Each job can declare attempts and a backoff function. Exponential backoff is built-in; custom strategies are a callback.' },
      { h: 'Job-level failure', p: 'A job fails after attempts are exhausted. It moves to the failed set, awaiting manual or scheduled re-queue.' },
      { h: 'Removing completed', p: 'completed and failed jobs accumulate. removeOnComplete and removeOnFail keep Redis from filling up.' },
      { h: 'Workers and concurrency', p: 'Each worker has a concurrency setting. Two workers at concurrency 5 process up to 10 jobs in parallel.' },
      { h: 'Rate limiting', p: 'Limiter options cap jobs per duration. Useful when downstream services have their own rate limits.' },
      { h: 'Sandboxed workers', p: 'Running the worker in a subprocess isolates crashes. Memory leaks no longer take down the main process.' },
    ],
  },
  {
    name: 'WebSockets reconnection',
    category: 'Backend',
    blurb: 'designing socket clients to survive flaky networks',
    sections: [
      { h: 'Backoff with jitter', p: 'Exponential backoff prevents stampedes when many clients reconnect at once. Jitter scatters the herd further.' },
      { h: 'Auth on every reconnect', p: 'Token expiry means the next reconnect may fail. Refresh tokens before sending CONNECT.' },
      { h: 'State resync', p: 'Servers send last-known-good state on connect. Clients must reconcile; assume nothing in between.' },
      { h: 'Heartbeats', p: 'A periodic ping detects dead sockets faster than the OS timeout. Set the interval below intermediary idle timeouts.' },
      { h: 'Pending messages', p: 'A reliable client queues messages while disconnected and flushes on reconnect. Watch for duplicates if both ends queue.' },
      { h: 'Socket.IO vs raw WS', p: 'Socket.IO bundles reconnection, namespacing, and acks. Raw WebSocket leaves all that to you.' },
    ],
  },
  {
    name: 'OAuth 2 device flow',
    category: 'Security',
    blurb: "the auth grant designed for input-constrained devices",
    sections: [
      { h: 'When to use it', p: 'TVs, CLIs, and IoT devices cannot show a browser. Device flow moves the auth step to a phone or laptop.' },
      { h: 'Polling the token endpoint', p: 'The device polls for the access token until the user finishes consent. Polling intervals are dictated by the server.' },
      { h: 'Short verification codes', p: 'The user-facing code is intentionally short and high-entropy. Code expiry is measured in minutes.' },
      { h: 'PKCE alternative', p: "PKCE is preferred for native and SPA flows. Device flow specifically targets devices without keyboards." },
      { h: 'Rate-limit the polling', p: 'A misbehaving client can hammer the token endpoint. Servers must enforce intervals and return slow_down.' },
      { h: 'Token refresh', p: 'Devices keep refresh tokens for long periods. Revocation paths must reach those devices.' },
    ],
  },
  {
    name: 'JWT pitfalls',
    category: 'Security',
    blurb: 'common mistakes when issuing and verifying JSON Web Tokens',
    sections: [
      { h: 'Algorithm confusion', p: 'Servers that accept any alg header have been exploited. Whitelist the expected algorithm explicitly.' },
      { h: 'No revocation', p: 'JWTs are valid until they expire. Adding a tokenVersion or jti deny-list gives you a kill switch.' },
      { h: 'Stuffing too much', p: 'Every byte of claims travels on every request. Keep the payload to identifiers; fetch profile data server-side.' },
      { h: 'Storing in localStorage', p: 'Browser storage is reachable by XSS. HttpOnly cookies are safer when you can use them.' },
      { h: 'Short access, long refresh', p: 'Access tokens should expire quickly; refresh tokens compensate. Rotating refresh tokens on use detects theft.' },
      { h: 'Signing keys', p: 'Symmetric secrets must stay secret; asymmetric keys allow separation of issue and verify. Pick by your trust boundaries.' },
    ],
  },
  {
    name: 'Argon2 password hashing',
    category: 'Security',
    blurb: 'the winner of the Password Hashing Competition',
    sections: [
      { h: 'Memory-hard by design', p: 'Argon2 is tuned to cost the attacker memory, not just CPU. GPU and ASIC attacks slow down accordingly.' },
      { h: 'Three parameters', p: 'Iterations, memory, and parallelism trade off speed against resistance. Calibrate on production hardware, not your laptop.' },
      { h: 'Variants id, i, d', p: 'Argon2id is the default for password hashing. It mixes data-dependent and data-independent passes for balanced resistance.' },
      { h: 'Salt every hash', p: 'A random per-password salt prevents rainbow tables. The library handles it; you only need to keep the hash record.' },
      { h: 'Rehash on login', p: 'When you raise the cost parameters, rehash on next successful login. Old hashes upgrade gradually without password resets.' },
      { h: 'Pepper optional', p: 'A server-side pepper adds a secret no attacker can read from the DB alone. Store it in a key manager, not in code.' },
    ],
  },
  {
    name: 'Content Security Policy',
    category: 'Security',
    blurb: 'a header that constrains what your page can load and execute',
    sections: [
      { h: 'Default-src is the base', p: 'default-src is the fallback for unspecified directives. Setting it to a strict value forces you to whitelist what you actually use.' },
      { h: 'Nonces beat unsafe-inline', p: 'Per-request nonces let inline scripts run without the catch-all unsafe-inline. The performance cost is negligible.' },
      { h: 'Reporting first', p: 'Roll out with report-only to see what would break. Promote to enforcing once the report queue is clean.' },
      { h: "Don't forget connect-src", p: 'connect-src controls fetch, XHR, and WebSocket targets. Forgetting it leaves a hole in your defence in depth.' },
      { h: 'Strict-dynamic with trust', p: 'strict-dynamic lets trusted scripts load further trusted scripts. It simplifies CSP for SPAs at the cost of audit complexity.' },
      { h: 'Common reporting endpoints', p: 'Send reports to a sink you watch. Browsers truncate fields and report subtly different things, so normalise before storing.' },
    ],
  },
  {
    name: 'Rate limiting strategies',
    category: 'Security',
    blurb: 'fairness and abuse protection without harming real users',
    sections: [
      { h: 'Token bucket', p: 'Tokens refill at a steady rate; each request consumes one. The bucket size is your burst budget.' },
      { h: 'Sliding window', p: 'Counts requests over a rolling time range. Smoother than fixed windows, slightly heavier to compute.' },
      { h: 'Per identity, not per IP', p: 'A NAT or proxy means one IP can be many users. Limit by user id or API key where possible.' },
      { h: 'Layered limits', p: 'Per route, per identity, per IP, and global. Each layer catches a different abuse pattern.' },
      { h: 'Return headers', p: 'RateLimit-* response headers tell clients where they stand. Polite clients self-throttle when they see them.' },
      { h: 'Penalise burst', p: 'Failed auth attempts should cost more tokens than reads. The cost model is your defence against credential stuffing.' },
    ],
  },
  {
    name: 'Docker layer caching',
    category: 'DevOps',
    blurb: 'how Dockerfile changes invalidate the build cache',
    sections: [
      { h: 'Order from stable to volatile', p: 'Put commands that change rarely above ones that change often. Source code COPY should come after dep installs.' },
      { h: 'Bind mount the cache', p: '--mount=type=cache stores package manager caches between builds. Big speed-ups for npm, pip, apt.' },
      { h: 'BuildKit by default', p: 'BuildKit parallelises stages and supports inline secrets. Set DOCKER_BUILDKIT=1 if your toolchain lags.' },
      { h: 'Multi-stage images', p: 'Build in one stage, copy artefacts to a smaller runtime stage. The image you ship excludes build tools.' },
      { h: '.dockerignore matters', p: 'Files copied into the context become inputs to the cache. Ignoring node_modules and .git keeps rebuilds fast.' },
      { h: 'Reproducibility', p: 'Floating tags like :latest break determinism. Pin base images by digest when you need reproducible builds.' },
    ],
  },
  {
    name: 'Kubernetes probes',
    category: 'DevOps',
    blurb: 'liveness, readiness, and startup checks for pods',
    sections: [
      { h: 'Three kinds', p: 'Liveness restarts unresponsive containers; readiness controls traffic; startup gives slow boots a grace period.' },
      { h: 'Cheap and idempotent', p: 'Probes run constantly. They must be fast and side-effect-free or they degrade the pod.' },
      { h: 'Initial delay vs startup probe', p: 'startupProbe is the preferred mechanism for slow boots. initialDelaySeconds on liveness is a blunt instrument.' },
      { h: 'Readiness for warm-up', p: 'A pod can be live but not ready while it warms a cache. Remove from the Service until the cache is hot.' },
      { h: 'Different endpoints', p: 'Liveness should answer even with broken dependencies; readiness should reflect them. Separate endpoints make this clear.' },
      { h: 'Exec probes', p: 'Exec probes spawn a process every check. They cost more than HTTP; reserve for when there is no HTTP option.' },
    ],
  },
  {
    name: 'Terraform state',
    category: 'DevOps',
    blurb: "Terraform's record of what it created and where",
    sections: [
      { h: 'Local is not for teams', p: 'Local state is fine for a tutorial. A team needs a remote backend with locking.' },
      { h: 'S3 plus DynamoDB', p: 'S3 holds the file, DynamoDB provides the lock. The pair is the most common production setup.' },
      { h: 'State drift', p: 'When the cloud changes outside of Terraform, plans surprise you. terraform refresh shows the truth.' },
      { h: 'Move and import', p: 'terraform state mv reorganises without recreation. terraform import adopts an existing resource into state.' },
      { h: 'Workspaces vs accounts', p: 'Workspaces are lightweight namespaces. Real env separation usually wants real accounts, not workspaces.' },
      { h: 'Secrets in state', p: 'Resource attributes can include secrets. Encrypt the backend; do not commit the state file.' },
    ],
  },
  {
    name: 'AWS Lambda cold starts',
    category: 'DevOps',
    blurb: 'why your first invocation is slower and what to do about it',
    sections: [
      { h: 'Init phase cost', p: 'Container start, runtime boot, and your code init all happen on cold start. Lazy loads can move time out of init.' },
      { h: 'Provisioned concurrency', p: 'Keeps warm executions ready at a cost. Best for predictable, latency-sensitive workloads.' },
      { h: 'Runtime size', p: 'Smaller bundles boot faster. Tree-shake, externalise the AWS SDK if your runtime provides it.' },
      { h: 'VPC penalty is gone', p: 'Hyperplane ENIs removed the multi-second VPC tax. Old advice to avoid VPCs is outdated.' },
      { h: 'Languages differ', p: 'Node and Python boot faster than JVM out of the box. SnapStart helps Java close the gap.' },
      { h: 'Observability', p: 'X-Ray segments show the init/invocation split. Without that, you cannot tell which to optimise.' },
    ],
  },
  {
    name: 'Cloudflare Workers KV',
    category: 'DevOps',
    blurb: 'eventually-consistent key-value at the edge',
    sections: [
      { h: 'Eventually consistent', p: 'Writes propagate within a minute or so. Treat KV as a cache, not a source of truth.' },
      { h: 'Read-fast, write-cheap', p: 'Reads hit a cache near the user. Writes go to the central store and replicate.' },
      { h: 'Value size limits', p: 'A value caps at a small number of MB. Larger blobs belong in R2.' },
      { h: 'Metadata pairs', p: 'Each key has optional metadata returned on list. Use it to avoid extra reads.' },
      { h: 'Eventual deletes', p: 'A deleted key may still serve from cache. Bust by writing a tombstone if the staleness matters.' },
      { h: 'Pricing model', p: 'Reads are cheap; writes and lists are not. Designs that list often will surprise the bill.' },
    ],
  },
  {
    name: 'Prometheus histograms',
    category: 'Observability',
    blurb: 'pre-aggregated buckets for latency and size measurements',
    sections: [
      { h: 'Buckets are pre-chosen', p: 'A histogram exposes counts per bucket. You must pick bucket boundaries up front; they cannot be reshaped later.' },
      { h: 'histogram_quantile', p: 'The function estimates quantiles from buckets. Estimate quality depends on bucket density near your target.' },
      { h: 'Avoid summary if you scrape multiple instances', p: 'Summary quantiles cannot be aggregated across replicas. Histograms can.' },
      { h: 'Native histograms', p: 'Native (sparse) histograms remove the bucket-tuning problem. Adoption is climbing across libraries.' },
      { h: 'Cardinality control', p: 'Labels multiply series. Adding a high-cardinality label to a histogram explodes storage and query cost.' },
      { h: 'rate() before quantile', p: 'histogram_quantile expects rates, not raw counters. Wrapping in rate() is the correct way.' },
    ],
  },
  {
    name: 'OpenTelemetry traces',
    category: 'Observability',
    blurb: 'a vendor-neutral standard for distributed tracing',
    sections: [
      { h: 'Spans nest', p: 'A span has a parent and zero or more children. The tree forms a single trace identified by trace id.' },
      { h: 'Context propagation', p: 'Trace context travels in headers like traceparent. Without it, a downstream span starts a new trace.' },
      { h: 'Sampling decisions', p: 'Head-based sampling decides at the root; tail-based decides after seeing the trace. Each has cost trade-offs.' },
      { h: 'Auto-instrumentations', p: 'Language SDKs ship plugins that wrap common libraries. They cover most needs with no code changes.' },
      { h: 'Attributes are searchable', p: 'Span attributes show in backends as filterable fields. Use the semantic conventions for cross-tool searches.' },
      { h: 'Resource describes the emitter', p: 'Resource attributes describe the process (service name, version, host). They make slicing dashboards possible.' },
    ],
  },
  {
    name: 'Structured logging',
    category: 'Observability',
    blurb: 'machine-parseable logs that hold up under aggregation',
    sections: [
      { h: 'JSON over text', p: 'Logs are read by machines first, humans second. JSON makes filtering and counting trivial in the aggregator.' },
      { h: 'Correlation ids', p: 'Tag every log line for a request with the same id. Joining lines across services becomes a single query.' },
      { h: 'Levels are filters, not labels', p: 'Reserve error for things that need attention. Treating warning as a soft error makes warnings useless.' },
      { h: 'Sensitive data', p: 'Auth headers, PII, and secrets should never reach the logger. Redact at the boundary, not after.' },
      { h: 'Sampling on volume', p: 'Some endpoints are noisy. Sample debug logs; never sample errors.' },
      { h: 'Cost of pretty', p: 'Pretty printing in production wastes CPU and disk. Pretty in dev only.' },
    ],
  },
  {
    name: 'SLO error budgets',
    category: 'Observability',
    blurb: 'a quantified target for unreliability you can spend',
    sections: [
      { h: 'Budget is a contract', p: 'A 99.9% SLO permits 43 minutes of badness per month. Treating that budget as planned spend changes how teams ship.' },
      { h: 'Burn-rate alerts', p: 'Fast burn alerts catch incidents; slow burn alerts catch regressions. Two thresholds beat one.' },
      { h: 'Multiple SLIs', p: 'Latency and availability often conflict. Define both with explicit weights or fall back to user-facing journeys.' },
      { h: 'Internal vs external', p: 'Internal SLOs are tighter than the public SLA. The gap is your cushion for the unexpected.' },
      { h: 'Periodic review', p: 'SLOs need quarterly recalibration. As traffic and dependencies shift, what mattered last quarter may not now.' },
      { h: 'Halting deploys', p: 'When the budget is exhausted, the policy should slow or stop changes. Without that, the SLO is decorative.' },
    ],
  },
  {
    name: 'Service mesh sidecars',
    category: 'Architecture',
    blurb: 'pod-local proxies handling mTLS, retries, and telemetry',
    sections: [
      { h: 'Sidecar pattern', p: 'A proxy runs alongside every service instance. The application calls localhost; the proxy handles the network.' },
      { h: 'mTLS without code', p: 'The mesh issues certificates and pins identities. Services get encryption and authentication for free.' },
      { h: 'Traffic policies', p: 'Retry, timeout, and outlier detection live in the mesh config. Operators tune them without touching application code.' },
      { h: 'Telemetry pipeline', p: 'Every hop emits metrics, traces, and logs. The mesh is often the cheapest path to consistent observability.' },
      { h: 'Resource overhead', p: 'Sidecars use CPU and memory per pod. Multiply by replicas; the cost matters on big clusters.' },
      { h: 'Ambient mode', p: 'Ambient meshes remove the sidecar per pod, processing traffic at the node. Lighter footprint, newer model.' },
    ],
  },
  {
    name: 'Event sourcing basics',
    category: 'Architecture',
    blurb: 'storing state as an append-only log of domain events',
    sections: [
      { h: 'Events as truth', p: 'The event log is the source of truth. The current state is derived by replaying events.' },
      { h: 'Projections feed queries', p: 'Read models project the log into shapes optimised for queries. They are disposable; rebuild any time.' },
      { h: 'Versioning events', p: 'Schemas evolve. Upcast old events into new shapes during replay rather than mutating history.' },
      { h: 'Snapshotting', p: 'Replaying a million events for one entity is slow. Snapshots checkpoint state to bound replay cost.' },
      { h: 'Compensating events', p: 'Events are immutable; you cannot delete a wrong one. Append a compensating event that reverses the effect.' },
      { h: 'When to avoid', p: 'Simple CRUD does not benefit from event sourcing. The pattern shines when audit trails and time travel are first-class.' },
    ],
  },
  {
    name: 'Hexagonal architecture',
    category: 'Architecture',
    blurb: 'ports and adapters separating domain from infrastructure',
    sections: [
      { h: 'Domain in the middle', p: 'The core knows nothing about HTTP, the DB, or queues. It speaks in domain language and exposes ports.' },
      { h: 'Adapters at the edges', p: 'Adapters translate from the outside world to the ports. Swapping one adapter does not ripple inward.' },
      { h: 'Testability', p: 'Tests run against fakes that satisfy the ports. The domain logic runs without spinning anything up.' },
      { h: 'Dependency direction', p: 'Everything points inward. The DI container wires concrete adapters at the edges.' },
      { h: 'Over-engineering risk', p: 'A weekend project may not need ports. Reach for hexagonal when the cost of switching infrastructure starts to feel real.' },
      { h: 'Naming the ports', p: 'Port names describe intent, not implementation. UserRepository, not PostgresUserStore.' },
    ],
  },
  {
    name: 'CQRS patterns',
    category: 'Architecture',
    blurb: 'splitting reads and writes into separate models',
    sections: [
      { h: 'Write model normalises', p: 'The command model enforces invariants. It is often small, deeply consistent, and behavioural.' },
      { h: 'Read model denormalises', p: 'Query models join and pre-shape data for fast reads. They trade write complexity for read speed.' },
      { h: 'Eventually consistent', p: 'Reads lag writes by milliseconds. Document the SLA so callers do not expect strict consistency.' },
      { h: 'No CRUD shortcut', p: 'A single REST endpoint that does both does not benefit from CQRS. The split costs more than it saves.' },
      { h: 'Pairs well with events', p: 'Write commands produce events; events update read models. CQRS and event sourcing reinforce each other but are independent.' },
      { h: 'Multiple read models', p: 'You can have many. One per use case beats one over-generalised view of the world.' },
    ],
  },
  {
    name: 'Idempotent APIs',
    category: 'Architecture',
    blurb: 'endpoints that can be retried safely without side effects',
    sections: [
      { h: 'Idempotency keys', p: 'A client-generated key lets the server detect and dedupe replays. Persist the result; return it on the duplicate.' },
      { h: 'GET, PUT, DELETE', p: 'These verbs are idempotent by definition. POST takes effort to make so.' },
      { h: 'Window matters', p: 'Dedup memory has a TTL. Long-lived idempotency requires a backing store, not just an LRU.' },
      { h: 'Error responses too', p: 'Cached responses include failures. A retried 4xx must return the same 4xx, not a fresh attempt.' },
      { h: 'Conflict semantics', p: 'Same key, different body, is an error. Return 409 so the client knows to fix its key or its payload.' },
      { h: 'Webhook receivers', p: 'Webhooks retry on any non-2xx. Receivers must be idempotent or every glitch double-applies.' },
    ],
  },
  {
    name: 'Feature flags',
    category: 'Architecture',
    blurb: 'runtime toggles for decoupling release from deploy',
    sections: [
      { h: 'Kill switches', p: 'A boolean flag in front of risky code lets ops disable it without a deploy. Best inserted on day one.' },
      { h: 'Targeting rules', p: 'Flags can target by user, account, or percentage. Gradual rollouts surface regressions before everyone hits them.' },
      { h: 'Lifecycle', p: 'Flags accumulate cruft if never removed. Owner and expiry per flag prevents the graveyard.' },
      { h: 'Avoid runtime logic loops', p: 'Reading a flag inside a hot loop costs more than caching. Read once per request, not per record.' },
      { h: 'Testing both sides', p: 'Every flagged branch should have tests in both states. Otherwise removal is risky.' },
      { h: 'Server vs client', p: 'Server flags should not leak to the client. Either copy them deliberately or risk exposing internal knobs.' },
    ],
  },
  {
    name: 'Distributed tracing in microservices',
    category: 'Observability',
    blurb: 'piecing together a request across service boundaries',
    sections: [
      { h: 'Context must propagate', p: 'A trace breaks the moment a service forgets to forward headers. Standardise on W3C traceparent.' },
      { h: 'Span correlation', p: 'Each service contributes spans into the same trace. The trace id is the join key across stores.' },
      { h: 'Database calls', p: 'Wrap DB clients to emit spans for queries. Slow queries become obvious without grep.' },
      { h: 'Async fan-out', p: 'Spans across queue boundaries need link semantics. Inject trace context into messages, extract on consumer side.' },
      { h: 'Sampling', p: '100% sampling is rarely affordable. Tail-based sampling keeps the interesting traces; head-based is simpler.' },
      { h: 'Searchable attributes', p: 'A trace without searchable tags is a needle in a haystack. Always tag user id, route, and version.' },
    ],
  },
  {
    name: 'API versioning',
    category: 'Architecture',
    blurb: "evolving an API without breaking existing clients",
    sections: [
      { h: 'URI vs header', p: 'Path-based versions are visible and cacheable; header-based versions are cleaner but harder to debug. Most teams pick URI.' },
      { h: 'Additive change is free', p: 'New optional fields and new endpoints rarely break clients. Removing or renaming always does.' },
      { h: 'Deprecation contracts', p: 'Announce, instrument, and remove. Each phase needs a timeline clients can plan around.' },
      { h: 'Per-endpoint cadence', p: 'Versioning the whole API forces lockstep upgrades. Per-resource versions reduce blast radius.' },
      { h: 'Date-based schemes', p: 'Stripe-style YYYY-MM-DD versions make ordering obvious. They also discourage major-version theatrics.' },
      { h: 'Server-driven hints', p: 'A Deprecation or Sunset header tells clients automatically. Tooling that respects them is increasingly common.' },
    ],
  },
  {
    name: 'Database migrations',
    category: 'Databases',
    blurb: "evolving schema without taking the app down",
    sections: [
      { h: 'Backwards-compatible first', p: "Add columns nullable, default safely, deploy code that tolerates both states. Cut over once writes use the new shape." },
      { h: 'Backfills off the hot path', p: 'Backfill in batches with sleeps. A single UPDATE on a million rows is an outage in waiting.' },
      { h: 'Lock-aware', p: 'Some DDL takes ACCESS EXCLUSIVE briefly. Concurrent index builds avoid blocking writers.' },
      { h: 'Forward only', p: 'Down migrations sound nice but are rarely usable in production. Plan to roll forward.' },
      { h: 'Idempotent scripts', p: 'Re-running a migration should be safe. Wrap in IF NOT EXISTS or your tool of choice.' },
      { h: 'Tooling discipline', p: 'A migration tool with locking and history is non-negotiable. The folder of unreviewed SQL is a future incident.' },
    ],
  },
  {
    name: 'Webhook signing',
    category: 'Security',
    blurb: 'cryptographic proof that a webhook came from you',
    sections: [
      { h: 'HMAC over payload', p: 'A shared secret HMACs the body. The receiver recomputes and compares constant-time.' },
      { h: 'Timestamp to defeat replay', p: 'Include a timestamp inside the signed payload. Reject requests older than a tolerance window.' },
      { h: 'Multiple keys for rotation', p: 'Senders may sign with a new and an old key during rotation. Receivers should accept either temporarily.' },
      { h: 'Body parsing pitfalls', p: 'Some frameworks alter raw bodies before you can sign-check. Hold the raw body to verify before parsing.' },
      { h: 'Library or roll-your-own', p: 'Constant-time compare and key handling are easy to get wrong. Use a battle-tested library.' },
      { h: 'Audit the unsigned cases', p: 'Health checks and replays may skip signing. Tighten or whitelist sources explicitly; do not just bypass.' },
    ],
  },
  {
    name: 'Saga pattern',
    category: 'Architecture',
    blurb: 'coordinating long-running, multi-step processes across services',
    sections: [
      { h: 'Local transactions chained', p: 'Each step in a saga is its own local transaction. Cross-service atomicity is faked through compensations.' },
      { h: 'Orchestration vs choreography', p: 'A central orchestrator owns the workflow; choreography lets services react to events. Orchestration is easier to reason about.' },
      { h: 'Compensating actions', p: 'Every forward step needs a reverse step for failure. Refund the payment, restock the item, notify the user.' },
      { h: 'Idempotency is required', p: 'Steps may run twice. Without idempotent handlers, compensations cascade unpredictably.' },
      { h: 'Visibility', p: 'A saga that fails midway is hard to debug without state. Persist saga state for inspection.' },
      { h: 'Timeouts', p: 'Some steps may stall forever. A timeout-triggered compensation is your safety net.' },
    ],
  },
  {
    name: 'Pagination strategies',
    category: 'Architecture',
    blurb: "offset, cursor, and keyset trade-offs",
    sections: [
      { h: 'Offset is simple', p: 'OFFSET/LIMIT is the easiest to implement and the worst at scale. Deep pages get progressively slower.' },
      { h: 'Cursor stays fast', p: 'A cursor encodes the last seen sort key. Page size stays constant in time regardless of depth.' },
      { h: 'Sort stability', p: 'Cursors require a stable sort tiebreaker. Otherwise a tied row can be skipped or repeated.' },
      { h: 'Total counts cost', p: 'Showing exact totals on huge tables is expensive. Approximate counts or remove them.' },
      { h: 'Bidirectional pages', p: 'Some UIs need to scroll backwards. A two-pointer cursor (before/after) supports both directions cleanly.' },
      { h: 'GraphQL connections', p: 'Relay-style connections standardise cursor pagination across an API. Adopt the conventions; do not reinvent them.' },
    ],
  },
  {
    name: 'gRPC vs REST',
    category: 'Architecture',
    blurb: 'when each protocol earns its keep',
    sections: [
      { h: 'Binary efficiency', p: 'Protobufs are smaller and faster to (de)serialise than JSON. The win compounds on chatty internal APIs.' },
      { h: 'Browser story', p: 'REST is at home in the browser; gRPC needs grpc-web. The friction shapes architecture decisions.' },
      { h: 'Schema-first vs document-later', p: 'gRPC forces a schema; REST often gets one bolted on. Schema-first is a forcing function for clarity.' },
      { h: 'Tooling', p: 'REST tooling is universal: browsers, curl, OpenAPI. gRPC needs the right client libraries everywhere it reaches.' },
      { h: 'Streaming', p: 'gRPC supports streaming natively. REST can stream with SSE or chunked transfer but is less idiomatic.' },
      { h: 'Pick by audience', p: 'Internal services lean gRPC; public APIs lean REST. The audience determines which trade-offs win.' },
    ],
  },
  {
    name: 'Cache eviction policies',
    category: 'Databases',
    blurb: 'choosing what to discard when the cache is full',
    sections: [
      { h: 'LRU is the default', p: 'Least-recently-used works for the long-tail distribution most workloads have. Easy to implement, easy to reason about.' },
      { h: 'LFU for popularity', p: 'Least-frequently-used keeps the hot items longer through short bursts of cold reads. Heavier bookkeeping.' },
      { h: 'TinyLFU and W-TinyLFU', p: 'Modern admission policies combine recency and frequency. Caffeine, the Java cache, popularised the idea.' },
      { h: 'Random eviction', p: 'Counterintuitively decent under uniform access. Cheap to compute and avoids LRU memory overhead.' },
      { h: 'TTL is orthogonal', p: 'TTL bounds staleness; eviction bounds size. You usually need both.' },
      { h: 'Workload-specific', p: 'Pick a policy by measuring hit rate on real traces. Defaults are decent starting points, not endpoints.' },
    ],
  },
  {
    name: 'Domain-driven design',
    category: 'Architecture',
    blurb: 'a vocabulary for aligning software with business reality',
    sections: [
      { h: 'Ubiquitous language', p: 'Code and conversation use the same terms. Mismatches between them are where bugs are born.' },
      { h: 'Bounded contexts', p: 'A model is only valid within its boundary. Two contexts can use the same word with different meanings.' },
      { h: 'Aggregates', p: 'An aggregate is a consistency boundary. Mutations flow through the root; invariants are enforced inside.' },
      { h: 'Domain events', p: 'Events express things that happened in the domain. They are the natural integration point across contexts.' },
      { h: 'Strategic design', p: 'Context maps and team topologies shape the architecture. DDD is as much about people as software.' },
      { h: 'Tactical patterns', p: 'Entities, value objects, repositories. They are tools, not goals; reach for them when the domain warrants the structure.' },
    ],
  },
];

const ANGLES: Angle[] = [
  {
    prefix: 'A practical guide to',
    intro:
      'This guide walks through {topic} with the goal of leaving you confident enough to use it tomorrow, not just answer trivia. Expect concrete patterns rather than encyclopedic coverage; we cover {blurb}.',
    sections: [
      { h: 'Mental model first', p: 'Before any syntax, internalise what {topic} is solving. Most confusion later traces back to a hazy mental model now.' },
      { h: 'Minimum viable usage', p: 'Start with the smallest version of {topic} that does something useful. Lay foundations before reaching for advanced features.' },
      { h: 'Idioms over rules', p: 'Idioms compress experience. Learn the conventions for {topic} so you write code that other practitioners can read.' },
      { h: 'Where it shines', p: 'Some problems map cleanly to {topic}; others fight it. Notice the problems where it earns its complexity.' },
      { h: 'Where it does not', p: 'Use the wrong tool and {topic} becomes friction. Resist applying it to every problem you encounter for a week.' },
      { h: 'Next steps', p: 'Once the basics land, read the official documentation cover to cover and skim one real codebase that uses {topic} at scale.' },
    ],
  },
  {
    prefix: 'Avoiding common pitfalls in',
    intro:
      'Mistakes with {topic} tend to look identical across teams. This piece catalogs the failure modes worth knowing about up front; collectively they describe how {blurb} can be misused.',
    sections: [
      { h: 'Subtle defaults', p: 'The default behaviour of {topic} is rarely what you actually want. Inspect every default before relying on it in production.' },
      { h: 'Silent failure', p: 'When {topic} breaks quietly, you discover the bug only in metrics. Always wire alerts to the path that uses {topic}.' },
      { h: 'Overuse', p: 'A new tool gets applied to problems it does not fit. The clearest sign of overuse is friction wrapping every other change.' },
      { h: 'Tests that pass anyway', p: 'Mocks around {topic} can pass while real {topic} fails. Run at least one integration test against the real thing.' },
      { h: 'Operational surprises', p: 'Most pitfalls only surface in production. The fix is not better code; it is better observability around {topic}.' },
      { h: 'Recovery paths', p: 'Plan how you back out a misuse of {topic}. The plan is cheap when designed; expensive in the middle of an incident.' },
    ],
  },
  {
    prefix: 'Performance tuning',
    intro:
      'Performance with {topic} is mostly about removing surprises rather than chasing micro-optimisations. We start with measurement, then walk the levers that actually move the needle for {blurb}.',
    sections: [
      { h: 'Measure before tuning', p: 'A flame graph reveals where {topic} spends time. Without one, you tune the wrong thing 80% of the time.' },
      { h: 'Hot paths first', p: '90% of work happens in 10% of the code. Pareto applies to {topic} too; focus there before broadening.' },
      { h: 'Allocations matter', p: 'Garbage collection lurks behind many {topic} latency cliffs. Reduce per-call allocations to flatten p99.' },
      { h: 'Cache the boring', p: 'The cheapest wins are caching deterministic computations. Once you spot one for {topic}, you usually spot three.' },
      { h: 'Batch where you can', p: 'Fewer round-trips beat faster ones. Group operations through {topic} when the API supports it.' },
      { h: 'Validate after', p: 'Re-measure after each change. Improvements that vanish in a load test were not real.' },
    ],
  },
  {
    prefix: 'Testing strategies for',
    intro:
      'Tests that protect {topic} look different from tests around your business logic. This piece argues for a layered approach: fast unit tests for the surface, integration tests for the reality of {blurb}.',
    sections: [
      { h: 'Pyramid still works', p: 'Many small unit tests, fewer integration tests, a handful of end-to-end checks. {topic} belongs at multiple layers.' },
      { h: 'Test the contract', p: 'Test what {topic} promises, not how it works. Implementation tests break on every refactor.' },
      { h: 'Time and randomness', p: 'Pin the clock and the seed before testing anything touching {topic}. Flaky tests almost always have one of these two as the source.' },
      { h: 'Real backing service', p: 'Mocking {topic} entirely leads to confident deploys that fail in production. Spin up a real instance for at least the critical paths.' },
      { h: 'Property tests', p: 'Random inputs into {topic} surface edge cases your examples miss. A handful of property tests beats hundreds of examples.' },
      { h: 'Coverage is a smell', p: 'High coverage on {topic} without assertions is a comfort blanket. Aim for behaviour confidence, not a green percentage.' },
    ],
  },
  {
    prefix: 'Debugging tips for',
    intro:
      'When {topic} misbehaves, the diagnosis path is rarely the same as your normal application debugging. We cover the questions to ask and the tools to reach for when {blurb} stops cooperating.',
    sections: [
      { h: 'Reproduce locally first', p: 'A reproducer for {topic} is half the fix. Without one, you guess and hope.' },
      { h: 'Read the logs slowly', p: 'The message that matters is rarely the loudest. Slow down and read context around {topic} events.' },
      { h: 'Inspect state', p: '{topic} usually has inspectable state. Dump it during the failure and diff against a known-good state.' },
      { h: 'Bisect changes', p: 'When {topic} worked last week, git bisect finds the offending change in minutes. Faster than reading a thousand commits.' },
      { h: 'Reach for tracing', p: 'Distributed tracing across {topic} shows what really happened. Print statements lie about ordering under concurrency.' },
      { h: 'Write the post-mortem', p: 'Every {topic} debug session is worth a writeup. The next person will thank you, including future-you.' },
    ],
  },
  {
    prefix: 'Production lessons from',
    intro:
      "These are the lessons we wish we'd known before running {topic} in production. Each one cost a real incident or a long Friday. Reflect on them before {blurb} reaches users.",
    sections: [
      { h: 'It will fail', p: '{topic} fails differently in production than in staging. Design for failure rather than hoping.' },
      { h: 'Alarms over dashboards', p: 'Dashboards are for diagnosis; alarms are for waking you. {topic} needs both.' },
      { h: 'Capacity ahead of demand', p: 'Plan capacity for {topic} based on next quarter, not last week. Catching up under load is expensive.' },
      { h: 'Documented runbooks', p: 'The on-call engineer has minutes, not hours. A {topic} runbook with playbooks is the difference between calm and chaos.' },
      { h: 'Chaos rather than hope', p: "Periodically break {topic} on purpose in staging. Bugs you find on Tuesday don't page you on Saturday." },
      { h: 'Postmortems are gold', p: 'Each incident with {topic} reveals an assumption you held. Write them up; share them widely; act on them.' },
    ],
  },
  {
    prefix: 'Why we chose',
    intro:
      "This is a candid look at why our team adopted {topic}, what we considered, and what we'd do differently. The short version: {blurb}. The long version is below.",
    sections: [
      { h: 'The problem context', p: 'Before {topic}, we had a problem the existing tools could not address cleanly. We tried two patches first; neither stuck.' },
      { h: 'What we evaluated', p: 'We benchmarked three alternatives against {topic}. The shortlist was driven by team familiarity as much as raw capability.' },
      { h: 'The deciding factor', p: 'Performance was close; the deciding factor was operability. {topic} had the clearest path from prototype to production.' },
      { h: 'Migration cost', p: 'Adoption was not free. The team paid in unfamiliarity for a few weeks; familiarity arrived around month two.' },
      { h: 'What surprised us', p: '{topic} did one thing better than the benchmarks suggested and one thing worse. Both surprises shaped how we use it now.' },
      { h: 'Would we do it again', p: 'Yes, with caveats. Knowing the failure modes up front would have saved at least one weekend.' },
    ],
  },
  {
    prefix: 'Migrating away from',
    intro:
      'Migrating off {topic} is rarely the dramatic rewrite people expect; usually it is months of patient parallel-running and incremental cutover. This is the playbook that worked for us; it applies even when {blurb}.',
    sections: [
      { h: 'Why migrate at all', p: 'The case for leaving {topic} must be strong; the cost of migration is always higher than first estimated.' },
      { h: 'Parallel run', p: 'Run the new system alongside {topic} writing both ways. Diff outputs daily; trust nothing without comparison.' },
      { h: 'Traffic shifting', p: 'Move 1%, then 10%, then 50% of traffic off {topic}. Monitor at every step; roll back fast on regression.' },
      { h: 'Frozen scope', p: 'Resist adding features to the old or new system mid-migration. A moving target prolongs the parallel-run period.' },
      { h: 'The long tail', p: 'The last 5% of {topic} usage hides in cron jobs and forgotten scripts. Find them with logs, not memory.' },
      { h: 'Decommission deliberately', p: 'Turning {topic} off is the last and most satisfying step. Document why before you do, so future you remembers.' },
    ],
  },
  {
    prefix: 'The internals of',
    intro:
      'Most engineers can use {topic} without ever opening the source. The ones who go deeper write better code on top of it. This piece skims the internals so you understand why {blurb}.',
    sections: [
      { h: 'Architecture at a glance', p: '{topic} is built around a small number of moving parts. Map them once and the docs read differently afterwards.' },
      { h: 'The hot path', p: 'A single function in {topic} runs on every operation. Profilers always point here first; optimisations cluster around it.' },
      { h: 'Memory layout', p: 'Knowing how {topic} lays out memory explains its performance cliffs. Cache misses are the recurring villain.' },
      { h: 'Concurrency model', p: '{topic} makes specific assumptions about threads or async. Violating them is a reliable way to introduce hard-to-find bugs.' },
      { h: 'Trade-offs the authors made', p: 'Every design decision in {topic} traded one thing for another. Reading the change log is sometimes more illuminating than the code.' },
      { h: 'Reading the source', p: 'Start with the entry point and follow one operation through. Random source diving is overwhelming; guided diving teaches you the shape.' },
    ],
  },
  {
    prefix: 'Security best practices for',
    intro:
      "{topic} sits adjacent to your security boundary whether you intended it or not. This piece collects defaults and habits that materially lower risk without turning every change into a security review. The context: {blurb}.",
    sections: [
      { h: 'Least privilege', p: '{topic} should run with the smallest permissions that work. Reducing the blast radius is cheaper than perfect code.' },
      { h: 'Input validation', p: 'Treat every input to {topic} as hostile. Schema-driven validation at the boundary catches whole categories of bugs.' },
      { h: 'Secrets handling', p: 'Secrets that flow through {topic} should never land in logs or commit history. A secret in a log is a leak waiting to happen.' },
      { h: 'Updates as a habit', p: 'Outdated {topic} is the easiest entry point. Dependabot or equivalent should be on by default.' },
      { h: 'Audit trail', p: 'Sensitive actions through {topic} need an audit log you cannot tamper with. Append-only stores work well here.' },
      { h: 'Threat modelling', p: 'Spend an hour drawing the attack surface around {topic}. Most teams find one obvious gap within ten minutes.' },
    ],
  },
  {
    prefix: 'Scaling considerations for',
    intro:
      'Scaling {topic} usually fails in one of three places: a hot data point, an unbounded queue, or a single coordinator. We cover the patterns that move past those bottlenecks, given that {blurb}.',
    sections: [
      { h: 'Find the bottleneck', p: 'Before scaling {topic}, identify which resource saturates first. Adding hardware to the wrong dimension wastes budget.' },
      { h: 'Stateless first', p: 'Pull state out of {topic} where you can. Stateless components scale horizontally without orchestration.' },
      { h: 'Sharding strategies', p: '{topic} usually has a natural shard key. Choose it carefully; resharding later is among the harder operational problems.' },
      { h: 'Async by default', p: 'Synchronous calls through {topic} cap throughput. Move what you can to queues or background work.' },
      { h: 'Cache aggressively', p: 'Reads through {topic} are usually cacheable somewhere. Even a 10% hit rate is meaningful at scale.' },
      { h: 'Graceful degradation', p: '{topic} under load should serve degraded responses, not error pages. Plan the fallback before you need it.' },
    ],
  },
  {
    prefix: 'Comparing alternatives to',
    intro:
      'Choosing {topic} should be a comparison, not a default. This piece lines it up against the closest alternatives and surfaces the trade-offs that matter in real teams; the framing is {blurb}.',
    sections: [
      { h: 'Capability', p: 'Each alternative to {topic} covers slightly different ground. Listing what each is best at clears half the decision.' },
      { h: 'Operability', p: 'The cheapest alternative on paper can be the most expensive in operations. Account for staffing along with licensing.' },
      { h: 'Community and ecosystem', p: 'A vibrant ecosystem around {topic} matters more than five extra features. Plugins and examples save weeks.' },
      { h: 'Lock-in', p: 'Some alternatives to {topic} lock you in harder than others. Cheaper exit ramps usually win in the long run.' },
      { h: 'Familiarity', p: 'Whatever your team already knows has a real value. Adopting {topic} when the team knows the alternative inside out is a hard sell.' },
      { h: 'The decision matrix', p: 'Score the candidates on the dimensions you care about. The exercise is more useful than the resulting number.' },
    ],
  },
  {
    prefix: 'When not to use',
    intro:
      'A piece in praise of restraint with {topic}. Like every tool it does some things well, others poorly. We catalog the cases where reaching for {topic} costs more than it gives; in particular, {blurb}.',
    sections: [
      { h: 'Over-fitted problems', p: 'The smallest version of your problem may not need {topic}. Use the lighter tool until weight is justified.' },
      { h: 'Team unfamiliarity', p: '{topic} dropped into a team that has never used it adds risk to every change. Train first or pick something familiar.' },
      { h: 'Ops headroom', p: '{topic} adds operational surface area. If your team is already drowning in pages, this is the wrong moment.' },
      { h: 'Cost ceiling', p: '{topic} can be cheap at scale and expensive in single-tenant uses. Run the numbers; the cliff is often where you stop.' },
      { h: 'Existing solution good enough', p: 'A working system that fits poorly is still working. Replacing it with {topic} should clear a high bar.' },
      { h: 'Recoverable choices', p: 'The cheapest mistakes are reversible. Choose {topic} when the cost of unwinding is low if you change your mind.' },
    ],
  },
  {
    prefix: 'Anti-patterns in',
    intro:
      "Anti-patterns with {topic} are surprisingly stable across teams. We collect them in one place so you can recognise yours before another engineer points it out, and so {blurb} stops surprising you in code review.",
    sections: [
      { h: 'God object', p: 'When one component grows to know everything about {topic}, every change ripples through it. Split by responsibility before the seams calcify.' },
      { h: 'Hidden coupling', p: 'Two components sharing state via {topic} without saying so will break together. Make the coupling explicit or remove it.' },
      { h: 'Premature optimisation', p: 'Optimising {topic} before profiling produces clever, hard-to-read code that fixes nothing. Measure first.' },
      { h: 'Magic config', p: 'A single config line in {topic} that nobody understands is a future incident. Comment why values exist, not what they are.' },
      { h: 'Suppressed errors', p: 'Catching every error from {topic} and swallowing it hides real problems. Let errors surface to the layer that can act on them.' },
      { h: 'Implicit assumptions', p: 'Beliefs about {topic} that nobody wrote down become unstable over time. Encode them in tests or comments.' },
    ],
  },
  {
    prefix: 'Onboarding new developers to',
    intro:
      'New developers ramp onto {topic} faster when the curriculum is intentional. This piece sketches a four-week path that has worked across teams; the emphasis is {blurb}.',
    sections: [
      { h: 'Week one: read', p: 'Read the documentation for {topic} once cover-to-cover and the change log twice. Resist coding until concepts feel familiar.' },
      { h: 'Week two: copy', p: 'Reproduce a small example from the {topic} docs without copy-pasting. Typing every character builds muscle memory.' },
      { h: 'Week three: extend', p: 'Take a real ticket that touches {topic}, scoped small. Code review is the fastest accelerator at this stage.' },
      { h: 'Week four: teach', p: 'The new dev presents {topic} to a colleague. Teaching surfaces gaps faster than any quiz.' },
      { h: 'Beyond the month', p: 'Pair on real production work with {topic} for at least another month. Expertise compounds with exposure.' },
      { h: 'Reverse onboarding', p: 'The new dev returns with questions the docs do not answer. Treat the questions as gold; update the team docs.' },
    ],
  },
  {
    prefix: 'Code review checklist for',
    intro:
      'A short checklist that pulls a {topic} pull request from "looks fine" to "merge with confidence". Use it as a starting point and adapt; the core point is {blurb}.',
    sections: [
      { h: 'Does the change solve the stated problem', p: 'A PR for {topic} should match a ticket exactly. Scope creep is the slowest poison.' },
      { h: 'Are edge cases covered', p: '{topic} has predictable edge cases. The PR description should call out which ones the author considered.' },
      { h: 'Tests at the right layer', p: 'Each change touching {topic} adds tests at the right layer. Coverage without intent is bookkeeping.' },
      { h: 'Observability hooks', p: 'New code paths through {topic} should emit metrics or logs. Silent code is hard to debug later.' },
      { h: 'Reversibility', p: 'A change to {topic} should be revertable. If revert risks data, the PR description spells out why.' },
      { h: 'Naming', p: 'Identifiers around {topic} should match the team vocabulary. Inconsistent names today are tomorrow refactors.' },
    ],
  },
  {
    prefix: 'Modernizing legacy',
    intro:
      "Legacy {topic} usually still works; that's why it's legacy. Replacing it is a long, careful project rather than a heroic weekend. We trace the steps that have worked for teams modernising {blurb}.",
    sections: [
      { h: 'Inventory first', p: 'Catalog every consumer and call site of {topic}. The list almost always grows during this exercise.' },
      { h: 'Identify the spine', p: 'A small core path through {topic} carries most of the value. Migrating the spine first is leverage.' },
      { h: 'Adapter layer', p: 'Wrap the old {topic} interface so callers stop noticing the difference. The adapter lets you migrate consumers independently.' },
      { h: 'Shadow traffic', p: 'Send a copy of production traffic to the new system. Diffs surface invisible behaviours of old {topic}.' },
      { h: 'Sunset window', p: 'Pick a date for retiring old {topic}, even tentative. A deadline keeps the project from drifting forever.' },
      { h: 'Knowledge transfer', p: 'Old {topic} has tribal knowledge. Capture it in docs before the original authors leave.' },
    ],
  },
  {
    prefix: 'Observability for',
    intro:
      'Observability for {topic} is the difference between confident operation and constant firefighting. We cover the signals worth emitting and the queries worth saving when {blurb}.',
    sections: [
      { h: 'Three pillars', p: 'Metrics, logs, and traces each answer different questions about {topic}. Emit all three or be surprised at the wrong moment.' },
      { h: 'Pick the right metric', p: 'A counter for {topic} answers throughput; a histogram answers latency. Mixing them up wastes both dashboards and alerts.' },
      { h: 'Correlation ids', p: 'Every request through {topic} should carry the same id from edge to data store. Searching joins logs into stories.' },
      { h: 'Useful labels only', p: 'Labels on {topic} metrics multiply cardinality fast. Stick to low-cardinality dimensions or buy more storage than you wanted.' },
      { h: 'Cardinality budget', p: 'Set a cardinality budget for {topic} dashboards. Without one, the bill grows faster than the user base.' },
      { h: 'Symptom-based alerts', p: 'Alert when users feel pain in {topic}, not when an internal metric crosses an arbitrary threshold.' },
    ],
  },
  {
    prefix: 'CI/CD patterns for',
    intro:
      'CI for {topic} usually starts simple and accretes special cases. We describe a clean baseline that scales without becoming a mess; the implementation framing is {blurb}.',
    sections: [
      { h: 'Fast feedback', p: '{topic} tests should run on every PR within ten minutes. Slower than that and engineers wait, batch, or skip.' },
      { h: 'Cache aggressively', p: 'Dependency caches between {topic} CI runs save the most time. Tune them once; reap forever.' },
      { h: 'Parallel by default', p: 'Split {topic} tests across runners. Wall-clock time matters more than CPU efficiency.' },
      { h: 'Deploy small, often', p: '{topic} deployments should be boring. Small, frequent deploys de-risk every change.' },
      { h: 'Canary or progressive', p: 'A canary on {topic} catches regressions a smoke test cannot. Roll out by percentage; halt on signal.' },
      { h: 'Rollback by config', p: 'Reverting {topic} should be a config flip, not a re-deploy. Feature flags make this trivial.' },
    ],
  },
  {
    prefix: 'Cost optimisation for',
    intro:
      'Cost optimisation for {topic} is usually a matter of finding the leak rather than negotiating discounts. We walk the highest-leverage knobs to turn for {blurb} before reaching for procurement.',
    sections: [
      { h: 'Measure per request', p: 'Cost per request through {topic} is the right denominator. Total spend hides the trends.' },
      { h: 'Pricing model', p: 'Vendors price {topic} on cores, memory, requests, or storage. The cheapest knob to turn is the one your bill spikes on.' },
      { h: 'Right-size compute', p: '{topic} workloads often run on overprovisioned boxes. Cut by 30% and you find the floor empirically.' },
      { h: 'Egress is sneaky', p: '{topic} that talks across regions racks up egress fees. Co-locate where you can.' },
      { h: 'Idle resources', p: '{topic} dev environments left running for weeks dominate small budgets. Auto-stop nightly.' },
      { h: 'Negotiated discounts', p: 'Once usage stabilises, vendor reps want to talk. {topic} commitments unlock real savings.' },
    ],
  },
];

// ─────────────────────────── builders ───────────────────────────
function fill(s: string, topic: Topic): string {
  return s
    .replace(/\{topic\}/g, topic.name)
    .replace(/\{blurb\}/g, topic.blurb);
}

function buildContent(topic: Topic, angle: Angle, ti: number, ai: number): string {
  const intro = fill(angle.intro, topic);

  // Rotate angle sections so each topic pulls a different 3
  const angleSections = [
    angle.sections[(ti + 0) % angle.sections.length],
    angle.sections[(ti + 2) % angle.sections.length],
    angle.sections[(ti + 4) % angle.sections.length],
  ].map((s) => ({ h: fill(s.h, topic), p: fill(s.p, topic) }));

  // Rotate topic sections so each angle pulls a different 3
  const topicSections = [
    topic.sections[(ai + 0) % topic.sections.length],
    topic.sections[(ai + 2) % topic.sections.length],
    topic.sections[(ai + 4) % topic.sections.length],
  ];

  // Interleave: angle, topic, angle, topic, angle, topic
  const interleaved = [
    angleSections[0],
    topicSections[0],
    angleSections[1],
    topicSections[1],
    angleSections[2],
    topicSections[2],
  ];

  const body = interleaved
    .map((s) => `${s.h.toUpperCase()}\n\n${s.p}`)
    .join('\n\n');

  return `${intro}\n\n${body}`;
}

// ─────────────────────────── main ───────────────────────────
async function run() {
  console.log('→ connecting to MongoDB…');
  await mongoose.connect(DBURI as string);

  if (ANGLES.length !== TOTAL_ANGLES) {
    throw new Error(
      `expected ${TOTAL_ANGLES} angles, got ${ANGLES.length}`,
    );
  }
  const TOTAL = TOPICS.length * ANGLES.length;
  console.log(
    `→ will generate ${TOPICS.length} topics × ${ANGLES.length} angles = ${TOTAL} unique blogs`,
  );

  // 1. categories
  const categoryNames = [...new Set(TOPICS.map((t) => t.category))];
  const categoryIdByName: Record<string, mongoose.Types.ObjectId> = {};
  for (const name of categoryNames) {
    const doc = await CategoryModel.findOneAndUpdate(
      { category: name },
      { $setOnInsert: { category: name, createdAt: new Date() } },
      { upsert: true, new: true },
    );
    categoryIdByName[name] = doc._id as mongoose.Types.ObjectId;
  }
  console.log(`→ ${categoryNames.length} categories ready`);

  // 2. seed author
  let author = await AuthModel.findOne({ username: SEED_AUTHOR });
  if (!author) {
    author = await AuthModel.create({
      username: SEED_AUTHOR,
      email: 'seed-bot@example.com',
      password: await bcrypt.hash('seed-bot-password', 10),
      role: 'Writer',
      tokenVersion: 0,
    });
  }
  console.log(`→ seed author ready (${author._id})`);

  // 2b. test users
  const testUsers = [
    { username: 'admin', email: 'admin@example.com', password: 'admin123', role: 'Admin' },
    { username: 'writer', email: 'writer@example.com', password: 'writer123', role: 'Writer' },
    { username: 'reader', email: 'reader@example.com', password: 'reader123', role: 'Reader' },
  ];
  for (const u of testUsers) {
    const hashed = await bcrypt.hash(u.password, 10);
    await AuthModel.updateOne(
      { username: u.username },
      {
        $set: { email: u.email, password: hashed, role: u.role },
        $setOnInsert: { tokenVersion: 0 },
      },
      { upsert: true },
    );
  }
  console.log(
    `→ test users ready: ${testUsers
      .map((u) => `${u.username}/${u.password} (${u.role})`)
      .join(', ')}`,
  );

  // 3. wipe previous seed
  const removed = await BlogModel.deleteMany({ userId: author._id });
  console.log(`→ removed ${removed.deletedCount} previously seeded posts`);

  // 4. generate (50 topics x 20 angles = 1000 unique)
  const now = Date.now();
  const twoYears = 1000 * 60 * 60 * 24 * 365 * 2;
  const docs: Record<string, unknown>[] = [];
  const seenTitles = new Set<string>();

  for (let ti = 0; ti < TOPICS.length; ti++) {
    for (let ai = 0; ai < ANGLES.length; ai++) {
      const topic = TOPICS[ti];
      const angle = ANGLES[ai];
      const title = `${angle.prefix} ${topic.name}`;

      if (seenTitles.has(title)) {
        throw new Error(`duplicate title detected: ${title}`);
      }
      seenTitles.add(title);

      const i = ti * ANGLES.length + ai;
      docs.push({
        title,
        content: buildContent(topic, angle, ti, ai),
        image: `https://picsum.photos/seed/blog${i}/1200/600`,
        category: categoryIdByName[topic.category],
        status: 'Approved',
        userId: author._id,
        comments: [],
        reactions: [],
        createdAt: new Date(now - Math.floor(Math.random() * twoYears)),
      });
    }
  }

  console.log(`→ generated ${docs.length} unique posts`);

  // 5. insert in batches
  console.log(`→ inserting ${TOTAL} posts…`);
  const batch = 500;
  for (let i = 0; i < docs.length; i += batch) {
    await BlogModel.insertMany(docs.slice(i, i + batch));
    console.log(`  inserted ${Math.min(i + batch, docs.length)}/${TOTAL}`);
  }

  console.log('✓ seed complete');
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('✗ seed failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});

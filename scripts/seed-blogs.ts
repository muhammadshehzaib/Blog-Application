/**
 * Seed script, generates 2000 topical blog posts.
 *
 * Run with:  npm run seed
 *
 * It connects to the database in DBURI, ensures a set of categories and a
 * dedicated "seed-bot" author exist, wipes any previously seeded posts, and
 * inserts 2000 freshly generated posts about programming languages, the
 * MERN stack, Redis, BullMQ and system design.
 */
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import mongoose, { Schema } from 'mongoose';

dotenv.config();

const DBURI = process.env.DBURI;
const TOTAL = 2000;
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
  sections: Section[];
}

const TOPICS: Topic[] = [
  {
    name: 'JavaScript',
    category: 'Programming Languages',
    blurb:
      'the language of the web, single-threaded, event-driven, and everywhere',
    sections: [
      {
        h: 'The event loop',
        p: 'JavaScript runs on a single thread, but the event loop lets it stay responsive. Synchronous code runs first; callbacks, promises and timers are queued and picked up when the stack is clear. Understanding the microtask vs macrotask split is what separates confident JS developers from confused ones.',
      },
      {
        h: 'Closures',
        p: 'A closure is a function that remembers the variables of the scope it was created in, even after that scope has returned. They power data privacy, memoised helpers and most callback patterns. Almost every subtle bug around loops and async code traces back to misunderstanding closures.',
      },
      {
        h: 'Prototypes and inheritance',
        p: 'Objects in JavaScript delegate to other objects through the prototype chain. The class keyword is sugar over this mechanism, not a separate system. Knowing the chain explains why a method lookup works and where to put shared behaviour.',
      },
      {
        h: 'Async/await',
        p: 'Promises made asynchronous code composable; async/await made it readable. Under the hood it is still promises and the event loop. Forgetting an await, or awaiting inside a loop when you could parallelise, are the most common performance mistakes.',
      },
      {
        h: 'The module system',
        p: 'ES modules gave JavaScript a real, standard module system with static imports and tree-shaking. CommonJS still powers much of Node. Mixing the two is a frequent source of build-time pain worth understanding early.',
      },
      {
        h: 'Common footguns',
        p: 'Loose equality, hoisting, this binding and floating-point math all surprise newcomers. Strict mode, linters and a habit of using const by default remove most of them. The language rewards developers who learn its sharp edges instead of avoiding them.',
      },
    ],
  },
  {
    name: 'TypeScript',
    category: 'Programming Languages',
    blurb: 'a typed superset of JavaScript that catches bugs before runtime',
    sections: [
      {
        h: 'Why types matter',
        p: 'TypeScript adds a static type layer that disappears at compile time. It catches whole classes of bugs, undefined access, wrong argument shapes, typos, before the code ever runs. On a large codebase the type system is documentation that can never go stale.',
      },
      {
        h: 'Structural typing',
        p: 'TypeScript checks the shape of a value, not its declared name. If an object has the right properties, it fits. This makes the type system flexible and is why duck-typed JavaScript patterns translate cleanly.',
      },
      {
        h: 'Generics',
        p: 'Generics let you write code that works over many types without losing type safety. They are how reusable utilities, collections and API clients stay correct. Overusing them hurts readability, so reach for them only when a real type relationship exists.',
      },
      {
        h: 'Narrowing and unions',
        p: 'Union types model "this is one of several things"; narrowing uses checks like typeof or in to tell the compiler which one. Discriminated unions are the cleanest way to model state and are worth mastering.',
      },
      {
        h: 'The any escape hatch',
        p: 'The any type turns off checking. It is sometimes necessary, but every any is a hole in your safety net. Prefer unknown and explicit narrowing; treat a spreading any as technical debt.',
      },
      {
        h: 'Configuring the compiler',
        p: 'The tsconfig file controls how strict the compiler is. Turning on strict mode early is far easier than retrofitting it later. Settings like noUncheckedIndexedAccess catch real bugs most teams leave on the table.',
      },
    ],
  },
  {
    name: 'Python',
    category: 'Programming Languages',
    blurb: 'a readable, batteries-included language used everywhere from scripts to ML',
    sections: [
      {
        h: 'Readability as a feature',
        p: 'Python made indentation part of the syntax, forcing a consistent visual structure. The result is code that reads almost like prose. This is why it is the default teaching language and a favourite for fast prototyping.',
      },
      {
        h: 'The data model',
        p: 'Everything in Python is an object, and dunder methods let your own classes behave like built-in types. Implementing __len__ or __iter__ plugs your objects into the language itself. This consistency is one of Python\'s quiet strengths.',
      },
      {
        h: 'The GIL',
        p: 'The Global Interpreter Lock means only one thread executes Python bytecode at a time. For CPU-bound work you reach for multiprocessing or native extensions; for IO-bound work, threads and async still help. Knowing which kind of work you have decides your concurrency strategy.',
      },
      {
        h: 'Virtual environments',
        p: 'Dependency isolation is not optional in Python. Virtual environments keep each project\'s packages separate and reproducible. Skipping them leads to the classic "works on my machine" breakage.',
      },
      {
        h: 'Comprehensions and generators',
        p: 'List comprehensions express transformations concisely; generators do the same lazily, one item at a time. Generators are how you process data larger than memory. Both are idioms a fluent Python developer reaches for automatically.',
      },
      {
        h: 'The standard library',
        p: 'Python ships with tools for dates, JSON, HTTP, files and more. Reaching for the standard library before a third-party package keeps dependencies lean. Many "I need a library for this" moments are already solved in the box.',
      },
    ],
  },
  {
    name: 'Go',
    category: 'Programming Languages',
    blurb: 'a compiled language built for simple, fast, concurrent backend services',
    sections: [
      {
        h: 'Simplicity by design',
        p: 'Go deliberately leaves out features, no inheritance, no generics for years, no exceptions. The payoff is that almost any Go codebase reads the same way. Teams onboard quickly because there is little dialect to learn.',
      },
      {
        h: 'Goroutines and channels',
        p: 'Goroutines are lightweight threads managed by the runtime; channels pass data between them safely. The model encourages communicating instead of sharing memory. It makes concurrent code approachable without manual lock juggling.',
      },
      {
        h: 'The compiler and tooling',
        p: 'Go compiles to a single static binary in seconds. Formatting, testing and dependency management are built in and standardised. The lack of configuration debates is itself a productivity feature.',
      },
      {
        h: 'Error handling',
        p: 'Go returns errors as values and asks you to handle them explicitly. It is verbose, but it makes failure paths visible instead of hidden in stack unwinding. Most Go bugs come from ignoring a returned error.',
      },
      {
        h: 'Where Go shines',
        p: 'Network services, CLIs and infrastructure tools are Go\'s sweet spot. Docker and Kubernetes are written in it for good reason. If you need predictable performance and easy deployment, Go is hard to beat.',
      },
      {
        h: 'Interfaces',
        p: 'Go interfaces are satisfied implicitly, a type fits an interface just by having the right methods. This keeps packages decoupled. Small, focused interfaces are the idiomatic way to design Go APIs.',
      },
    ],
  },
  {
    name: 'Rust',
    category: 'Programming Languages',
    blurb: 'a systems language that guarantees memory safety without a garbage collector',
    sections: [
      {
        h: 'Ownership',
        p: 'Every value in Rust has a single owner, and when the owner goes out of scope the value is freed. This compile-time discipline removes whole categories of memory bugs. It is the central idea everything else builds on.',
      },
      {
        h: 'Borrowing and lifetimes',
        p: 'Instead of copying data you borrow references, and the borrow checker proves they never outlive what they point to. Lifetimes make those rules explicit. Fighting the borrow checker early becomes working with it later.',
      },
      {
        h: 'No data races',
        p: 'Rust\'s type system enforces that shared mutable state is synchronised. Concurrency bugs that would be runtime crashes elsewhere become compile errors here. "Fearless concurrency" is a real, measurable property.',
      },
      {
        h: 'Zero-cost abstractions',
        p: 'High-level constructs like iterators compile down to code as fast as a hand-written loop. You rarely trade ergonomics for speed. This is why Rust competes with C and C++ on performance.',
      },
      {
        h: 'The ecosystem',
        p: 'Cargo handles building, testing and dependencies with almost no friction. The crate ecosystem is young but high quality. Good tooling is a large part of why Rust adoption keeps climbing.',
      },
      {
        h: 'When Rust is worth it',
        p: 'Rust pays off where correctness and performance both matter, systems software, game engines, WebAssembly, infrastructure. For a simple CRUD service the learning curve may not be worth it. Choose it deliberately.',
      },
    ],
  },
  {
    name: 'Java',
    category: 'Programming Languages',
    blurb: 'a mature, statically typed language running the JVM across the enterprise',
    sections: [
      {
        h: 'Write once, run anywhere',
        p: 'Java compiles to bytecode that runs on the JVM, abstracting away the operating system. Decades of investment have made the JVM one of the most optimised runtimes in existence. Portability and performance together explain Java\'s staying power.',
      },
      {
        h: 'The JVM and JIT',
        p: 'The Just-In-Time compiler watches your program run and compiles hot paths to native code. Long-running Java services often get faster after warm-up. Understanding this changes how you benchmark.',
      },
      {
        h: 'Garbage collection',
        p: 'Java manages memory for you with a choice of collectors tuned for throughput or latency. Modern collectors keep pauses to milliseconds. Tuning the heap and collector is a real skill for high-scale services.',
      },
      {
        h: 'The ecosystem',
        p: 'Spring, build tools, profilers and libraries make Java a complete platform, not just a language. Enterprise systems lean on this maturity. The ecosystem is conservative, which is exactly what large organisations want.',
      },
      {
        h: 'Modern Java',
        p: 'Recent releases added records, pattern matching, sealed types and virtual threads. The language that once felt verbose is now far more concise. Staying on a current LTS version is worth the upgrade effort.',
      },
      {
        h: 'Concurrency',
        p: 'Java has a deep concurrency toolkit, from threads and executors to the new virtual threads. Virtual threads make blocking code scale like async code. It is one of the most significant recent JVM changes.',
      },
    ],
  },
  {
    name: 'C++',
    category: 'Programming Languages',
    blurb: 'a powerful systems language giving you control over every byte and cycle',
    sections: [
      {
        h: 'Control and cost',
        p: 'C++ lets you decide exactly how memory is laid out and when work happens. With that control comes responsibility for correctness. It is the language of choice when performance is non-negotiable.',
      },
      {
        h: 'RAII',
        p: 'Resource Acquisition Is Initialisation ties a resource\'s lifetime to an object\'s scope. When the object is destroyed, the resource is released. RAII is the idiom that makes modern C++ memory-safe in practice.',
      },
      {
        h: 'Smart pointers',
        p: 'unique_ptr and shared_ptr express ownership in the type system instead of in comments. Raw owning pointers are now a code smell. Modern C++ leans on these to avoid leaks and double frees.',
      },
      {
        h: 'Move semantics',
        p: 'Move semantics let you transfer resources instead of copying them, a major performance win. Understanding lvalues, rvalues and move constructors is core to writing efficient modern C++.',
      },
      {
        h: 'Templates',
        p: 'Templates enable generic, zero-overhead code and underpin the standard library. They are powerful but can produce dense error messages. Concepts in recent standards make template constraints far more readable.',
      },
      {
        h: 'Where C++ lives',
        p: 'Games, browsers, databases, embedded systems and trading platforms all run on C++. Anywhere latency and hardware control matter, it remains dominant. The language keeps modernising to stay there.',
      },
    ],
  },
  {
    name: 'React',
    category: 'Frontend',
    blurb: 'a component-based library for building user interfaces declaratively',
    sections: [
      {
        h: 'The component model',
        p: 'React UIs are trees of components, each a function of its props and state. You describe what the UI should look like and React figures out the DOM changes. This declarative model is why React scaled across the industry.',
      },
      {
        h: 'State and re-renders',
        p: 'When state changes, React re-renders the component and its children. Knowing what triggers a render, and what does not, is the key to a fast app. Most performance problems are unnecessary renders.',
      },
      {
        h: 'Hooks',
        p: 'Hooks let function components hold state and side effects. useState, useEffect and useMemo cover most needs; custom hooks package reusable logic. The rules of hooks exist so React can track them reliably.',
      },
      {
        h: 'The effect trap',
        p: 'useEffect is for synchronising with systems outside React. It is overused for things that should be derived state or event handlers. A good rule: if you can compute it during render, do not put it in an effect.',
      },
      {
        h: 'Keys and lists',
        p: 'Keys tell React which list item is which between renders. Using an array index as a key causes subtle bugs when the list reorders. Stable, unique keys are a small detail with real consequences.',
      },
      {
        h: 'Server components',
        p: 'React Server Components run on the server and send rendered output, shrinking the JavaScript bundle. They change how you think about data fetching and the client/server boundary. They are the direction modern React is heading.',
      },
    ],
  },
  {
    name: 'Next.js',
    category: 'Frontend',
    blurb: 'a React framework with routing, rendering and server features built in',
    sections: [
      {
        h: 'Rendering strategies',
        p: 'Next.js lets each route choose static generation, server rendering or client rendering. Picking the right one per page balances speed, freshness and cost. This flexibility is the framework\'s core value.',
      },
      {
        h: 'The App Router',
        p: 'The App Router organises routes as folders with layouts, loading states and nested boundaries. It leans heavily on React Server Components. It is a different mental model from the old pages directory and worth learning properly.',
      },
      {
        h: 'Data fetching',
        p: 'Server components can fetch data directly with no client round-trip. Caching and revalidation are configured per request. Understanding the cache layers prevents both stale data and unnecessary refetching.',
      },
      {
        h: 'Server actions',
        p: 'Server actions let you run server code from a form or event without writing a separate API route. They simplify mutations significantly. Treat them as real endpoints, validate and authorise inside them.',
      },
      {
        h: 'Image and font optimisation',
        p: 'Next.js optimises images and fonts automatically, a large real-world performance win. The Image component handles sizing, lazy loading and modern formats. Configuring allowed domains is a common first hurdle.',
      },
      {
        h: 'Deployment',
        p: 'Next.js runs on serverless platforms and traditional Node servers alike. Long-lived features like WebSockets need a persistent runtime, not serverless. Knowing your deploy target shapes your architecture.',
      },
    ],
  },
  {
    name: 'Node.js',
    category: 'Backend',
    blurb: 'a runtime that brought JavaScript to the server with non-blocking IO',
    sections: [
      {
        h: 'Non-blocking IO',
        p: 'Node handles thousands of connections on one thread by never waiting on IO. Instead of blocking, it registers a callback and moves on. This is why Node excels at IO-heavy workloads like APIs and proxies.',
      },
      {
        h: 'The event loop',
        p: 'Node\'s event loop processes timers, IO callbacks and microtasks in defined phases. Blocking it with heavy synchronous work freezes the whole server. Keeping the loop free is the golden rule of Node performance.',
      },
      {
        h: 'Streams',
        p: 'Streams process data in chunks instead of loading it all into memory. They are how Node handles large files and network data efficiently. Underused, but the right tool for any sizeable payload.',
      },
      {
        h: 'The npm ecosystem',
        p: 'npm hosts the largest package registry in software. It accelerates development but makes dependency hygiene essential. Auditing, pinning and minimising dependencies is part of the job.',
      },
      {
        h: 'Worker threads',
        p: 'CPU-bound work belongs on worker threads or a separate process, not the main loop. The cluster module and worker_threads exist for exactly this. Offloading heavy computation keeps the API responsive.',
      },
      {
        h: 'Error handling',
        p: 'Unhandled promise rejections and uncaught exceptions can crash a Node process. Centralised error handling and graceful shutdown are not optional in production. A crash strategy is part of the design.',
      },
    ],
  },
  {
    name: 'Express.js',
    category: 'Backend',
    blurb: 'a minimal, unopinionated web framework for Node.js',
    sections: [
      {
        h: 'Middleware',
        p: 'Express is built around middleware, functions that run in order on every request. Authentication, logging, parsing and error handling all slot into this pipeline. The mental model is a chain of small responsibilities.',
      },
      {
        h: 'Routing',
        p: 'Routes map HTTP methods and paths to handlers. Routers let you split a large API into modular files. Keeping route order in mind matters because Express matches top to bottom.',
      },
      {
        h: 'Minimal by design',
        p: 'Express gives you routing and middleware and little else. You assemble the rest, validation, structure, ORM, yourself. That freedom is powerful but puts architecture decisions on you.',
      },
      {
        h: 'Error middleware',
        p: 'Express recognises error-handling middleware by its four arguments. Centralising errors there keeps handlers clean. Forgetting to forward async errors is the classic Express bug.',
      },
      {
        h: 'Where Express fits',
        p: 'For small services and prototypes Express is fast to stand up. For larger apps many teams move to a structured framework on top of it. Knowing when to graduate is a useful instinct.',
      },
      {
        h: 'Security basics',
        p: 'Helmet, rate limiting, input validation and CORS configuration are baseline needs. Express ships none of them by default. Production readiness means adding that layer deliberately.',
      },
    ],
  },
  {
    name: 'NestJS',
    category: 'Backend',
    blurb: 'a structured, opinionated Node framework built around modules and DI',
    sections: [
      {
        h: 'Modules and structure',
        p: 'NestJS organises an app into modules, each owning its controllers and providers. The structure scales cleanly as the codebase grows. It removes the "where does this go" question that plagues bare Express apps.',
      },
      {
        h: 'Dependency injection',
        p: 'Nest has a real DI container. Services declare what they need in a constructor and Nest wires it up. This makes code testable and decoupled without manual plumbing.',
      },
      {
        h: 'Decorators',
        p: 'Controllers, routes, guards and validation are all expressed with decorators. The code reads like a description of behaviour. It is the same metadata-driven style as Angular, applied to the backend.',
      },
      {
        h: 'Guards and interceptors',
        p: 'Guards decide if a request may proceed; interceptors wrap the request/response. Auth, roles, caching and logging slot in cleanly. The request lifecycle has well-defined hooks for cross-cutting concerns.',
      },
      {
        h: 'Beyond HTTP',
        p: 'The same Nest concepts apply to WebSockets, queues and microservices. A gateway looks like a controller; a processor looks like a service. Learning the core ideas once pays off across transports.',
      },
      {
        h: 'Platform agnostic',
        p: 'Nest runs on Express or Fastify under the hood without changing your code. You get structure without locking into one HTTP library. That abstraction is a deliberate design goal.',
      },
    ],
  },
  {
    name: 'MongoDB',
    category: 'Databases',
    blurb: 'a document database that stores flexible, JSON-like records',
    sections: [
      {
        h: 'The document model',
        p: 'MongoDB stores records as flexible BSON documents instead of rows. Related data can live together in one document, avoiding joins. The schema lives in your application, which is freedom and responsibility at once.',
      },
      {
        h: 'Indexes',
        p: 'Without an index, a query scans every document. Indexes turn that into a fast lookup. Designing indexes around your real query patterns is the single biggest MongoDB performance lever.',
      },
      {
        h: 'The aggregation pipeline',
        p: 'The aggregation framework processes documents through stages, match, group, sort, project. It is how you compute analytics and reshape data in the database. Complex reporting belongs here, not in application code.',
      },
      {
        h: 'Embedding vs referencing',
        p: 'You can nest related data inside a document or reference it by id. Embedding is fast to read; referencing avoids duplication. The right call depends on how the data is read and updated.',
      },
      {
        h: 'Replication and sharding',
        p: 'Replica sets give high availability; sharding spreads data across machines for scale. Together they are how MongoDB grows past one server. Planning the shard key early avoids painful migrations later.',
      },
      {
        h: 'Schema discipline',
        p: 'Flexible does not mean structureless. Validation rules and a tool like Mongoose keep documents consistent. A loose schema without discipline becomes a maintenance burden.',
      },
    ],
  },
  {
    name: 'Redis',
    category: 'Databases',
    blurb: 'an in-memory store powering caching, queues and real-time messaging',
    sections: [
      {
        h: 'In-memory speed',
        p: 'Redis keeps data in RAM, so reads and writes take microseconds. That speed is why it sits in front of slower databases as a cache. It trades durability nuance for raw latency.',
      },
      {
        h: 'Caching with Redis',
        p: 'The cache-aside pattern checks Redis first and falls back to the database on a miss. A TTL bounds staleness; explicit invalidation keeps hot data fresh. Done well, it removes most read load from your primary store.',
      },
      {
        h: 'Pub/Sub',
        p: 'Redis publish/subscribe lets processes broadcast messages on named channels. It is how multiple server instances coordinate, for example to fan out WebSocket events. Delivery is fire-and-forget, so it suits hints, not guarantees.',
      },
      {
        h: 'Data structures',
        p: 'Redis is more than strings, it has hashes, sorted sets, streams and more. Sorted sets power leaderboards and rate limiters elegantly. Choosing the right structure often replaces a lot of application code.',
      },
      {
        h: 'Persistence options',
        p: 'Redis can snapshot to disk or append every write to a log. You choose the durability/performance trade-off. For a pure cache, losing data on restart is often perfectly acceptable.',
      },
      {
        h: 'Eviction and memory',
        p: 'RAM is finite, so Redis has eviction policies for when it fills up. allkeys-lru is a sensible default for a cache. Setting a memory cap and policy prevents nasty production surprises.',
      },
    ],
  },
  {
    name: 'PostgreSQL',
    category: 'Databases',
    blurb: 'a powerful, standards-compliant relational database',
    sections: [
      {
        h: 'Relational integrity',
        p: 'Postgres enforces structure with schemas, constraints and foreign keys. The database guarantees your data stays consistent, not just your application. For data that must be correct, that guarantee is worth a lot.',
      },
      {
        h: 'ACID transactions',
        p: 'Transactions let multiple changes succeed or fail as one unit. Postgres has strong, well-tested transactional semantics. This is why it is trusted for financial and critical systems.',
      },
      {
        h: 'Indexing',
        p: 'Postgres offers B-tree, hash, GIN, GiST and more index types. The right index depends on the query, equality, range, full text, JSON. Reading query plans with EXPLAIN is how you tune them.',
      },
      {
        h: 'JSON support',
        p: 'The jsonb type lets Postgres store and query semi-structured data. You get document flexibility without giving up relational power. Many teams reach for Postgres instead of a separate document store because of it.',
      },
      {
        h: 'Extensions',
        p: 'Postgres is extensible, pgvector adds vector search, PostGIS adds geospatial queries. One database can cover needs that would otherwise mean several. The extension ecosystem is a quiet superpower.',
      },
      {
        h: 'Concurrency with MVCC',
        p: 'Multi-Version Concurrency Control lets readers and writers work without blocking each other. Each transaction sees a consistent snapshot. Understanding MVCC explains both Postgres\'s strengths and its vacuuming needs.',
      },
    ],
  },
  {
    name: 'The MERN Stack',
    category: 'Full Stack',
    blurb: 'MongoDB, Express, React and Node, a full JavaScript web stack',
    sections: [
      {
        h: 'One language end to end',
        p: 'MERN uses JavaScript across the database layer, server and client. Developers move freely between layers without context switching. That single-language flow is the stack\'s main appeal.',
      },
      {
        h: 'How the pieces fit',
        p: 'MongoDB stores data, Express and Node serve an API, React renders the UI. Each layer has a clear responsibility. The contract between them is JSON over HTTP.',
      },
      {
        h: 'The API boundary',
        p: 'The Express API is the contract between front and back end. Keeping it well-designed, predictable routes, clear errors, validation, keeps the whole stack maintainable. The boundary is where most bugs are caught or created.',
      },
      {
        h: 'Authentication',
        p: 'MERN apps usually authenticate with JWTs passed from React to the API. Token storage, expiry and revocation all need deliberate design. Auth is the part beginners most often get subtly wrong.',
      },
      {
        h: 'Beyond the basics',
        p: 'Real MERN apps add caching, background jobs, real-time features and observability. The four core letters are a starting point, not the finished architecture. Knowing what to add, and when, is the senior skill.',
      },
      {
        h: 'Deployment',
        p: 'The frontend, API and database often deploy to different platforms. Environment configuration and CORS are the usual friction points. A clear separation of concerns makes deployment far smoother.',
      },
    ],
  },
  {
    name: 'System Design Fundamentals',
    category: 'System Design',
    blurb: 'the principles behind building systems that scale and stay reliable',
    sections: [
      {
        h: 'Vertical vs horizontal scaling',
        p: 'Vertical scaling means a bigger machine; horizontal means more machines. Vertical is simple but capped; horizontal is unbounded but demands stateless design. Most large systems end up scaling horizontally.',
      },
      {
        h: 'Statelessness',
        p: 'Stateless services keep no per-client memory between requests, so any instance can serve any request. This is what makes horizontal scaling and load balancing work. State is pushed into databases, caches and queues.',
      },
      {
        h: 'The CAP trade-off',
        p: 'Under a network partition a system must choose consistency or availability. There is no third option. Every distributed system makes this trade somewhere, and naming it is part of good design.',
      },
      {
        h: 'Caching layers',
        p: 'Caches sit between expensive work and the request, trading freshness for speed. They appear at the browser, CDN, application and database layers. Each layer needs its own invalidation strategy.',
      },
      {
        h: 'Asynchronous processing',
        p: 'Slow or unreliable work, email, image processing, third-party calls, belongs off the request path. A queue and worker decouple it from the user\'s wait. The request returns fast; the work happens reliably in the background.',
      },
      {
        h: 'Single points of failure',
        p: 'Any component without a backup is a single point of failure. Redundancy, health checks and failover remove them. Designing for failure is what separates a demo from a production system.',
      },
    ],
  },
  {
    name: 'Caching Strategies',
    category: 'System Design',
    blurb: 'how to make systems fast by reusing expensive results',
    sections: [
      {
        h: 'Cache-aside',
        p: 'In cache-aside the application checks the cache, and on a miss loads from the database and stores the result. It is the most common pattern because it is simple and the cache stays optional. If the cache fails, the app still works.',
      },
      {
        h: 'TTL as a safety net',
        p: 'A time-to-live makes cached entries expire automatically. Even if you forget to invalidate something, staleness is bounded. TTL is the backstop behind every other strategy.',
      },
      {
        h: 'Explicit invalidation',
        p: 'When data changes, the code deletes the affected cache keys so the next read recomputes. Forgetting a key is the most common cache bug. Famously, cache invalidation is one of the hard problems in computing.',
      },
      {
        h: 'Cache stampede',
        p: 'When a hot key expires, many requests miss at once and hammer the database. Locks, early recomputation or stale-while-revalidate spread that load. Ignoring stampede is how a cache becomes an outage.',
      },
      {
        h: 'What not to cache',
        p: 'Highly personalised data, fast-changing values and cheap lookups gain little from caching. Caching the wrong things adds complexity for no speed. Cache reads that are frequent, costly and stable.',
      },
      {
        h: 'State, not deltas',
        p: 'When pushing cached state to clients, send the full current value rather than incremental changes. A client that misses one update still recovers on the next. This makes the system self-healing.',
      },
    ],
  },
  {
    name: 'Message Queues and BullMQ',
    category: 'System Design',
    blurb: 'moving slow, fallible work off the request path with background jobs',
    sections: [
      {
        h: 'Why use a queue',
        p: 'A queue lets a request enqueue work and return immediately instead of waiting. Email, image processing and external API calls all belong behind one. The user gets a fast response; the work happens reliably afterwards.',
      },
      {
        h: 'Producers and consumers',
        p: 'A producer adds jobs to the queue; a consumer, or worker, processes them. The two are decoupled and can scale independently. They communicate only through the queue.',
      },
      {
        h: 'BullMQ on Redis',
        p: 'BullMQ stores jobs in Redis, so they survive process restarts. If a worker crashes mid-job, the job is retried. It brings durable background processing without a separate message broker.',
      },
      {
        h: 'Retries and backoff',
        p: 'Transient failures, a flaky network, a rate limit, should be retried, ideally with exponential backoff. After a few attempts a failed job moves to a dead-letter set for inspection. This turns flakiness into resilience.',
      },
      {
        h: 'Delivery guarantees',
        p: 'Most queues offer at-least-once delivery, meaning a job can run twice. Workers should therefore be idempotent. Designing for duplicate execution is safer than assuming it cannot happen.',
      },
      {
        h: 'Scaling workers',
        p: 'Throughput grows by raising worker concurrency or running more worker processes. The queue distributes jobs among them automatically. Watching queue depth tells you when to add capacity.',
      },
    ],
  },
  {
    name: 'WebSockets and Real-Time Systems',
    category: 'System Design',
    blurb: 'persistent connections that let servers push updates instantly',
    sections: [
      {
        h: 'Beyond request/response',
        p: 'Normal HTTP cannot push, the client must ask. WebSockets keep a connection open so the server can send data any time. This is what makes live comments, chat and presence possible.',
      },
      {
        h: 'Stateful connections',
        p: 'A WebSocket lives on one specific server process for its lifetime. That statefulness makes real-time harder to scale than stateless HTTP. It shapes every decision about load balancing and deployment.',
      },
      {
        h: 'Scaling across instances',
        p: 'With multiple servers, a client on one will not see an event emitted on another. A shared pub/sub layer like Redis bridges them. Every instance publishes and subscribes, so a broadcast reaches everyone.',
      },
      {
        h: 'Authentication',
        p: 'A WebSocket authenticates once, at the handshake, not on every message. The verified identity is then attached to the connection. Token expiry mid-connection is a real gap worth designing for.',
      },
      {
        h: 'Missed events',
        p: 'If a client briefly disconnects it can miss events, because pub/sub does not replay. Treating the database as the source of truth and the socket as a hint keeps the UI correct. On reconnect, the client refetches.',
      },
      {
        h: 'Sticky sessions',
        p: 'Load balancers in front of WebSocket servers usually need sticky sessions so a client returns to the same instance. It complicates rolling deploys, since dropping an instance disconnects everyone on it. Plan for reconnection storms.',
      },
    ],
  },
];

// ─────────────────────────── generation ───────────────────────────
interface Angle {
  titles: string[];
  intro: string;
  outro: string;
}

const ANGLES: Angle[] = [
  {
    titles: [
      'Understanding {name}',
      'A deep dive into {name}',
      '{name}, explained from the ground up',
      'What every developer should know about {name}',
    ],
    intro:
      'This article takes a careful look at {name}, {blurb}. The goal is not a quick reference but a real mental model you can carry into your own projects.',
    outro:
      'Understanding the ideas above turns {name} from something you use into something you reason about. That shift is what separates copying snippets from engineering.',
  },
  {
    titles: [
      'Getting started with {name}',
      '{name} for beginners',
      'Your first steps with {name}',
      'A gentle introduction to {name}',
    ],
    intro:
      'If you are new to {name}, {blurb}, this guide walks through the concepts that matter first, in plain language, before any advanced material.',
    outro:
      'With these fundamentals in place, the rest of {name} is far easier to learn. Build something small next; the concepts stick when you apply them.',
  },
  {
    titles: [
      'Best practices for {name}',
      'Writing production-grade {name}',
      'How to use {name} the right way',
      '{name} done properly',
    ],
    intro:
      'It is easy to get {name} working and hard to get it right. This piece collects practices that hold up once {blurb} meets real production traffic.',
    outro:
      'None of these practices are exotic. They are the difference between code that demos well and code that survives a year in production.',
  },
  {
    titles: [
      'Common mistakes with {name}',
      'Pitfalls every {name} developer should avoid',
      'Debugging {name}: lessons learned',
      'Where {name} projects go wrong',
    ],
    intro:
      'Most trouble with {name} is not exotic, it is the same handful of mistakes repeated. Knowing them in advance saves hours of debugging.',
    outro:
      'Every pitfall above has the same cure: understand the model instead of pattern-matching. {name} rewards developers who learn its sharp edges.',
  },
  {
    titles: [
      'Scaling with {name}',
      'Performance tuning {name}',
      'Optimizing {name} for production',
      'Making {name} fast',
    ],
    intro:
      'Performance work starts with measurement, not guesses. This article looks at where time and resources actually go when {blurb} is pushed hard.',
    outro:
      'Optimisation is a loop: measure, change one thing, measure again. Applied to {name}, that discipline beats any single trick.',
  },
  {
    titles: [
      'Building real projects with {name}',
      '{name} in the real world',
      'Architecting systems with {name}',
      'From tutorial to production with {name}',
    ],
    intro:
      'Tutorials show {name} in isolation; real systems show it under pressure. This piece bridges that gap with a look at how {blurb} behaves in practice.',
    outro:
      'A real project is where {name} stops being theory. The concepts here are the scaffolding; the experience comes from shipping.',
  },
];

const SUBTITLES = [
  '',
  ', a practical perspective',
  ', lessons from production',
  ', what the docs leave out',
  ', a 2025 perspective',
  ', the parts that matter',
  ', beyond the basics',
  ', a working developer\'s view',
];

const STATUSES = ['Approved', 'Approved', 'Approved', 'Approved', 'Pending'];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}
function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function fill(template: string, topic: Topic): string {
  return template
    .replace(/\{name\}/g, topic.name)
    .replace(/\{blurb\}/g, topic.blurb);
}

function buildContent(topic: Topic, angle: Angle, n: number): string {
  const intro = fill(angle.intro, topic);
  const chosen = shuffle(topic.sections, n + 7).slice(0, 4 + (n % 2));
  const body = chosen
    .map((s) => `${s.h.toUpperCase()}\n\n${s.p}`)
    .join('\n\n');
  const outro = `WRAPPING UP\n\n${fill(angle.outro, topic)}`;
  return `${intro}\n\n${body}\n\n${outro}`;
}

async function run() {
  console.log('→ connecting to MongoDB…');
  await mongoose.connect(DBURI as string);

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

  // 3. wipe previous seed
  const removed = await BlogModel.deleteMany({ userId: author._id });
  console.log(`→ removed ${removed.deletedCount} previously seeded posts`);

  // 4. generate
  const now = Date.now();
  const twoYears = 1000 * 60 * 60 * 24 * 365 * 2;
  const docs: Record<string, unknown>[] = [];

  for (let i = 0; i < TOTAL; i++) {
    const topic = pick(TOPICS, i);
    const angle = pick(ANGLES, Math.floor(i / TOPICS.length));
    const titleBase = fill(pick(angle.titles, i + topic.name.length), topic);
    const title = titleBase + pick(SUBTITLES, i + 3);

    docs.push({
      title,
      content: buildContent(topic, angle, i),
      image: `https://picsum.photos/seed/blog${i}/1200/600`,
      category: categoryIdByName[topic.category],
      status: pick(STATUSES, i),
      userId: author._id,
      comments: [],
      reactions: [],
      createdAt: new Date(now - Math.floor(Math.random() * twoYears)),
    });
  }

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

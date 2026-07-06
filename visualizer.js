// ==========================================
// PRAVIO VISUALIZER INTERACTIVE ENGINE
// ==========================================

// Global state
let vizSessions = [];
let activeSession = null;
let vizInterval = null;
let vizIsPlaying = false;
let vizSpeed = 500; // ms per step
let learningMode = "intermediate"; // beginner, intermediate, expert
let bookmarks = [];
let completedTopics = [];
let workspaceNotes = {}; // Keyed by lesson name

// Study metrics
let userStreak = 5;
let userXP = 1250;
let completedCount = 12;
let studyHours = 8.4;

// Diff Mode parameters
let diffModeActive = false;
let diffCodeA = "";
let diffCodeB = "";

// Custom Graph Editor state
let customGraphNodes = [];
let customGraphEdges = [];
let activeGraphNodeId = null;

// Multi-language syntax tracker
let activeSyntaxLanguage = "c";

// 28 Learning Studios Catalog
const LEARNING_STUDIOS = [
    { id: "c", title: "C Studio", desc: "Master low-level compilation, memory allocations, pointer dereferencing, and structures.", category: "languages", lessons: 24, time: "10 hrs", diff: "Intermediate", icon: "💻 C", objectives: ["Pointers & addresses", "Stack/Heap allocation", "Structures & Unions"] },
    { id: "cpp", title: "C++ Studio", desc: "Object-oriented software development with classes, inheritance, polymorphism, and STL containers.", category: "languages", lessons: 18, time: "12 hrs", diff: "Intermediate", icon: "💻 C++", objectives: ["OOP Paradigations", "Templates & Generic code", "STL Data structures"] },
    { id: "java", title: "Java Studio", desc: "Write scalable cross-platform software. Memory management, collections, and multi-threading.", category: "languages", lessons: 28, time: "18 hrs", diff: "Intermediate", icon: "☕ Java", objectives: ["JVM & Garbage sweep", "Interface inheritance", "Concurrency threads"] },
    { id: "python", title: "Python Studio", desc: "Syntax simplicity with list comprehensions, decorators, generators, and data analytics tools.", category: "languages", lessons: 28, time: "8 hrs", diff: "Beginner", icon: "🐍 Python", objectives: ["Variables & Loops", "Data Science libs", "Decorators & closures"] },
    { id: "javascript", title: "JavaScript Studio", desc: "Web client interactivity. Prototypes, event loops, call stacks, and promise pipelines.", category: "languages", lessons: 26, time: "7 hrs", diff: "Beginner", icon: "⚡ JavaScript", objectives: ["Closures scopes", "Event Loop mechanics", "Async Await threads"] },
    { id: "typescript", title: "TypeScript Studio", desc: "Enforce strict compile-time types. Structural interfaces, type annotations, and enums.", category: "languages", lessons: 12, time: "6 hrs", diff: "Intermediate", icon: "🟦 TS", objectives: ["Interface specs", "Strict types", "Generics structures"] },
    { id: "html", title: "HTML Studio", desc: "Semantic structural documents, SEO essentials, accessibility layouts, and form validations.", category: "web", lessons: 12, time: "3 hrs", diff: "Beginner", icon: "🌐 HTML", objectives: ["Semantic tags", "SEO hierarchies", "Form validation DOM"] },
    { id: "css", title: "CSS Studio", desc: "Transform layouts. Box model sizing, Flexbox grids, media queries, and transition animations.", category: "web", lessons: 14, time: "5 hrs", diff: "Beginner", icon: "🎨 CSS", objectives: ["Box model margin/border", "Flexbox layouts", "Glow keyframe transition"] },
    { id: "sql", title: "SQL Studio", desc: "Relational database operations. Aggregate filters, inner/outer joins, indexing, and ACID constraints.", category: "cs", lessons: 18, time: "6 hrs", diff: "Beginner", icon: "🗄 SQL", objectives: ["SELECT projection WHERE", "GROUP BY aggregates", "JOIN row matching"] },
    { id: "git", title: "Git & GitHub Studio", desc: "Track code changes. Git branch checkouts, commits timelines, merges, and merge conflicts.", category: "cs", lessons: 12, time: "4 hrs", diff: "Beginner", icon: "🐙 Git VCS", objectives: ["Commit checkouts", "Branch checkout rules", "Merge conflict resets"] },
    { id: "data_structures", title: "Data Structures Studio", desc: "Optimize memory storage. Arrays, lists, circular stacks, binary trees, heaps, and hash structures.", category: "cs", lessons: 24, time: "15 hrs", diff: "Advanced", icon: "📦 Data Structs", objectives: ["Arrays & Lists", "BST & AVL trees", "Bloom filter hash"] },
    { id: "algorithms", title: "Algorithms Studio", desc: "Time & space complexity optimizations. Bubble/Merge sorting, binary search, greed, and DP.", category: "cs", lessons: 25, time: "18 hrs", diff: "Advanced", icon: "⚡ Algorithms", objectives: ["Sorting swaps", "Binary search bounds", "Dynamic programming"] }
];

// Structured syllabus mapping for all 12 studios
const STUDIO_SYLLABUS = {
    c: [
        {
            module: "Module 1: C Fundamentals",
            lessons: [
                { name: "Variables", key: "c_variables", operations: ["Introduction", "Declaration", "Scope", "Lifetime"] },
                { name: "Data Types", key: "c_data_types", operations: ["Primitives", "Modifiers", "SizeOf"] },
                { name: "Operators", key: "c_operators", operations: ["Arithmetic", "Logical", "Relational"] },
                { name: "Input Output", key: "c_input_output", operations: ["printf", "scanf", "Format Specifiers"] }
            ]
        },
        {
            module: "Module 2: Control & Loops",
            lessons: [
                { name: "If Else", key: "c_if_else", operations: ["Conditions", "Nested If"] },
                { name: "Switch", key: "c_switch", operations: ["Case select", "Default case"] },
                { name: "Loops", key: "c_loops", operations: ["For Loop", "While Loop", "Do-While"] }
            ]
        },
        {
            module: "Module 3: Derived & Memory Types",
            lessons: [
                { name: "Arrays", key: "c_arrays", operations: ["Contiguous allocation", "Index boundaries"] },
                { name: "Strings", key: "c_strings", operations: ["Char arrays", "String methods"] },
                { name: "Pointers", key: "c_pointers", operations: ["Dereferencing", "Double Pointers", "Pointer Arithmetic"] }
            ]
        },
        {
            module: "Module 4: Advanced C System",
            lessons: [
                { name: "Functions", key: "c_functions", operations: ["Parameters", "Return values"] },
                { name: "Recursion", key: "c_recursion", operations: ["Stack frames", "Base case"] },
                { name: "Structures", key: "c_structures", operations: ["Definition", "Memory alignment"] },
                { name: "Dynamic Memory", key: "c_dynamic_memory", operations: ["malloc", "calloc", "free"] }
            ]
        }
    ],
    cpp: [
        {
            module: "Module 1: OOP Basics",
            lessons: [
                { name: "Classes", key: "cpp_classes", operations: ["Declaration", "Methods"] },
                { name: "Objects", key: "cpp_objects", operations: ["Instantiation", "Memory Layout"] },
                { name: "Constructors", key: "cpp_constructors", operations: ["Overloading", "Destructors"] }
            ]
        },
        {
            module: "Module 2: Inheritance & Poly",
            lessons: [
                { name: "Inheritance", key: "cpp_inheritance", operations: ["Public", "Protected", "Private"] },
                { name: "Polymorphism", key: "cpp_polymorphism", operations: ["Virtual functions", "Runtime bindings"] }
            ]
        },
        {
            module: "Module 3: C++ STL",
            lessons: [
                { name: "Vectors", key: "cpp_vectors", operations: ["Push back", "Resizing"] },
                { name: "Maps", key: "cpp_maps", operations: ["Key Value", "Find"] }
            ]
        }
    ],
    java: [
        {
            module: "Module 1: Java Basics",
            lessons: [
                { name: "Variables", key: "java_variables", operations: ["Declaration", "Scope", "Access Modifiers"] },
                { name: "Data Types", key: "java_data_types", operations: ["Primitives", "Wrapper Classes"] }
            ]
        },
        {
            module: "Module 2: Concurrency",
            lessons: [
                { name: "Thread Race Conditions", key: "java_concurrency", operations: ["Simulation", "Race conditions", "Synchronization Locks"] }
            ]
        }
    ],
    python: [
        {
            module: "Module 1: Basics & Variables",
            lessons: [
                { name: "Variables", key: "python_variables", operations: ["Introduction", "Scope", "Memory Labels"] },
                { name: "Data Types", key: "python_types", operations: ["Integers", "Floats", "Booleans"] }
            ]
        },
        {
            module: "Module 2: Built-in Containers",
            lessons: [
                { name: "Tuples", key: "python_tuples", operations: ["Introduction", "Tuple Creation", "Tuple Indexing", "Negative Indexing", "Tuple Slicing", "Tuple Packing", "Tuple Unpacking", "Tuple Iteration", "Membership", "Tuple Concatenation", "Tuple Repetition", "count()", "index()"] },
                { name: "Lists", key: "python_lists", operations: ["append()", "pop()", "extend()", "insert()", "remove()", "clear()", "sort()", "reverse()"] },
                { name: "Strings", key: "python_strings", operations: ["upper()", "lower()", "strip()", "replace()", "split()", "join()", "find()"] }
            ]
        }
    ],
    javascript: [
        {
            module: "Module 1: JS Basics",
            lessons: [
                { name: "Variables", key: "js_variables", operations: ["var", "let", "const", "Lexical Scoping"] }
            ]
        },
        {
            module: "Module 2: Array Structures",
            lessons: [
                { name: "JS Arrays", key: "javascript_arrays", operations: ["push", "pop", "shift", "unshift", "splice", "slice"] },
                { name: "JS Objects", key: "javascript_objects", operations: ["Object creation", "Object keys", "Object values"] }
            ]
        },
        {
            module: "Module 3: Asynchronous JS",
            lessons: [
                { name: "Promises", key: "js_promises", operations: ["Pending state", "Resolved chain", "Rejected catch"] },
                { name: "Event Loop", key: "js_event_loop", operations: ["Call Stack", "Microtasks queue", "Callback loop"] }
            ]
        }
    ],
    typescript: [
        {
            module: "Module 1: TS Types",
            lessons: [
                { name: "Type Annotations", key: "ts_types", operations: ["Basics", "Unions"] },
                { name: "Interfaces", key: "ts_interfaces", operations: ["Declaration", "Extends"] }
            ]
        }
    ],
    html: [
        {
            module: "Module 1: Semantic HTML",
            lessons: [
                { name: "Semantic Tags", key: "html_semantics", operations: ["Header", "Section", "Footer"] },
                { name: "Form Validations", key: "html_forms", operations: ["Inputs", "Submit"] }
            ]
        }
    ],
    css: [
        {
            module: "Module 1: CSS Layouts",
            lessons: [
                { name: "Box Model", key: "css_box_model", operations: ["Margin", "Padding", "Border"] },
                { name: "Flexbox", key: "css_flexbox", operations: ["Justify", "Align"] }
            ]
        }
    ],
    sql: [
        {
            module: "Module 1: Database Clauses",
            lessons: [
                { name: "SQL Clauses", key: "sql_clauses", operations: ["SELECT", "WHERE", "GROUP BY", "HAVING", "ORDER BY"] }
            ]
        },
        {
            module: "Module 2: Relational Joins",
            lessons: [
                { name: "SQL Joins", key: "sql_joins", operations: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "UNION"] }
            ]
        }
    ],
    git: [
        {
            module: "Module 1: Version Control",
            lessons: [
                { name: "Git Commits", key: "git_commits", operations: ["Stage", "Commit"] },
                { name: "Branching", key: "git_branches", operations: ["Checkout", "Merge"] }
            ]
        }
    ],
    data_structures: [
        {
            module: "Module 1: Linear Structures",
            lessons: [
                { name: "Arrays", key: "dsa_arrays", operations: ["Allocation", "Index access"] },
                { name: "Linked Lists", key: "dsa_linked_lists", operations: ["Node insertion", "Traversal"] },
                { name: "Stacks", key: "dsa_stacks", operations: ["Push", "Pop"] },
                { name: "Queues", key: "dsa_queues", operations: ["Enqueue", "Dequeue"] }
            ]
        },
        {
            module: "Module 2: Non-Linear Structures",
            lessons: [
                { name: "Binary Search Tree", key: "dsa_trees", operations: ["Node insertion", "BFS Traversal", "DFS Traversal"] }
            ]
        },
        {
            module: "Module 3: Graph Editor",
            lessons: [
                { name: "Graph representation", key: "dsa_graphs", operations: ["Interactive builder", "BFS search"] }
            ]
        }
    ],
    algorithms: [
        {
            module: "Module 1: Sorting Algorithms",
            lessons: [
                { name: "Bubble Sort", key: "algo_bubble_sort", operations: ["Swapping elements", "Outer passes"] },
                { name: "Insertion Sort", key: "algo_insertion_sort", operations: ["Shift elements", "Sort passes"] },
                { name: "Merge Sort", key: "algo_merge_sort", operations: ["Divide", "Merge arrays"] }
            ]
        },
        {
            module: "Module 2: Searching Algorithms",
            lessons: [
                { name: "Linear Search", key: "algo_linear_search", operations: ["Sequential scan"] },
                { name: "Binary Search", key: "algo_binary_search", operations: ["Range reduction"] }
            ]
        },
        {
            module: "Module 3: Dynamic Programming",
            lessons: [
                { name: "Fibonacci Sequence", key: "algo_fibonacci", operations: ["Memoization", "Tabulation"] }
            ]
        }
    ]
};

// Complete sub-lessons database
const SUB_LESSONS_CATALOG = {
    "python_variables": [
        {
            name: "Introduction",
            desc: "Learn Python variable dynamics and target object labels mapping.",
            code: `x = 10\ny = 20\nsum = x + y`,
            complexity: { best: "Not Applicable", avg: "Not Applicable", worst: "Not Applicable", space: "Not Applicable" },
            steps: [
                { line: 1, vars: { x: "10" }, mem: ["x (0x500) -> 10"], explain: "Variable x is bound to integer object 10 in stack frame.", action: { type: "var_alloc", name: "x", val: 10, addr: "0x500", dtype: "int" } },
                { line: 2, vars: { x: "10", y: "20" }, mem: ["x -> 10", "y -> 20"], explain: "Variable y is bound to integer object 20 in stack frame.", action: { type: "var_alloc", name: "y", val: 20, addr: "0x508", dtype: "int" } },
                { line: 3, vars: { x: "10", y: "20", sum: "30" }, mem: ["x -> 10", "y -> 20", "sum -> 30"], explain: "Compute x + y = 30 and bind the result to variable 'sum'.", action: { type: "var_alloc", name: "sum", val: 30, addr: "0x510", dtype: "int" } }
            ]
        }
    ],
    "python_tuples": [
        {
            name: "Introduction",
            desc: "Learn Tuple characteristics, memory structures, and contrast differences with python Lists.",
            code: `# Tuples characteristics demo\ntup = (10, "Pravio", 3.14)\n# Note: Tuples are immutable!`,
            complexity: { best: "Not Applicable", avg: "Not Applicable", worst: "Not Applicable", space: "Not Applicable" },
            steps: [
                { line: 2, vars: { tup: "(10, 'Pravio', 3.14)" }, mem: ["tup (0x9000) -> 10", "tup (0x9008) -> 'Pravio'", "tup (0x9010) -> 3.14"], explain: "Declare and allocate a tuple container inside heap memory containing integer, string, and float items.", action: { type: "init", data: [10, "Pravio", 3.14] } }
            ]
        },
        {
            name: "Tuple Slicing",
            desc: "Extract a sub-slice sequence of tuple elements using indexing boundaries `tup[start:end]`.",
            code: `tup = (10, 20, 30, 40, 50)\nslice_tup = tup[1:4] # indexes 1,2,3`,
            complexity: { best: "O(k)", avg: "O(k)", worst: "O(k)", space: "O(k)" },
            steps: [
                { line: 1, vars: { tup: "(10, 20, 30, 40, 50)" }, mem: ["tup (0x8000) -> [10, 20, 30, 40, 50]"], explain: "Initialize tuple with 5 elements.", action: { type: "array_state", data: [10, 20, 30, 40, 50], active: [] } },
                { line: 2, vars: { tup: "(10, 20, 30, 40, 50)", slice_tup: "(20, 30, 40)" }, mem: ["tup (0x8000)", "slice_tup (0x8500) -> [20, 30, 40]"], explain: "Slice elements from index 1 to 4 (exclusive). Slice contains index 1, 2, and 3.", action: { type: "array_state", data: [20, 30, 40], active: [0, 1, 2], highlight: true } }
            ]
        },
        {
            name: "Tuple Packing",
            desc: "Combine discrete independent variables together into a single tuple container object.",
            code: `a = 10\nb = 20\nc = 30\ntup = a, b, c # Packing`,
            complexity: { best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(n)" },
            steps: [
                { line: 1, vars: { a: 10 }, mem: ["a (stack) -> 10"], explain: "Assign variable a to 10.", action: { type: "array_state", data: [10], active: [0] } },
                { line: 2, vars: { a: 10, b: 20 }, mem: ["a -> 10", "b -> 20"], explain: "Assign variable b to 20.", action: { type: "array_state", data: [10, 20], active: [1] } },
                { line: 4, vars: { a: 10, b: 20, c: 30, tup: "(10, 20, 30)" }, mem: ["tup (0x7000) -> (10, 20, 30)"], explain: "Pack a, b, and c into a single tuple object.", action: { type: "array_state", data: [10, 20, 30], active: [0, 1, 2], complete: true } }
            ]
        },
        {
            name: "Tuple Unpacking",
            desc: "Extract tuple values directly into separate standalone variables.",
            code: `tup = (100, 200)\nx, y = tup # Unpacking`,
            complexity: { best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(n)" },
            steps: [
                { line: 1, vars: { tup: "(100, 200)" }, mem: ["tup -> (100, 200)"], explain: "Initialize tuple with values 100 and 200.", action: { type: "array_state", data: [100, 200], active: [] } },
                { line: 2, vars: { x: 100, y: 200, tup: "(100, 200)" }, mem: ["x (stack) -> 100", "y (stack) -> 200"], explain: "Unpack elements into variables x and y.", action: { type: "array_state", data: [100, 200], active: [0, 1], highlight: true } }
            ]
        }
    ],
    "java_concurrency": [
        {
            name: "Simulation",
            desc: "Understand thread race conditions, interleaving schedules, and synchronization locks.",
            code: `// Multi-threaded Balance increments\nThread t1 = new Thread(() -> balance += 10);\nThread t2 = new Thread(() -> balance += 20);`,
            complexity: { best: "O(1)", avg: "O(1)", worst: "O(1)", space: "O(1)" },
            steps: [
                { line: 2, vars: { balance: 0, "Thread 1 State": "RUNNABLE", "Thread 2 State": "WAITING" }, mem: ["Shared Balance (0x5000) -> 0"], explain: "Thread 1 gains CPU lock. Read shared balance variable value: 0.", action: { type: "thread_state", activeThread: 1, active: [0], data: [0] } },
                { line: 3, vars: { balance: 0, "Thread 1 State": "BLOCKED (Context switch)", "Thread 2 State": "RUNNABLE" }, mem: ["Shared Balance (0x5000) -> 0"], explain: "Thread 2 preempts Thread 1. Read shared balance variable: 0.", action: { type: "thread_state", activeThread: 2, active: [1], data: [0] } },
                { line: 3, vars: { balance: 20, "Thread 1 State": "BLOCKED", "Thread 2 State": "TERMINATED" }, mem: ["Shared Balance (0x5000) -> 20"], explain: "Thread 2 completes increment, writing balance = 20 back to heap memory.", action: { type: "thread_state", activeThread: 2, active: [1], data: [20], complete: true } },
                { line: 2, vars: { balance: 10, "Thread 1 State": "TERMINATED", "Thread 2 State": "TERMINATED" }, mem: ["Shared Balance (0x5000) -> 10"], explain: "Thread 1 wakes up and writes its stale value (0 + 10 = 10), overwriting Thread 2 updates! Race condition occurred.", action: { type: "thread_state", activeThread: 1, active: [0], data: [10], highlight: true } }
            ]
        }
    ],
    "dsa_arrays": [
        {
            name: "Allocation",
            desc: "Understand contiguous index memory layout of static arrays.",
            code: `// Array memory slots\nint arr[5] = {10, 20, 30, 40, 50};`,
            complexity: { best: "O(1)", avg: "O(1)", worst: "O(1)", space: "O(n)" },
            steps: [
                { line: 2, vars: { "arr[0]": 10, "arr[1]": 20, "arr[2]": 30 }, mem: ["arr (0x3000) -> [10, 20, 30, 40, 50]"], explain: "Animate contiguous allocation of array blocks in heap memory.", action: { type: "array_state", data: [10, 20, 30, 40, 50], active: [0, 1, 2, 3, 4] } }
            ]
        }
    ],
    "dsa_stacks": [
        {
            name: "Push",
            desc: "Push element onto the top of the stack.",
            code: `// Stack LIFO push\nstack[++top] = 42;`,
            complexity: { best: "O(1)", avg: "O(1)", worst: "O(1)", space: "O(1)" },
            steps: [
                { line: 2, vars: { top: 0 }, mem: ["stack[0] -> 42"], explain: "Push 42 onto index 0. Increments top stack pointer.", action: { type: "array_state", data: [42, "", "", ""], active: [0], highlight: true } }
            ]
        }
    ],
    "dsa_queues": [
        {
            name: "Enqueue",
            desc: "Enqueue element at the tail of the queue.",
            code: `// Queue FIFO enqueue\nqueue[tail++] = 88;`,
            complexity: { best: "O(1)", avg: "O(1)", worst: "O(1)", space: "O(1)" },
            steps: [
                { line: 2, vars: { head: 0, tail: 1 }, mem: ["queue[0] -> 88"], explain: "Enqueue 88 at tail. Increments tail queue pointer.", action: { type: "array_state", data: [88, "", "", ""], active: [0], highlight: true } }
            ]
        }
    ],
    "algo_bubble_sort": [
        {
            name: "Swapping elements",
            desc: "Bubble sort swaps adjacent elements if they are in the wrong order.",
            code: `// Bubble Sort swap iteration\nif (arr[j] > arr[j+1]) {\n    swap(arr[j], arr[j+1]);\n}`,
            complexity: { best: "O(n)", avg: "O(n^2)", worst: "O(n^2)", space: "O(1)" },
            steps: [
                { line: 2, vars: { "arr[0]": 5, "arr[1]": 2 }, mem: ["arr -> [5, 2, 8]"], explain: "Compare element 5 at index 0 and 2 at index 1. Since 5 > 2, swap them.", action: { type: "array_state", data: [5, 2, 8], active: [0, 1], highlight: true } },
                { line: 3, vars: { "arr[0]": 2, "arr[1]": 5 }, mem: ["arr -> [2, 5, 8]"], explain: "Swap completed: index 0 and 1 swapped successfully.", action: { type: "array_state", data: [2, 5, 8], active: [0, 1], complete: true } }
            ]
        }
    ],
    "dsa_trees": [
        {
            name: "BFS Traversal",
            desc: "Breadth-First Search: Visit nodes level-by-level using a FIFO Queue.",
            code: `// BST BFS level traversal\nQueue q = new Queue();\nq.enqueue(50); // root`,
            complexity: { best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(n)" },
            steps: [
                { line: 1, vars: { queue: "[]", root: 50 }, mem: ["Queue allocated"], explain: "Initialize an empty queue for tracking active nodes.", action: { type: "tree_bfs", visited: [], active: 50, queue: [] } },
                { line: 2, vars: { queue: "[50]", root: 50 }, mem: ["Queue -> 50"], explain: "Enqueue root node (50) to start breadth-first expansion.", action: { type: "tree_bfs", visited: [], active: 50, queue: [50] } },
                { line: 2, vars: { queue: "[30, 70]", visited: "[50]" }, mem: ["Visited -> 50"], explain: "De-queue node 50, mark as visited, and enqueue children nodes (30) and (70).", action: { type: "tree_bfs", visited: [50], active: 30, queue: [30, 70] } }
            ]
        }
    ],
    "dsa_graphs": [
        {
            name: "Interactive builder",
            desc: "Click canvas to draw node points, drag connections, and watch BFS path visualizer traces.",
            code: `// Graph representations\nGraph g = new Graph();\ng.addEdge("Node A", "Node B");`,
            complexity: { best: "O(V + E)", avg: "O(V + E)", worst: "O(V + E)", space: "O(V + E)" },
            steps: [
                { line: 2, vars: { nodesCount: 2 }, mem: ["Node A (0x10) -> B"], explain: "Graph canvas initialized. Double-click to create custom nodes.", action: { type: "interactive_graph" } }
            ]
        }
    ]
};

// Auto-generate context-aware analogies, mistakes, and interview tips dynamically based on topic key
function getDynamicAnalogyAndTips(category, topicKey, displayName) {
    const key = topicKey.toLowerCase();
    
    if (key.includes("pointer")) {
        return {
            analogy: "Think of a pointer like a street address. Instead of carrying the house itself, you carry a slip of paper telling you where the house is located.",
            mistake: "Dereferencing a pointer that points to NULL or random garbage address coordinates.",
            tip: "Always check if your pointers are null pointers before attempting to read/write value blocks.",
            practice: "Write code declaring an integer, a pointer, and assign the pointer to reference that integer."
        };
    }
    if (key.includes("tuple")) {
        return {
            analogy: "Think of a tuple as a sealed parcel package. Once you pack items inside, you can read them, but you can never change or swap them without opening a new parcel.",
            mistake: "Attempting to change tuple elements in place like a list (e.g. tup[0] = 5).",
            tip: "Use tuples when you want to ensure data parameters cannot be modified by other parts of the script.",
            practice: "Create a tuple representing coordinate dimensions and try to read the second item."
        };
    }
    if (key.includes("list") || key.includes("array")) {
        return {
            analogy: "Think of an array or list as a train. Each carriage is an index slot where passengers sit. You can walk through carriages in order.",
            mistake: "Accessing index bounds out of range (e.g., index 5 on an array of size 5).",
            tip: "Keep track of array size bounds, particularly when writing loops.",
            practice: "Iterate through a list and insert an element at index 2."
        };
    }
    if (key.includes("tree")) {
        return {
            analogy: "Think of a binary tree like a corporate hierarchy. The CEO is the root node, and managers branch off to lead separate teams below.",
            mistake: "Creating cyclic links that lock traversal loops in infinite cycles.",
            tip: "Ensure base cases are reached in your tree traversals to avoid stack overflow crashes.",
            practice: "Trace path traversal order from root node 50 to leaf node 40."
        };
    }
    if (key.includes("sql") || key.includes("join")) {
        return {
            analogy: "Think of database tables as spreadsheets. Joins act like merging two sheets together based on a matching ID column.",
            mistake: "Writing Cartesian joins (omitting join match filters) that create huge redundant data rows.",
            tip: "Use explicit INNER/LEFT join statements instead of implicit comma separations.",
            practice: "Write a query joining student info tables on student ID."
        };
    }
    if (key.includes("html") || key.includes("css")) {
        return {
            analogy: "Think of HTML as the brick walls of a house, and CSS as the paint colors, wallpapers, and dimensions of each room.",
            mistake: "Forgetting to close HTML tags or mistyping CSS selector syntax names.",
            tip: "Keep style declarations separated in custom CSS files for code maintenance.",
            practice: "Style a div box margin and background color elements."
        };
    }

    // Dynamic general fallback using current topic name
    return {
        analogy: `Think of ${displayName} as a building block in your software design. It provides structured parameters to organize your instructions.`,
        mistake: `Misunderstanding the local scope or lifecycle boundaries of ${displayName}.`,
        tip: `Consult language style guides to format ${displayName} declarations correctly.`,
        practice: `Create a clean code snippet showing ${displayName} instantiation.`
    };
}

// Generate topic-specific dynamic revision guide layout
function getTopicRevisionGuide(studioId, topicKey, displayName) {
    const key = topicKey.toLowerCase();
    
    if (key.includes("pointer")) {
        return `
            <div style="font-weight:700; color:var(--primary-color); margin-bottom:8px;">C Pointers Cheat Sheet & Takeaways</div>
            <p><strong>Definition:</strong> A pointer is a variable that stores the memory address of another variable.</p>
            <p><strong>Key Concepts:</strong> Dereferencing (*ptr) accesses the value at that address. Pointer arithmetic allows moving through contiguous memory array offsets.</p>
            <p><strong>Complexity:</strong> Address referencing and dereferencing take <strong>O(1) constant time</strong>.</p>
            <p><strong>Common Mistakes:</strong> Accessing unassigned wild pointers or dereferencing NULL pointers (causes Segmentation Fault crashes).</p>
            <p><strong>Best Practices:</strong> Always initialize pointers to <code>NULL</code> when declaring them, and verify pointers are not NULL before dereferencing.</p>
            <p><strong>Interview Question:</strong> What is the difference between pointer pass-by-value and pass-by-reference in C functions?</p>
            <p><strong>Real-world Use:</strong> Direct hardware mapping, dynamic memory allocations, and high-performance buffer streaming.</p>
        `;
    }
    if (key.includes("tuple")) {
        return `
            <div style="font-weight:700; color:var(--primary-color); margin-bottom:8px;">Python Tuples Cheat Sheet & Takeaways</div>
            <p><strong>Definition:</strong> Tuples are ordered, immutable collections of heterogeneous items declared with parentheses <code>()</code>.</p>
            <p><strong>Key Concepts:</strong> Slicing, packing, unpacking, element membership testing, iteration loop pipelines.</p>
            <p><strong>Complexity:</strong> Index lookup takes <strong>O(1) time</strong>. Concatenation takes <strong>O(n + m) time</strong>.</p>
            <p><strong>Common Mistakes:</strong> Mismatched unpacking variable lengths, or attempting to write or update indices in-place (raises TypeError).</p>
            <p><strong>Best Practices:</strong> Use tuples for read-only static records or as keys inside dictionaries.</p>
            <p><strong>Interview Question:</strong> Why are Python tuples more memory-efficient than lists?</p>
            <p><strong>Real-world Use:</strong> Returning multiple coordinates or status outputs from clean database queries.</p>
        `;
    }
    if (key.includes("array") || key.includes("list")) {
        return `
            <div style="font-weight:700; color:var(--primary-color); margin-bottom:8px;">Arrays & Lists Cheat Sheet & Takeaways</div>
            <p><strong>Definition:</strong> Contiguous memory cells storing elements of homogeneous types accessible via 0-based indices.</p>
            <p><strong>Key Concepts:</strong> Linear traversals, element swapping, index-based edits, bounds checking.</p>
            <p><strong>Complexity:</strong> Access is <strong>O(1) time</strong>. Insertion/Deletion takes <strong>O(n) linear time</strong> due to element shifting.</p>
            <p><strong>Common Mistakes:</strong> Traversing beyond index boundaries (leads to OutOfBounds exceptions).</p>
            <p><strong>Best Practices:</strong> Pre-allocate capacity when possible to prevent frequent resizing allocations.</p>
            <p><strong>Interview Question:</strong> Describe how dynamic arrays resize when they exceed capacity thresholds.</p>
            <p><strong>Real-world Use:</strong> Storage buffer queues, database index vectors, and image pixel matrices.</p>
        `;
    }
    if (key.includes("tree")) {
        return `
            <div style="font-weight:700; color:var(--primary-color); margin-bottom:8px;">Binary Trees Cheat Sheet & Takeaways</div>
            <p><strong>Definition:</strong> Non-linear hierarchical structure where each parent node contains at most two children nodes (left/right).</p>
            <p><strong>Key Concepts:</strong> Node relations, height depth tracking, BFS (level traversal), and DFS (Pre/In/Post order traversals).</p>
            <p><strong>Complexity:</strong> Search & Insertion take <strong>O(log n) average time</strong>, and <strong>O(n) worst-case time</strong> (unbalanced trees).</p>
            <p><strong>Common Mistakes:</strong> Traversal logic missing null checking conditions (leads to NullPointer exception failures).</p>
            <p><strong>Best Practices:</strong> Balance trees (e.g. AVL or Red-Black trees) to keep optimal search complexity.</p>
            <p><strong>Interview Question:</strong> Write an algorithm to find the maximum depth height of a Binary Search Tree.</p>
            <p><strong>Real-world Use:</strong> Compilers syntax parsing, DOM representations, and hierarchical file systems.</p>
        `;
    }
    if (key.includes("sql") || key.includes("join") || key.includes("clause")) {
        return `
            <div style="font-weight:700; color:var(--primary-color); margin-bottom:8px;">SQL Relational Operations Cheat Sheet & Takeaways</div>
            <p><strong>Definition:</strong> SQL clauses query and combine data subsets across relational tables using constraints filters.</p>
            <p><strong>Key Concepts:</strong> Row projection filtering (SELECT / WHERE), join mappings (INNER / LEFT / RIGHT), aggregate grouping.</p>
            <p><strong>Complexity:</strong> Joins take <strong>O(n * m) time</strong> without indexes; optimized to <strong>O(n log m) time</strong> with indexes.</p>
            <p><strong>Common Mistakes:</strong> Joining columns without index properties, or causing Cartesian product overflows.</p>
            <p><strong>Best Practices:</strong> Always write query plans (EXPLAIN) and select columns explicitly instead of using * wildcards.</p>
            <p><strong>Interview Question:</strong> Explain the structural differences between LEFT JOIN and INNER JOIN operations.</p>
            <p><strong>Real-world Use:</strong> Financial reports generation, user authentication tables matching, and analytical queries.</p>
        `;
    }
    if (key.includes("html") || key.includes("css")) {
        return `
            <div style="font-weight:700; color:var(--primary-color); margin-bottom:8px;">HTML/CSS Web Layouts Cheat Sheet & Takeaways</div>
            <p><strong>Definition:</strong> HTML tags structure content elements on screen, while CSS rules apply formatting rules.</p>
            <p><strong>Key Concepts:</strong> Document Object Model (DOM) hierarchies, Box Model spacing, positioning layout schemes.</p>
            <p><strong>Complexity:</strong> Style rules match against elements in <strong>O(1) to O(n) rendering cycles</strong>.</p>
            <p><strong>Common Mistakes:</strong> Overlooking margin collapse properties, or nesting tags incorrectly.</p>
            <p><strong>Best Practices:</strong> Enforce responsive structures using relative measurements (em, rem, percentages).</p>
            <p><strong>Interview Question:</strong> Explain how padding, margin, border, and content calculate in the CSS Box Model.</p>
            <p><strong>Real-world Use:</strong> Interactive web clients dashboard, SEO responsive layouts, and responsive interfaces.</p>
        `;
    }

    // Dynamic general fallback matching target displayName
    return `
        <div style="font-weight:700; color:var(--primary-color); margin-bottom:8px;">${displayName} Revision Guide & Takeaways</div>
        <p><strong>Definition:</strong> Core concepts, syntax models, and runtime parameters of ${displayName} in ${studioId.toUpperCase()}.</p>
        <p><strong>Key Concepts:</strong> Structural variables, namespace scopes, loop iterators, code debugging.</p>
        <p><strong>Complexity:</strong> Operations complexity varies; simple values access takes constant O(1) CPU registers lookup.</p>
        <p><strong>Common Mistakes:</strong> Syntax typos, missing keywords, and scope mismatch bindings.</p>
        <p><strong>Best Practices:</strong> Keep variables encapsulated inside minimal functional parameters.</p>
        <p><strong>Interview Question:</strong> How does ${displayName} execute inside standard runtime execution environments?</p>
        <p><strong>Real-world Use:</strong> Modular software design and structural parameters tracking.</p>
    `;
}

// Build studio cards
function buildStudioDashboard() {
    const grid = document.getElementById('viz-studios-grid');
    if (!grid) return;

    grid.innerHTML = '';

    LEARNING_STUDIOS.forEach(st => {
        const progressVal = localStorage.getItem(`viz_progress_${st.id}`) || '0';
        
        const card = document.createElement('div');
        card.className = 'studio-card';
        card.setAttribute('data-category', st.category);
        card.setAttribute('data-title', st.title.toLowerCase());
        
        card.style.background = 'var(--bg-container)';
        card.style.border = '1px solid var(--border-color)';
        card.style.borderRadius = '12px';
        card.style.padding = '18px';
        card.style.position = 'relative';
        card.style.overflow = 'hidden';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '10px';
        card.style.transition = 'transform 0.3s, box-shadow 0.3s';
        card.style.boxShadow = 'var(--shadow-sm)';
        card.style.cursor = 'pointer';

        card.onmouseenter = () => {
            card.style.transform = 'translateY(-4px)';
            card.style.boxShadow = '0 10px 20px rgba(59, 130, 246, 0.12)';
            card.style.borderColor = 'var(--primary-color)';
        };
        card.onmouseleave = () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'var(--shadow-sm)';
            card.style.borderColor = 'var(--border-color)';
        };

        let objectivesHtml = st.objectives.map(o => `<li style="font-size:11px; color:var(--text-muted); list-style:inside disc;">${o}</li>`).join('');

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div style="font-size:1.8rem; background:rgba(59,130,246,0.06); width:50px; height:50px; border-radius:10px; display:flex; align-items:center; justify-content:center;">${st.icon.split(' ')[0]}</div>
                <span style="font-size:10px; font-weight:700; text-transform:uppercase; padding:2px 8px; border-radius:20px; background:rgba(16, 185, 129, 0.1); color:#10b981;">${st.diff}</span>
            </div>
            
            <div>
                <h4 style="margin:0; font-size:1.15rem; font-weight:800; color:var(--text-body);">${st.title}</h4>
                <p style="font-size:12px; color:var(--text-muted); margin:4px 0 10px 0; line-height:1.4;">${st.desc}</p>
            </div>

            <div style="border-top:1px dashed var(--border-color); padding-top:8px; margin-top:auto;">
                <div style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">Learning Objectives</div>
                <ul style="margin:0; padding:0; list-style:none;">${objectivesHtml}</ul>
            </div>

            <div style="margin-top:12px;">
                <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted); margin-bottom:4px;">
                    <span>Syllabus: ${st.lessons} lessons</span>
                    <span>${progressVal}% Done</span>
                </div>
                <div style="width:100%; height:6px; background:var(--border-color); border-radius:3px; overflow:hidden;">
                    <div style="width:${progressVal}%; height:100%; background:var(--primary-color);"></div>
                </div>
            </div>

            <button onclick="enterStudioWorkspace('${st.id}', '${st.title}')" class="btn btn-primary" style="width:100%; padding:8px; font-size:12px; font-weight:700; border-radius:8px; margin-top:8px; display:flex; align-items:center; justify-content:center; gap:6px;">
                <span>Continue Learning</span> <i class="fas fa-play" style="font-size:10px;"></i>
            </button>
        `;

        grid.appendChild(card);
    });
}

function filterStudios(category) {
    const cards = document.querySelectorAll('.studio-card');
    cards.forEach(c => {
        if (category === 'all' || c.getAttribute('data-category') === category) {
            c.style.display = 'flex';
        } else {
            c.style.display = 'none';
        }
    });

    const btns = document.querySelectorAll('#viz-category-filters button');
    btns.forEach(btn => {
        btn.className = 'btn btn-secondary';
        btn.style.background = 'var(--bg-container)';
    });
    
    const active = Array.from(btns).find(btn => btn.innerText.toLowerCase().includes(category) || (category === 'all' && btn.innerText.includes('All')));
    if (active) {
        active.className = 'btn btn-primary';
        active.style.background = 'var(--primary-color)';
    }
}

function searchStudios(query) {
    const q = query.toLowerCase().trim();
    const cards = document.querySelectorAll('.studio-card');
    cards.forEach(c => {
        const title = c.getAttribute('data-title');
        if (title.includes(q)) {
            c.style.display = 'flex';
        } else {
            c.style.display = 'none';
        }
    });
}

// Enter workspace
function enterStudioWorkspace(studioId, studioTitle) {
    document.getElementById('viz-dashboard-view').style.display = 'none';
    document.getElementById('viz-workspace-view').style.display = 'flex';

    document.getElementById('breadcrumb-studio').innerText = studioTitle;
    
    buildStudioSyllabusTree(studioId);

    localStorage.setItem('viz_recent_studio', studioId);

    const syllabus = STUDIO_SYLLABUS[studioId] || [
        { module: "Module 1: General Basics", lessons: [{ name: "Variables", key: "general_variables", operations: ["Introduction"] }] }
    ];
    const firstLesson = syllabus[0].lessons[0];
    loadCurriculumTopic(studioId, firstLesson.key, firstLesson.name);
}

function exitStudioWorkspace() {
    document.getElementById('viz-workspace-view').style.display = 'none';
    document.getElementById('viz-dashboard-view').style.display = 'flex';
    
    vizIsPlaying = false;
    clearInterval(vizInterval);
    updatePlayPauseButtonUI();
    
    buildStudioDashboard();
}

function buildStudioSyllabusTree(studioId) {
    const treeEl = document.getElementById('viz-curriculum-tree');
    if (!treeEl) return;

    treeEl.innerHTML = '';
    const syllabus = STUDIO_SYLLABUS[studioId] || [];

    syllabus.forEach(mod => {
        const modNode = document.createElement('div');
        modNode.className = 'curr-folder';

        const header = document.createElement('div');
        header.className = 'folder-header';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.gap = '8px';
        header.style.padding = '8px 10px';
        header.style.borderRadius = '6px';
        header.style.cursor = 'pointer';
        header.style.fontWeight = '700';
        header.style.color = 'var(--text-body)';
        header.onclick = () => toggleFolderNode(header);

        header.innerHTML = `
            <i class="fas fa-chevron-right folder-chevron" style="font-size:10px; transition:transform 0.2s;"></i>
            <span style="font-size:12.5px;">${mod.module}</span>
        `;
        modNode.appendChild(header);

        const contents = document.createElement('div');
        contents.className = 'folder-contents';
        contents.style.paddingLeft = '14px';
        contents.style.display = 'none';

        mod.lessons.forEach(l => {
            const item = document.createElement('div');
            item.className = 'tree-item';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            
            const checkIcon = completedTopics.includes(l.key.toLowerCase()) ? '<i class="fas fa-check-circle" style="color:#10b981;"></i>' : '<i class="far fa-circle" style="color:var(--text-muted);"></i>';
            
            item.innerHTML = `
                <span>${l.name}</span>
                ${checkIcon}
            `;
            item.onclick = () => loadCurriculumTopic(studioId, l.key, l.name);
            contents.appendChild(item);
        });

        modNode.appendChild(contents);
        treeEl.appendChild(modNode);
    });
}

function toggleFolderNode(headerElement) {
    const contents = headerElement.nextElementSibling;
    const chevron = headerElement.querySelector('.folder-chevron');
    if (contents) {
        if (contents.style.display === 'none' || contents.style.display === '') {
            contents.style.display = 'block';
            if (chevron) {
                chevron.style.transform = 'rotate(90deg)';
            }
        } else {
            contents.style.display = 'none';
            if (chevron) {
                chevron.style.transform = 'rotate(0deg)';
            }
        }
    }
}

// Tabs
function toggleWorkspaceTab(tab) {
    const tabNotes = document.getElementById('workspace-tab-notes');
    const tabRev = document.getElementById('workspace-tab-revision');
    const btnNotes = document.getElementById('tab-btn-notes');
    const btnRev = document.getElementById('tab-btn-revision');

    if (tab === 'notes') {
        if (tabNotes) tabNotes.style.display = 'flex';
        if (tabRev) tabRev.style.display = 'none';
        if (btnNotes) {
            btnNotes.style.background = 'var(--bg-container)';
            btnNotes.style.color = 'var(--primary-color)';
            btnNotes.style.fontWeight = '700';
        }
        if (btnRev) {
            btnRev.style.background = 'transparent';
            btnRev.style.color = 'var(--text-body)';
            btnRev.style.fontWeight = '600';
        }
    } else {
        if (tabNotes) tabNotes.style.display = 'none';
        if (tabRev) tabRev.style.display = 'block';
        if (btnRev) {
            btnRev.style.background = 'var(--bg-container)';
            btnRev.style.color = 'var(--primary-color)';
            btnRev.style.fontWeight = '700';
        }
        if (btnNotes) {
            btnNotes.style.background = 'transparent';
            btnNotes.style.color = 'var(--text-body)';
            btnNotes.style.fontWeight = '600';
        }
    }
}

function saveActiveWorkspaceNotes() {
    if (!activeSession) return;
    const notesText = document.getElementById('workspace-notes-textarea');
    if (notesText) {
        workspaceNotes[activeSession.name] = notesText.value;
        localStorage.setItem('pravio_visualizer_notes', JSON.stringify(workspaceNotes));
        alert('Notes saved successfully!');
    }
}

function loadCurriculumTopic(studioId, topicKey, displayName) {
    document.getElementById('breadcrumb-topic').innerText = displayName;

    const consoleLog = document.getElementById('viz-console-log');
    if (consoleLog) {
        consoleLog.innerHTML = `[Console System Initialized]\nLoaded Studio: ${studioId}\nLesson: ${displayName}\nReady for execution...`;
    }

    // Default load sub-lesson operations toolbar
    const sublessonToolbar = document.getElementById('viz-sublesson-toolbar');
    if (sublessonToolbar) {
        sublessonToolbar.innerHTML = '';
        
        let activeKey = topicKey.toLowerCase();
        
        if (!SUB_LESSONS_CATALOG[activeKey]) {
            SUB_LESSONS_CATALOG[activeKey] = [
                {
                    name: "Introduction",
                    desc: `Learn the fundamentals of ${displayName} in ${studioId.toUpperCase()}.`,
                    code: generateCurriculumCodeSample(studioId, displayName),
                    complexity: { best: "Not Applicable", avg: "Not Applicable", worst: "Not Applicable", space: "Not Applicable" },
                    steps: [
                        { line: 1, vars: { topic: displayName }, mem: [`Topic -> ${displayName}`], explain: `Beginning interactive workspace lesson for ${displayName}.`, action: { type: "generic" } }
                    ]
                }
            ];
        }

        const list = SUB_LESSONS_CATALOG[activeKey];

        list.forEach((sub, sIdx) => {
            const btn = document.createElement('button');
            btn.className = 'btn btn-secondary';
            btn.style.padding = '4px 10px';
            btn.style.fontSize = '12px';
            btn.style.borderRadius = '6px';
            btn.style.fontWeight = sIdx === 0 ? '700' : '500';
            btn.style.background = sIdx === 0 ? 'var(--primary-color)' : 'var(--bg-container)';
            btn.style.color = sIdx === 0 ? '#ffffff' : 'var(--text-body)';
            btn.style.border = '1px solid var(--border-color)';
            btn.innerText = sub.name;
            
            btn.onclick = () => {
                Array.from(sublessonToolbar.children).forEach(child => {
                    child.style.background = 'var(--bg-container)';
                    child.style.color = 'var(--text-body)';
                    child.style.fontWeight = '500';
                });
                btn.style.background = 'var(--primary-color)';
                btn.style.color = '#ffffff';
                btn.style.fontWeight = '700';
                
                loadSelectedSubLesson(activeKey, sIdx, studioId, topicKey);
            };
            
            sublessonToolbar.appendChild(btn);
        });

        loadSelectedSubLesson(activeKey, 0, studioId, topicKey);
    }

    const previewContainer = document.getElementById('viz-html-preview-container');
    if (previewContainer) {
        if (displayName.toLowerCase().includes('css') || displayName.toLowerCase().includes('html') || displayName.toLowerCase().includes('box')) {
            previewContainer.style.display = 'flex';
        } else {
            previewContainer.style.display = 'none';
        }
    }
}

// Generate topic-specific example code snippets
function generateCurriculumCodeSample(studioId, topicName) {
    const name = topicName.toLowerCase();
    
    // Auto sync translation of active syntax language representation
    if (activeSyntaxLanguage === "python") {
        if (name.includes("variable")) {
            return `# Python variables\nx = 10\ny = 20.5\nname = "Pravio"`;
        }
        if (name.includes("pointer")) {
            return `# Python names referencing target heap arrays\nval = 42\nref_val = val\nprint(ref_val)`;
        }
    }
    
    if (studioId === 'c') {
        if (name.includes("variable")) {
            return `// C Variable allocations\nint age = 20;\nfloat salary = 45000.5;\nchar grade = 'A';`;
        }
        if (name.includes("data type")) {
            return `// C Data Types primitives\nint score = 95;\ndouble percentage = 98.75;\nchar letter = 'B';`;
        }
        if (name.includes("operator")) {
            return `// C Operators arithmetic\nint a = 15;\nint b = 4;\nint sum = a + b;\nint remainder = a % b;`;
        }
        if (name.includes("input output")) {
            return `// C Input Output IO stream\nprintf("Enter target boundary:\\n");\nint bound = 100;\nprintf("Boundary: %d\\n", bound);`;
        }
        if (name.includes("if else")) {
            return `// C Control Flow conditionals\nint mark = 85;\nif (mark >= 90) {\n    printf("Excellent\\n");\n} else {\n    printf("Good\\n");\n}`;
        }
        if (name.includes("switch")) {
            return `// C Switch multi-branch\nint selector = 2;\nswitch(selector) {\n    case 1: printf("First\\n"); break;\n    case 2: printf("Second\\n"); break;\n    default: printf("Other\\n");\n}`;
        }
        if (name.includes("loop")) {
            return `// C Loop iteration cycles\nint result = 0;\nfor (int i = 0; i < 3; i++) {\n    result += 10;\n}`;
        }
        if (name.includes("array")) {
            return `// C Static Array contiguous layout\nint items[3] = {10, 20, 30};\nint val = items[1];`;
        }
        if (name.includes("string")) {
            return `// C String char array\nchar name[] = "Pravio";\nint size = 6;`;
        }
        if (name.includes("pointer")) {
            return `// C Pointer dereference reference\nint num = 42;\nint *ptr = &num;\n*ptr = 99;`;
        }
        if (name.includes("function")) {
            return `// C Function scopes\nint add(int a, int b) {\n    return a + b;\n}\nint sum = add(10, 20);`;
        }
        if (name.includes("recursion")) {
            return `// C Model Recursion\nint factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\nint ans = factorial(3);`;
        }
        if (name.includes("structure")) {
            return `// C Structure alignment\nstruct Student {\n    int roll;\n    float score;\n};\nstruct Student s = {101, 95.5};`;
        }
        if (name.includes("memory")) {
            return `// C Dynamic malloc alloc\nint *arr = (int*)malloc(2 * sizeof(int));\narr[0] = 5;\nfree(arr);`;
        }
    }
    
    if (studioId === 'cpp') {
        if (name.includes("class")) {
            return `// C++ Class declaration\nclass Student {\npublic:\n    int id = 101;\n};`;
        }
        if (name.includes("object")) {
            return `// C++ Object memory layout\nStudent s1;\nint sid = s1.id;`;
        }
        if (name.includes("constructor")) {
            return `// C++ Constructor definition\nclass Book {\npublic:\n    int pages;\n    Book(int p) { pages = p; }\n};\nBook b(350);`;
        }
        if (name.includes("inheritance")) {
            return `// C++ Base & Derived classes\nclass Father {};\nclass Child : public Father {};`;
        }
        if (name.includes("polymorphism")) {
            return `// C++ Virtual functions\nclass Shape {\npublic:\n    virtual void draw() {}\n};`;
        }
        if (name.includes("vector")) {
            return `// C++ STL dynamic vector\nstd::vector<int> numbers = {10, 20};\nnumbers.push_back(30);`;
        }
    }
    
    if (studioId === 'java') {
        if (name.includes("variable")) {
            return `// Java Variables mapping\nint age = 22;\ndouble sal = 55000.5;\nString name = "Alice";`;
        }
        if (name.includes("type")) {
            return `// Java Primitive data types\nbyte b = 127;\nint code = 1001;\nboolean status = true;`;
        }
    }
    
    if (studioId === 'python') {
        if (name.includes("variable")) {
            return `# Python Variables dynamic assignment\nx = 10\ny = "Pravio"\nprint(x)`;
        }
        if (name.includes("type")) {
            return `# Python Basic types\npi = 3.14159\nis_valid = True\nlabel = "Code"`;
        }
    }
    
    if (studioId === 'javascript') {
        if (name.includes("variable")) {
            return `// JS variable block scopes\nlet x = 100;\nconst name = "Pravio";\nvar legacy = true;`;
        }
        if (name.includes("promise")) {
            return `// JS Promises async resolver\nconst task = new Promise((resolve) => {\n    resolve("Done");\n});`;
        }
        if (name.includes("event loop")) {
            return `// JS Event Loop task priorities\nconsole.log("Sync 1");\nsetTimeout(() => console.log("Macro 1"), 0);\nconsole.log("Sync 2");`;
        }
    }

    if (studioId === 'typescript') {
        return `// TypeScript annotations\nlet age: number = 25;\ninterface User {\n    id: number;\n}`;
    }

    if (studioId === 'html') {
        return `<!-- HTML5 structure -->\n<div class="card">\n    <h3>Pravio layout</h3>\n</div>`;
    }

    if (studioId === 'css') {
        return `/* CSS Layout attributes */\n.card {\n    margin: 10px;\n    padding: 15px;\n    border: 1px solid #ddd;\n}`;
    }

    if (studioId === 'git') {
        return `# Git workflow instructions\ngit add .\ngit commit -m "Initialize project"`;
    }

    if (studioId === 'data_structures') {
        return `// DSA Data Structures allocation\nint items[5] = {10, 20, 30, 40, 50};`;
    }

    if (studioId === 'algorithms') {
        return `// Algorithm Swapping logic\nint temp = a;\na = b;\nb = temp;`;
    }

    // Default template fallbacks
    return `// ${topicName} Fundamentals\n// Start writing code samples here...`;
}

// Diff Mode Layout Toggler
function toggleDiffMode() {
    diffModeActive = !diffModeActive;
    const btn = document.getElementById('viz-diff-btn');
    if (btn) {
        btn.style.background = diffModeActive ? 'var(--primary-color)' : 'var(--bg-container)';
        btn.style.color = diffModeActive ? '#ffffff' : 'var(--text-body)';
    }

    const editorContainer = document.getElementById('viz-code-editor').parentNode.parentNode;

    if (diffModeActive) {
        diffCodeA = document.getElementById('viz-code-editor').value;
        diffCodeB = diffCodeA.replace("20", "80").replace("10", "40"); // Dynamic variant

        // Split code editor view side-by-side
        editorContainer.innerHTML = `
            <div style="flex: 1; display: flex; flex-direction: column; border-right: 1px solid var(--border-color); height: 100%; min-width: 0;">
                <div style="padding: 4px 12px; background: rgba(0,0,0,0.02); font-size: 10px; font-weight: 700; color: var(--primary-color);">Algorithm A (Standard)</div>
                <div style="flex: 1; display: flex; font-family: monospace; font-size: 12.5px; overflow: hidden; background: var(--bg-container);">
                    <textarea id="viz-code-editor" style="flex: 1; padding: 10px; border: none; background: transparent; color: var(--text-body); resize: none; outline: none; font-family: inherit; font-size: inherit; line-height: inherit; overflow-y: auto;"></textarea>
                </div>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; height: 100%; min-width: 0;">
                <div style="padding: 4px 12px; background: rgba(0,0,0,0.02); font-size: 10px; font-weight: 700; color: #14b8a6;">Algorithm B (Comparison Scale)</div>
                <div style="flex: 1; display: flex; font-family: monospace; font-size: 12.5px; overflow: hidden; background: var(--bg-container);">
                    <textarea id="viz-code-editor-b" style="flex: 1; padding: 10px; border: none; background: transparent; color: var(--text-body); resize: none; outline: none; font-family: inherit; font-size: inherit; line-height: inherit; overflow-y: auto;"></textarea>
                </div>
            </div>
        `;
        document.getElementById('viz-code-editor').value = diffCodeA;
        document.getElementById('viz-code-editor-b').value = diffCodeB;
        runCustomCode();
    } else {
        // Restore normal layout
        editorContainer.innerHTML = `
            <div style="flex: 3; display: flex; flex-direction: column; border-right: 1px solid var(--border-color); min-width: 0; height: 100%;">
                <div style="padding: 6px 12px; background: rgba(0,0,0,0.02); font-size: 11px; font-weight: 700; color: var(--text-muted); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <span>Editable Source Code</span>
                    <button onclick="runCustomCode()" class="btn btn-primary" style="padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700;"><i class="fas fa-play"></i> Run Code</button>
                </div>
                <div style="flex: 1; display: flex; font-family: monospace; font-size: 12.5px; line-height: 1.5; overflow: hidden; background: var(--bg-container);">
                    <div id="viz-line-gutter" style="padding: 10px 6px; border-right: 1px solid var(--border-color); background: rgba(0,0,0,0.05); color: var(--text-muted); text-align: right; user-select: none; min-width: 32px; box-sizing: border-box;"></div>
                    <textarea id="viz-code-editor" style="flex: 1; padding: 10px; border: none; background: transparent; color: var(--text-body); resize: none; outline: none; font-family: inherit; font-size: inherit; line-height: inherit; overflow-y: auto;"></textarea>
                </div>
            </div>
            <!-- Console -->
            <div style="flex: 1; display: flex; flex-direction: column; border-right: 1px solid var(--border-color); min-width: 0; height: 100%;">
                <div style="padding: 6px 12px; background: rgba(0,0,0,0.02); font-size: 11px; font-weight: 700; color: var(--text-muted); border-bottom: 1px solid var(--border-color);">Console Output</div>
                <div id="viz-console-log" style="flex: 1; padding: 10px; background: #1f2937; color: #10b981; font-family: monospace; font-size: 11.5px; overflow-y: auto; white-space: pre-wrap; line-height: 1.45;"></div>
            </div>
        `;
        document.getElementById('viz-code-editor').value = diffCodeA || `x = 10`;
        syncEditorLineNumbers();
        runCustomCode();
    }
}

// Switch active translation mapping language
function setSyntaxLanguage(lang) {
    activeSyntaxLanguage = lang;
    if (activeSession) {
        loadCurriculumTopic(activeSession.category, activeSession.topic, activeSession.name);
    }
}

// Interactive canvas mouse click handlers for Graph Node Builder
function handleGraphCanvasClick(event) {
    if (!activeSession || !activeSession.topic.toLowerCase().includes("graph")) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if clicked near an existing node to select/connect
    const clickedNode = customGraphNodes.find(n => Math.hypot(n.x - x, n.y - y) < 18);
    
    if (clickedNode) {
        if (activeGraphNodeId && activeGraphNodeId !== clickedNode.id) {
            // Create edge connection line
            customGraphEdges.push({ from: activeGraphNodeId, to: clickedNode.id });
            activeGraphNodeId = null;
        } else {
            activeGraphNodeId = clickedNode.id;
        }
    } else {
        // Double-click or empty click creates a new graph node
        const nodeId = String.fromCharCode(65 + customGraphNodes.length); // Node A, B, C...
        customGraphNodes.push({ x, y, id: nodeId });
        activeGraphNodeId = null;
    }
    
    renderCurrentStep();
}

function loadSelectedSubLesson(activeKey, sIdx, category, topic) {
    const list = SUB_LESSONS_CATALOG[activeKey];
    const sub = list[sIdx];
    
    activeSession = {
        id: "viz_" + Date.now(),
        name: sub.name,
        category: category,
        topic: topic,
        code: sub.code,
        currentStep: 0,
        createdAt: new Date().toISOString()
    };
    
    const editor = document.getElementById('viz-code-editor');
    if (editor) {
        editor.value = sub.code;
        syncEditorLineNumbers();
    }

    const notesTextarea = document.getElementById('workspace-notes-textarea');
    if (notesTextarea) {
        notesTextarea.value = workspaceNotes[sub.name] || '';
    }

    const revisionText = document.getElementById('viz-revision-text');
    if (revisionText) {
        revisionText.innerHTML = getTopicRevisionGuide(category, topic, sub.name);
    }

    const bestC = document.getElementById('viz-best-case');
    const avgC = document.getElementById('viz-avg-case');
    const worstC = document.getElementById('viz-worst-case');
    const spaceC = document.getElementById('viz-space-case');
    
    if (bestC) bestC.innerText = sub.complexity.best;
    if (avgC) avgC.innerText = sub.complexity.avg;
    if (worstC) worstC.innerText = sub.complexity.worst;
    if (spaceC) spaceC.innerText = sub.complexity.space;

    vizIsPlaying = false;
    clearInterval(vizInterval);
    updatePlayPauseButtonUI();

    renderCurrentStep();
}

function searchVizCurriculum(query) {
    const q = query.toLowerCase().trim();
    const items = document.querySelectorAll('.tree-item');
    items.forEach(item => {
        if (item.innerText.toLowerCase().includes(q)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function runCustomCode() {
    if (!activeSession) return;
    const editor = document.getElementById('viz-code-editor');
    if (!editor) return;

    activeSession.code = editor.value;
    activeSession.currentStep = 0;

    const consoleLog = document.getElementById('viz-console-log');
    if (consoleLog) {
        consoleLog.innerHTML += `\n[Pravio GCC] Compile triggered...`;
        consoleLog.innerHTML += `\n[Pravio GCC] Successfully parsed variables.`;
        consoleLog.scrollTop = consoleLog.scrollHeight;
    }

    renderCurrentStep();
}

function renderCurrentStep() {
    if (!activeSession) return;

    let steps = [];
    const lowerName = activeSession.name.toLowerCase();

    // Check if custom code interpreter parser should evaluate the custom editor code
    if (activeSession.code && !activeSession.code.includes("Characteristics demo") && !activeSession.code.includes("int[] arr") && !activeSession.code.includes("Queue q") && !activeSession.code.includes("arr[5]") && !activeSession.code.includes("Thread t1")) {
        steps = generateDynamicSteps(activeSession.category, activeSession.topic, activeSession.code);
    } else {
        // Preset operations matching
        if (lowerName.includes("slicing")) {
            steps = [
                { line: 1, vars: { tup: "(10, 20, 30, 40, 50)" }, mem: ["tup -> [10, 20, 30, 40, 50]"], explain: "Initialize tuple with 5 elements.", action: { type: "array_state", data: [10, 20, 30, 40, 50], active: [] } },
                { line: 2, vars: { tup: "(10, 20, 30, 40, 50)", slice_tup: "(20, 30, 40)" }, mem: ["slice_tup -> [20, 30, 40]"], explain: "Animate selected element slice being extracted from boundaries [1:4].", action: { type: "array_state", data: [20, 30, 40], active: [0, 1, 2], highlight: true } }
            ];
        } else if (lowerName.includes("packing")) {
            steps = [
                { line: 1, vars: { a: 10 }, mem: ["a -> 10"], explain: "Assign variable a to 10.", action: { type: "array_state", data: [10], active: [0] } },
                { line: 2, vars: { a: 10, b: 20 }, mem: ["b -> 20"], explain: "Assign variable b to 20.", action: { type: "array_state", data: [10, 20], active: [1] } },
                { line: 4, vars: { tup: "(10, 20, 30)" }, mem: ["tup -> (10, 20, 30)"], explain: "Animate variables combining/packing into a single tuple index structure.", action: { type: "array_state", data: [10, 20, 30], active: [0, 1, 2], complete: true } }
            ];
        } else if (lowerName.includes("unpacking")) {
            steps = [
                { line: 1, vars: { tup: "(100, 200)" }, mem: ["tup -> (100, 200)"], explain: "Initialize tuple to unpack.", action: { type: "array_state", data: [100, 200], active: [] } },
                { line: 2, vars: { x: 100, y: 200, tup: "(100, 200)" }, mem: ["x (stack) -> 100", "y (stack) -> 200"], explain: "Animate tuple values separating/unpacking into independent local stack variables.", action: { type: "array_state", data: [100, 200], active: [0, 1], highlight: true } }
            ];
        } else if (lowerName.includes("concatenation")) {
            steps = [
                { line: 1, vars: { t1: "(1, 2)" }, mem: ["t1 -> (1, 2)"], explain: "Initialize first tuple.", action: { type: "array_state", data: [1, 2], active: [] } },
                { line: 3, vars: { t3: "(1, 2, 3, 4)" }, mem: ["t3 -> (1, 2, 3, 4)"], explain: "Animate two tuples merging/concatenating together into a new heap allocation address.", action: { type: "array_state", data: [1, 2, 3, 4], active: [0, 1, 2, 3], complete: true } }
            ];
        } else if (lowerName.includes("append")) {
            steps = [
                { line: 1, vars: { lst: "[10, 20]" }, mem: ["lst -> [10, 20]"], explain: "Initialize list with 2 items.", action: { type: "array_state", data: [10, 20], active: [] } },
                { line: 2, vars: { lst: "[10, 20, 30]" }, mem: ["lst -> [10, 20, 30]"], explain: "Add element to the end of array list. Array size expands dynamically.", action: { type: "array_state", data: [10, 20, 30], active: [2], complete: true } }
            ];
        } else if (lowerName.includes("pop")) {
            steps = [
                { line: 1, vars: { lst: "[10, 20, 30]" }, mem: ["lst -> [10, 20, 30]"], explain: "Initialize list with 3 elements.", action: { type: "array_state", data: [10, 20, 30], active: [] } },
                { line: 2, vars: { lst: "[10, 20]", val: 30 }, mem: ["lst -> [10, 20]"], explain: "Pop element off the last index of list.", action: { type: "array_state", data: [10, 20], active: [1], highlight: true } }
            ];
        } else if (lowerName.includes("dereferencing")) {
            steps = [
                { line: 1, vars: { val: 42 }, mem: ["val (0x7ffe) -> 42"], explain: "Allocate local stack integer variable val with 42.", action: { type: "mem_set", addr: "0x7ffe", val: 42 } },
                { line: 2, vars: { ptr: "0x7ffe" }, mem: ["ptr -> 0x7ffe"], explain: "Assign address of val to pointer variable ptr.", action: { type: "mem_set", addr: "0x7fff", val: "0x7ffe" } },
                { line: 3, vars: { val: 99 }, mem: ["val (0x7ffe) -> 99"], explain: "Animate dereference: change value at address stored in pointer.", action: { type: "mem_update", addr: "0x7ffe", val: 99 } }
            ];
        } else if (activeSession.topic.toLowerCase().includes("concurrency") || activeSession.topic.toLowerCase().includes("java_concurrency")) {
            steps = SUB_LESSONS_CATALOG.java_concurrency[0].steps;
        } else if (activeSession.topic.toLowerCase().includes("tree") || activeSession.topic.toLowerCase().includes("dsa_trees")) {
            steps = SUB_LESSONS_CATALOG.dsa_trees[0].steps;
        } else if (activeSession.topic.toLowerCase().includes("array") || activeSession.topic.toLowerCase().includes("dsa_arrays")) {
            steps = SUB_LESSONS_CATALOG.dsa_arrays[0].steps;
        } else if (activeSession.topic.toLowerCase().includes("stack") || activeSession.topic.toLowerCase().includes("dsa_stacks")) {
            steps = SUB_LESSONS_CATALOG.dsa_stacks[0].steps;
        } else if (activeSession.topic.toLowerCase().includes("queue") || activeSession.topic.toLowerCase().includes("dsa_queues")) {
            steps = SUB_LESSONS_CATALOG.dsa_queues[0].steps;
        } else if (activeSession.topic.toLowerCase().includes("bubble") || activeSession.topic.toLowerCase().includes("algo_bubble_sort")) {
            steps = SUB_LESSONS_CATALOG.algo_bubble_sort[0].steps;
        } else if (activeSession.topic.toLowerCase().includes("graph") || activeSession.topic.toLowerCase().includes("dsa_graphs")) {
            steps = SUB_LESSONS_CATALOG.dsa_graphs[0].steps;
        } else {
            steps = generateDynamicSteps(activeSession.category, activeSession.topic, activeSession.code);
        }
    }

    const totalSteps = steps.length;
    let stepIdx = activeSession.currentStep;
    if (stepIdx >= totalSteps) stepIdx = totalSteps - 1;
    if (stepIdx < 0) stepIdx = 0;
    activeSession.currentStep = stepIdx;

    const step = steps[stepIdx];

    // Gutter coloring
    const gutterDivs = document.querySelectorAll('#viz-line-gutter div');
    gutterDivs.forEach(div => {
        const line = parseInt(div.getAttribute('data-line'), 10);
        if (line === step.line) {
            div.style.background = '#3b82f6';
            div.style.color = '#ffffff';
        } else {
            div.style.background = 'transparent';
            div.style.color = 'var(--text-muted)';
        }
    });

    const progress = document.getElementById('viz-step-slider');
    const label = document.getElementById('viz-step-label-nav');
    const sliderLabel = document.getElementById('viz-step-label-slider');
    const bar = document.getElementById('viz-step-progressbar');
    
    if (progress) {
        progress.max = totalSteps - 1;
        progress.value = stepIdx;
    }
    if (label) {
        label.innerText = `Step: ${stepIdx + 1} / ${totalSteps}`;
    }
    if (sliderLabel) {
        sliderLabel.innerText = `${stepIdx + 1} / ${totalSteps}`;
    }
    if (bar) {
        const pct = totalSteps > 1 ? (stepIdx / (totalSteps - 1)) * 100 : 100;
        bar.style.width = `${pct}%`;
    }

    // Dynamic right side context-aware explanation generation
    const activeKey = activeSession.topic.toLowerCase();
    const subInfo = getDynamicAnalogyAndTips(activeSession.category, activeSession.topic, activeSession.name);

    const explanation = document.getElementById('viz-explanation-panel');
    if (explanation) {
        // Multi-language switcher dropdown addition to visualizer UI
        explanation.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid var(--border-color); padding-bottom:6px;">
                <span style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Visualizer Syntax Translation</span>
                <select onchange="setSyntaxLanguage(this.value)" style="padding:2px; font-size:10px; border-radius:4px; background:var(--bg-body); color:var(--text-body); border:1px solid var(--border-color);">
                    <option value="c" ${activeSyntaxLanguage === 'c' ? 'selected' : ''}>C Scope</option>
                    <option value="python" ${activeSyntaxLanguage === 'python' ? 'selected' : ''}>Python Ref</option>
                </select>
            </div>
            
            <div style="font-size:0.9rem; line-height:1.5; color:var(--text-body); margin-bottom:8px;">${step.explain}</div>
            <div style="font-size:0.8rem; color:#f59e0b; font-style:italic; margin-bottom:10px;">💡 Analogy: ${subInfo.analogy}</div>
            
            <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px; border-top:1px dashed var(--border-color); padding-top:8px;">Common Mistake</div>
            <div style="font-size:0.8rem; color:#ef4444; margin-bottom:10px;">⚠️ ${subInfo.mistake}</div>

            <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px; border-top:1px dashed var(--border-color); padding-top:8px;">Best Practice</div>
            <div style="font-size:0.8rem; color:#10b981; margin-bottom:10px;">🛡️ ${subInfo.tip}</div>

            <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px; border-top:1px dashed var(--border-color); padding-top:8px;">Practice Challenge</div>
            <div style="font-size:0.8rem; color:var(--text-body);">${subInfo.practice}</div>
        `;
    }

    // Variables Inspect
    const variablesGrid = document.getElementById('viz-variables-inspect');
    if (variablesGrid) {
        variablesGrid.innerHTML = '';
        Object.keys(step.vars).forEach(vKey => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.fontSize = '11.5px';
            row.style.padding = '4px 0';
            row.style.borderBottom = '1px solid rgba(0,0,0,0.03)';
            row.innerHTML = `
                <span style="font-family:monospace; color:#f97316; font-weight:600;">${vKey}</span>
                <span style="font-family:monospace; color:var(--text-body);">${step.vars[vKey]}</span>
            `;
            variablesGrid.appendChild(row);
        });
    }

    // Memory stack
    const memoryStack = document.getElementById('viz-memory-stack');
    if (memoryStack) {
        memoryStack.innerHTML = '';
        step.mem.forEach(m => {
            const block = document.createElement('div');
            block.style.padding = '4px 8px';
            block.style.fontSize = '11px';
            block.style.fontFamily = 'monospace';
            block.style.background = 'rgba(20,184,166,0.05)';
            block.style.borderLeft = '3px solid #14b8a6';
            block.style.color = 'var(--text-body)';
            block.style.marginBottom = '3px';
            block.innerText = m;
            memoryStack.appendChild(block);
        });
    }

    // If Diff Mode is active, render side-by-side comparison traces
    if (diffModeActive) {
        const canvas = document.getElementById('viz-display-area');
        if (canvas) {
            canvas.innerHTML = '';
            
            const diffContainer = document.createElement('div');
            diffContainer.style.display = 'flex';
            diffContainer.style.width = '100%';
            diffContainer.style.height = '100%';
            diffContainer.style.gap = '16px';
            
            const tracePanelA = document.createElement('div');
            tracePanelA.style.flex = '1';
            tracePanelA.style.borderRight = '1px dashed var(--border-color)';
            tracePanelA.style.padding = '10px';
            tracePanelA.innerHTML = `<h5 style="color:var(--primary-color); font-size:12px; margin-top:0;">Trace A (Standard scope)</h5>`;
            
            const tracePanelB = document.createElement('div');
            tracePanelB.style.flex = '1';
            tracePanelB.style.padding = '10px';
            tracePanelB.innerHTML = `<h5 style="color:#14b8a6; font-size:12px; margin-top:0;">Trace B (Dynamic scope)</h5>`;

            diffContainer.appendChild(tracePanelA);
            diffContainer.appendChild(tracePanelB);
            canvas.appendChild(diffContainer);

            // Render Trace A
            renderMemoryCanvasSplit(tracePanelA, step, step.action);
            
            // Build simple variant step for Trace B
            let stepB = { ...step };
            stepB.vars = { ...step.vars };
            Object.keys(stepB.vars).forEach(k => {
                if (typeof stepB.vars[k] === 'number') stepB.vars[k] *= 4;
            });
            renderMemoryCanvasSplit(tracePanelB, stepB, step.action);
        }
    } else {
        renderInteractiveCanvas(step.action, step);
    }

    const normalizedName = activeSession.topic.toLowerCase();
    if (stepIdx === totalSteps - 1 && !completedTopics.includes(normalizedName)) {
        completedTopics.push(normalizedName);
        localStorage.setItem('pravio_visualizer_completed', JSON.stringify(completedTopics));
    }
}

// Side-by-side memory map partition renderer for comparison diff
function renderMemoryCanvasSplit(panelContainer, step, action) {
    const splitWrapper = document.createElement('div');
    splitWrapper.style.display = 'flex';
    splitWrapper.style.flexDirection = 'column';
    splitWrapper.style.gap = '8px';
    splitWrapper.style.width = '100%';
    
    // Stack box
    const stackBox = document.createElement('div');
    stackBox.style.border = '1px solid var(--border-color)';
    stackBox.style.borderRadius = '8px';
    stackBox.style.padding = '8px';
    stackBox.style.background = 'var(--bg-secondary)';
    stackBox.innerHTML = `<div style="font-size:10px; font-weight:700; color:var(--text-muted); margin-bottom:4px;">STACK</div>`;
    
    Object.keys(step.vars).forEach(k => {
        const item = document.createElement('div');
        item.style.fontSize = '11px';
        item.style.fontFamily = 'monospace';
        item.innerHTML = `<strong>${k}</strong> = ${step.vars[k]}`;
        stackBox.appendChild(item);
    });
    
    // Heap box
    const heapBox = document.createElement('div');
    heapBox.style.border = '1px solid var(--border-color)';
    heapBox.style.borderRadius = '8px';
    heapBox.style.padding = '8px';
    heapBox.style.background = 'var(--bg-secondary)';
    heapBox.innerHTML = `<div style="font-size:10px; font-weight:700; color:#14b8a6; margin-bottom:4px;">HEAP</div>`;
    
    step.mem.forEach(m => {
        const item = document.createElement('div');
        item.style.fontSize = '10px';
        item.style.fontFamily = 'monospace';
        item.innerText = m;
        heapBox.appendChild(item);
    });
    
    splitWrapper.appendChild(stackBox);
    splitWrapper.appendChild(heapBox);
    panelContainer.appendChild(splitWrapper);
}

function renderInteractiveCanvas(action, step) {
    const canvas = document.getElementById('viz-display-area');
    if (!canvas) return;

    canvas.innerHTML = '';
    
    // Remove canvas mouse handlers to prevent duplicate binds
    canvas.onclick = null;
    canvas.ondblclick = null;

    if (action.type === "interactive_graph" || activeSession.topic.toLowerCase().includes("graph")) {
        // Set canvas interactive graph builders
        canvas.ondblclick = (e) => handleGraphCanvasClick(e);
        canvas.onclick = (e) => handleGraphCanvasClick(e);
        
        const wrapper = document.createElement('div');
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        wrapper.style.position = 'relative';

        let svgContent = '';
        
        // Draw connector edges lines
        customGraphEdges.forEach(edge => {
            const fromNode = customGraphNodes.find(n => n.id === edge.from);
            const toNode = customGraphNodes.find(n => n.id === edge.to);
            if (fromNode && toNode) {
                svgContent += `<line x1="${fromNode.x}" y1="${fromNode.y}" x2="${toNode.x}" y2="${toNode.y}" stroke="#94a3b8" stroke-width="3" />`;
            }
        });

        // Draw node circles
        customGraphNodes.forEach(node => {
            const isActive = activeGraphNodeId === node.id;
            svgContent += `
                <circle cx="${node.x}" cy="${node.y}" r="16" fill="${isActive ? '#3b82f6' : 'var(--bg-container)'}" stroke="#2563eb" stroke-width="2.5" />
                <text x="${node.x}" y="${node.y + 4}" font-size="11" font-weight="bold" text-anchor="middle" fill="${isActive ? '#ffffff' : 'var(--text-body)'}">${node.id}</text>
            `;
        });

        wrapper.innerHTML = `
            <div style="font-size:11px; color:var(--text-muted); text-align:center; margin-bottom:4px;">Double-click canvas to Add Node | Click two nodes sequentially to connect them with Edge</div>
            <svg id="viz-graph-svg" width="100%" height="220" style="background:rgba(255,255,255,0.01); border:1px dashed var(--border-color); border-radius:8px; overflow:visible;">
                ${svgContent}
            </svg>
        `;
        canvas.appendChild(wrapper);
        return;
    }
    
    if (action.type === "init" || action.type === "array_state") {
        const arr = action.data || [];
        const activeIdx = action.active || [];
        
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.gap = '10px';
        wrapper.style.justifyContent = 'center';

        arr.forEach((val, idx) => {
            const block = document.createElement('div');
            block.style.width = '55px';
            block.style.height = '55px';
            block.style.display = 'flex';
            block.style.flexDirection = 'column';
            block.style.alignItems = 'center';
            block.style.justifyContent = 'center';
            block.style.borderRadius = '8px';
            block.style.border = '1px solid var(--border-color)';
            block.style.fontSize = '0.95rem';
            block.style.fontWeight = '700';
            block.style.color = '#ffffff';

            const isActive = activeIdx.includes(idx);
            if (isActive) {
                if (action.highlight) {
                    block.style.background = '#ef4444'; // Red
                } else {
                    block.style.background = '#a855f7'; // Purple
                }
            } else if (action.complete) {
                block.style.background = '#10b981'; // Green
            } else {
                block.style.background = 'rgba(255, 255, 255, 0.05)';
                block.style.color = 'var(--text-body)';
            }

            block.innerHTML = `
                <div style="font-size:0.65rem; color:${isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'};">[${idx}]</div>
                <div>${val}</div>
            `;
            wrapper.appendChild(block);
        });
        canvas.appendChild(wrapper);
    }
    else if (action.type === "sql_table") {
        const wrapper = document.createElement('div');
        wrapper.style.width = '90%';
        wrapper.style.background = 'var(--bg-container)';
        wrapper.style.border = '1px solid var(--border-color)';
        wrapper.style.borderRadius = '8px';
        wrapper.style.overflow = 'hidden';

        let rowsHtml = action.rows.map(r => `
            <tr>
                <td style="padding:8px; border-bottom:1px solid var(--border-color); font-size:12px; color:var(--text-body); font-family:monospace;">${r.name}</td>
                <td style="padding:8px; border-bottom:1px solid var(--border-color); font-size:12px; color:var(--text-body); font-family:monospace;">${r.grade}</td>
            </tr>
        `).join('');

        wrapper.innerHTML = `
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="background:var(--bg-secondary);">
                        <th style="padding:8px; text-align:left; font-size:11px; color:var(--text-muted);">NAME</th>
                        <th style="padding:8px; text-align:left; font-size:11px; color:var(--text-muted);">GRADE</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        `;
        canvas.appendChild(wrapper);
    }
    else if (action.type === "tree_bfs") {
        const wrapper = document.createElement('div');
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';

        const svg = `
            <svg id="viz-tree-svg" viewBox="0 0 400 240" width="100%" height="220" style="max-width:350px; overflow:visible;">
                <line x1="200" y1="40" x2="100" y2="100" stroke="#94a3b8" stroke-width="2.5" />
                <line x1="200" y1="40" x2="300" y2="100" stroke="#94a3b8" stroke-width="2.5" />
                <line x1="100" y1="100" x2="50" y2="160" stroke="#94a3b8" stroke-width="2" />
                <line x1="100" y1="100" x2="150" y2="160" stroke="#94a3b8" stroke-width="2" />
                <line x1="300" y1="100" x2="250" y2="160" stroke="#94a3b8" stroke-width="2" />
                <line x1="300" y1="100" x2="350" y2="160" stroke="#94a3b8" stroke-width="2" />

                <circle cx="200" cy="40" r="18" fill="${action.visited.includes(50) ? '#10b981' : (action.active === 50 ? '#3b82f6' : 'var(--bg-container)')}" stroke="${action.active === 50 ? '#2563eb' : '#64748b'}" stroke-width="3" />
                <text x="200" y="44" font-size="12" font-weight="bold" text-anchor="middle" fill="${action.visited.includes(50) || action.active === 50 ? '#ffffff' : 'var(--text-body)'}">50</text>

                <circle cx="100" cy="100" r="18" fill="${action.visited.includes(30) ? '#10b981' : (action.active === 30 ? '#3b82f6' : 'var(--bg-container)')}" stroke="${action.active === 30 ? '#2563eb' : '#64748b'}" stroke-width="2.5" />
                <text x="100" y="104" font-size="12" font-weight="bold" text-anchor="middle" fill="${action.visited.includes(30) || action.active === 30 ? '#ffffff' : 'var(--text-body)'}">30</text>

                <circle cx="300" cy="100" r="18" fill="${action.visited.includes(70) ? '#10b981' : (action.active === 70 ? '#3b82f6' : 'var(--bg-container)')}" stroke="${action.active === 70 ? '#2563eb' : '#64748b'}" stroke-width="2.5" />
                <text x="300" y="104" font-size="12" font-weight="bold" text-anchor="middle" fill="${action.visited.includes(70) || action.active === 70 ? '#ffffff' : 'var(--text-body)'}">70</text>

                <circle cx="50" cy="160" r="15" fill="var(--bg-container)" stroke="#64748b" stroke-width="2" />
                <text x="50" y="164" font-size="10" font-weight="bold" text-anchor="middle" fill="var(--text-body)">20</text>

                <circle cx="150" cy="160" r="15" fill="var(--bg-container)" stroke="#64748b" stroke-width="2" />
                <text x="150" y="164" font-size="10" font-weight="bold" text-anchor="middle" fill="var(--text-body)">40</text>

                <circle cx="250" cy="160" r="15" fill="var(--bg-container)" stroke="#64748b" stroke-width="2" />
                <text x="250" y="164" font-size="10" font-weight="bold" text-anchor="middle" fill="var(--text-body)">60</text>

                <circle cx="350" cy="160" r="15" fill="var(--bg-container)" stroke="#64748b" stroke-width="2" />
                <text x="350" y="164" font-size="10" font-weight="bold" text-anchor="middle" fill="var(--text-body)">80</text>
            </svg>
        `;
        
        wrapper.innerHTML = `
            ${svg}
            <div style="margin-top:10px; display:flex; gap:12px; font-size:11px;">
                <div><span style="display:inline-block; width:12px; height:12px; background:#3b82f6; border-radius:50%; vertical-align:middle; margin-right:4px;"></span>Active Queue Head</div>
                <div><span style="display:inline-block; width:12px; height:12px; background:#10b981; border-radius:50%; vertical-align:middle; margin-right:4px;"></span>Visited Node</div>
            </div>
            <div style="font-family:monospace; font-size:11px; margin-top:6px; color:var(--text-muted);">Queue elements buffer: [ ${action.queue.join(', ')} ]</div>
        `;
        canvas.appendChild(wrapper);
    }
    else {
        // Render unified Stack & Heap layout for standard variables, C pointers, class objects, etc.
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.width = '95%';
        container.style.height = '90%';
        container.style.gap = '20px';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'stretch';
        container.style.position = 'relative';
        
        // Stack Column
        const stackCol = document.createElement('div');
        stackCol.style.flex = '1';
        stackCol.style.background = 'rgba(255, 255, 255, 0.02)';
        stackCol.style.border = '1px solid var(--border-color)';
        stackCol.style.borderRadius = '10px';
        stackCol.style.padding = '12px';
        stackCol.style.display = 'flex';
        stackCol.style.flexDirection = 'column';
        stackCol.style.gap = '8px';
        stackCol.style.overflowY = 'auto';
        stackCol.style.position = 'relative';
        stackCol.innerHTML = `<div style="font-size: 11px; font-weight: 700; color: var(--primary-color); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; text-transform: uppercase;">Stack Frame (Local Scope)</div>`;
        
        // Middle Pointer Connectors SVG Column
        const connectorCol = document.createElement('div');
        connectorCol.style.width = '60px';
        connectorCol.style.position = 'relative';
        connectorCol.style.display = 'flex';
        connectorCol.style.flexDirection = 'column';
        connectorCol.style.justifyContent = 'space-around';

        // Heap/Static Memory Column
        const heapCol = document.createElement('div');
        heapCol.style.flex = '1';
        heapCol.style.background = 'rgba(255, 255, 255, 0.02)';
        heapCol.style.border = '1px solid var(--border-color)';
        heapCol.style.borderRadius = '10px';
        heapCol.style.padding = '12px';
        heapCol.style.display = 'flex';
        heapCol.style.flexDirection = 'column';
        heapCol.style.gap = '8px';
        heapCol.style.overflowY = 'auto';
        heapCol.innerHTML = `<div style="font-size: 11px; font-weight: 700; color: #14b8a6; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; text-transform: uppercase;">Heap Space (Allocations)</div>`;

        // Populate Stack variables
        const activeVars = step ? step.vars : {};
        let stackCount = 0;
        let pointerIndices = []; // Stores stack index mapping pointing to heap address
        
        Object.keys(activeVars).forEach(vKey => {
            const isPointer = activeVars[vKey].toString().startsWith('0x');
            const isActiveVar = action && (action.name === vKey || (action.type === "mem_update" && action.name === vKey));
            
            const item = document.createElement('div');
            item.style.padding = '8px 12px';
            item.style.borderRadius = '6px';
            item.style.border = isActiveVar ? '1.5px solid #f59e0b' : '1px solid var(--border-color)';
            item.style.background = isActiveVar ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-container)';
            item.style.fontFamily = 'monospace';
            item.style.fontSize = '12px';
            item.style.transition = 'all 0.3s';
            
            if (isActiveVar) {
                item.style.boxShadow = '0 0 10px rgba(245, 158, 11, 0.2)';
            }
            
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
                    <span style="color:var(--text-muted); font-size:10px;">${isPointer ? 'pointer' : 'variable'}</span>
                    <span style="color:var(--text-muted); font-size:10px;">FP + ${stackCount * 4}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight: 700; color: #f97316;">${vKey}</span>
                    <span style="color: var(--text-body); font-weight: 600;">${activeVars[vKey]}</span>
                </div>
            `;
            stackCol.appendChild(item);

            if (isPointer) {
                pointerIndices.push({ stackIdx: stackCount, targetAddr: activeVars[vKey].toString() });
            }
            
            stackCount++;
        });

        if (stackCount === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.color = 'var(--text-muted)';
            emptyMsg.style.fontSize = '12px';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.marginTop = '20px';
            emptyMsg.innerText = 'Stack frame is currently empty.';
            stackCol.appendChild(emptyMsg);
        }

        // Populate Heap addresses
        const activeMem = step ? step.mem : [];
        let heapCount = 0;
        let heapIndices = {}; // maps hex address to vertical index
        
        activeMem.forEach(mStr => {
            const match = mStr.match(/^([a-zA-Z_0-9\[\]]+)\s*\((0x[a-f0-9]+)\)\s*->\s*(.+)$/);
            if (match) {
                const mName = match[1];
                const mAddr = match[2];
                const mVal = match[3];
                const isActiveMem = action && (action.addr === mAddr || (action.type === "mem_update" && action.name === mName));
                
                const item = document.createElement('div');
                item.style.padding = '8px 12px';
                item.style.borderRadius = '6px';
                item.style.border = isActiveMem ? '1.5px solid #14b8a6' : '1px solid var(--border-color)';
                item.style.background = isActiveMem ? 'rgba(20, 184, 166, 0.08)' : 'var(--bg-container)';
                item.style.fontFamily = 'monospace';
                item.style.fontSize = '12px';
                
                item.innerHTML = `
                    <div style="display:flex; justify-content:space-between; margin-bottom: 2px;">
                        <span style="color:#14b8a6; font-size:10px; font-weight:700;">${mAddr}</span>
                        <span style="color:var(--text-muted); font-size:10px;">${mName}</span>
                    </div>
                    <div style="font-weight:700; color:var(--text-body); font-size:1.05rem;">${mVal}</div>
                `;
                heapCol.appendChild(item);
                
                heapIndices[mAddr] = heapCount;
                heapCount++;
            }
        });

        if (heapCount === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.color = 'var(--text-muted)';
            emptyMsg.style.fontSize = '12px';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.marginTop = '20px';
            emptyMsg.innerText = 'No active dynamic memory allocations.';
            heapCol.appendChild(emptyMsg);
        }

        // Draw visual reference arrow lines dynamically inside middle connector SVG
        let pathElements = "";
        pointerIndices.forEach(p => {
            const hIdx = heapIndices[p.targetAddr];
            if (hIdx !== undefined) {
                // Approximate vertical heights matching flex child offsets
                const y1 = 40 + p.stackIdx * 62;
                const y2 = 40 + hIdx * 62;
                pathElements += `
                    <path d="M 0 ${y1} C 30 ${y1}, 30 ${y2}, 60 ${y2}" stroke="#f59e0b" stroke-width="2.5" fill="none" marker-end="url(#arrow-head)" />
                `;
            }
        });

        connectorCol.innerHTML = `
            <svg width="60" height="100%" style="overflow: visible; pointer-events: none;">
                <defs>
                    <marker id="arrow-head" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                    </marker>
                </defs>
                ${pathElements}
            </svg>
        `;

        container.appendChild(stackCol);
        container.appendChild(connectorCol);
        container.appendChild(heapCol);
        canvas.appendChild(container);
    }
}

// Playback Controls
function updatePlayPauseButtonUI() {
    const playBtn = document.getElementById('viz-play-btn');
    if (!playBtn) return;
    playBtn.innerHTML = vizIsPlaying 
        ? `<i class="fas fa-pause"></i>` 
        : `<i class="fas fa-play"></i>`;
}

function toggleVizPlayback() {
    if (!activeSession) return;
    
    let steps = [];
    const lowerName = activeSession.name.toLowerCase();
    
    if (lowerName.includes("slicing")) {
        steps = [
            { line: 1, vars: { tup: "(10, 20, 30, 40, 50)" }, mem: ["tup -> [10, 20, 30, 40, 50]"], explain: "Initialize tuple with 5 elements.", action: { type: "array_state", data: [10, 20, 30, 40, 50], active: [] } },
            { line: 2, vars: { tup: "(10, 20, 30, 40, 50)", slice_tup: "(20, 30, 40)" }, mem: ["slice_tup -> [20, 30, 40]"], explain: "Animate selected element slice being extracted from boundaries [1:4].", action: { type: "array_state", data: [20, 30, 40], active: [0, 1, 2], highlight: true } }
        ];
    } else if (lowerName.includes("packing")) {
        steps = [
            { line: 1, vars: { a: 10 }, mem: ["a -> 10"], explain: "Assign variable a to 10.", action: { type: "array_state", data: [10], active: [0] } },
            { line: 2, vars: { a: 10, b: 20 }, mem: ["b -> 20"], explain: "Assign variable b to 20.", action: { type: "array_state", data: [10, 20], active: [1] } },
            { line: 4, vars: { tup: "(10, 20, 30)" }, mem: ["tup -> (10, 20, 30)"], explain: "Animate variables combining/packing into a single tuple index structure.", action: { type: "array_state", data: [10, 20, 30], active: [0, 1, 2], complete: true } }
        ];
    } else if (lowerName.includes("unpacking")) {
        steps = [
            { line: 1, vars: { tup: "(100, 200)" }, mem: ["tup -> (100, 200)"], explain: "Initialize tuple to unpack.", action: { type: "array_state", data: [100, 200], active: [] } },
            { line: 2, vars: { x: 100, y: 200, tup: "(100, 200)" }, mem: ["x (stack) -> 100", "y (stack) -> 200"], explain: "Animate tuple values separating/unpacking into independent local stack variables.", action: { type: "array_state", data: [100, 200], active: [0, 1], highlight: true } }
        ];
    } else if (lowerName.includes("concatenation")) {
        steps = [
            { line: 1, vars: { t1: "(1, 2)" }, mem: ["t1 -> (1, 2)"], explain: "Initialize first tuple.", action: { type: "array_state", data: [1, 2], active: [] } },
            { line: 3, vars: { t3: "(1, 2, 3, 4)" }, mem: ["t3 -> (1, 2, 3, 4)"], explain: "Animate two tuples merging/concatenating together into a new heap allocation address.", action: { type: "array_state", data: [1, 2, 3, 4], active: [0, 1, 2, 3], complete: true } }
        ];
    } else if (lowerName.includes("append")) {
        steps = [
            { line: 1, vars: { lst: "[10, 20]" }, mem: ["lst -> [10, 20]"], explain: "Initialize list with 2 items.", action: { type: "array_state", data: [10, 20], active: [] } },
            { line: 2, vars: { lst: "[10, 20, 30]" }, mem: ["lst -> [10, 20, 30]"], explain: "Add element to the end of array list. Array size expands dynamically.", action: { type: "array_state", data: [10, 20, 30], active: [2], complete: true } }
        ];
    } else if (lowerName.includes("pop")) {
        steps = [
            { line: 1, vars: { lst: "[10, 20, 30]" }, mem: ["lst -> [10, 20, 30]"], explain: "Initialize list with 3 elements.", action: { type: "array_state", data: [10, 20, 30], active: [] } },
            { line: 2, vars: { lst: "[10, 20]", val: 30 }, mem: ["lst -> [10, 20]"], explain: "Pop element off the last index of list.", action: { type: "array_state", data: [10, 20], active: [1], highlight: true } }
        ];
    } else if (lowerName.includes("dereferencing")) {
        steps = [
            { line: 1, vars: { val: 42 }, mem: ["val (0x7ffe) -> 42"], explain: "Allocate local stack integer variable val with 42.", action: { type: "mem_set", addr: "0x7ffe", val: 42 } },
            { line: 2, vars: { ptr: "0x7ffe" }, mem: ["ptr -> 0x7ffe"], explain: "Assign address of val to pointer variable ptr.", action: { type: "mem_set", addr: "0x7fff", val: "0x7ffe" } },
            { line: 3, vars: { val: 99 }, mem: ["val (0x7ffe) -> 99"], explain: "Animate dereference: change value at address stored in pointer.", action: { type: "mem_update", addr: "0x7ffe", val: 99 } }
        ];
    } else if (activeSession.topic.toLowerCase().includes("concurrency") || activeSession.topic.toLowerCase().includes("java_concurrency")) {
        steps = SUB_LESSONS_CATALOG.java_concurrency[0].steps;
    } else if (activeSession.topic.toLowerCase().includes("tree") || activeSession.topic.toLowerCase().includes("dsa_trees")) {
        steps = SUB_LESSONS_CATALOG.dsa_trees[0].steps;
    } else if (activeSession.topic.toLowerCase().includes("array") || activeSession.topic.toLowerCase().includes("dsa_arrays")) {
        steps = SUB_LESSONS_CATALOG.dsa_arrays[0].steps;
    } else if (activeSession.topic.toLowerCase().includes("stack") || activeSession.topic.toLowerCase().includes("dsa_stacks")) {
        steps = SUB_LESSONS_CATALOG.dsa_stacks[0].steps;
    } else if (activeSession.topic.toLowerCase().includes("queue") || activeSession.topic.toLowerCase().includes("dsa_queues")) {
        steps = SUB_LESSONS_CATALOG.dsa_queues[0].steps;
    } else if (activeSession.topic.toLowerCase().includes("bubble") || activeSession.topic.toLowerCase().includes("algo_bubble_sort")) {
        steps = SUB_LESSONS_CATALOG.algo_bubble_sort[0].steps;
    } else if (activeSession.topic.toLowerCase().includes("graph") || activeSession.topic.toLowerCase().includes("dsa_graphs")) {
        steps = SUB_LESSONS_CATALOG.dsa_graphs[0].steps;
    } else {
        steps = generateDynamicSteps(activeSession.category, activeSession.topic, activeSession.code);
    }
    
    const totalSteps = steps.length;

    if (vizIsPlaying) {
        clearInterval(vizInterval);
        vizIsPlaying = false;
    } else {
        vizIsPlaying = true;

        vizInterval = setInterval(() => {
            if (activeSession.currentStep < totalSteps - 1) {
                activeSession.currentStep++;
                renderCurrentStep();
            } else {
                clearInterval(vizInterval);
                vizIsPlaying = false;
                updatePlayPauseButtonUI();
            }
        }, vizSpeed);
    }
    updatePlayPauseButtonUI();
}

function stepForwardViz() {
    if (!activeSession) return;
    let steps = [];
    const lowerName = activeSession.name.toLowerCase();
    
    if (activeSession.code && !activeSession.code.includes("Characteristics demo") && !activeSession.code.includes("int[] arr") && !activeSession.code.includes("Queue q") && !activeSession.code.includes("arr[5]") && !activeSession.code.includes("Thread t1")) {
        steps = generateDynamicSteps(activeSession.category, activeSession.topic, activeSession.code);
    } else {
        if (lowerName.includes("slicing")) {
            steps = [
                { line: 1, vars: { tup: "(10, 20, 30, 40, 50)" }, mem: ["tup -> [10, 20, 30, 40, 50]"], explain: "Initialize tuple with 5 elements.", action: { type: "array_state", data: [10, 20, 30, 40, 50], active: [] } },
                { line: 2, vars: { tup: "(10, 20, 30, 40, 50)", slice_tup: "(20, 30, 40)" }, mem: ["slice_tup -> [20, 30, 40]"], explain: "Animate selected element slice being extracted from boundaries [1:4].", action: { type: "array_state", data: [20, 30, 40], active: [0, 1, 2], highlight: true } }
            ];
        } else if (lowerName.includes("packing")) {
            steps = [
                { line: 1, vars: { a: 10 }, mem: ["a -> 10"], explain: "Assign variable a to 10.", action: { type: "array_state", data: [10], active: [0] } },
                { line: 2, vars: { a: 10, b: 20 }, mem: ["b -> 20"], explain: "Assign variable b to 20.", action: { type: "array_state", data: [10, 20], active: [1] } },
                { line: 4, vars: { tup: "(10, 20, 30)" }, mem: ["tup -> (10, 20, 30)"], explain: "Animate variables combining/packing into a single tuple index structure.", action: { type: "array_state", data: [10, 20, 30], active: [0, 1, 2], complete: true } }
            ];
        } else if (lowerName.includes("unpacking")) {
            steps = [
                { line: 1, vars: { tup: "(100, 200)" }, mem: ["tup -> (100, 200)"], explain: "Initialize tuple to unpack.", action: { type: "array_state", data: [100, 200], active: [] } },
                { line: 2, vars: { x: 100, y: 200, tup: "(100, 200)" }, mem: ["x (stack) -> 100", "y (stack) -> 200"], explain: "Animate tuple values separating/unpacking into independent local stack variables.", action: { type: "array_state", data: [100, 200], active: [0, 1], highlight: true } }
            ];
        } else if (lowerName.includes("concatenation")) {
            steps = [
                { line: 1, vars: { t1: "(1, 2)" }, mem: ["t1 -> (1, 2)"], explain: "Initialize first tuple.", action: { type: "array_state", data: [1, 2], active: [] } },
                { line: 3, vars: { t3: "(1, 2, 3, 4)" }, mem: ["t3 -> (1, 2, 3, 4)"], explain: "Animate two tuples merging/concatenating together into a new heap allocation address.", action: { type: "array_state", data: [1, 2, 3, 4], active: [0, 1, 2, 3], complete: true } }
            ];
        } else if (lowerName.includes("append")) {
            steps = [
                { line: 1, vars: { lst: "[10, 20]" }, mem: ["lst -> [10, 20]"], explain: "Initialize list with 2 items.", action: { type: "array_state", data: [10, 20], active: [] } },
                { line: 2, vars: { lst: "[10, 20, 30]" }, mem: ["lst -> [10, 20, 30]"], explain: "Add element to the end of array list. Array size expands dynamically.", action: { type: "array_state", data: [10, 20, 30], active: [2], complete: true } }
            ];
        } else if (lowerName.includes("pop")) {
            steps = [
                { line: 1, vars: { lst: "[10, 20, 30]" }, mem: ["lst -> [10, 20, 30]"], explain: "Initialize list with 3 elements.", action: { type: "array_state", data: [10, 20, 30], active: [] } },
                { line: 2, vars: { lst: "[10, 20]", val: 30 }, mem: ["lst -> [10, 20]"], explain: "Pop element off the last index of list.", action: { type: "array_state", data: [10, 20], active: [1], highlight: true } }
            ];
        } else if (lowerName.includes("dereferencing")) {
            steps = [
                { line: 1, vars: { val: 42 }, mem: ["val (0x7ffe) -> 42"], explain: "Allocate local stack integer variable val with 42.", action: { type: "mem_set", addr: "0x7ffe", val: 42 } },
                { line: 2, vars: { ptr: "0x7ffe" }, mem: ["ptr -> 0x7ffe"], explain: "Assign address of val to pointer variable ptr.", action: { type: "mem_set", addr: "0x7fff", val: "0x7ffe" } },
                { line: 3, vars: { val: 99 }, mem: ["val (0x7ffe) -> 99"], explain: "Animate dereference: change value at address stored in pointer.", action: { type: "mem_update", addr: "0x7ffe", val: 99 } }
            ];
        } else if (activeSession.topic.toLowerCase().includes("concurrency") || activeSession.topic.toLowerCase().includes("java_concurrency")) {
            steps = SUB_LESSONS_CATALOG.java_concurrency[0].steps;
        } else if (activeSession.topic.toLowerCase().includes("tree") || activeSession.topic.toLowerCase().includes("dsa_trees")) {
            steps = SUB_LESSONS_CATALOG.dsa_trees[0].steps;
        } else if (activeSession.topic.toLowerCase().includes("array") || activeSession.topic.toLowerCase().includes("dsa_arrays")) {
            steps = SUB_LESSONS_CATALOG.dsa_arrays[0].steps;
        } else if (activeSession.topic.toLowerCase().includes("stack") || activeSession.topic.toLowerCase().includes("dsa_stacks")) {
            steps = SUB_LESSONS_CATALOG.dsa_stacks[0].steps;
        } else if (activeSession.topic.toLowerCase().includes("queue") || activeSession.topic.toLowerCase().includes("dsa_queues")) {
            steps = SUB_LESSONS_CATALOG.dsa_queues[0].steps;
        } else if (activeSession.topic.toLowerCase().includes("bubble") || activeSession.topic.toLowerCase().includes("algo_bubble_sort")) {
            steps = SUB_LESSONS_CATALOG.algo_bubble_sort[0].steps;
        } else if (activeSession.topic.toLowerCase().includes("graph") || activeSession.topic.toLowerCase().includes("dsa_graphs")) {
            steps = SUB_LESSONS_CATALOG.dsa_graphs[0].steps;
        } else {
            steps = generateDynamicSteps(activeSession.category, activeSession.topic, activeSession.code);
        }
    }

    if (activeSession.currentStep < steps.length - 1) {
        activeSession.currentStep++;
        renderCurrentStep();
    }
}

// Controls
function stepBackwardViz() {
    if (!activeSession) return;
    if (activeSession.currentStep > 0) {
        activeSession.currentStep--;
        renderCurrentStep();
    }
}

function restartViz() {
    if (!activeSession) return;
    activeSession.currentStep = 0;
    renderCurrentStep();
}

function setVizSpeed(val) {
    vizSpeed = parseInt(val, 10);
    const displayLbl = document.getElementById('viz-speed-display-lbl');
    if (displayLbl) displayLbl.innerText = `${vizSpeed}ms`;

    if (vizIsPlaying) {
        clearInterval(vizInterval);
        
        let steps = [];
        const lowerName = activeSession.name.toLowerCase();
        
        if (activeSession.code && !activeSession.code.includes("Characteristics demo") && !activeSession.code.includes("int[] arr") && !activeSession.code.includes("Queue q") && !activeSession.code.includes("arr[5]") && !activeSession.code.includes("Thread t1")) {
            steps = generateDynamicSteps(activeSession.category, activeSession.topic, activeSession.code);
        } else {
            if (lowerName.includes("slicing")) {
                steps = [
                    { line: 1, vars: { tup: "(10, 20, 30, 40, 50)" }, mem: ["tup -> [10, 20, 30, 40, 50]"], explain: "Initialize tuple with 5 elements.", action: { type: "array_state", data: [10, 20, 30, 40, 50], active: [] } },
                    { line: 2, vars: { tup: "(10, 20, 30, 40, 50)", slice_tup: "(20, 30, 40)" }, mem: ["slice_tup -> [20, 30, 40]"], explain: "Animate selected element slice being extracted from boundaries [1:4].", action: { type: "array_state", data: [20, 30, 40], active: [0, 1, 2], highlight: true } }
                ];
            } else if (lowerName.includes("packing")) {
                steps = [
                    { line: 1, vars: { a: 10 }, mem: ["a -> 10"], explain: "Assign variable a to 10.", action: { type: "array_state", data: [10, 20], active: [0] } },
                    { line: 2, vars: { a: 10, b: 20 }, mem: ["b -> 20"], explain: "Assign variable b to 20.", action: { type: "array_state", data: [10, 20], active: [1] } },
                    { line: 4, vars: { tup: "(10, 20, 30)" }, mem: ["tup -> (10, 20, 30)"], explain: "Animate variables combining/packing into a single tuple index structure.", action: { type: "array_state", data: [10, 20, 30], active: [0, 1, 2], complete: true } }
                ];
            } else if (lowerName.includes("unpacking")) {
                steps = [
                    { line: 1, vars: { tup: "(100, 200)" }, mem: ["tup -> (100, 200)"], explain: "Initialize tuple to unpack.", action: { type: "array_state", data: [100, 200], active: [] } },
                    { line: 2, vars: { x: 100, y: 200 }, mem: ["x -> 100", "y -> 200"], explain: "Animate tuple values separating/unpacking into independent local stack variables.", action: { type: "array_state", data: [100, 200], active: [0, 1], highlight: true } }
                ];
            } else if (lowerName.includes("concatenation")) {
                steps = [
                    { line: 1, vars: { t1: "(1, 2)" }, mem: ["t1 -> (1, 2)"], explain: "Initialize first tuple.", action: { type: "array_state", data: [1, 2], active: [] } },
                    { line: 3, vars: { t3: "(1, 2, 3, 4)" }, mem: ["t3 -> (1, 2, 3, 4)"], explain: "Animate two tuples merging/concatenating together into a new heap allocation address.", action: { type: "array_state", data: [1, 2, 3, 4], active: [0, 1, 2, 3], complete: true } }
                ];
            } else if (lowerName.includes("append")) {
                steps = [
                    { line: 1, vars: { lst: "[10, 20]" }, mem: ["lst -> [10, 20]"], explain: "Initialize list with 2 items.", action: { type: "array_state", data: [10, 20], active: [] } },
                    { line: 2, vars: { lst: "[10, 20, 30]" }, mem: ["lst -> [10, 20, 30]"], explain: "Add element to the end of array list. Array size expands dynamically.", action: { type: "array_state", data: [10, 20, 30], active: [2], complete: true } }
                ];
            } else if (lowerName.includes("pop")) {
                steps = [
                    { line: 1, vars: { lst: "[10, 20, 30]" }, mem: ["lst -> [10, 20, 30]"], explain: "Initialize list with 3 elements.", action: { type: "array_state", data: [10, 20, 30], active: [] } },
                    { line: 2, vars: { lst: "[10, 20]", val: 30 }, mem: ["lst -> [10, 20]"], explain: "Pop element off the last index of list.", action: { type: "array_state", data: [10, 20], active: [1], highlight: true } }
                ];
            } else if (lowerName.includes("dereferencing")) {
                steps = [
                    { line: 1, vars: { val: 42 }, mem: ["val (0x7ffe) -> 42"], explain: "Allocate local stack integer variable val with 42.", action: { type: "mem_set", addr: "0x7ffe", val: 42 } },
                    { line: 2, vars: { ptr: "0x7ffe" }, mem: ["ptr -> 0x7ffe"], explain: "Assign address of val to pointer variable ptr.", action: { type: "mem_set", addr: "0x7fff", val: "0x7ffe" } },
                    { line: 3, vars: { val: 99 }, mem: ["val (0x7ffe) -> 99"], explain: "Animate dereference: change value at address stored in pointer.", action: { type: "mem_update", addr: "0x7ffe", val: 99 } }
                ];
            } else if (activeSession.topic.toLowerCase().includes("concurrency") || activeSession.topic.toLowerCase().includes("java_concurrency")) {
                steps = SUB_LESSONS_CATALOG.java_concurrency[0].steps;
            } else if (activeSession.topic.toLowerCase().includes("tree") || activeSession.topic.toLowerCase().includes("dsa_trees")) {
                steps = SUB_LESSONS_CATALOG.dsa_trees[0].steps;
            } else if (activeSession.topic.toLowerCase().includes("array") || activeSession.topic.toLowerCase().includes("dsa_arrays")) {
                steps = SUB_LESSONS_CATALOG.dsa_arrays[0].steps;
            } else if (activeSession.topic.toLowerCase().includes("stack") || activeSession.topic.toLowerCase().includes("dsa_stacks")) {
                steps = SUB_LESSONS_CATALOG.dsa_stacks[0].steps;
            } else if (activeSession.topic.toLowerCase().includes("queue") || activeSession.topic.toLowerCase().includes("dsa_queues")) {
                steps = SUB_LESSONS_CATALOG.dsa_queues[0].steps;
            } else if (activeSession.topic.toLowerCase().includes("bubble") || activeSession.topic.toLowerCase().includes("algo_bubble_sort")) {
                steps = SUB_LESSONS_CATALOG.algo_bubble_sort[0].steps;
            } else if (activeSession.topic.toLowerCase().includes("graph") || activeSession.topic.toLowerCase().includes("dsa_graphs")) {
                steps = SUB_LESSONS_CATALOG.dsa_graphs[0].steps;
            } else {
                steps = generateDynamicSteps(activeSession.category, activeSession.topic, activeSession.code);
            }
        }
        
        const totalSteps = steps.length;

        vizInterval = setInterval(() => {
            if (activeSession.currentStep < totalSteps - 1) {
                activeSession.currentStep++;
                renderCurrentStep();
            } else {
                clearInterval(vizInterval);
                vizIsPlaying = false;
                updatePlayPauseButtonUI();
            }
        }, vizSpeed);
    }
}

function jumpToStep(val) {
    if (!activeSession) return;
    activeSession.currentStep = parseInt(val, 10);
    renderCurrentStep();
}

function setLearningMode(mode) {
    learningMode = mode;
    renderCurrentStep();
}

function syncEditorLineNumbers() {
    const editor = document.getElementById('viz-code-editor');
    const gutter = document.getElementById('viz-line-gutter');
    if (!editor || !gutter) return;

    const lines = editor.value.split('\n');
    gutter.innerHTML = '';
    lines.forEach((_, idx) => {
        const div = document.createElement('div');
        div.innerText = idx + 1;
        div.setAttribute('data-line', idx + 1);
        gutter.appendChild(div);
    });
}

function toggleAITutorSettings() {
    const dropdown = document.getElementById('viz-ai-settings-dropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
    }
}

// Bookmarks
function toggleVizBookmark() {
    if (!activeSession) return;
    const topic = activeSession.name;
    const idx = bookmarks.indexOf(topic);
    
    if (idx === -1) {
        bookmarks.push(topic);
        alert(`🔖 Bookmarked topic: ${topic}`);
    } else {
        bookmarks.splice(idx, 1);
        alert(`Unbookmarked topic: ${topic}`);
    }
    
    localStorage.setItem('pravio_visualizer_bookmarks', JSON.stringify(bookmarks));
    updateBookmarkIconUI();
}

// Export and sharing capabilities
function shareVizSessionState() {
    if (!activeSession) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?studio=${activeSession.category}&topic=${activeSession.topic}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert("📋 Shareable lesson link copied to clipboard!");
    });
}

function exportVizReport(format) {
    if (!activeSession) return;
    
    if (format === 'markdown') {
        const markdown = `# Pravio Studio Report: ${activeSession.name}\n\n## Code Sample\n\`\`\`\n${activeSession.code}\n\`\`\`\n\nGenerated via Pravio Visualizer.`;
        const blob = new Blob([markdown], { type: "text/markdown" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${activeSession.name.replace(/\s+/g, '_')}_report.md`;
        link.click();
    } else if (format === 'svg') {
        // Grab current active canvas SVG string representation to export direct vector illustration
        const svgEl = document.getElementById('viz-tree-svg') || document.getElementById('viz-graph-svg');
        if (svgEl) {
            const svgData = new XMLSerializer().serializeToString(svgEl);
            const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${activeSession.name.replace(/\s+/g, '_')}_canvas.svg`;
            link.click();
            alert("🎨 Canvas SVG Vector graphic downloaded successfully!");
        } else {
            alert("No vector SVG graphics found on screen to export. Trees and Graphs render fully as SVG vectors.");
        }
    }
}

// Intercept export click to allow choosing format
function triggerExportSelection() {
    const format = confirm("Export options:\n\nClick OK to export Vector Canvas Graphic (.SVG)\nClick Cancel to export Markdown Report (.MD)");
    if (format) {
        exportVizReport('svg');
    } else {
        exportVizReport('markdown');
    }
}

function updateBookmarkIconUI() {
    const btn = document.getElementById('viz-bookmark-btn');
    if (!btn || !activeSession) return;
    
    const isBookmarked = bookmarks.includes(activeSession.name);
    btn.innerHTML = isBookmarked 
        ? `<i class="fas fa-bookmark" style="color:var(--primary-color);"></i>` 
        : `<i class="far fa-bookmark"></i>`;
}

// Advanced custom code compiler interpreter
function generateDynamicSteps(category, topic, code) {
    const steps = [];
    const lines = code.split('\n');
    let variablesState = {};
    let memoryAllocations = [];
    let baseAddr = 0x7ffe;

    lines.forEach((lineText, idx) => {
        const lineNum = idx + 1;
        const trimmed = lineText.trim();
        if (!trimmed) return;

        // Skip comments
        if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) {
            return;
        }

        let explain = `Executing instruction on line ${lineNum}: \`${trimmed}\`.`;
        let action = { type: "generic" };

        let varMatch = trimmed.match(/^(?:int|float|double|char|let|const|var)?\s*([a-zA-Z_]\w*)\s*=\s*(.+?);?$/);
        let ptrMatch = trimmed.match(/^(?:int|float|double|char)?\s*\*([a-zA-Z_]\w*)\s*=\s*&([a-zA-Z_]\w*);?$/);
        let derefMatch = trimmed.match(/^\*([a-zA-Z_]\w*)\s*=\s*(.+?);?$/);
        let printMatch = trimmed.match(/^(?:printf|print|console\.log)\((.+?)\);?$/);

        if (ptrMatch) {
            const ptrName = ptrMatch[1];
            const targetName = ptrMatch[2];
            let targetAddr = "0x7ffe";
            const existing = memoryAllocations.find(m => m.name === targetName);
            if (existing) targetAddr = existing.addr;

            variablesState[ptrName] = targetAddr;
            const ptrAddr = "0x" + (baseAddr - memoryAllocations.length * 4).toString(16);
            memoryAllocations.push({ name: ptrName, addr: ptrAddr, val: targetAddr, dtype: "pointer" });

            explain = `Pointer Declaration: Create pointer variable \`${ptrName}\` and store the memory address of \`${targetName}\` (${targetAddr}) inside it.`;
            action = { type: "mem_set", addr: ptrAddr, val: targetAddr, name: ptrName, dtype: "pointer" };
        }
        else if (derefMatch) {
            const ptrName = derefMatch[1];
            const valExpr = derefMatch[2];
            
            const ptrVal = variablesState[ptrName];
            if (ptrVal) {
                const target = memoryAllocations.find(m => m.addr === ptrVal);
                if (target) {
                    const oldVal = variablesState[target.name];
                    variablesState[target.name] = valExpr;
                    target.val = valExpr;

                    explain = `Pointer Dereference: Write value \`${valExpr}\` directly to the address stored in pointer \`${ptrName}\` (${ptrVal}). This updates the value of \`${target.name}\` from ${oldVal} to ${valExpr}.`;
                    action = { type: "mem_update", addr: ptrVal, val: valExpr, name: target.name, dtype: target.dtype };
                }
            }
        }
        else if (varMatch) {
            const varName = varMatch[1];
            const valExpr = varMatch[2];
            
            variablesState[varName] = valExpr;
            let dtype = "int";
            if (valExpr.includes('.') || parseFloat(valExpr) % 1 !== 0) dtype = "float";
            if (valExpr.startsWith("'") || valExpr.startsWith('"')) dtype = "char";
            
            const existing = memoryAllocations.find(m => m.name === varName);
            let addr = "";
            if (existing) {
                existing.val = valExpr;
                addr = existing.addr;
                explain = `Variable Assignment: Update existing variable \`${varName}\` to new value ${valExpr}.`;
                action = { type: "mem_update", addr: addr, val: valExpr, name: varName, dtype: dtype };
            } else {
                addr = "0x" + (baseAddr - memoryAllocations.length * 4).toString(16);
                memoryAllocations.push({ name: varName, addr: addr, val: valExpr, dtype: dtype });
                explain = `Variable Allocation: Allocate stack memory slot for new variable \`${varName}\` at address ${addr} and assign initial value ${valExpr}.`;
                action = { type: "var_alloc", name: varName, val: valExpr, addr: addr, dtype: dtype };
            }
        }
        else if (printMatch) {
            explain = `Output Statement: Print result details to the simulated console log container.`;
            action = { type: "generic" };
        }

        const memStrings = memoryAllocations.map(m => `${m.name} (${m.addr}) -> ${m.val}`);

        steps.push({
            line: lineNum,
            vars: { ...variablesState },
            mem: memStrings,
            explain: explain,
            action: action
        });
    });

    if (steps.length === 0) {
        steps.push({
            line: 1,
            vars: {},
            mem: [],
            explain: "Start typing code to compile and run trace animations.",
            action: { type: "generic" }
        });
    }

    return steps;
}

function initVizSessions() {
    try {
        bookmarks = JSON.parse(localStorage.getItem('pravio_visualizer_bookmarks') || '[]');
        completedTopics = JSON.parse(localStorage.getItem('pravio_visualizer_completed') || '[]');
        workspaceNotes = JSON.parse(localStorage.getItem('pravio_visualizer_notes') || '{}');
    } catch(e) {
        bookmarks = [];
        completedTopics = [];
        workspaceNotes = {};
    }

    if (!Array.isArray(bookmarks)) bookmarks = [];
    if (!Array.isArray(completedTopics)) completedTopics = [];

    document.getElementById('viz-stat-streak').innerText = `${userStreak} Days`;
    document.getElementById('viz-stat-xp').innerText = `${userXP} XP`;
    document.getElementById('viz-stat-completed').innerText = `${completedTopics.length} / 85`;
    document.getElementById('viz-stat-hours').innerText = `${studyHours} hrs`;

    buildStudioDashboard();
}

// Start listener hooks
document.addEventListener('DOMContentLoaded', () => {
    initVizSessions();
    document.getElementById('viz-step-slider')?.addEventListener('input', (e) => {
        jumpToStep(e.target.value);
    });
    document.getElementById('viz-speed-slider')?.addEventListener('input', (e) => {
        setVizSpeed(e.target.value);
    });
});

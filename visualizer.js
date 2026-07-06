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

// Structured syllabus
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
    java: [
        {
            module: "Module 1: Java Basics",
            lessons: [
                { name: "Variables", key: "java_variables", operations: ["Declaration", "Scope", "Access Modifiers"] },
                { name: "Data Types", key: "java_data_types", operations: ["Primitives", "Wrapper Classes"] },
                { name: "Control Statements", key: "java_control", operations: ["If-Else branch", "Switch cases"] },
                { name: "Loops", key: "java_loops", operations: ["For-Each loop", "While iterator"] }
            ]
        },
        {
            module: "Module 2: Object-Oriented Java",
            lessons: [
                { name: "Classes", key: "java_classes", operations: ["Template specification", "Instantiation"] },
                { name: "Objects", key: "java_objects", operations: ["Heap allocations", "Instance scopes"] },
                { name: "Constructors", key: "java_constructors", operations: ["Default parameter", "Overloading"] },
                { name: "Inheritance", key: "java_inheritance", operations: ["Extends keyword", "Super methods"] },
                { name: "Polymorphism", key: "java_polymorphism", operations: ["Method Overriding", "Dynamic Dispatch"] },
                { name: "Abstraction", key: "java_abstraction", operations: ["Abstract classes", "Concrete methods"] },
                { name: "Interfaces", key: "java_interfaces", operations: ["Contracts definitions", "Multiple interfaces"] }
            ]
        },
        {
            module: "Module 3: Collection APIs",
            lessons: [
                { name: "Collections", key: "java_collections", operations: ["ArrayList add", "ArrayList remove", "HashMap put", "HashMap get"] },
                { name: "Generics", key: "java_generics", operations: ["Type bounds", "Generic classes"] },
                { name: "Exception Handling", key: "java_exceptions", operations: ["Try-Catch-Finally", "Custom exceptions"] }
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
    data_structures: [
        {
            module: "Module 1: Non-Linear Structures",
            lessons: [
                { name: "Binary Search Tree", key: "dsa_trees", operations: ["Node insertion", "BFS Traversal", "DFS Traversal"] }
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

function generateCurriculumCodeSample(studioId, topicName) {
    if (studioId === 'c') {
        return `// C ${topicName} Fundamentals\n#include <stdio.h>\n\nint main() {\n    int targetVal = 100;\n    printf("Val is: %d\\n", targetVal);\n    return 0;\n}`;
    } else if (studioId === 'java') {
        return `// Java ${topicName} Fundamentals\npublic class Main {\n    public static void main(String[] args) {\n        int variableVal = 200;\n        System.out.println(variableVal);\n    }\n}`;
    } else if (studioId === 'python') {
        return `# Python ${topicName} Fundamentals\nlabel_val = 500\nprint(label_val)`;
    } else if (studioId === 'javascript') {
        return `// JS ${topicName} Fundamentals\nlet variableValue = 300;\nconsole.log(variableValue);`;
    }
    return `// ${topicName} workspace\n// Enter sample code...`;
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
    if (activeSession.code && !activeSession.code.includes("Characteristics demo") && !activeSession.code.includes("int[] arr") && !activeSession.code.includes("Queue q")) {
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
        } else if (activeSession.topic.toLowerCase().includes("tree") || activeSession.topic.toLowerCase().includes("dsa_trees")) {
            steps = SUB_LESSONS_CATALOG.dsa_trees[0].steps;
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
        explanation.innerHTML = `
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

    renderInteractiveCanvas(step.action);

    const normalizedName = activeSession.topic.toLowerCase();
    if (stepIdx === totalSteps - 1 && !completedTopics.includes(normalizedName)) {
        completedTopics.push(normalizedName);
        localStorage.setItem('pravio_visualizer_completed', JSON.stringify(completedTopics));
    }
}

function renderInteractiveCanvas(action) {
    const canvas = document.getElementById('viz-display-area');
    if (!canvas) return;

    canvas.innerHTML = '';
    
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
    else if (action.type === "var_alloc") {
        const block = document.createElement('div');
        block.style.border = '1px solid var(--border-color)';
        block.style.borderRadius = '8px';
        block.style.background = 'rgba(20, 184, 166, 0.05)';
        block.style.borderLeft = '4px solid #14b8a6'; // Teal variable memory box
        block.style.padding = '12px';
        block.style.fontFamily = 'monospace';
        block.style.fontSize = '12px';
        block.innerHTML = `
            <div style="color:var(--text-muted); font-size:0.65rem;">Address: ${action.addr} | Type: ${action.dtype}</div>
            <div style="font-weight:700; color:var(--text-body); font-size:1.1rem; margin-top:2px;">${action.name} = ${action.val}</div>
        `;
        canvas.appendChild(block);
    }
    else if (action.type === "mem_set" || action.type === "mem_update") {
        const block = document.createElement('div');
        block.style.border = '1px solid var(--border-color)';
        block.style.borderRadius = '8px';
        block.style.background = 'rgba(59, 130, 246, 0.05)';
        block.style.borderLeft = '4px solid #3b82f6';
        block.style.padding = '12px';
        block.style.fontFamily = 'monospace';
        block.innerHTML = `
            <div style="font-size:0.7rem; color:#2563eb;">Address: ${action.addr}</div>
            <div style="font-size:1rem; font-weight:700; margin-top:2px; color:var(--text-body);">Value: ${action.val}</div>
        `;
        canvas.appendChild(block);
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
            <svg viewBox="0 0 400 240" width="100%" height="220" style="max-width:350px;">
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
    } else if (activeSession.topic.toLowerCase().includes("tree") || activeSession.topic.toLowerCase().includes("dsa_trees")) {
        steps = SUB_LESSONS_CATALOG.dsa_trees[0].steps;
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
    
    if (activeSession.code && !activeSession.code.includes("Characteristics demo") && !activeSession.code.includes("int[] arr") && !activeSession.code.includes("Queue q")) {
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
        } else if (activeSession.topic.toLowerCase().includes("tree") || activeSession.topic.toLowerCase().includes("dsa_trees")) {
            steps = SUB_LESSONS_CATALOG.dsa_trees[0].steps;
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
        
        if (activeSession.code && !activeSession.code.includes("Characteristics demo") && !activeSession.code.includes("int[] arr") && !activeSession.code.includes("Queue q")) {
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
            } else if (activeSession.topic.toLowerCase().includes("tree") || activeSession.topic.toLowerCase().includes("dsa_trees")) {
                steps = SUB_LESSONS_CATALOG.dsa_trees[0].steps;
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

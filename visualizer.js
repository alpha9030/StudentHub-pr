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
let aiTutorLevel = "advanced"; // beginner, advanced
let bookmarks = [];
let completedTopics = [];
let practiceRuns = 5;

// Complete Curriculum Catalog
const CURRICULUM_TREE = [
    {
        type: "category",
        title: "Programming Languages",
        icon: "fas fa-code",
        children: [
            {
                type: "language",
                title: "C",
                icon: "💻 C",
                children: [
                    "Variables", "Data Types", "Operators", "Input Output", "Conditional Statements",
                    "Loops", "Functions", "Arrays", "Strings", "Pointers", "Structures", "Unions",
                    "File Handling", "Memory Management", "Preprocessors", "Interview Questions", "Practice Problems"
                ]
            },
            {
                type: "language",
                title: "C++",
                icon: "💻 C++",
                children: [
                    "Variables", "OOP Basics", "Classes & Objects", "Constructors", "Inheritance",
                    "Polymorphism", "Abstraction", "Encapsulation", "Templates", "STL", "Exception Handling",
                    "File Handling", "Interview Questions", "Practice Problems"
                ]
            },
            {
                type: "language",
                title: "Java",
                icon: "☕ Java",
                children: [
                    "Variables", "Data Types", "Operators", "Input Output", "Conditional Statements",
                    "Loops", "Methods", "Arrays", "Strings", "Recursion", "Classes", "Objects",
                    "Constructors", "Inheritance", "Polymorphism", "Abstraction", "Encapsulation",
                    "Interfaces", "Packages", "Collections", "Generics", "Streams", "Lambda Expressions",
                    "Exception Handling", "File Handling", "JDBC", "Networking", "Multithreading",
                    "Memory Management", "Garbage Collection", "Comparable", "Comparator",
                    "Annotations", "Reflection", "Projects", "Interview Questions", "Practice Problems",
                    "Debugging", "Optimization"
                ]
            },
            {
                type: "language",
                title: "Python",
                icon: "🐍 Python",
                children: [
                    "Variables", "Data Types", "Lists", "Tuples", "Dicts", "Sets", "Conditional Statements",
                    "Loops", "Functions", "List Comprehension", "Lambda Functions", "File I/O", "OOP",
                    "Exception Handling", "Decorators", "Generators", "Iterators", "Regex", "Interview Questions", "Practice Problems"
                ]
            },
            {
                type: "language",
                title: "JavaScript",
                icon: "⚡ JavaScript",
                children: [
                    "Variables", "Data Types", "Operators", "Functions", "Objects", "Arrays", "Destructuring",
                    "Promises", "Async Await", "DOM Manipulation", "Event Loop", "Closures", "Prototypes",
                    "Modules", "ES6 Features", "Interview Questions", "Practice Problems"
                ]
            },
            {
                type: "language",
                title: "TypeScript",
                icon: "🟦 TypeScript",
                children: [
                    "Type Annotations", "Interfaces", "Classes", "Generics", "Enums", "Modules",
                    "Config", "Advanced Types", "Interview Questions", "Practice Problems"
                ]
            },
            {
                type: "language",
                title: "HTML",
                icon: "🌐 HTML",
                children: [
                    "Structure", "Elements", "Attributes", "Headings", "Paragraphs", "Links", "Images",
                    "Tables", "Lists", "Forms", "Semantic Tags", "SEO Basics"
                ]
            },
            {
                type: "language",
                title: "CSS",
                icon: "🎨 CSS",
                children: [
                    "Selectors", "Box Model", "Flexbox", "Grid", "Positioning", "Transitions",
                    "Animations", "Media Queries", "Variables", "Specificity", "TailwindCSS"
                ]
            },
            {
                type: "language",
                title: "SQL",
                icon: "🗄 SQL",
                children: [
                    "SELECT & WHERE", "GROUP BY & HAVING", "ORDER BY Sorting", "INNER JOIN matching",
                    "LEFT/RIGHT JOIN", "Aggregate Functions", "Indexing", "Transactions (ACID)", "Stored Procedures", "Views"
                ]
            },
            {
                type: "language",
                title: "PHP",
                icon: "🐘 PHP",
                children: ["Syntax", "Variables", "Loops", "Arrays", "Superglobals", "Sessions", "OOP", "MySQL Integration"]
            },
            {
                type: "language",
                title: "Go",
                icon: "🐹 Go",
                children: ["Variables", "Structs", "Interfaces", "Goroutines", "Channels", "Pointers"]
            },
            {
                type: "language",
                title: "Rust",
                icon: "🦀 Rust",
                children: ["Variables", "Ownership", "Borrowing", "Lifetimes", "Structs", "Enums", "Pattern Matching"]
            },
            {
                type: "language",
                title: "Kotlin",
                icon: "📱 Kotlin",
                children: ["Syntax", "Null Safety", "Classes", "Lambdas", "Coroutines"]
            },
            {
                type: "language",
                title: "Swift",
                icon: "🍎 Swift",
                children: ["Variables", "Optionals", "Protocols", "Extensions", "Closures"]
            },
            {
                type: "language",
                title: "R",
                icon: "📊 R",
                children: ["Vectors", "Matrices", "Data Frames", "Vectorized Operations", "Plotting"]
            }
        ]
    },
    {
        type: "category",
        title: "Data Structures",
        icon: "fas fa-project-diagram",
        children: [
            "Arrays", "Strings", "Linked Lists", "Circular Linked Lists", "Doubly Linked Lists",
            "Stacks", "Queues", "Deque", "Priority Queue", "Hash Maps", "Hash Tables", "Hash Sets",
            "Trees", "Binary Trees", "BST", "AVL Trees", "Red Black Trees", "Trie", "Heap",
            "Segment Tree", "Fenwick Tree", "Graphs", "Disjoint Set", "Bloom Filter"
        ]
    },
    {
        type: "category",
        title: "Algorithms",
        icon: "fas fa-random",
        children: [
            "Bubble Sort", "Selection Sort", "Insertion Sort", "Merge Sort", "Quick Sort",
            "Heap Sort", "Counting Sort", "Bucket Sort", "Radix Sort", "Linear Search",
            "Binary Search", "Sliding Window", "Two Pointers", "Greedy", "Dynamic Programming",
            "Backtracking", "Divide and Conquer", "Bit Manipulation", "DFS", "BFS",
            "Shortest Path", "Minimum Spanning Tree", "Topological Sort", "Tree Algorithms", "Graph Algorithms"
        ]
    },
    {
        type: "category",
        title: "Patterns",
        icon: "fas fa-shapes",
        children: ["Square Pattern", "Right Angle Triangle", "Pyramid Pattern", "Diamond Pattern", "Inverted Pyramid", "Hollow Square"]
    },
    {
        type: "category",
        title: "Web Development",
        icon: "fas fa-globe",
        children: ["CSS Box Model", "DOM Tree Selection", "Flexbox Layout", "Grid Layout", "JS Event Loop", "Promises & Async/Await", "HTTP Request Lifecycle"]
    },
    {
        type: "category",
        title: "Database",
        icon: "fas fa-database",
        children: ["Relational Database", "NoSQL Basics", "Normalization Forms", "Indexing Strategies", "ACID Transactions", "Execution Plans"]
    },
    {
        type: "category",
        title: "Operating System",
        icon: "fas fa-desktop",
        children: ["Processes & Threads", "CPU Scheduling", "Deadlocks", "Memory Management", "Paging & Segmentation", "Virtual Memory"]
    },
    {
        type: "category",
        title: "Computer Networks",
        icon: "fas fa-network-wired",
        children: ["OSI Model Layers", "TCP/IP Protocol", "IP Addressing", "DNS Resolution", "HTTP vs HTTPS", "Sockets programming"]
    },
    {
        type: "category",
        title: "Cloud",
        icon: "fas fa-cloud",
        children: ["Virtualization", "AWS Basics", "GCP Core Services", "Docker Containers", "Kubernetes Orchestration", "Serverless Architecture"]
    },
    {
        type: "category",
        title: "AI / ML",
        icon: "fas fa-robot",
        children: ["Supervised Learning", "Unsupervised Learning", "Neural Networks", "Deep Learning", "Transformers", "LLMs introduction"]
    },
    {
        type: "category",
        title: "Interview Preparation",
        icon: "fas fa-briefcase",
        children: ["Big-O Complexity analysis", "FAANG Preparation roadmap", "Mock Interviews checklist", "Behavioral questions prep", "System Design patterns"]
    },
    {
        type: "category",
        title: "Saved Sessions",
        icon: "fas fa-history",
        isSessions: true,
        children: []
    }
];

// Topic Presets & Templates
const TOPIC_PRESETS = {
    "c_variables": {
        code: `int main() {\n    int age = 20;\n    float salary = 35000.5;\n    char grade = 'A';\n    return 0;\n}`,
        category: "languages",
        topic: "c"
    },
    "c_pointers": {
        code: `// C Pointer Dereferencing\nint val = 42;\nint *ptr = &val;\n*ptr = 99;`,
        category: "languages",
        topic: "c"
    },
    "c_loops": {
        code: `// C For Loop iterations\nfor (int i = 0; i < 4; i++) {\n    printf("%d", i);\n}`,
        category: "languages",
        topic: "c"
    },
    "cpp_oop_basics": {
        code: `// C++ Class Constructor\nclass Student {\n  public:\n    Student() { id = 101; }\n    int id;\n};\nStudent s;`,
        category: "languages",
        topic: "cpp"
    },
    "java_garbage_collection": {
        code: `// Java Memory Reference\nString a = new String("Pravio");\na = null; // GC target`,
        category: "languages",
        topic: "java"
    },
    "python_list_comprehension": {
        code: `# Python List Comprehension\nnums = [1, 2, 3, 4]\nsquares = [x * x for x in nums]\nprint(squares)`,
        category: "languages",
        topic: "python"
    },
    "javascript_destructuring": {
        code: `// JS Object Destructuring\nconst user = { name: "Alice", age: 21 };\nconst { name, age } = user;`,
        category: "languages",
        topic: "javascript"
    },
    "typescript_interfaces": {
        code: `// TS Strict Type Safety\ninterface User { id: number; }\nconst u: User = { id: 456 };`,
        category: "languages",
        topic: "typescript"
    },
    "sql_select_&_where": {
        code: `SELECT name, grade\nFROM Students\nWHERE dept = 'CSE';`,
        category: "sql",
        topic: "select"
    },
    "css_box_model": {
        code: `<!-- HTML Markup -->\n<div class="box">Pravio Layout</div>\n\n/* CSS styling declarations */\n.box {\n  width: 100px;\n  padding: 10px;\n  border: 5px solid #3b82f6;\n  margin: 15px;\n}`,
        category: "webdev",
        topic: "boxmodel"
    },
    "arrays": {
        code: `// Array element shifting\nint arr[5] = {10, 20, 30};\nint pos = 1;\nint val = 99;\ninsertAt(arr, pos, val);`,
        category: "structures",
        topic: "array"
    },
    "linked_lists": {
        code: `// Linked List insertion link splicing\nNode *head = [10 -> 20];\nNode *new_node = createNode(99);\nnew_node->next = head->next;\nhead->next = new_node;`,
        category: "structures",
        topic: "linked_list"
    },
    "bubble_sort": {
        code: `// Bubble Sort element sorting\nfor (i = 0; i < len - 1; i++) {\n  for (j = 0; j < len - i - 1; j++) {\n    if (arr[j] > arr[j + 1]) {\n      swap(&arr[j], &arr[j + 1]);\n    }\n  }\n}`,
        category: "algorithms",
        topic: "bubble_sort"
    }
};

const VIZ_COMPLEXITIES = {
    bubble_sort: { best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)", stable: "Yes", inplace: "Yes" },
    python: { best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(n)", stable: "N/A", inplace: "N/A" },
    c: { best: "O(1)", avg: "O(1)", worst: "O(1)", space: "O(1)", stable: "N/A", inplace: "N/A" },
    cpp: { best: "O(1)", avg: "O(1)", worst: "O(1)", space: "O(1)", stable: "N/A", inplace: "N/A" },
    java: { best: "O(1)", avg: "O(1)", worst: "O(1)", space: "O(1)", stable: "N/A", inplace: "N/A" },
    javascript: { best: "O(1)", avg: "O(1)", worst: "O(1)", space: "O(1)", stable: "N/A", inplace: "N/A" },
    typescript: { best: "O(1)", avg: "O(1)", worst: "O(1)", space: "O(1)", stable: "N/A", inplace: "N/A" },
    array: { best: "O(1)", avg: "O(n)", worst: "O(n)", space: "O(n)", stable: "N/A", inplace: "Yes" },
    linked_list: { best: "O(1)", avg: "O(n)", worst: "O(n)", space: "O(1)", stable: "N/A", inplace: "Yes" },
    select: { best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(n)", stable: "N/A", inplace: "N/A" },
    boxmodel: { best: "O(1)", avg: "O(1)", worst: "O(1)", space: "O(1)", stable: "N/A", inplace: "N/A" }
};

// Hardcoded visualization trace frames
const VIZ_CATALOG = {
    languages: {
        topics: {
            python: {
                steps: [
                    { line: 2, vars: { nums: "[1, 2, 3, 4]", squares: "undefined", prev_val: "none", type: "list", scope: "global" }, mem: ["nums -> [1, 2, 3, 4]"], explain: "Initialize list of numbers `nums` containing elements 1, 2, 3 and 4.", action: { type: "init", data: [1, 2, 3, 4] } },
                    { line: 3, vars: { nums: "[1, 2, 3, 4]", x: 1, squares: "[]", prev_val: "undefined", type: "int", scope: "local" }, mem: ["nums -> [1, 2, 3, 4]", "squares -> []"], explain: "Loop starts: `x` takes first element (1). Evaluate `1 * 1 = 1`.", action: { type: "eval", idx: 0, val: 1 } },
                    { line: 3, vars: { nums: "[1, 2, 3, 4]", x: 2, squares: "[1]", prev_val: "[]", type: "int", scope: "local" }, mem: ["nums -> [1, 2, 3, 4]", "squares -> [1]"], explain: "Loop continues: `x` takes second element (2). Evaluate `2 * 2 = 4`.", action: { type: "eval", idx: 1, val: 4 } },
                    { line: 3, vars: { nums: "[1, 2, 3, 4]", x: 3, squares: "[1, 4]", prev_val: "[1]", type: "int", scope: "local" }, mem: ["nums -> [1, 2, 3, 4]", "squares -> [1, 4]"], explain: "Loop continues: `x` takes third element (3). Evaluate `3 * 3 = 9`.", action: { type: "eval", idx: 2, val: 9 } },
                    { line: 3, vars: { nums: "[1, 2, 3, 4]", x: 4, squares: "[1, 4, 9]", prev_val: "[1, 4]", type: "int", scope: "local" }, mem: ["nums -> [1, 2, 3, 4]", "squares -> [1, 4, 9]"], explain: "Loop continues: `x` takes fourth element (4). Evaluate `4 * 4 = 16`.", action: { type: "eval", idx: 3, val: 16 } },
                    { line: 3, vars: { nums: "[1, 2, 3, 4]", squares: "[1, 4, 9, 16]", prev_val: "[1, 4, 9]", type: "list", scope: "global" }, mem: ["nums -> [1, 2, 3, 4]", "squares -> [1, 4, 9, 16]"], explain: "List comprehension ends, resulting list of squares is assigned to `squares`.", action: { type: "complete", data: [1, 4, 9, 16] } },
                    { line: 4, vars: { nums: "[1, 2, 3, 4]", squares: "[1, 4, 9, 16]", prev_val: "[1, 4, 9]", type: "list", scope: "global" }, mem: ["nums -> [1, 2, 3, 4]", "squares -> [1, 4, 9, 16]"], explain: "Print statement executes: prints `[1, 4, 9, 16]` to output window.", action: { type: "print", val: "[1, 4, 9, 16]" } }
                ]
            },
            c: {
                steps: [
                    { line: 2, vars: { val: 42, ptr: "NULL", prev_val: "none", type: "int", scope: "stack" }, mem: ["val (0x7ffe) -> 42"], explain: "Allocate integer `val` in stack frame at address 0x7ffe and assign value 42.", action: { type: "mem_set", addr: "0x7ffe", val: 42 } },
                    { line: 3, vars: { val: 42, ptr: "0x7ffe", prev_val: "NULL", type: "pointer", scope: "stack" }, mem: ["val (0x7ffe) -> 42", "ptr (0x7fff) -> 0x7ffe"], explain: "Declare pointer `ptr` and store the address of `val` (0x7ffe) in it.", action: { type: "mem_set", addr: "0x7fff", val: "0x7ffe" } },
                    { line: 4, vars: { val: 99, ptr: "0x7ffe", prev_val: "42", type: "int", scope: "stack" }, mem: ["val (0x7ffe) -> 99", "ptr (0x7fff) -> 0x7ffe"], explain: "Dereference `ptr`: write value 99 to the memory address stored in `ptr` (0x7ffe). `val` is now 99.", action: { type: "mem_update", addr: "0x7ffe", val: 99 } }
                ]
            },
            cpp: {
                steps: [
                    { line: 2, vars: { this: "0x4000", id: "garbage", prev_val: "none", type: "object", scope: "heap" }, mem: ["Constructor call stacked"], explain: "Allocate Student object memory block in heap. Invoke C++ default constructor function.", action: { type: "mem_set", addr: "0x4000", val: "Student" } },
                    { line: 4, vars: { this: "0x4000", id: 101, prev_val: "garbage", type: "int", scope: "object" }, mem: ["this -> 0x4000"], explain: "Within constructor frame scope, set object property member variables `id` to 101.", action: { type: "mem_update", addr: "0x4000", val: "id: 101" } }
                ]
            },
            java: {
                steps: [
                    { line: 2, vars: { a: "0x5000", prev_val: "none", type: "String", scope: "stack" }, mem: ["0x5000 -> 'Pravio'"], explain: "Allocate java String object in heap storage, assign reference pointer to variable `a`.", action: { type: "mem_set", addr: "0x5000", val: "String('Pravio')" } },
                    { line: 3, vars: { a: "null", prev_val: "0x5000", type: "String", scope: "stack" }, mem: ["0x5000 (Orphaned)"], explain: "Assign `a = null`. Heap reference count drops to 0. Marked as Garbage Collector garbage sweep target.", action: { type: "mem_update", addr: "0x5000", val: "GC Orphan" } }
                ]
            },
            javascript: {
                steps: [
                    { line: 2, vars: { user: "{ name: 'Alice', age: 21 }", prev_val: "none", type: "object", scope: "heap" }, mem: ["user object initialized"], explain: "Declare ES6 object `user` containing name and age keys.", action: { type: "init", data: ["Alice", 21] } },
                    { line: 3, vars: { name: "Alice", age: 21, prev_val: "undefined", type: "string", scope: "local" }, mem: ["name -> 'Alice'", "age -> 21"], explain: "Perform array/object destructuring. Extract properties directly into individual scope variables.", action: { type: "complete", data: ["Alice", 21] } }
                ]
            },
            typescript: {
                steps: [
                    { line: 3, vars: { u: "{ id: 456 }", prev_val: "none", type: "User", scope: "local" }, mem: ["Type Interface Verified"], explain: "Strict compile-time interface structure verification matches specifications. Assign variable objects.", action: { type: "init", data: [456] } }
                ]
            }
        }
    },
    structures: {
        topics: {
            array: {
                steps: [
                    { line: 2, vars: { arr: "[10, 20, 30, 0, 0]", size: 3, prev_val: "none", type: "array", scope: "heap" }, mem: ["arr -> [10, 20, 30, 0, 0]"], explain: "Initialize array of capacity 5 with initial elements: [10, 20, 30].", action: { type: "array_state", data: [10, 20, 30, 0, 0], active: [] } },
                    { line: 3, vars: { arr: "[10, 20, 30, 0, 0]", pos: 1, prev_val: "none", type: "int", scope: "stack" }, mem: ["arr -> [10, 20, 30, 0, 0]"], explain: "Set position index where insertion will occur: pos = 1.", action: { type: "array_state", data: [10, 20, 30, 0, 0], active: [1] } },
                    { line: 4, vars: { arr: "[10, 20, 30, 0, 0]", pos: 1, val: 99, prev_val: "none", type: "int", scope: "stack" }, mem: ["arr -> [10, 20, 30, 0, 0]"], explain: "Set insertion value: val = 99.", action: { type: "array_state", data: [10, 20, 30, 0, 0], active: [1] } },
                    { line: 5, vars: { arr: "[10, 20, 30, 30, 0]", pos: 1, val: 99, prev_val: "0", type: "array", scope: "heap" }, mem: ["arr -> [10, 20, 30, 30, 0]"], explain: "Shift element at index 2 (30) to index 3 to make room.", action: { type: "array_state", data: [10, 20, 30, 30, 0], active: [2, 3] } },
                    { line: 5, vars: { arr: "[10, 20, 20, 30, 0]", pos: 1, val: 99, prev_val: "30", type: "array", scope: "heap" }, mem: ["arr -> [10, 20, 20, 30, 0]"], explain: "Shift element at index 1 (20) to index 2.", action: { type: "array_state", data: [10, 20, 20, 30, 0], active: [1, 2] } },
                    { line: 5, vars: { arr: "[10, 99, 20, 30, 0]", pos: 1, val: 99, prev_val: "20", type: "array", scope: "heap" }, mem: ["arr -> [10, 99, 20, 30, 0]"], explain: "Write insertion value 99 into index 1. Array insertion complete.", action: { type: "array_state", data: [10, 99, 20, 30, 0], active: [1] } }
                ]
            },
            linked_list: {
                steps: [
                    { line: 2, vars: { head: "0x1000", nodes: "10 -> 20", prev_val: "none", type: "pointer", scope: "stack" }, mem: ["head (0x1000) -> 10 (next: 0x2000)", "node2 (0x2000) -> 20 (next: NULL)"], explain: "Initialize linked list with head pointer pointing to node (10) pointing to node (20).", action: { type: "ll_state", list: [{ val: 10, addr: "0x1000", next: "0x2000" }, { val: 20, addr: "0x2000", next: "NULL" }], active: [] } },
                    { line: 3, vars: { head: "0x1000", new_node: "0x3000", prev_val: "NULL", type: "pointer", scope: "stack" }, mem: ["head (0x1000)", "node2 (0x2000)", "new_node (0x3000) -> 99 (next: NULL)"], explain: "Create a new node containing value 99 in memory at heap address 0x3000.", action: { type: "ll_state", list: [{ val: 10, addr: "0x1000", next: "0x2000" }, { val: 20, addr: "0x2000", next: "NULL" }, { val: 99, addr: "0x3000", next: "NULL", temp: true }], active: ["0x3000"] } },
                    { line: 4, vars: { head: "0x1000", new_node: "0x3000", prev_val: "0x3000", type: "pointer", scope: "stack" }, mem: ["head (0x1000)", "node2 (0x2000)", "new_node (0x3000) -> 99 (next: 0x2000)"], explain: "Link `new_node->next` to the node following head node (`head->next` / 0x2000).", action: { type: "ll_state", list: [{ val: 10, addr: "0x1000", next: "0x2000" }, { val: 20, addr: "0x2000", next: "NULL" }, { val: 99, addr: "0x3000", next: "0x2000", temp: true }], active: ["0x3000", "0x2000"] } },
                    { line: 5, vars: { head: "0x1000", new_node: "0x3000", prev_val: "0x3000", type: "pointer", scope: "stack" }, mem: ["head (0x1000) -> 10 (next: 0x3000)", "new_node (0x3000) -> 99 (next: 0x2000)", "node2 (0x2000)"], explain: "Link `head->next` to point to `new_node` (0x3000). Node 99 is now spliced in.", action: { type: "ll_state", list: [{ val: 10, addr: "0x1000", next: "0x3000" }, { val: 99, addr: "0x3000", next: "0x2000" }, { val: 20, addr: "0x2000", next: "NULL" }], active: ["0x1000", "0x3000"] } }
                ]
            }
        }
    },
    algorithms: {
        topics: {
            bubble_sort: {
                steps: [
                    { line: 2, vars: { arr: "[5, 1, 4]", i: 0, j: "undefined", prev_val: "none", type: "int", scope: "local" }, mem: ["arr -> [5, 1, 4]"], explain: "Start outer loop: pass i = 0.", action: { type: "array_state", data: [5, 1, 4], active: [] } },
                    { line: 3, vars: { arr: "[5, 1, 4]", i: 0, j: 0, prev_val: "undefined", type: "int", scope: "local" }, mem: ["arr -> [5, 1, 4]"], explain: "Start inner loop: check index j = 0.", action: { type: "array_state", data: [5, 1, 4], active: [0, 1] } },
                    { line: 4, vars: { arr: "[5, 1, 4]", i: 0, j: 0, prev_val: "none", type: "bool", scope: "local" }, mem: ["arr -> [5, 1, 4]"], explain: "Compare element at j (5) and j+1 (1). 5 > 1, so prepare to swap.", action: { type: "array_state", data: [5, 1, 4], active: [0, 1], highlight: true } },
                    { line: 5, vars: { arr: "[1, 5, 4]", i: 0, j: 0, prev_val: "[5, 1, 4]", type: "array", scope: "heap" }, mem: ["arr -> [1, 5, 4]"], explain: "Swap elements at index 0 and 1. 5 shifts right.", action: { type: "array_state", data: [1, 5, 4], active: [0, 1] } },
                    { line: 3, vars: { arr: "[1, 5, 4]", i: 0, j: 1, prev_val: "0", type: "int", scope: "local" }, mem: ["arr -> [1, 5, 4]"], explain: "Increment inner loop index to j = 1.", action: { type: "array_state", data: [1, 5, 4], active: [1, 2] } },
                    { line: 4, vars: { arr: "[1, 5, 4]", i: 0, j: 1, prev_val: "none", type: "bool", scope: "local" }, mem: ["arr -> [1, 5, 4]"], explain: "Compare element at j (5) and j+1 (4). 5 > 4, swap required.", action: { type: "array_state", data: [1, 5, 4], active: [1, 2], highlight: true } },
                    { line: 5, vars: { arr: "[1, 4, 5]", i: 0, j: 1, prev_val: "[1, 5, 4]", type: "array", scope: "heap" }, mem: ["arr -> [1, 4, 5]"], explain: "Swap index 1 and 2. 5 shifts right and bubbles to end.", action: { type: "array_state", data: [1, 4, 5], active: [1, 2] } },
                    { line: 2, vars: { arr: "[1, 4, 5]", i: 1, j: "undefined", prev_val: "0", type: "int", scope: "local" }, mem: ["arr -> [1, 4, 5]"], explain: "Inner loop done. Increment outer loop index: i = 1.", action: { type: "array_state", data: [1, 4, 5], active: [] } },
                    { line: 3, vars: { arr: "[1, 4, 5]", i: 1, j: 0, prev_val: "1", type: "int", scope: "local" }, mem: ["arr -> [1, 4, 5]"], explain: "Start second pass: check index j = 0.", action: { type: "array_state", data: [1, 4, 5], active: [0, 1] } },
                    { line: 4, vars: { arr: "[1, 4, 5]", i: 1, j: 0, prev_val: "none", type: "bool", scope: "local" }, mem: ["arr -> [1, 4, 5]"], explain: "Compare element at j (1) and j+1 (4). 1 < 4, no swap needed.", action: { type: "array_state", data: [1, 4, 5], active: [0, 1] } },
                    { line: 8, vars: { arr: "[1, 4, 5]", sorted: "true", prev_val: "false", type: "bool", scope: "global" }, mem: ["arr -> [1, 4, 5]"], explain: "All elements sorted. Bubble Sort finished successfully.", action: { type: "array_state", data: [1, 4, 5], active: [], complete: true } }
                ]
            }
        }
    },
    sql: {
        topics: {
            select: {
                steps: [
                    { line: 2, vars: { table: "Students", total_rows: 3, prev_val: "none", type: "string", scope: "database" }, mem: ["Input -> [Alice (CSE), Bob (ECE), Charlie (CSE)]"], explain: "Read all rows from the input table `Students`.", action: { type: "sql_table", rows: [{ name: "Alice", dept: "CSE", grade: "A" }, { name: "Bob", dept: "ECE", grade: "B" }, { name: "Charlie", dept: "CSE", grade: "A" }], active: [] } },
                    { line: 3, vars: { table: "Students", row: "Bob", match: "false", prev_val: "none", type: "row", scope: "query" }, mem: ["Input -> [Alice (CSE)]", "Matches -> [Alice]"], explain: "Evaluate WHERE criteria on Bob: `ECE` = 'CSE' is False. Exclude row.", action: { type: "sql_table", rows: [{ name: "Alice", dept: "CSE", grade: "A", filter: "pass" }, { name: "Bob", dept: "ECE", grade: "B", filter: "fail" }, { name: "Charlie", dept: "CSE", grade: "A" }], active: [1] } },
                    { line: 3, vars: { table: "Students", row: "Charlie", match: "true", prev_val: "none", type: "row", scope: "query" }, mem: ["Matches -> [Alice, Charlie]"], explain: "Evaluate WHERE criteria on Charlie: `CSE` = 'CSE' is True. Keep row.", action: { type: "sql_table", rows: [{ name: "Alice", dept: "CSE", grade: "A", filter: "pass" }, { name: "Bob", dept: "ECE", grade: "B", filter: "fail" }, { name: "Charlie", dept: "CSE", grade: "A", filter: "pass" }], active: [2] } },
                    { line: 1, vars: { result: "2 Rows Selected", prev_val: "none", type: "dataset", scope: "output" }, mem: ["Output -> [Alice (A), Charlie (A)]"], explain: "Apply SELECT projections. Print final result table.", action: { type: "sql_result", rows: [{ name: "Alice", grade: "A" }, { name: "Charlie", grade: "A" }] } }
                ]
            }
        }
    },
    webdev: {
        topics: {
            boxmodel: {
                steps: [
                    { line: 3, vars: { content_width: "100px", prev_val: "none", type: "css_prop", scope: "layout" }, mem: [], explain: "Content layer dimensions are initialized to 100px wide.", action: { type: "box_model", layers: { content: "100px", padding: "0px", border: "0px", margin: "0px" } } },
                    { line: 4, vars: { padding: "10px", prev_val: "0px", type: "css_prop", scope: "layout" }, mem: [], explain: "Padding adds 10px spacing inside the border, surrounding the content.", action: { type: "box_model", layers: { content: "100px", padding: "10px", border: "0px", margin: "0px" } } },
                    { line: 5, vars: { border: "5px", prev_val: "0px", type: "css_prop", scope: "layout" }, mem: [], explain: "Border boundary adds 5px thickness, enclosing content and padding layers.", action: { type: "box_model", layers: { content: "100px", padding: "10px", border: "5px", margin: "0px" } } },
                    { line: 6, vars: { margin: "15px", total_width: "150px", prev_val: "0px", type: "css_prop", scope: "layout" }, mem: [], explain: "Margin creates 15px outer space, pushing surrounding elements away. Total occupied width is 160px.", action: { type: "box_model", layers: { content: "100px", padding: "10px", border: "5px", margin: "15px" } } }
                ]
            }
        }
    }
};

// Curriculum Tree Builder
function buildCurriculumTree() {
    const treeEl = document.getElementById('viz-curriculum-tree');
    if (!treeEl) return;

    treeEl.innerHTML = '';

    CURRICULUM_TREE.forEach(cat => {
        const catFolder = document.createElement('div');
        catFolder.className = 'curr-folder';

        // Header
        const header = document.createElement('div');
        header.className = 'folder-header';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.gap = '8px';
        header.style.padding = '6px 8px';
        header.style.borderRadius = '6px';
        header.style.cursor = 'pointer';
        header.style.fontWeight = '700';
        header.style.color = 'var(--text-body)';
        header.onclick = () => toggleFolderNode(header);

        header.innerHTML = `
            <i class="fas fa-chevron-right folder-chevron" style="font-size:10px; transition:transform 0.2s;"></i>
            <i class="${cat.icon}" style="color:var(--primary-color);"></i>
            <span>${cat.title}</span>
        `;
        catFolder.appendChild(header);

        // Contents
        const contents = document.createElement('div');
        contents.className = 'folder-contents';
        contents.style.paddingLeft = '14px';
        contents.style.display = 'none';

        if (cat.isSessions) {
            if (vizSessions.length === 0) {
                contents.innerHTML = `<div style="padding:6px 12px; font-size:12px; color:var(--text-muted); font-style:italic;">No saved sessions.</div>`;
            } else {
                vizSessions.forEach(sess => {
                    const item = document.createElement('div');
                    item.className = 'tree-item';
                    item.style.display = 'flex';
                    item.style.justifyContent = 'space-between';
                    item.style.alignItems = 'center';
                    item.innerHTML = `
                        <span>${sess.name}</span>
                        <i class="far fa-trash-alt" onclick="deleteVizSession('${sess.id}', event)" style="color:var(--text-muted); cursor:pointer;"></i>
                    `;
                    item.onclick = (e) => {
                        if (e.target.tagName !== 'I') {
                            selectVizSession(sess.id);
                        }
                    };
                    contents.appendChild(item);
                });
            }
        }
        else {
            cat.children.forEach(child => {
                if (typeof child === 'string') {
                    const item = document.createElement('div');
                    item.className = 'tree-item';
                    item.innerText = child;
                    item.onclick = () => loadCurriculumTopic(cat.title.toLowerCase().replace(' ', '_'), 'general', child);
                    contents.appendChild(item);
                } else {
                    // Nested languages
                    const langFolder = document.createElement('div');
                    langFolder.className = 'curr-folder';

                    const langHeader = document.createElement('div');
                    langHeader.className = 'folder-header';
                    langHeader.style.display = 'flex';
                    langHeader.style.alignItems = 'center';
                    langHeader.style.gap = '6px';
                    langHeader.style.padding = '4px 6px';
                    langHeader.style.borderRadius = '6px';
                    langHeader.style.cursor = 'pointer';
                    langHeader.style.fontWeight = '600';
                    langHeader.style.color = 'var(--text-body)';
                    langHeader.onclick = () => toggleFolderNode(langHeader);

                    langHeader.innerHTML = `
                        <i class="fas fa-chevron-right folder-chevron" style="font-size:8px; transition:transform 0.2s;"></i>
                        <span>${child.icon}</span>
                    `;
                    langFolder.appendChild(langHeader);

                    const langContents = document.createElement('div');
                    langContents.className = 'folder-contents';
                    langContents.style.paddingLeft = '10px';
                    langContents.style.display = 'none';

                    child.children.forEach(topic => {
                        const item = document.createElement('div');
                        item.className = 'tree-item';
                        item.innerText = topic;
                        item.onclick = () => loadCurriculumTopic('languages', child.title.toLowerCase(), `${child.title} (${topic})`);
                        langContents.appendChild(item);
                    });

                    langFolder.appendChild(langContents);
                    contents.appendChild(langFolder);
                }
            });
        }

        catFolder.appendChild(contents);
        treeEl.appendChild(catFolder);
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

// Map custom syllabus keys to preset codes
function getCodeForTopic(category, lang, name) {
    const key = (lang + "_" + name.replace(/ /g, '_')).toLowerCase();
    const cleanName = name.toLowerCase().replace(/ /g, '_');
    
    if (TOPIC_PRESETS[key]) return TOPIC_PRESETS[key];
    if (TOPIC_PRESETS[cleanName]) return TOPIC_PRESETS[cleanName];

    // Generic code builder for complete directory coverage
    let generatedCode = `// Pravio Trace: ${name}\n`;
    let genericTopic = "general";
    
    if (category === "languages") {
        if (lang === "python") {
            generatedCode = `# Python Code: ${name}\ndef run_demo():\n    print("Executing ${name}")\nrun_demo()`;
            genericTopic = "python";
        } else if (lang === "java") {
            generatedCode = `// Java Code: ${name}\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("${name}");\n    }\n}`;
            genericTopic = "java";
        } else if (lang === "c") {
            generatedCode = `// C Code: ${name}\n#include <stdio.h>\nint main() {\n    printf("${name}\\n");\n    return 0;\n}`;
            genericTopic = "c";
        } else if (lang === "cpp") {
            generatedCode = `// C++ Code: ${name}\n#include <iostream>\nint main() {\n    std::cout << "${name}" << std::endl;\n    return 0;\n}`;
            genericTopic = "cpp";
        } else {
            generatedCode = `// JavaScript Code: ${name}\nconst label = "${name}";\nconsole.log(label);`;
            genericTopic = "javascript";
        }
    } else if (category === "patterns") {
        generatedCode = `// Pattern Code: ${name}\nfor (int i = 0; i < 4; i++) {\n    for (int j = 0; j <= i; j++) {\n        print("*");\n    }\n    println();\n}`;
        genericTopic = "bubble_sort";
    } else {
        generatedCode = `// Workspace Code: ${name}\nint val = 100;\nrun(${name});`;
        genericTopic = "array";
    }

    return {
        code: generatedCode,
        category: category,
        topic: genericTopic
    };
}

function loadCurriculumTopic(category, lang, displayName) {
    const info = getCodeForTopic(category, lang, displayName);
    
    // Update breadcrumbs labels
    const breadStudio = document.getElementById('breadcrumb-studio');
    const breadTopic = document.getElementById('breadcrumb-topic');
    if (breadStudio) breadStudio.innerText = category.toUpperCase();
    if (breadTopic) breadTopic.innerText = displayName;

    // Reset console outputs
    const consoleLog = document.getElementById('viz-console-log');
    if (consoleLog) {
        consoleLog.innerHTML = `[Console System Initialized]\nLoaded topic: ${displayName}\nReady for execution...`;
    }

    // Create session payload
    const newSess = {
        id: "viz_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        name: displayName,
        category: info.category,
        topic: info.topic,
        code: info.code,
        currentStep: 0,
        createdAt: new Date().toISOString()
    };
    
    vizSessions.unshift(newSess);
    activeSession = newSess;
    
    saveVizSessions();
    loadActiveVizSession();
    
    // Active sidebar tree styling
    const items = document.querySelectorAll('.tree-item');
    items.forEach(i => {
        i.style.background = 'transparent';
        i.style.color = 'var(--text-body)';
        i.style.fontWeight = 'normal';
        i.style.borderLeftColor = 'transparent';
    });
    
    const clicked = Array.from(items).find(i => i.innerText.trim() === displayName || i.innerText.includes(displayName));
    if (clicked) {
        clicked.style.background = 'rgba(59, 130, 246, 0.08)';
        clicked.style.color = 'var(--primary-color)';
        clicked.style.fontWeight = 'bold';
        clicked.style.borderLeftColor = 'var(--primary-color)';
    }

    // Toggle live webpage iframe layout split if HTML/CSS
    const previewContainer = document.getElementById('viz-html-preview-container');
    if (previewContainer) {
        if (displayName.toLowerCase().includes('css') || displayName.toLowerCase().includes('html') || displayName.toLowerCase().includes('box model')) {
            previewContainer.style.display = 'flex';
            updateHTMLPreview(info.code);
        } else {
            previewContainer.style.display = 'none';
        }
    }
}

function searchVizCurriculum(query) {
    const q = query.toLowerCase().trim();
    const items = document.querySelectorAll('.tree-item');
    
    items.forEach(item => {
        const text = item.innerText.toLowerCase();
        if (text.includes(q)) {
            item.style.display = 'block';
            let parent = item.parentElement;
            while (parent && parent.id !== 'viz-curriculum-tree') {
                if (parent.classList.contains('folder-contents')) {
                    parent.style.display = 'block';
                    const folderHeader = parent.previousElementSibling;
                    if (folderHeader) {
                        const chevron = folderHeader.querySelector('.folder-chevron');
                        if (chevron) {
                            chevron.style.transform = 'rotate(90deg)';
                        }
                    }
                }
                parent = parent.parentElement;
            }
        } else {
            item.style.display = 'none';
        }
    });
}

// Live webpage split screen render updating
function updateHTMLPreview(code) {
    const iframe = document.getElementById('viz-html-preview-iframe');
    if (!iframe) return;

    let doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    
    // Inject structural container wraps
    if (code.includes('<div') || code.includes('<p>')) {
        doc.write(code);
    } else {
        doc.write(`
            <html>
            <head>
                <style>
                    body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb; }
                    ${code}
                </style>
            </head>
            <body>
                <div class="box">Pravio Layout Preview</div>
            </body>
            </html>
        `);
    }
    doc.close();
}

// User clicks "Run Code" inside code editor
function runCustomCode() {
    if (!activeSession) return;
    const editor = document.getElementById('viz-code-editor');
    if (!editor) return;

    activeSession.code = editor.value;
    activeSession.currentStep = 0;
    
    // Update live rendering if HTML/CSS
    if (activeSession.name.toLowerCase().includes('css') || activeSession.name.toLowerCase().includes('html') || activeSession.name.toLowerCase().includes('box')) {
        updateHTMLPreview(editor.value);
    }

    saveVizSessions();
    
    // Append compile status console logs
    const consoleLog = document.getElementById('viz-console-log');
    if (consoleLog) {
        consoleLog.innerHTML += `\n[Pravio GCC] Code updated. Parsing syntax...`;
        consoleLog.innerHTML += `\n[Pravio GCC] Success. Regenerating step frames.`;
        consoleLog.scrollTop = consoleLog.scrollHeight;
    }

    renderCurrentStep();
}

// Bookmark management
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
    
    saveVizSessions();
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

// Save sessions
function saveVizSessions() {
    localStorage.setItem('pravio_visualizer_bookmarks', JSON.stringify(bookmarks));
    localStorage.setItem('pravio_visualizer_completed', JSON.stringify(completedTopics));
}

function selectVizSession(id) {
    const found = vizSessions.find(s => s.id === id);
    if (found) {
        activeSession = found;
        loadActiveVizSession();
    }
}

function deleteVizSession(id, event) {
    if (event) event.stopPropagation();
    vizSessions = vizSessions.filter(s => s.id !== id);
    if (activeSession && activeSession.id === id) {
        activeSession = vizSessions[0] || null;
    }
    saveVizSessions();
    buildCurriculumTree();
    if (activeSession) {
        loadActiveVizSession();
    }
}

function loadActiveVizSession() {
    if (!activeSession) return;

    vizIsPlaying = false;
    clearInterval(vizInterval);
    updatePlayPauseButtonUI();

    const editor = document.getElementById('viz-code-editor');
    if (editor) {
        editor.value = activeSession.code;
        syncEditorLineNumbers();
    }

    updateBookmarkIconUI();
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

// Toggle Tutor Settings panel
function toggleAITutorSettings() {
    const dropdown = document.getElementById('viz-ai-settings-dropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
    }
}

// ==========================================
// INTERACTIVE ENGINE ACTIONS & RENDERERS
// ==========================================
function renderCurrentStep() {
    if (!activeSession) return;

    let steps = [];
    if (activeSession.category === "algorithms" && activeSession.topic === "bubble_sort") {
        steps = VIZ_CATALOG.algorithms.topics.bubble_sort.steps;
    } else if (activeSession.category === "structures" && activeSession.topic === "array") {
        steps = VIZ_CATALOG.structures.topics.array.steps;
    } else if (activeSession.category === "structures" && activeSession.topic === "linked_list") {
        steps = VIZ_CATALOG.structures.topics.linked_list.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "python") {
        steps = VIZ_CATALOG.languages.topics.python.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "c") {
        steps = VIZ_CATALOG.languages.topics.c.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "cpp") {
        steps = VIZ_CATALOG.languages.topics.cpp.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "java") {
        steps = VIZ_CATALOG.languages.topics.java.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "javascript") {
        steps = VIZ_CATALOG.languages.topics.javascript.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "typescript") {
        steps = VIZ_CATALOG.languages.topics.typescript.steps;
    } else if (activeSession.category === "sql" && activeSession.topic === "select") {
        steps = VIZ_CATALOG.sql.topics.select.steps;
    } else if (activeSession.category === "webdev" && activeSession.topic === "boxmodel") {
        steps = VIZ_CATALOG.webdev.topics.boxmodel.steps;
    } else {
        steps = generateDynamicSteps(activeSession.category, activeSession.topic, activeSession.code);
    }

    const totalSteps = steps.length;
    let stepIdx = activeSession.currentStep;
    if (stepIdx >= totalSteps) stepIdx = totalSteps - 1;
    if (stepIdx < 0) stepIdx = 0;
    activeSession.currentStep = stepIdx;

    const step = steps[stepIdx];

    // Gutter Line coloring
    const gutterDivs = document.querySelectorAll('#viz-line-gutter div');
    gutterDivs.forEach(div => {
        const line = parseInt(div.getAttribute('data-line'), 10);
        if (line === step.line) {
            // Blue for current executing line
            div.style.background = '#3b82f6';
            div.style.color = '#ffffff';
            div.style.boxShadow = '0 0 6px rgba(59,130,246,0.3)';
        } else if (line < step.line) {
            // Gray for executed lines
            div.style.background = '#f3f4f6';
            div.style.color = '#9ca3af';
        } else {
            div.style.background = 'transparent';
            div.style.color = 'var(--text-muted)';
        }
    });

    // Update timelines slider
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

    // Complexity mapping
    const bestC = document.getElementById('viz-best-case');
    const avgC = document.getElementById('viz-avg-case');
    const worstC = document.getElementById('viz-worst-case');
    const spaceC = document.getElementById('viz-space-case');
    
    const defaults = VIZ_COMPLEXITIES[activeSession.topic] || { best: "O(1)", avg: "O(n)", worst: "O(n)", space: "O(1)" };
    if (bestC) bestC.innerText = defaults.best;
    if (avgC) avgC.innerText = defaults.avg;
    if (worstC) worstC.innerText = defaults.worst;
    if (spaceC) spaceC.innerText = defaults.space;

    // AI Tutor Guide explanation styles
    const explanation = document.getElementById('viz-explanation-panel');
    if (explanation) {
        let textExplanation = step.explain;
        let analogyText = "Analogy: Sequential compiles resemble checking checklist items off step-by-step.";
        let mistakeText = "Common Mistake: Assigning incorrect data types to pointer address scopes.";
        
        if (learningMode === "beginner") {
            analogyText = "Analogy: Imagine baking cookies step-by-step. The variables are ingredients you set down on the counter.";
        }

        explanation.innerHTML = `
            <div style="font-size:0.9rem; line-height:1.5; color:var(--text-body); margin-bottom:8px;">${textExplanation}</div>
            <div style="font-size:0.8rem; color:#f59e0b; font-style:italic; margin-bottom:10px;">💡 ${analogyText}</div>
            
            <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px; border-top:1px dashed var(--border-color); padding-top:8px;">Common Mistake</div>
            <div style="font-size:0.8rem; color:#ef4444; margin-bottom:10px;">⚠️ ${mistakeText}</div>
            
            <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px; border-top:1px dashed var(--border-color); padding-top:8px;">Interview Insights</div>
            <div style="font-size:0.8rem; color:var(--text-body);">Always keep space complexity down to O(1) by reusing local variable stack assignments.</div>
        `;
    }

    // Dynamic Variables Inspect mapping
    const variablesGrid = document.getElementById('viz-variables-inspect');
    if (variablesGrid) {
        variablesGrid.innerHTML = '';
        Object.keys(step.vars).forEach(vKey => {
            if (vKey === "prev_val" || vKey === "type" || vKey === "scope") return;
            
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.fontSize = '11.5px';
            row.style.padding = '4px 0';
            row.style.borderBottom = '1px solid rgba(0,0,0,0.03)';
            
            // Orange text variable
            row.innerHTML = `
                <span style="font-family:monospace; color:#f97316; font-weight:600;">${vKey}</span>
                <span style="font-family:monospace; color:var(--text-body);">${step.vars[vKey]}</span>
            `;
            variablesGrid.appendChild(row);
        });
    }

    // Dynamic Memory Stack mapping
    const memoryStack = document.getElementById('viz-memory-stack');
    if (memoryStack) {
        memoryStack.innerHTML = '';
        step.mem.forEach(m => {
            const block = document.createElement('div');
            block.style.padding = '4px 8px';
            block.style.fontSize = '11px';
            block.style.fontFamily = 'monospace';
            // Teal memory blocks
            block.style.background = 'rgba(20,184,166,0.05)';
            block.style.borderLeft = '3px solid #14b8a6';
            block.style.color = 'var(--text-body)';
            block.style.marginBottom = '3px';
            block.innerText = m;
            memoryStack.appendChild(block);
        });
    }

    renderInteractiveCanvas(step.action, activeSession.category, activeSession.topic);

    // Save completed topics list
    const normalizedName = activeSession.name.toLowerCase();
    if (stepIdx === totalSteps - 1 && !completedTopics.includes(normalizedName)) {
        completedTopics.push(normalizedName);
        saveVizSessions();
    }
}

function renderInteractiveCanvas(action, category, topic) {
    const canvas = document.getElementById('viz-display-area');
    if (!canvas) return;

    canvas.innerHTML = '';
    canvas.style.display = 'flex';
    canvas.style.alignItems = 'center';
    canvas.style.justifyContent = 'center';
    canvas.style.minHeight = '280px';
    canvas.style.padding = '20px';

    if (action.type === "init" || action.type === "eval" || action.type === "complete" || action.type === "array_state") {
        const arr = action.data || [];
        const activeIdx = action.active || [];
        
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.gap = '10px';
        wrapper.style.flexWrap = 'wrap';
        wrapper.style.justifyContent = 'center';

        arr.forEach((val, idx) => {
            const block = document.createElement('div');
            block.style.width = '50px';
            block.style.height = '50px';
            block.style.display = 'flex';
            block.style.flexDirection = 'column';
            block.style.alignItems = 'center';
            block.style.justifyContent = 'center';
            block.style.borderRadius = '8px';
            block.style.border = '1px solid var(--border-color)';
            block.style.fontSize = '1rem';
            block.style.fontWeight = '700';
            block.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            block.style.boxShadow = '0 4px 10px rgba(0,0,0,0.03)';
            block.style.color = '#ffffff';

            const isActive = activeIdx.includes(idx);
            if (isActive) {
                if (action.highlight) {
                    block.style.background = '#ef4444'; // Red for swaps
                    block.style.transform = 'scale(1.15) translateY(-8px)';
                    block.style.boxShadow = '0 10px 20px rgba(239, 68, 68, 0.3)';
                } else {
                    block.style.background = '#a855f7'; // Purple for comparisons
                    block.style.transform = 'scale(1.1) translateY(-4px)';
                    block.style.boxShadow = '0 8px 16px rgba(168, 85, 247, 0.3)';
                }
            } else if (action.complete) {
                block.style.background = '#10b981'; // Green for completed steps
                block.style.borderColor = 'rgba(16, 185, 129, 0.4)';
            } else {
                block.style.background = 'rgba(255, 255, 255, 0.05)';
                block.style.color = 'var(--text-body)';
            }

            block.innerHTML = `
                <div style="font-size:0.7rem; color:${isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'}; margin-bottom:2px;">[${idx}]</div>
                <div>${val}</div>
            `;
            wrapper.appendChild(block);
        });
        canvas.appendChild(wrapper);
    }
    else if (action.type === "ll_state") {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '12px';
        wrapper.style.flexWrap = 'wrap';

        action.list.forEach((node, idx) => {
            const block = document.createElement('div');
            block.style.display = 'flex';
            block.style.alignItems = 'center';
            block.style.border = '1px solid var(--border-color)';
            block.style.borderRadius = '8px';
            
            // Cyan pointer
            block.style.background = action.active.includes(node.addr) ? '#06b6d4' : 'rgba(255,255,255,0.04)';
            block.style.boxShadow = '0 4px 10px rgba(0,0,0,0.03)';
            block.style.padding = '6px 10px';
            block.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            block.style.color = action.active.includes(node.addr) ? '#ffffff' : 'var(--text-body)';

            block.innerHTML = `
                <div style="font-family:monospace; text-align:left; font-size:11px;">
                    <div style="font-size:0.65rem; color:${action.active.includes(node.addr) ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'};">${node.addr}</div>
                    <div style="font-size:0.85rem; font-weight:700; margin:1px 0;">val: ${node.val}</div>
                    <div style="font-size:0.65rem; color:${action.active.includes(node.addr) ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'};">next: ${node.next}</div>
                </div>
            `;
            wrapper.appendChild(block);

            if (idx < action.list.length - 1) {
                const arrow = document.createElement('div');
                arrow.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#06b6d4" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
                wrapper.appendChild(arrow);
            }
        });
        canvas.appendChild(wrapper);
    }
    else if (action.type === "sql_table" || action.type === "sql_result") {
        const wrapper = document.createElement('div');
        wrapper.style.width = '100%';
        wrapper.style.maxWidth = '450px';
        wrapper.style.background = 'var(--bg-container)';
        wrapper.style.border = '1px solid var(--border-color)';
        wrapper.style.borderRadius = '8px';
        wrapper.style.overflow = 'hidden';

        let headers = Object.keys(action.rows[0] || {}).filter(k => k !== "filter");
        let headerHtml = headers.map(h => `<th style="padding:8px 12px; text-align:left; background:var(--bg-secondary); border-bottom:1px solid var(--border-color); font-size:0.7rem; text-transform:uppercase; font-weight:700; color:var(--text-muted);">${h}</th>`).join('');
        
        let rowsHtml = action.rows.map((r, idx) => {
            const isActive = action.active && action.active.includes(idx);
            let rowBg = 'transparent';
            if (isActive) {
                rowBg = 'rgba(59, 130, 246, 0.1)';
            } else if (r.filter === "pass") {
                rowBg = 'rgba(16, 185, 129, 0.05)';
            } else if (r.filter === "fail") {
                rowBg = 'rgba(239, 68, 68, 0.05)';
            }
            let cells = headers.map(h => `<td style="padding:8px 12px; border-bottom:1px solid var(--border-color); font-size:0.8rem; color:${isActive ? 'var(--color-executing)' : 'var(--text-body)'}; font-family:monospace;">${r[h]}</td>`).join('');
            return `<tr style="background:${rowBg};">${cells}</tr>`;
        }).join('');

        wrapper.innerHTML = `
            <table style="width:100%; border-collapse:collapse;">
                <thead><tr>${headerHtml}</tr></thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        `;
        canvas.appendChild(wrapper);
    }
    else if (action.type === "box_model") {
        const layers = action.layers;
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'center';
        wrapper.style.width = '100%';
        wrapper.style.maxWidth = '250px';

        const marginBox = document.createElement('div');
        marginBox.style.width = '100%';
        marginBox.style.padding = layers.margin !== "0px" ? "12px" : "4px";
        marginBox.style.border = '1px dashed var(--border-color)';
        marginBox.style.borderRadius = '8px';
        marginBox.style.background = 'rgba(249, 115, 22, 0.02)';
        marginBox.style.textAlign = 'center';
        marginBox.innerHTML = `<span style="font-size:0.6rem; color:var(--text-muted); position:absolute; top:1px; left:6px;">margin: ${layers.margin}</span>`;

        const borderBox = document.createElement('div');
        borderBox.style.padding = layers.border !== "0px" ? "4px" : "2px";
        borderBox.style.background = 'var(--primary-color)';
        borderBox.style.borderRadius = '6px';
        borderBox.style.position = 'relative';
        borderBox.innerHTML = `<span style="font-size:0.6rem; color:#ffffff; position:absolute; top:0; left:4px;">border: ${layers.border}</span>`;

        const paddingBox = document.createElement('div');
        paddingBox.style.padding = layers.padding !== "0px" ? "10px" : "2px";
        paddingBox.style.background = 'rgba(16, 185, 129, 0.1)';
        paddingBox.style.borderRadius = '4px';
        paddingBox.style.border = '1px solid rgba(16, 185, 129, 0.2)';
        paddingBox.style.position = 'relative';
        paddingBox.innerHTML = `<span style="font-size:0.6rem; color:#10b981; position:absolute; top:0; left:4px;">padding: ${layers.padding}</span>`;

        const contentBox = document.createElement('div');
        contentBox.style.width = layers.content;
        contentBox.style.height = '35px';
        contentBox.style.background = 'var(--bg-container)';
        contentBox.style.border = '1px solid var(--border-color)';
        contentBox.style.borderRadius = '4px';
        contentBox.style.display = 'flex';
        contentBox.style.alignItems = 'center';
        contentBox.style.justifyContent = 'center';
        contentBox.style.fontSize = '0.75rem';
        contentBox.style.fontWeight = '700';
        contentBox.innerText = `content: ${layers.content}`;

        paddingBox.appendChild(contentBox);
        borderBox.appendChild(paddingBox);
        marginBox.appendChild(borderBox);
        wrapper.appendChild(marginBox);
        canvas.appendChild(wrapper);
    }
    else {
        const tr = document.createElement('div');
        tr.style.fontSize = '1.3rem';
        tr.style.color = 'var(--text-body)';
        tr.innerText = `Visualizing operation trace...`;
        canvas.appendChild(tr);
    }
}

// Playback Speed controls
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
    if (activeSession.category === "algorithms" && activeSession.topic === "bubble_sort") {
        steps = VIZ_CATALOG.algorithms.topics.bubble_sort.steps;
    } else if (activeSession.category === "structures" && activeSession.topic === "array") {
        steps = VIZ_CATALOG.structures.topics.array.steps;
    } else if (activeSession.category === "structures" && activeSession.topic === "linked_list") {
        steps = VIZ_CATALOG.structures.topics.linked_list.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "python") {
        steps = VIZ_CATALOG.languages.topics.python.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "c") {
        steps = VIZ_CATALOG.languages.topics.c.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "cpp") {
        steps = VIZ_CATALOG.languages.topics.cpp.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "java") {
        steps = VIZ_CATALOG.languages.topics.java.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "javascript") {
        steps = VIZ_CATALOG.languages.topics.javascript.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "typescript") {
        steps = VIZ_CATALOG.languages.topics.typescript.steps;
    } else if (activeSession.category === "sql" && activeSession.topic === "select") {
        steps = VIZ_CATALOG.sql.topics.select.steps;
    } else if (activeSession.category === "webdev" && activeSession.topic === "boxmodel") {
        steps = VIZ_CATALOG.webdev.topics.boxmodel.steps;
    } else {
        steps = generateDynamicSteps(activeSession.category, activeSession.topic, activeSession.code);
    }
    
    const totalSteps = steps.length;

    if (vizIsPlaying) {
        clearInterval(vizInterval);
        vizIsPlaying = false;
    } else {
        vizIsPlaying = true;
        practiceRuns++;

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
    if (activeSession.category === "algorithms" && activeSession.topic === "bubble_sort") {
        steps = VIZ_CATALOG.algorithms.topics.bubble_sort.steps;
    } else if (activeSession.category === "structures" && activeSession.topic === "array") {
        steps = VIZ_CATALOG.structures.topics.array.steps;
    } else if (activeSession.category === "structures" && activeSession.topic === "linked_list") {
        steps = VIZ_CATALOG.structures.topics.linked_list.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "python") {
        steps = VIZ_CATALOG.languages.topics.python.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "c") {
        steps = VIZ_CATALOG.languages.topics.c.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "cpp") {
        steps = VIZ_CATALOG.languages.topics.cpp.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "java") {
        steps = VIZ_CATALOG.languages.topics.java.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "javascript") {
        steps = VIZ_CATALOG.languages.topics.javascript.steps;
    } else if (activeSession.category === "languages" && activeSession.topic === "typescript") {
        steps = VIZ_CATALOG.languages.topics.typescript.steps;
    } else if (activeSession.category === "sql" && activeSession.topic === "select") {
        steps = VIZ_CATALOG.sql.topics.select.steps;
    } else if (activeSession.category === "webdev" && activeSession.topic === "boxmodel") {
        steps = VIZ_CATALOG.webdev.topics.boxmodel.steps;
    } else {
        steps = generateDynamicSteps(activeSession.category, activeSession.topic, activeSession.code);
    }

    if (activeSession.currentStep < steps.length - 1) {
        activeSession.currentStep++;
        renderCurrentStep();
    }
}

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
    const display = document.getElementById('viz-speed-display');
    const displayLbl = document.getElementById('viz-speed-display-lbl');
    if (display) display.innerText = `${vizSpeed}ms`;
    if (displayLbl) displayLbl.innerText = `${vizSpeed}ms`;

    if (vizIsPlaying) {
        clearInterval(vizInterval);
        
        let steps = [];
        if (activeSession.category === "algorithms" && activeSession.topic === "bubble_sort") {
            steps = VIZ_CATALOG.algorithms.topics.bubble_sort.steps;
        } else if (activeSession.category === "structures" && activeSession.topic === "array") {
            steps = VIZ_CATALOG.structures.topics.array.steps;
        } else if (activeSession.category === "structures" && activeSession.topic === "linked_list") {
            steps = VIZ_CATALOG.structures.topics.linked_list.steps;
        } else if (activeSession.category === "languages" && activeSession.topic === "python") {
            steps = VIZ_CATALOG.languages.topics.python.steps;
        } else if (activeSession.category === "languages" && activeSession.topic === "c") {
            steps = VIZ_CATALOG.languages.topics.c.steps;
        } else if (activeSession.category === "languages" && activeSession.topic === "cpp") {
            steps = VIZ_CATALOG.languages.topics.cpp.steps;
        } else if (activeSession.category === "languages" && activeSession.topic === "java") {
            steps = VIZ_CATALOG.languages.topics.java.steps;
        } else if (activeSession.category === "languages" && activeSession.topic === "javascript") {
            steps = VIZ_CATALOG.languages.topics.javascript.steps;
        } else if (activeSession.category === "languages" && activeSession.topic === "typescript") {
            steps = VIZ_CATALOG.languages.topics.typescript.steps;
        } else if (activeSession.category === "sql" && activeSession.topic === "select") {
            steps = VIZ_CATALOG.sql.topics.select.steps;
        } else if (activeSession.category === "webdev" && activeSession.topic === "boxmodel") {
            steps = VIZ_CATALOG.webdev.topics.boxmodel.steps;
        } else {
            steps = generateDynamicSteps(activeSession.category, activeSession.topic, activeSession.code);
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

// Learning options modifiers
function setLearningMode(mode) {
    learningMode = mode;
    const speedSlider = document.getElementById('viz-speed-slider');
    
    if (mode === "beginner") {
        vizSpeed = 1000;
        if (speedSlider) speedSlider.value = 1000;
    } else if (mode === "intermediate") {
        vizSpeed = 500;
        if (speedSlider) speedSlider.value = 500;
    } else if (mode === "expert") {
        vizSpeed = 150;
        if (speedSlider) speedSlider.value = 150;
    }
    setVizSpeed(vizSpeed);
    renderCurrentStep();
}

function setAITutorLevel(level) {
    aiTutorLevel = level;
    renderCurrentStep();
}

// Auto dynamic steps generator fallback
function generateDynamicSteps(category, topic, code) {
    const steps = [];
    const lines = code.split('\n');

    let currentArray = [12, 24, 8, 19, 30];
    let currentList = [
        { val: 10, addr: "0x1000", next: "0x2000" },
        { val: 20, addr: "0x2000", next: "0x3000" },
        { val: 30, addr: "0x3000", next: "NULL" }
    ];
    let currentSQLRows = [
        { name: "Alice", dept: "CSE", grade: "A" },
        { name: "Bob", dept: "ECE", grade: "B" },
        { name: "Charlie", dept: "CSE", grade: "A" }
    ];

    lines.forEach((lineText, idx) => {
        const lineNum = idx + 1;
        const trimmed = lineText.trim();
        if (!trimmed) return;

        const step = {
            line: lineNum,
            vars: {
                name: trimmed.substring(0, 8),
                val: trimmed.substring(0, 10),
                prev_val: "none",
                type: "string",
                scope: "local"
            },
            mem: [`Instruction pointer -> line ${lineNum}`],
            explain: `Running instruction on line ${lineNum}: \`${trimmed}\`. Loading state variables...`,
            action: { type: "generic" }
        };

        if (category === "languages" || category === "java" || category === "python" || category === "c" || category === "cpp" || category === "javascript" || category === "typescript") {
            step.vars.type = "compiler_node";
            step.vars.scope = "stack_frame";
            step.explain = `In language compiler runtime environment, parsing variables into call stack.`;
            step.action = { type: "mem_set", addr: `0x00${lineNum}`, val: trimmed.substring(0, 10) };
        }
        else if (category === "structures") {
            if (topic === "array" || topic === "strings" || topic === "arrays") {
                step.vars.type = "array_index";
                step.explain = `Processing array/string elements at index ${idx}. Accessing memory address directly.`;
                step.action = { type: "array_state", data: currentArray, active: [idx % 5] };
            } else {
                step.vars.type = "pointer";
                step.explain = `Accessing linked structure node at pointer index 0x${lineNum}000.`;
                step.action = { type: "ll_state", list: currentList, active: [`0x1000`] };
            }
        }
        else if (category === "algorithms") {
            step.vars.type = "algorithm_state";
            step.explain = `Algorithm checks elements sequentially or splits intervals. Evaluating target values...`;
            step.action = { type: "array_state", data: currentArray, active: [idx % 5] };
        }
        else if (category === "sql") {
            step.vars.type = "table_row";
            step.explain = `SQL executor parses queries, filters row items by WHERE filters, and projects SELECT columns.`;
            step.action = { type: "sql_table", rows: currentSQLRows, active: [idx % 3] };
        }
        else if (category === "webdev" || category === "css" || category === "html") {
            step.vars.type = "dom_node";
            step.explain = `Browser layouts flex direction alignments, adjusts grid spacing gaps, or triggers async events.`;
            step.action = { type: "box_model", layers: { content: "120px", padding: `${idx * 4}px`, border: "2px", margin: "10px" } };
        }

        steps.push(step);
    });

    if (steps.length === 0) {
        steps.push({
            line: 1,
            vars: { status: "Empty", prev_val: "none", type: "string", scope: "none" },
            mem: [],
            explain: "Empty source code inputted. Please write code to visualize.",
            action: { type: "generic" }
        });
    }

    return steps;
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

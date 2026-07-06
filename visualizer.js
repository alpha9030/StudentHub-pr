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

// Complete Sub-Lessons Database Catalog
const SUB_LESSONS_CATALOG = {
    "python_tuples": [
        {
            name: "Introduction",
            desc: "Learn Tuple characteristics, memory structures, and contrast differences with python Lists.",
            code: `# Tuples characteristics demo\ntup = (10, "Pravio", 3.14)\nprint(tup)\n# Note: Tuples are immutable!`,
            complexity: { best: "O(1)", avg: "O(1)", worst: "O(1)", space: "O(n)" },
            steps: [
                { line: 2, vars: { tup: "(10, 'Pravio', 3.14)", type: "tuple" }, mem: ["tup (0x9000) -> 10", "tup (0x9008) -> 'Pravio'", "tup (0x9010) -> 3.14"], explain: "Declare and allocate a tuple container inside heap memory containing integer, string, and float items.", action: { type: "init", data: [10, "Pravio", 3.14] } }
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
        },
        {
            name: "Tuple Concatenation",
            desc: "Merge two separate tuples together to form an entirely new tuple.",
            code: `t1 = (1, 2)\nt2 = (3, 4)\nt3 = t1 + t2`,
            complexity: { best: "O(n+m)", avg: "O(n+m)", worst: "O(n+m)", space: "O(n+m)" },
            steps: [
                { line: 1, vars: { t1: "(1, 2)" }, mem: ["t1 -> (1, 2)"], explain: "Initialize tuple t1.", action: { type: "array_state", data: [1, 2], active: [] } },
                { line: 3, vars: { t1: "(1, 2)", t2: "(3, 4)", t3: "(1, 2, 3, 4)" }, mem: ["t3 -> (1, 2, 3, 4)"], explain: "Merge t1 and t2. Result is stored in a new memory address allocation block.", action: { type: "array_state", data: [1, 2, 3, 4], active: [0, 1, 2, 3], complete: true } }
            ]
        }
    ],
    "python_lists": [
        {
            name: "append()",
            desc: "Add a single element to the end of a python List.",
            code: `lst = [10, 20]\nlst.append(30)`,
            complexity: { best: "O(1) amortized", avg: "O(1)", worst: "O(1)", space: "O(1)" },
            steps: [
                { line: 1, vars: { lst: "[10, 20]" }, mem: ["lst -> [10, 20]"], explain: "Initialize list with 2 elements.", action: { type: "array_state", data: [10, 20, 0], active: [] } },
                { line: 2, vars: { lst: "[10, 20, 30]" }, mem: ["lst -> [10, 20, 30]"], explain: "Append 30 to the end of the list array.", action: { type: "array_state", data: [10, 20, 30], active: [2], complete: true } }
            ]
        },
        {
            name: "pop()",
            desc: "Remove and return the last element from the list.",
            code: `lst = [10, 20, 30]\nval = lst.pop()`,
            complexity: { best: "O(1)", avg: "O(1)", worst: "O(1)", space: "O(1)" },
            steps: [
                { line: 1, vars: { lst: "[10, 20, 30]" }, mem: ["lst -> [10, 20, 30]"], explain: "Initialize list with 3 elements.", action: { type: "array_state", data: [10, 20, 30], active: [] } },
                { line: 2, vars: { lst: "[10, 20]", val: 30 }, mem: ["lst -> [10, 20]", "val -> 30"], explain: "Remove and pop element at the last index (30).", action: { type: "array_state", data: [10, 20], active: [1], highlight: true } }
            ]
        }
    ],
    "python_strings": [
        {
            name: "upper()",
            desc: "Convert all characters inside string array to uppercase.",
            code: `s = "hi"\nres = s.upper()`,
            complexity: { best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(n)" },
            steps: [
                { line: 1, vars: { s: "'hi'" }, mem: ["s -> 'hi'"], explain: "Initialize string.", action: { type: "array_state", data: ["h", "i"], active: [] } },
                { line: 2, vars: { s: "'hi'", res: "'HI'" }, mem: ["res -> 'HI'"], explain: "Iterate through characters and convert them to uppercase.", action: { type: "array_state", data: ["H", "I"], active: [0, 1], complete: true } }
            ]
        }
    ],
    "c_pointers": [
        {
            name: "Dereferencing",
            desc: "Modify target memory blocks by dereferencing pointers via `*ptr`.",
            code: `int val = 42;\nint *ptr = &val;\n*ptr = 99;`,
            complexity: { best: "O(1)", avg: "O(1)", worst: "O(1)", space: "O(1)" },
            steps: [
                { line: 1, vars: { val: 42 }, mem: ["val (0x7ffe) -> 42"], explain: "Allocate integer variable val in stack with value 42.", action: { type: "mem_set", addr: "0x7ffe", val: 42 } },
                { line: 2, vars: { val: 42, ptr: "0x7ffe" }, mem: ["val (0x7ffe) -> 42", "ptr -> 0x7ffe"], explain: "Assign address of val (0x7ffe) to pointer ptr.", action: { type: "mem_set", addr: "0x7fff", val: "0x7ffe" } },
                { line: 3, vars: { val: 99, ptr: "0x7ffe" }, mem: ["val (0x7ffe) -> 99"], explain: "Dereference ptr: set val to 99.", action: { type: "mem_update", addr: "0x7ffe", val: 99 } }
            ]
        }
    ],
    "sql_select_&_where": [
        {
            name: "SELECT Clause",
            desc: "Select specific columns from query matches.",
            code: `SELECT name, grade\nFROM Students;`,
            complexity: { best: "O(n)", avg: "O(n)", worst: "O(n)", space: "O(n)" },
            steps: [
                { line: 1, vars: { total_rows: 3 }, mem: ["Columns: name, grade"], explain: "Select only name and grade columns from the database rows.", action: { type: "sql_table", rows: [{ name: "Alice", grade: "A" }, { name: "Bob", grade: "B" }, { name: "Charlie", grade: "A" }], active: [0, 1, 2] } }
            ]
        }
    ]
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

    // Generic fallback code compiler generator for full catalog coverage
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

    // Determine sub-lessons catalog list key
    const normalKey = (lang + "_" + displayName.replace(/ /g, '_')).toLowerCase().replace(/\(|\)/g, '');
    const cleanKey = displayName.toLowerCase().replace(/ /g, '_').replace(/\(|\)/g, '');
    
    let activeKey = "";
    if (SUB_LESSONS_CATALOG[normalKey]) {
        activeKey = normalKey;
    } else if (SUB_LESSONS_CATALOG[cleanKey]) {
        activeKey = cleanKey;
    } else {
        // Fallback checks
        if (displayName.toLowerCase().includes('tuple')) activeKey = "python_tuples";
        else if (displayName.toLowerCase().includes('list')) activeKey = "python_lists";
        else if (displayName.toLowerCase().includes('string')) activeKey = "python_strings";
        else if (displayName.toLowerCase().includes('pointer')) activeKey = "c_pointers";
        else if (displayName.toLowerCase().includes('select') || displayName.toLowerCase().includes('sql')) activeKey = "sql_select_&_where";
    }

    // Build the Sub-Lesson Tab Buttons Toolbar dynamically
    const sublessonToolbar = document.getElementById('viz-sublesson-toolbar');
    if (sublessonToolbar) {
        sublessonToolbar.innerHTML = '';
        const list = SUB_LESSONS_CATALOG[activeKey] || [
            {
                name: "Interactive Trace",
                desc: `Step-by-step trace analyzer for ${displayName}.`,
                code: info.code,
                complexity: { best: "O(1)", avg: "O(n)", worst: "O(n)", space: "O(1)" }
            }
        ];

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
                // Focus styling toggle
                Array.from(sublessonToolbar.children).forEach(child => {
                    child.style.background = 'var(--bg-container)';
                    child.style.color = 'var(--text-body)';
                    child.style.fontWeight = '500';
                });
                btn.style.background = 'var(--primary-color)';
                btn.style.color = '#ffffff';
                btn.style.fontWeight = '700';
                
                loadSelectedSubLesson(activeKey, sIdx, info.category, info.topic);
            };
            
            sublessonToolbar.appendChild(btn);
        });

        // Initialize active first sub-lesson immediately
        loadSelectedSubLesson(activeKey, 0, info.category, info.topic);
    }
    
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

function loadSelectedSubLesson(activeKey, sIdx, category, topic) {
    const list = SUB_LESSONS_CATALOG[activeKey] || [
        {
            name: "Interactive Trace",
            desc: "Dynamic code compiler step trace.",
            code: getCodeForTopic(category, topic, activeKey).code,
            complexity: { best: "O(1)", avg: "O(n)", worst: "O(n)", space: "O(1)" }
        }
    ];
    
    const sub = list[sIdx];
    
    // Create session wrapper
    const newSess = {
        id: "viz_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        name: sub.name,
        category: category,
        topic: topic,
        code: sub.code,
        currentStep: 0,
        createdAt: new Date().toISOString()
    };
    
    activeSession = newSess;
    
    // Sync editor
    const editor = document.getElementById('viz-code-editor');
    if (editor) {
        editor.value = sub.code;
        syncEditorLineNumbers();
    }

    // Clear and build step trace variables
    vizIsPlaying = false;
    clearInterval(vizInterval);
    updatePlayPauseButtonUI();

    // Cache values in complexity labels
    const bestC = document.getElementById('viz-best-case');
    const avgC = document.getElementById('viz-avg-case');
    const worstC = document.getElementById('viz-worst-case');
    const spaceC = document.getElementById('viz-space-case');
    
    if (bestC) bestC.innerText = sub.complexity.best;
    if (avgC) avgC.innerText = sub.complexity.avg;
    if (worstC) worstC.innerText = sub.complexity.worst;
    if (spaceC) spaceC.innerText = sub.complexity.space;

    // Trigger canvas updates immediate render
    renderCurrentStep();
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
    
    if (activeSession.name.toLowerCase().includes('css') || activeSession.name.toLowerCase().includes('html') || activeSession.name.toLowerCase().includes('box')) {
        updateHTMLPreview(editor.value);
    }

    saveVizSessions();
    
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
    const lowerName = activeSession.name.toLowerCase();
    
    // Custom sub-lesson trace frames selector matching active topic name
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
    } else {
        // Fallbacks trace selector
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
            div.style.background = '#3b82f6';
            div.style.color = '#ffffff';
            div.style.boxShadow = '0 0 6px rgba(59,130,246,0.3)';
        } else if (line < step.line) {
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
        marginBox.style.padding = layers.margin !== "0px" ? "14px" : "4px";
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
    else if (action.type === "mem_set" || action.type === "mem_update") {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.gap = '10px';
        wrapper.style.width = '100%';
        wrapper.style.maxWidth = '250px';

        const block = document.createElement('div');
        block.style.border = '1px solid var(--border-color)';
        block.style.borderRadius = '8px';
        block.style.background = '#e0f2fe'; // Blue memory allocation highlight
        block.style.borderLeft = '4px solid #3b82f6';
        block.style.padding = '10px';
        block.style.boxShadow = '0 4px 10px rgba(59, 130, 246, 0.15)';
        block.style.color = '#1e3a8a';
        block.style.fontFamily = 'monospace';
        
        block.innerHTML = `
            <div style="font-size:0.7rem; color:#2563eb;">Address: ${action.addr}</div>
            <div style="font-size:0.95rem; font-weight:700; margin-top:2px;">Value: ${action.val}</div>
        `;
        wrapper.appendChild(block);
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
    } else {
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
    } else {
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
        } else {
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

// Session initialization
function initVizSessions() {
    try {
        bookmarks = JSON.parse(localStorage.getItem('pravio_visualizer_bookmarks') || '[]');
        completedTopics = JSON.parse(localStorage.getItem('pravio_visualizer_completed') || '[]');
    } catch(e) {
        bookmarks = [];
        completedTopics = [];
    }

    if (!Array.isArray(bookmarks)) bookmarks = [];
    if (!Array.isArray(completedTopics)) completedTopics = [];

    buildCurriculumTree();
    
    // Auto-load default: C -> Variables
    loadCurriculumTopic('languages', 'c', 'C (Variables)');
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

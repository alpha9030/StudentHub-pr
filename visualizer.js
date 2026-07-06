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
    { id: "c", title: "C Studio", desc: "Master low-level compilation, memory allocations, pointer dereferencing, and structures.", category: "languages", lessons: 18, time: "10 hrs", diff: "Intermediate", icon: "💻 C", objectives: ["Pointers & addresses", "Stack/Heap allocation", "Structures & Unions"] },
    { id: "cpp", title: "C++ Studio", desc: "Object-oriented software development with classes, inheritance, polymorphism, and STL containers.", category: "languages", lessons: 15, time: "12 hrs", diff: "Intermediate", icon: "💻 C++", objectives: ["OOP Paradigms", "Templates & Generic code", "STL Data structures"] },
    { id: "java", title: "Java Studio", desc: "Write scalable cross-platform software. Memory management, collections, and multi-threading.", category: "languages", lessons: 32, time: "18 hrs", diff: "Intermediate", icon: "☕ Java", objectives: ["JVM & Garbage sweep", "Interface inheritance", "Concurrency threads"] },
    { id: "python", title: "Python Studio", desc: "Syntax simplicity with list comprehensions, decorators, generators, and data analytics tools.", category: "languages", lessons: 22, time: "8 hrs", diff: "Beginner", icon: "🐍 Python", objectives: ["Variables & Loops", "Data Science libs", "Decorators & closures"] },
    { id: "javascript", title: "JavaScript Studio", desc: "Web client interactivity. Prototypes, event loops, call stacks, and promise pipelines.", category: "languages", lessons: 16, time: "7 hrs", diff: "Beginner", icon: "⚡ JavaScript", objectives: ["Closures scopes", "Event Loop mechanics", "Async Await threads"] },
    { id: "typescript", title: "TypeScript Studio", desc: "Enforce strict compile-time types. Structural interfaces, type annotations, and enums.", category: "languages", lessons: 12, time: "6 hrs", diff: "Intermediate", icon: "🟦 TS", objectives: ["Interface specs", "Strict types", "Generics structures"] },
    { id: "html", title: "HTML Studio", desc: "Semantic structural documents, SEO essentials, accessibility layouts, and form validations.", category: "web", lessons: 10, time: "3 hrs", diff: "Beginner", icon: "🌐 HTML", objectives: ["Semantic tags", "SEO hierarchies", "Form validation DOM"] },
    { id: "css", title: "CSS Studio", desc: "Transform layouts. Box model sizing, Flexbox grids, media queries, and transition animations.", category: "web", lessons: 12, time: "5 hrs", diff: "Beginner", icon: "🎨 CSS", objectives: ["Box model margin/border", "Flexbox layouts", "Glow keyframe transition"] },
    { id: "sql", title: "SQL Studio", desc: "Relational database operations. Aggregate filters, inner/outer joins, indexing, and ACID constraints.", category: "cs", lessons: 14, time: "6 hrs", diff: "Beginner", icon: "🗄 SQL", objectives: ["SELECT projection WHERE", "GROUP BY aggregates", "JOIN row matching"] },
    { id: "php", title: "PHP Studio", desc: "Backend web architecture, session storage, cookie authorizations, and server integrations.", category: "web", lessons: 8, time: "4 hrs", diff: "Intermediate", icon: "🐘 PHP", objectives: ["Sessions & Cookies", "Server routing", "MySQL integration"] },
    { id: "go", title: "Go Studio", desc: "Build scalable concurrent servers. Goroutines concurrency, channel pipelines, and structs.", category: "languages", lessons: 11, time: "6 hrs", diff: "Advanced", icon: "🐹 Go", objectives: ["Goroutine concurrency", "Channel messages", "Struct definitions"] },
    { id: "rust", title: "Rust Studio", desc: "Compile-time memory safety. Variable ownership, reference borrowing, and lifetime scopes.", category: "languages", lessons: 14, time: "10 hrs", diff: "Advanced", icon: "🦀 Rust", objectives: ["Ownership scopes", "Reference borrowing", "Lifetimes checking"] },
    { id: "kotlin", title: "Kotlin Studio", desc: "Null-safe Android mobile development. Coroutines threads, lambdas, and class properties.", category: "languages", lessons: 10, time: "6 hrs", diff: "Intermediate", icon: "📱 Kotlin", objectives: ["Null-safety checks", "Coroutines tasks", "Lambdas blocks"] },
    { id: "swift", title: "Swift Studio", desc: "Apple client applications. Optionals wrapping, protocols matching, and UI storyboard layouts.", category: "languages", lessons: 12, time: "7 hrs", diff: "Intermediate", icon: "🍎 Swift", objectives: ["Optionals unwrapping", "Protocols contracts", "Extensions bindings"] },
    { id: "r", title: "R Studio", desc: "Statistical calculations, vectors, data frame manipulations, and plotting diagrams.", category: "languages", lessons: 8, time: "5 hrs", diff: "Intermediate", icon: "📊 R", objectives: ["Vectors arrays", "Data Frames", "Plot charts"] },
    { id: "data_structures", title: "Data Structures Studio", desc: "Optimize memory storage. Arrays, lists, circular stacks, binary trees, heaps, and hash structures.", category: "cs", lessons: 24, time: "15 hrs", diff: "Advanced", icon: "📦 Data Structs", objectives: ["Arrays & Lists", "BST & AVL trees", "Bloom filter hash"] },
    { id: "algorithms", title: "Algorithms Studio", desc: "Time & space complexity optimizations. Bubble/Merge sorting, binary search, greed, and DP.", category: "cs", lessons: 25, time: "18 hrs", diff: "Advanced", icon: "⚡ Algorithms", objectives: ["Sorting swaps", "Binary search bounds", "Dynamic programming"] },
    { id: "oop", title: "OOP Studio", desc: "Object-oriented design. Classes abstraction, inheritance mapping, polymorphism, and encapsulation.", category: "cs", lessons: 10, time: "5 hrs", diff: "Intermediate", icon: "🧩 OOP Design", objectives: ["Encapsulation setters", "Polymorphism calls", "Inheritance trees"] },
    { id: "database", title: "Database Studio", desc: "Relational database structures. Normalization forms, query execution plans, and ACID.", category: "cs", lessons: 8, time: "6 hrs", diff: "Intermediate", icon: "🗄 DB Design", objectives: ["Normalization forms", "Index lookups", "Transactions safety"] },
    { id: "os", title: "Operating Systems Studio", desc: "CPU process schedulers, mutex deadlocks, virtual paging, and memory allocations.", category: "cs", lessons: 12, time: "9 hrs", diff: "Advanced", icon: "💻 OS Core", objectives: ["CPU scheduler tasks", "Mutex deadlock states", "Paging maps"] },
    { id: "networks", title: "Computer Networks Studio", desc: "OSI layer stacks, DNS resolutions, IP routing paths, and TCP handshake handshakes.", category: "cs", lessons: 10, time: "6 hrs", diff: "Intermediate", icon: "📡 Networks", objectives: ["OSI layer levels", "DNS address resolve", "TCP handshake flow"] },
    { id: "system_design", title: "System Design Studio", desc: "Architect distributed databases, reverse proxy load balancers, and CDN cache clusters.", category: "cs", lessons: 12, time: "10 hrs", diff: "Advanced", icon: "🏛 Sys Design", objectives: ["Load balancer weights", "CDN caching layers", "Database partitions"] },
    { id: "ml", title: "Machine Learning Studio", desc: "Build predictive models: Linear regression models, decision trees, and cost optimizers.", category: "data", lessons: 12, time: "10 hrs", diff: "Advanced", icon: "🤖 Machine Learning", objectives: ["Regression curves", "Gradient descent rates", "Decision splitting"] },
    { id: "ai", title: "Artificial Intelligence Studio", desc: "Neural networks, activation calculations, transformer weights, and generative models.", category: "data", lessons: 14, time: "12 hrs", diff: "Advanced", icon: "🤖 AI Models", objectives: ["Neural calculations", "Transformer weights", "Attention mappings"] },
    { id: "data_science", title: "Data Science Studio", desc: "Clean datasets, manage NumPy matrix elements, and run Pandas data summaries.", category: "data", lessons: 15, time: "8 hrs", diff: "Intermediate", icon: "📊 Data Science", objectives: ["NumPy arrays", "Pandas cleaning", "Matplotlib charts"] },
    { id: "git", title: "Git & GitHub Studio", desc: "Track code changes. Git branch checkouts, commits timelines, merges, and merge conflicts.", category: "cs", lessons: 8, time: "4 hrs", diff: "Beginner", icon: "🐙 Git VCS", objectives: ["Commit checkouts", "Branch checkout rules", "Merge conflict resets"] },
    { id: "linux", title: "Linux Studio", desc: "Master filesystem navigations, bash shell scripting, and server configurations.", category: "cs", lessons: 10, time: "5 hrs", diff: "Intermediate", icon: "🐧 Linux", objectives: ["Filesystem paths", "Permissions scopes", "Bash scripts run"] }
];

// Syllabus structure per Studio mapping
const STUDIO_SYLLABUS = {
    python: [
        {
            module: "Module 1: Introduction",
            lessons: [
                { name: "Syntax", key: "python_syntax", operations: ["Introduction", "Print function", "Comments"] },
                { name: "Variables", key: "python_variables", operations: ["Declaration", "Scope", "Data types"] }
            ]
        },
        {
            module: "Module 2: Tuples",
            lessons: [
                { name: "Tuples Basics", key: "python_tuples", operations: ["Introduction", "Tuple Slicing", "Tuple Packing", "Tuple Unpacking", "Tuple Concatenation"] }
            ]
        },
        {
            module: "Module 3: Lists",
            lessons: [
                { name: "Lists Operations", key: "python_lists", operations: ["append()", "pop()"] }
            ]
        }
    ],
    c: [
        {
            module: "Module 1: Basics",
            lessons: [
                { name: "Variables", key: "c_variables", operations: ["Declaration", "Data Types"] }
            ]
        },
        {
            module: "Module 2: Pointers",
            lessons: [
                { name: "Pointer Operations", key: "c_pointers", operations: ["Dereferencing", "Double Pointers"] }
            ]
        }
    ],
    sql: [
        {
            module: "Module 1: Queries",
            lessons: [
                { name: "SELECT & WHERE", key: "sql_select_&_where", operations: ["SELECT Clause"] }
            ]
        }
    ]
};

// Sub-lessons database catalogs
const SUB_LESSONS_CATALOG = {
    "python_tuples": [
        {
            name: "Introduction",
            desc: "Learn Tuple characteristics, memory structures, and contrast differences with python Lists.",
            code: `# Tuples characteristics demo\ntup = (10, "Pravio", 3.14)\nprint(tup)\n# Note: Tuples are immutable!`,
            complexity: { best: "O(1)", avg: "O(1)", worst: "O(1)", space: "O(n)" },
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

// Auto build Studio Cards on boot
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

    // Update active filter styling
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

// Enter workspace logic
function enterStudioWorkspace(studioId, studioTitle) {
    document.getElementById('viz-dashboard-view').style.display = 'none';
    document.getElementById('viz-workspace-view').style.display = 'flex';

    // Set breadcrumbs
    document.getElementById('breadcrumb-studio').innerText = studioTitle;
    
    // Build curriculum tree for active studio
    buildStudioSyllabusTree(studioId);

    // Save recently visited
    localStorage.setItem('viz_recent_studio', studioId);

    // Trigger loading first topic automatically
    const syllabus = STUDIO_SYLLABUS[studioId] || [
        { module: "Module 1: General Basics", lessons: [{ name: "Variables", key: "general_variables", operations: ["Introduction"] }] }
    ];
    const firstLesson = syllabus[0].lessons[0];
    loadCurriculumTopic(studioId, firstLesson.key, firstLesson.name);
}

function exitStudioWorkspace() {
    document.getElementById('viz-workspace-view').style.display = 'none';
    document.getElementById('viz-dashboard-view').style.display = 'flex';
    
    // Clean timer triggers
    vizIsPlaying = false;
    clearInterval(vizInterval);
    updatePlayPauseButtonUI();
    
    buildStudioDashboard();
}

// Curriculum syllabus layout builder
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

// Workspace tab switcher notes/revision
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
    // Breadcrumbs topic update
    document.getElementById('breadcrumb-topic').innerText = displayName;

    // Reset console output window
    const consoleLog = document.getElementById('viz-console-log');
    if (consoleLog) {
        consoleLog.innerHTML = `[Console System Initialized]\nLoaded Studio: ${studioId}\nLesson: ${displayName}\nReady for execution...`;
    }

    // Default load sub-lesson operations tab bar
    const sublessonToolbar = document.getElementById('viz-sublesson-toolbar');
    if (sublessonToolbar) {
        sublessonToolbar.innerHTML = '';
        
        let activeKey = topicKey.toLowerCase();
        if (!SUB_LESSONS_CATALOG[activeKey]) {
            if (activeKey.includes('tuple')) activeKey = 'python_tuples';
            else if (activeKey.includes('list')) activeKey = 'python_lists';
            else if (activeKey.includes('pointer')) activeKey = 'c_pointers';
            else if (activeKey.includes('select') || activeKey.includes('sql')) activeKey = 'sql_select_&_where';
        }

        const list = SUB_LESSONS_CATALOG[activeKey] || [
            {
                name: "Interactive Trace",
                desc: "Generic traces",
                code: `// Lesson: ${displayName}\nint main() {\n  return 0;\n}`,
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

    // Toggle live CSS preview side panel
    const previewContainer = document.getElementById('viz-html-preview-container');
    if (previewContainer) {
        if (displayName.toLowerCase().includes('css') || displayName.toLowerCase().includes('html') || displayName.toLowerCase().includes('box')) {
            previewContainer.style.display = 'flex';
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
            code: `// Lesson concept: ${activeKey}\nint main() {\n  return 0;\n}`,
            complexity: { best: "O(1)", avg: "O(n)", worst: "O(n)", space: "O(1)" }
        }
    ];
    
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

    // Load saved notes for this lesson operation
    const notesTextarea = document.getElementById('workspace-notes-textarea');
    if (notesTextarea) {
        notesTextarea.value = workspaceNotes[sub.name] || '';
    }

    // Cache Complexity mappings
    const bestC = document.getElementById('viz-best-case');
    const avgC = document.getElementById('viz-avg-case');
    const worstC = document.getElementById('viz-worst-case');
    const spaceC = document.getElementById('viz-space-case');
    
    if (bestC) bestC.innerText = sub.complexity.best;
    if (avgC) avgC.innerText = sub.complexity.avg;
    if (worstC) worstC.innerText = sub.complexity.worst;
    if (spaceC) spaceC.innerText = sub.complexity.space;

    // Reset controls
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

    // Trace frames generator
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
        steps = generateDynamicSteps(activeSession.category, activeSession.topic, activeSession.code);
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

    // Step sliders and labels
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
        explanation.innerHTML = `
            <div style="font-size:0.9rem; line-height:1.5; color:var(--text-body); margin-bottom:8px;">${step.explain}</div>
            <div style="font-size:0.8rem; color:#f59e0b; font-style:italic; margin-bottom:10px;">💡 Analogy: Imagine baking cookies step-by-step. The variables are ingredients you set down on the counter.</div>
            
            <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px; border-top:1px dashed var(--border-color); padding-top:8px;">Common Mistake</div>
            <div style="font-size:0.8rem; color:#ef4444; margin-bottom:10px;">⚠️ Assigning out of bounds elements or modifing values on read-only tuple lists.</div>
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

    // Save completed list
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
                    block.style.background = '#ef4444'; // Red swap/highlight
                } else {
                    block.style.background = '#a855f7'; // Purple comparison
                }
            } else if (action.complete) {
                block.style.background = '#10b981'; // Green complete
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
    const displayLbl = document.getElementById('viz-speed-display-lbl');
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

// Fallback steps generator loops
function generateDynamicSteps(category, topic, code) {
    const steps = [];
    const lines = code.split('\n');

    lines.forEach((lineText, idx) => {
        const lineNum = idx + 1;
        const trimmed = lineText.trim();
        if (!trimmed) return;

        steps.push({
            line: lineNum,
            vars: {
                instruction: trimmed.substring(0, 10),
                type: "operation",
                scope: "stack"
            },
            mem: [`Pointer -> line ${lineNum}`],
            explain: `Running instruction on line ${lineNum}: \`${trimmed}\`. Updating stack references.`,
            action: { type: "mem_set", addr: `0x00${lineNum}`, val: trimmed.substring(0, 10) }
        });
    });

    if (steps.length === 0) {
        steps.push({
            line: 1,
            vars: { status: "Empty" },
            mem: [],
            explain: "Write code inside the editor to generate interactive compiler visualizations.",
            action: { type: "generic" }
        });
    }

    return steps;
}

// Boot sequence loaders
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

    // Render stats metrics labels
    document.getElementById('viz-stat-streak').innerText = `${userStreak} Days`;
    document.getElementById('viz-stat-xp').innerText = `${userXP} XP`;
    document.getElementById('viz-stat-completed').innerText = `${completedTopics.length} / 85`;
    document.getElementById('viz-stat-hours').innerText = `${studyHours} hrs`;

    // Render Dashboard homepage cards
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

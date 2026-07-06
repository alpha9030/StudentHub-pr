// ==========================================
// PRAVIO VISUALIZER INTERACTIVE ENGINE
// ==========================================

// Global state
let vizSessions = [];
let activeSession = null;
let vizInterval = null;
let vizIsPlaying = false;
let vizSpeed = 500; // ms per step

// Category definition catalog
const VIZ_CATEGORIES = {
    languages: {
        title: "Programming Languages",
        icon: "code",
        topics: {
            python: { title: "Python (List Comprehension)", code: `# Python List Comprehension\nnums = [1, 2, 3, 4]\nsquares = [x * x for x in nums]\nprint(squares)` },
            c: { title: "C (Pointers & Dereferencing)", code: `// C Pointer Dereferencing\nint val = 42;\nint *ptr = &val;\n*ptr = 99;` },
            cpp: { title: "C++ (OOP Constructor)", code: `// C++ Class Constructor\nclass Student {\n  public:\n    Student() { id = 101; }\n    int id;\n};\nStudent s;` },
            java: { title: "Java (Garbage Collection)", code: `// Java Memory Reference\nString a = new String("Pravio");\na = null; // GC target` },
            javascript: { title: "JavaScript (Destructuring)", code: `// JS Object Destructuring\nconst user = { name: "Alice", age: 21 };\nconst { name, age } = user;` },
            typescript: { title: "TypeScript (Interfaces)", code: `// TS Strict Type Safety\ninterface User { id: number; }\nconst u: User = { id: 456 };` },
            html: { title: "HTML (Semantic DOM)", code: `<!-- HTML Document structure -->\n<main>\n  <article>\n    <h1>Title</h1>\n  </article>\n</main>` },
            css: { title: "CSS (Specificity)", code: `/* CSS Cascade rules */\nbody h1 { color: blue; } /* specificity 0,0,2 */\n#title { color: red; }   /* specificity 0,1,0 */` },
            sql: { title: "SQL (Table Creation)", code: `-- Create Relational Table\nCREATE TABLE Students (\n  id INT PRIMARY KEY,\n  name VARCHAR(50)\n);` },
            php: { title: "PHP (Superglobals)", code: `<?php\n// Session binding\n$_SESSION['user'] = "Alice";\necho $_SESSION['user'];\n?>` },
            go: { title: "Go (Goroutines)", code: `package main\n// Concurrent execution channels\ngo runTask(1);\ngo runTask(2);` },
            rust: { title: "Rust (Ownership)", code: `// Rust Memory Safety Borrowing\nlet s1 = String::from("hello");\nlet s2 = s1; // s1 ownership is moved!` },
            kotlin: { title: "Kotlin (Null Safety)", code: `// Kotlin safe call compiler check\nvar name: String? = null\nprintln(name?.length)` },
            swift: { title: "Swift (Optionals)", code: `// Swift optionals unwrapping\nvar title: String? = "Pravio"\nif let active = title {\n  print(active)\n}` },
            r: { title: "R (Vectorized Operations)", code: `# R vector aggregation\nx <- c(10, 20, 30)\ny <- x * 2\nmean(y)` }
        }
    },
    structures: {
        title: "Data Structures",
        icon: "project-diagram",
        topics: {
            array: { title: "Arrays (Insertion)", code: `// Array element shifting\nint arr[5] = {10, 20, 30};\nint pos = 1;\nint val = 99;\ninsertAt(arr, pos, val);` },
            linked_list: { title: "Linked Lists (Singly)", code: `// Linked List insertion link splicing\nNode *head = [10 -> 20];\nNode *new_node = createNode(99);\nnew_node->next = head->next;\nhead->next = new_node;` },
            strings: { title: "Strings (Reversal)", code: `// String inplace character swapping\nstring s = "ABC";\nswap(s[0], s[2]);` },
            stacks: { title: "Stacks (Push & Pop)", code: `// Stack LIFO operations\nstack.push(10);\nstack.push(20);\nstack.pop();` },
            queues: { title: "Queues (Enqueue & Dequeue)", code: `// Queue FIFO operations\nqueue.enqueue(10);\nqueue.enqueue(20);\nqueue.dequeue();` },
            hash_tables: { title: "Hash Tables (Collision)", code: `// Hash Map Index chaining\nmap.put("Alice", 1);\nmap.put("Bob", 2);` },
            trees: { title: "Trees (Depth First)", code: `// Binary Tree DFS Traversal\ntree.traverse(root);` },
            binary_trees: { title: "Binary Trees (Inorder)", code: `// Inorder: Left, Root, Right\ninorder(root->left);\nvisit(root);\ninorder(root->right);` },
            bst: { title: "Binary Search Tree (Search)", code: `// BST Binary Search properties\nif (val < node->val) search(node->left);\nelse search(node->right);` },
            avl_trees: { title: "AVL Trees (Rotations)", code: `// AVL Balancing Tree Rotations\nif (balance > 1) leftRotate(node);` },
            heaps: { title: "Heaps (Heapify)", code: `// Max Heap bubble up node swap\nif (arr[child] > arr[parent]) swap(child, parent);` },
            tries: { title: "Tries (Prefix Matching)", code: `// Trie string letter lookup path\nnode = node->children[char];` },
            graphs: { title: "Graphs (Adjacency Matrix)", code: `// Graph edge link verification\nadj[u][v] = 1;\nadj[v][u] = 1;` },
            sets: { title: "Sets (Set Union)", code: `// Set unique elements set union\nsetA.add(1);\nsetB.add(1);\nunion = setA.union(setB);` },
            maps: { title: "Maps (Key Lookup)", code: `// Key-Value map table indexing\nmap.put("key", "val");\nres = map.get("key");` }
        }
    },
    algorithms: {
        title: "Algorithms",
        icon: "random",
        topics: {
            bubble_sort: { title: "Bubble Sort", code: `// Bubble Sort element sorting\nfor (i = 0; i < len - 1; i++) {\n  for (j = 0; j < len - i - 1; j++) {\n    if (arr[j] > arr[j + 1]) {\n      swap(&arr[j], &arr[j + 1]);\n    }\n  }\n}` },
            searching: { title: "Linear Search", code: `// Linear array element matching\nfor (int i = 0; i < len; i++) {\n  if (arr[i] == target) return i;\n}` },
            sliding_window: { title: "Sliding Window", code: `// Variable size index window tracking\nwhile (right < len) {\n  sum += arr[right];\n  while (sum > target) sum -= arr[left++];\n}` },
            two_pointers: { title: "Two Pointers", code: `// Two-Pointer index boundary tracking\nwhile (left < right) {\n  if (arr[left] + arr[right] == sum) return;\n  else if (sum < target) left++;\n  else right--;\n}` },
            prefix_sum: { title: "Prefix Sum", code: `// Precompute array element sums\nprefix[0] = arr[0];\nfor(int i=1; i<len; i++) prefix[i] = prefix[i-1] + arr[i];` },
            binary_search: { title: "Binary Search", code: `// Binary search interval halving\nwhile (low <= high) {\n  mid = low + (high - low) / 2;\n  if (arr[mid] == target) return mid;\n  else if (arr[mid] < target) low = mid + 1;\n  else high = mid - 1;\n}` },
            greedy: { title: "Greedy (Coin Change)", code: `// Greedy optimal choice selection\nfor (int coin : coins) {\n  count += amount / coin;\n  amount %= coin;\n}` },
            dp: { title: "Dynamic Programming (Fibonacci)", code: `// Memoization tabular precomputing\ndp[0] = 0;\ndp[1] = 1;\nfor(int i=2; i<=n; i++) dp[i] = dp[i-1] + dp[i-2];` },
            backtracking: { title: "Backtracking (N-Queens)", code: `// Recursive state backtracking path\nif (solve(col)) return true;\nremoveQueen(row, col);` },
            divide_conquer: { title: "Divide & Conquer (Merge Sort)", code: `// Recurse divide and merge steps\nmergesort(left);\nmergesort(right);\nmerge(left, right);` },
            bit_manipulation: { title: "Bit Manipulation", code: `// Binary bit manipulation operations\nx = x ^ y; // XOR values\nmask = 1 << i;` },
            graph_algorithms: { title: "BFS Graph Traversal", code: `// Breadth first queue pathing\nqueue.push(start);\nvisited[start] = true;` },
            tree_algorithms: { title: "Tree Height Recursion", code: `// Binary tree height recursion\nint h = 1 + max(height(left), height(right));` },
            recursion: { title: "Factorial Recursion", code: `// Recursive function calls\nint fact(int n) {\n  if (n <= 1) return 1;\n  return n * fact(n - 1);\n}` }
        }
    },
    sql: {
        title: "SQL Visualizer",
        icon: "database",
        topics: {
            select: { title: "SELECT & WHERE", code: `SELECT name, grade\nFROM Students\nWHERE dept = 'CSE';` },
            group_by: { title: "GROUP BY & HAVING", code: `SELECT dept, COUNT(*)\nFROM Students\nGROUP BY dept\nHAVING COUNT(*) > 1;` },
            order_by: { title: "ORDER BY Sorting", code: `SELECT name, grade\nFROM Students\nORDER BY grade DESC;` },
            joins: { title: "INNER JOIN matching", code: `SELECT Students.name, Courses.title\nFROM Students\nINNER JOIN Courses ON Students.id = Courses.student_id;` },
            aggregates: { title: "Aggregate Functions", code: `SELECT AVG(grade_points), MAX(grade_points)\nFROM Students;` },
            indexing: { title: "Database Indexing", code: `CREATE INDEX idx_student_dept\nON Students (dept);` },
            transactions: { title: "Transactions (ACID)", code: `BEGIN TRANSACTION;\nUPDATE Accounts SET bal = bal - 100;\nCOMMIT;` },
            procedures: { title: "Stored Procedures", code: `CREATE PROCEDURE GetStudents()\nBEGIN\n  SELECT * FROM Students;\nEND;` },
            views: { title: "Virtual Views", code: `CREATE VIEW ActiveStudents AS\nSELECT name, dept FROM Students\nWHERE status = 'active';` },
            normalization: { title: "Normalization Forms", code: `-- 1NF: Eliminate repeating groups\n-- 2NF: Remove partial dependencies\n-- 3NF: Remove transitive dependencies` }
        }
    },
    webdev: {
        title: "Web Development",
        icon: "globe",
        topics: {
            boxmodel: { title: "CSS Box Model", code: `.box {\n  width: 100px;\n  padding: 10px;\n  border: 5px solid;\n  margin: 15px;\n}` },
            dom: { title: "HTML DOM Selection", code: `// JavaScript DOM query manipulation\nconst container = document.getElementById('container');\ncontainer.style.color = 'red';` },
            flexbox: { title: "Flexbox Layout", code: `.container {\n  display: flex;\n  flex-direction: row;\n  justify-content: center;\n}` },
            grid: { title: "Grid Layout", code: `.container {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 10px;\n}` },
            positioning: { title: "CSS Positioning", code: `.box {\n  position: absolute;\n  top: 10px;\n  left: 20px;\n}` },
            responsive: { title: "CSS Media Queries", code: `@media (max-width: 768px) {\n  .container { flex-direction: column; }\n}` },
            eventloop: { title: "JS Event Loop", code: `console.log("Start");\nsetTimeout(() => console.log("Timeout"), 10);\nconsole.log("End");` },
            async_await: { title: "Promises & Async/Await", code: `async function fetchData() {\n  const res = await fetch(url);\n  const data = await res.json();\n}` }
        }
    }
};

// ==========================================
// DYNAMIC STEP METADATA GENERATOR
// ==========================================
function generateDynamicSteps(category, topic, code) {
    const steps = [];
    const lines = code.split('\n');

    // Default static data for rendering visual components
    let currentArray = [10, 20, 30, 40, 50];
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

        // Create a trace step for each code line
        const step = {
            line: lineNum,
            vars: {
                line: lineNum,
                instruction: trimmed.substring(0, 35) + (trimmed.length > 35 ? '...' : '')
            },
            mem: [`Instruction pointer -> line ${lineNum}`],
            explain: `Running instruction on line ${lineNum}: \`${trimmed}\`. Loading state variables...`,
            action: { type: "generic" }
        };

        // Enrich trace data based on category and topic
        if (category === "languages") {
            step.vars["environment"] = topic.toUpperCase();
            step.vars["stack_depth"] = "1 frame";
            step.mem.push("stack_frame -> base_addr");
            step.explain = `In ${VIZ_CATEGORIES[category].topics[topic].title}, line ${lineNum} parses variables into the compiler call stack.`;
            step.action = { type: "mem_set", addr: `0x00${lineNum}`, val: trimmed.substring(0, 10) };
        }
        else if (category === "structures") {
            if (topic === "array" || topic === "strings") {
                step.vars["index"] = idx;
                step.explain = `Processing array/string elements at index ${idx}. Accessing memory address directly.`;
                step.action = { type: "array_state", data: currentArray, active: [idx % 5] };
            } 
            else if (topic === "stacks" || topic === "queues") {
                const isPop = trimmed.includes("pop") || trimmed.includes("dequeue");
                const activeIndex = isPop ? 0 : idx % 5;
                if (isPop) currentArray[activeIndex] = 0;
                step.vars["action"] = isPop ? "remove" : "insert";
                step.explain = isPop ? "LIFO/FIFO container item popped/dequeued from front/back." : `Insert element into LIFO/FIFO linear index tracking buffer.`;
                step.action = { type: "array_state", data: currentArray, active: [activeIndex] };
            }
            else {
                step.vars["pointer"] = `0x${lineNum}000`;
                step.explain = `Accessing linked structure node at pointer index 0x${lineNum}000.`;
                step.action = { type: "ll_state", list: currentList, active: [`0x1000`] };
            }
        }
        else if (category === "algorithms") {
            if (topic === "bubble_sort") {
                // Return default Bubble Sort steps if it matches our built-in topic
                return;
            }
            step.vars["mid"] = Math.floor(currentArray.length / 2);
            step.vars["val"] = currentArray[idx % 5];
            step.explain = `Algorithm checks elements sequentially or splits intervals. Evaluating target values...`;
            step.action = { type: "array_state", data: currentArray, active: [idx % 5] };
        }
        else if (category === "sql") {
            step.vars["query_parser"] = "SQL Engine";
            step.explain = `SQL executor parses queries, filters row items by WHERE filters, and projects SELECT columns.`;
            step.action = { type: "sql_table", rows: currentSQLRows, active: [idx % 3] };
        }
        else if (category === "webdev") {
            if (topic === "boxmodel") {
                return;
            }
            step.vars["rendering_engine"] = "Blink/Gecko Webkit";
            step.explain = `Browser layouts flex direction alignments, adjusts grid spacing gaps, or triggers async events.`;
            step.action = { type: "box_model", layers: { content: "120px", padding: `${idx * 4}px`, border: "2px", margin: "10px" } };
        }

        steps.push(step);
    });

    if (steps.length === 0) {
        steps.push({
            line: 1,
            vars: { status: "Empty" },
            mem: [],
            explain: "Empty source code inputted. Please write code to visualize.",
            action: { type: "generic" }
        });
    }

    return steps;
}

// ==========================================
// SESSION LIFE ACTIONS
// ==========================================
function initVizSessions() {
    try {
        vizSessions = JSON.parse(localStorage.getItem('pravio_visualizer_sessions') || '[]');
    } catch(e) {
        vizSessions = [];
    }

    if (!Array.isArray(vizSessions)) vizSessions = [];

    if (vizSessions.length === 0) {
        createVizSession("Array Quickstart", "structures", "array");
        createVizSession("Bubble Sort Walkthrough", "algorithms", "bubble_sort");
    } else {
        activeSession = vizSessions[0];
    }
    renderVizSessionsSidebar();
    loadActiveVizSession();
}

function saveVizSessions() {
    localStorage.setItem('pravio_visualizer_sessions', JSON.stringify(vizSessions));
}

function createVizSession(name, category = "algorithms", topic = "bubble_sort") {
    const topicData = VIZ_CATEGORIES[category]?.topics[topic];
    if (!topicData) return;

    const newSess = {
        id: "viz_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        name: name,
        category: category,
        topic: topic,
        code: topicData.code,
        currentStep: 0,
        createdAt: new Date().toISOString()
    };
    vizSessions.unshift(newSess);
    activeSession = newSess;
    saveVizSessions();
    renderVizSessionsSidebar();
    loadActiveVizSession();
}

function selectVizSession(id) {
    const found = vizSessions.find(s => s.id === id);
    if (found) {
        activeSession = found;
        loadActiveVizSession();
        renderVizSessionsSidebar();
    }
}

function deleteVizSession(id, event) {
    if (event) event.stopPropagation();
    vizSessions = vizSessions.filter(s => s.id !== id);
    if (activeSession && activeSession.id === id) {
        activeSession = vizSessions[0] || null;
    }
    saveVizSessions();
    renderVizSessionsSidebar();
    if (activeSession) {
        loadActiveVizSession();
    } else {
        clearVizDisplay();
    }
}

function renameVizSession(id, newName) {
    const found = vizSessions.find(s => s.id === id);
    if (found && newName.trim()) {
        found.name = newName.trim();
        saveVizSessions();
        renderVizSessionsSidebar();
        if (activeSession && activeSession.id === id) {
            document.getElementById('active-viz-title').innerText = found.name;
        }
    }
}

function searchVizSessions(query) {
    const q = query.toLowerCase().trim();
    const items = document.querySelectorAll('.viz-session-item');
    items.forEach(item => {
        const text = item.querySelector('.session-name').innerText.toLowerCase();
        if (text.includes(q)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// ==========================================
// RENDERERS & LAYOUT CONTROLLER
// ==========================================
function renderVizSessionsSidebar() {
    const container = document.getElementById('viz-sessions-list');
    if (!container) return;

    container.innerHTML = '';
    vizSessions.forEach(sess => {
        const isActive = activeSession && activeSession.id === sess.id;
        const item = document.createElement('div');
        item.className = `viz-session-item ${isActive ? 'active' : ''}`;
        item.onclick = () => selectVizSession(sess.id);
        
        item.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                <i class="fas fa-play-circle" style="color: ${isActive ? 'var(--primary-color)' : 'var(--text-muted)'}; font-size:0.9rem;"></i>
                <span class="session-name" style="font-size:0.85rem; font-weight:${isActive ? '600' : '400'}; color:var(--text-body); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${sess.name}</span>
            </div>
            <div class="session-actions" style="display:flex; gap:6px;">
                <button onclick="triggerRenameSession('${sess.id}', event)" class="sess-btn" title="Rename"><i class="far fa-edit"></i></button>
                <button onclick="deleteVizSession('${sess.id}', event)" class="sess-btn" title="Delete"><i class="far fa-trash-alt"></i></button>
            </div>
        `;
        container.appendChild(item);
    });
}

function triggerRenameSession(id, event) {
    if (event) event.stopPropagation();
    const sess = vizSessions.find(s => s.id === id);
    if (!sess) return;
    const name = prompt("Enter new session name:", sess.name);
    if (name) renameVizSession(id, name);
}

function clearVizDisplay() {
    document.getElementById('active-viz-title').innerText = "No Active Session";
    document.getElementById('viz-code-editor').value = "";
    document.getElementById('viz-display-area').innerHTML = "<p style='color:var(--text-muted); padding:40px; text-align:center;'>Create or select a visualization session to get started.</p>";
}

function loadActiveVizSession() {
    if (!activeSession) return;

    vizIsPlaying = false;
    clearInterval(vizInterval);
    updatePlayPauseButtonUI();

    document.getElementById('active-viz-title').innerText = activeSession.name;
    
    const catSelect = document.getElementById('viz-category-select');
    const topicSelect = document.getElementById('viz-topic-select');
    if (catSelect) catSelect.value = activeSession.category;
    
    populateTopicsSelect(activeSession.category);
    if (topicSelect) topicSelect.value = activeSession.topic;

    const editor = document.getElementById('viz-code-editor');
    if (editor) {
        editor.value = activeSession.code;
        syncEditorLineNumbers();
    }

    renderCurrentStep();
}

function populateTopicsSelect(category) {
    const topicSelect = document.getElementById('viz-topic-select');
    if (!topicSelect) return;
    topicSelect.innerHTML = '';
    
    const cat = VIZ_CATEGORIES[category];
    if (cat) {
        Object.keys(cat.topics).forEach(key => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.innerText = cat.topics[key].title;
            topicSelect.appendChild(opt);
        });
    }
}

function handleCategoryChange(cat) {
    if (!activeSession) return;
    activeSession.category = cat;
    const firstTopic = Object.keys(VIZ_CATEGORIES[cat].topics)[0];
    activeSession.topic = firstTopic;
    activeSession.code = VIZ_CATEGORIES[cat].topics[firstTopic].code;
    activeSession.currentStep = 0;
    saveVizSessions();
    loadActiveVizSession();
}

function handleTopicChange(topic) {
    if (!activeSession) return;
    activeSession.topic = topic;
    activeSession.code = VIZ_CATEGORIES[activeSession.category].topics[topic].code;
    activeSession.currentStep = 0;
    saveVizSessions();
    loadActiveVizSession();
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

// ==========================================
// INTERACTIVE ENGINE ACTIONS
// ==========================================
function renderCurrentStep() {
    if (!activeSession) return;
    const cat = VIZ_CATEGORIES[activeSession.category];
    const topicData = cat?.topics[activeSession.topic];
    if (!topicData) return;

    // Check if we have hardcoded steps catalog or need to generate dynamically
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
    } else if (activeSession.category === "sql" && activeSession.topic === "select") {
        steps = VIZ_CATALOG.sql.topics.select.steps;
    } else if (activeSession.category === "webdev" && activeSession.topic === "boxmodel") {
        steps = VIZ_CATALOG.webdev.topics.boxmodel.steps;
    } else {
        // Fallback to dynamic step tracer!
        steps = generateDynamicSteps(activeSession.category, activeSession.topic, activeSession.code);
    }

    const totalSteps = steps.length;
    let stepIdx = activeSession.currentStep;
    if (stepIdx >= totalSteps) stepIdx = totalSteps - 1;
    if (stepIdx < 0) stepIdx = 0;
    activeSession.currentStep = stepIdx;

    const step = steps[stepIdx];

    const gutterDivs = document.querySelectorAll('#viz-line-gutter div');
    gutterDivs.forEach(div => {
        const line = parseInt(div.getAttribute('data-line'), 10);
        if (line === step.line) {
            div.className = 'active-line';
        } else {
            div.className = '';
        }
    });

    const varsBody = document.getElementById('viz-vars-table-body');
    if (varsBody) {
        varsBody.innerHTML = '';
        Object.keys(step.vars).forEach(vKey => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:6px 12px; border-bottom:1px solid var(--border-color); color:var(--primary-color); font-family:monospace; font-weight:600;">${vKey}</td>
                <td style="padding:6px 12px; border-bottom:1px solid var(--border-color); color:var(--text-body); font-family:monospace;">${step.vars[vKey]}</td>
            `;
            varsBody.appendChild(tr);
        });
    }

    const stackList = document.getElementById('viz-mem-stack');
    if (stackList) {
        stackList.innerHTML = '';
        step.mem.forEach(m => {
            const li = document.createElement('li');
            li.style.padding = '5px 8px';
            li.style.borderBottom = '1px solid var(--border-color)';
            li.style.fontSize = '0.82rem';
            li.style.fontFamily = 'monospace';
            li.innerText = m;
            stackList.appendChild(li);
        });
    }

    const bestC = document.getElementById('viz-best-case');
    const avgC = document.getElementById('viz-avg-case');
    const worstC = document.getElementById('viz-worst-case');
    const spaceC = document.getElementById('viz-space-case');
    
    // Fallback complexity
    const defaultComplexities = {
        best: "O(1)", avg: "O(n)", worst: "O(n)", space: "O(1)"
    };
    const topicComplexity = VIZ_CATALOG[activeSession.category]?.topics[activeSession.topic] || defaultComplexities;
    
    if (bestC) bestC.innerText = topicComplexity.best || defaultComplexities.best;
    if (avgC) avgC.innerText = topicComplexity.avg || defaultComplexities.avg;
    if (worstC) worstC.innerText = topicComplexity.worst || defaultComplexities.worst;
    if (spaceC) spaceC.innerText = topicComplexity.space || defaultComplexities.space;

    const progress = document.getElementById('viz-step-slider');
    const label = document.getElementById('viz-step-label');
    if (progress) {
        progress.max = totalSteps - 1;
        progress.value = stepIdx;
    }
    if (label) {
        label.innerText = `Step: ${stepIdx + 1} / ${totalSteps}`;
    }

    const explanation = document.getElementById('viz-explanation-panel');
    if (explanation) {
        explanation.innerHTML = `
            <div style="font-weight:600; color:var(--primary-color); margin-bottom:8px; display:flex; align-items:center; gap:6px;">
                <i class="fas fa-magic"></i> AI Execution Trace (Line ${step.line}):
            </div>
            <div style="font-size:0.9rem; line-height:1.5; color:var(--text-body);">${step.explain}</div>
        `;
    }

    renderInteractiveCanvas(step.action, activeSession.category, activeSession.topic);
}

function updatePlayPauseButtonUI() {
    const playBtn = document.getElementById('viz-play-btn');
    if (!playBtn) return;
    playBtn.innerHTML = vizIsPlaying 
        ? `<i class="fas fa-pause"></i> Pause` 
        : `<i class="fas fa-play"></i> Run`;
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

// Bind load listener on startup
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('viz-sessions-list')) {
        initVizSessions();
        
        document.getElementById('viz-step-slider')?.addEventListener('input', (e) => {
            jumpToStep(e.target.value);
        });
        document.getElementById('viz-speed-slider')?.addEventListener('input', (e) => {
            setVizSpeed(e.target.value);
        });
    }
});

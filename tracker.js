// Load and apply theme & font size on start so all pages stay synchronized
(function() {
    function applySettings() {
        const savedTheme = localStorage.getItem('siteTheme') || 'default';
        const savedFontSize = localStorage.getItem('siteFontSize') || 'medium';

        // Apply theme and font size classes to body
        document.body.className = '';
        if (savedTheme !== 'default') {
            document.body.classList.add('theme-' + savedTheme);
        }
        document.body.classList.add('font-size-' + savedFontSize);

        // Sync dropdown selectors on the current page if they exist
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = savedTheme;
        }
        const fontSelect = document.getElementById('font-size-select');
        if (fontSelect) {
            fontSelect.value = savedFontSize;
        }
    }

    // Expose change settings functions globally
    window.changeTheme = function(themeName) {
        localStorage.setItem('siteTheme', themeName);
        applySettings();
    };

    window.changeFontSize = function(fontSizeName) {
        localStorage.setItem('siteFontSize', fontSizeName);
        applySettings();
    };

    function standardizeSubjectPage() {
        try {
            const path = window.location.pathname || '';
            const fileName = path.split('/').pop() || document.location.href.split('/').pop() || '';
            
            // Determine if it's a subject page (local guide page other than primary entry points)
            const isSubjectPage = fileName.endsWith('.html') && 
                !['index.html', 'index', 'signup.html', 'signup', 'reference.html', 'reference', ''].includes(fileName.toLowerCase());
            
            if (!isSubjectPage) return;

            // 1. Wrap the body content in .app-container if not already present
            if (!document.querySelector('.app-container')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'app-container';
                while (document.body.firstChild) {
                    wrapper.appendChild(document.body.firstChild);
                }
                document.body.appendChild(wrapper);
            }

            const wrapper = document.querySelector('.app-container');

            // 2. Remove the legacy <h2>Navigation</h2> and old horizontal rules at the top
            const headings = wrapper.querySelectorAll('h2');
            headings.forEach(h2 => {
                if (h2.textContent.toLowerCase().includes('navigation')) {
                    h2.remove();
                }
            });

            const hrs = wrapper.querySelectorAll('hr');
            hrs.forEach((hr, idx) => {
                if (idx < 2) hr.remove();
            });

            // Remove legacy nav element if present
            const oldNav = wrapper.querySelector('nav');
            if (oldNav) oldNav.remove();

            // 3. Prepend the standard beautiful Student Hub header
            const headerContainer = document.createElement('div');
            headerContainer.className = 'standard-header';
            headerContainer.innerHTML = `
                <center>
                    <h1>Student Hub</h1>
                    <p>Your step-by-step guide to Computer Science and Web Development.</p>
                </center>
                <hr>
                <nav>
                    <a href="index.html">Home</a>
                    <a href="signup.html">Signup</a>
                    <a href="reference.html">References</a>
                </nav>
                <hr>
            `;
            wrapper.insertBefore(headerContainer, wrapper.firstChild);
        } catch (e) {
            console.error('Error standardizing subject page:', e);
        }
    }

    function injectSettingsBar() {
        // If theme-select is already in the DOM, just sync and return
        if (document.getElementById('theme-select')) {
            applySettings();
            return;
        }

        // Find the nav element on the page to append settings bar
        const nav = document.querySelector('nav');
        if (!nav) return;

        const settingsBar = document.createElement('div');
        settingsBar.id = 'site-settings-bar';

        const savedTheme = localStorage.getItem('siteTheme') || 'default';
        const savedFontSize = localStorage.getItem('siteFontSize') || 'medium';

        settingsBar.innerHTML = `
            <label for="theme-select" class="settings-label">Theme: </label>
            <select id="theme-select" onchange="changeTheme(this.value)" class="settings-select">
                <option value="default">Default Blue</option>
                <option value="light">Light Teal & Sage</option>
                <option value="dark">Dark Charcoal</option>
            </select>
            <label for="font-size-select" class="settings-label">Font Size: </label>
            <select id="font-size-select" onchange="changeFontSize(this.value)" class="settings-select">
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
            </select>
        `;

        // Insert after nav
        nav.parentNode.insertBefore(settingsBar, nav.nextSibling);

        applySettings();
    }
    
    function initPage() {
        standardizeSubjectPage();
        injectSettingsBar();
    }

    if (document.body) {
        initPage();
    } else {
        document.addEventListener("DOMContentLoaded", initPage);
    }

    // Listen for storage events (updates in other tabs/windows)
    window.addEventListener('storage', function(e) {
        if (e.key === 'siteTheme' || e.key === 'siteFontSize') {
            applySettings();
        }
        if (e.key === 'isLoggedIn' || e.key === null) {
            const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const path = window.location.pathname || '';
            const fileName = path.split('/').pop() || document.location.href.split('/').pop() || '';
            const isReferencePage = fileName.toLowerCase().includes('reference.html');
            
            if (!loggedIn) {
                if (isReferencePage) {
                    alert("Your session has ended. Redirecting to Enrollment...");
                    window.location.href = "index.html#auth";
                } else {
                    window.location.reload();
                }
            } else {
                // If logged in on another tab, reload non-reference pages to update UI session view
                if (!isReferencePage) {
                    window.location.reload();
                }
            }
        }
    });
})();


// Helper to sync progress checkpoint to Flask backend if online/served via HTTP
function syncProgressToBackend(checkpointId, checked) {
    const isBackendAvailable = window.location.protocol.startsWith('http');
    const email = localStorage.getItem('studentEmail');
    if (isBackendAvailable && email && checkpointId) {
        const apiBase = window.location.protocol.startsWith('http') ? '' : 'https://studenhub.pr';
        fetch(`${apiBase}/api/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                checkpoint_id: checkpointId,
                checked: checked
            })
        }).catch(err => console.warn("Could not sync progress to backend:", err));
    }
}

// tracker.js - Simple local storage progress tracker for students
document.addEventListener("DOMContentLoaded", function() {
    // 1. Find all progress checkboxes
    const checkboxes = document.querySelectorAll(".progress-check");
    
    // 2. Load saved states from localStorage
    checkboxes.forEach(function(checkbox) {
        const id = checkbox.getAttribute("id");
        if (id) {
            const savedState = localStorage.getItem(id);
            if (savedState === "true") {
                checkbox.checked = true;
            }
        }
    });

    // 3. Update the progress metrics on the current page
    updatePageProgress();

    // 4. Listen for changes on checkboxes
    checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener("change", function() {
            const id = checkbox.getAttribute("id");
            if (id) {
                localStorage.setItem(id, checkbox.checked ? "true" : "false");
                syncProgressToBackend(id, checkbox.checked);
            }
            updatePageProgress();
        });
    });

    // Function to calculate and update progress stats
    function updatePageProgress() {
        const total = checkboxes.length;
        if (total === 0) {
            // If we are on index.html, update the overall syllabus table progress
            updateHomepageProgress();
            return;
        }

        let completed = 0;
        checkboxes.forEach(function(checkbox) {
            if (checkbox.checked) {
                completed++;
            }
        });

        const percent = Math.round((completed / total) * 100) || 0;
        
        // Find or create progress text element
        let progressContainer = document.getElementById("page-progress-container");
        if (progressContainer) {
            progressContainer.innerHTML = `
                <div class="subject-progress-box">
                    <strong>Subject Progress:</strong> ${completed} of ${total} tasks completed (${percent}%)
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${percent}%;"></div>
                    </div>
                </div>
            `;
        }
    }

    // Function specifically for index.html to show status of all subjects
    function updateHomepageProgress() {
        const subjects = [
            { id: "c", name: "C Programming", totalTasks: 4 },
            { id: "python", name: "Python", totalTasks: 4 },
            { id: "html", name: "HTML", totalTasks: 6 },
            { id: "css", name: "CSS", totalTasks: 4 },
            { id: "javascript", name: "JavaScript", totalTasks: 4 },
            { id: "java", name: "Java", totalTasks: 4 },
            { id: "sql", name: "SQL", totalTasks: 4 },
            { id: "dbms", name: "DBMS", totalTasks: 5 },
            { id: "os", name: "OS", totalTasks: 5 },
            { id: "cn", name: "CN", totalTasks: 5 },
            { id: "react", name: "React.js", totalTasks: 4 },
            { id: "postgresql", name: "PostgreSQL", totalTasks: 4 },
            { id: "dsa", name: "DSA", totalTasks: 4 }
        ];

        let totalSyllabusTasks = 0;
        let totalSyllabusCompleted = 0;

        subjects.forEach(function(subject) {
            let subjectCompleted = 0;
            // Check all tasks for this subject
            for (let i = 1; i <= subject.totalTasks; i++) {
                const taskId = `${subject.id}-task-${i}`;
                if (localStorage.getItem(taskId) === "true") {
                    subjectCompleted++;
                }
            }

            totalSyllabusTasks += subject.totalTasks;
            totalSyllabusCompleted += subjectCompleted;

            // Find cell in index.html with class progress-cell and id e.g. "html-status"
            const statusCell = document.getElementById(`${subject.id}-status`);
            if (statusCell) {
                const percent = Math.round((subjectCompleted / subject.totalTasks) * 100) || 0;
                if (percent === 100) {
                    statusCell.innerHTML = `<span class="status-text status-completed">✅ Completed</span>`;
                } else if (percent > 0) {
                    statusCell.innerHTML = `<span class="status-text status-progress">⏳ In Progress (${percent}%)</span>`;
                } else {
                    statusCell.innerHTML = `<span class="status-text status-notstarted">Pending</span>`;
                }
            }
        });

        const overallPercent = Math.round((totalSyllabusCompleted / totalSyllabusTasks) * 100) || 0;
        
        // Update simple dashboard numeric counters
        const dashOverallCompleted = document.getElementById("dash-completed-count");
        if (dashOverallCompleted) {
            dashOverallCompleted.innerText = totalSyllabusCompleted;
        }
        
        const dashOverallPercent = document.getElementById("dash-progress-percent");
        if (dashOverallPercent) {
            dashOverallPercent.innerText = `${overallPercent}%`;
        }

        const dashProgressBar = document.getElementById("dash-progress-bar-fill");
        if (dashProgressBar) {
            dashProgressBar.style.width = `${overallPercent}%`;
            dashProgressBar.innerText = `${overallPercent}%`;
        }

        const overallContainer = document.getElementById("overall-progress-container");
        if (overallContainer) {
            overallContainer.innerHTML = `
                <div class="notice-box analytics-box">
                    <h3>📊 Scholastic Progress Analytics</h3>
                    <p>You have completed <strong>${totalSyllabusCompleted}</strong> out of <strong>${totalSyllabusTasks}</strong> total learning tasks across all subjects.</p>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${overallPercent}%;">
                            ${overallPercent}%
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Expose updateHomepageProgress globally
    window.updateHomepageProgress = updateHomepageProgress;
    
    // Check local storage periodically for changes (keep in sync)
    setInterval(updateHomepageProgress, 1500);
});

// Inject a standardized resources section into subject pages when missing
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Only run on subject pages (HTML files other than index.html and common pages)
        const path = window.location.pathname || '';
        const fileName = path.split('/').pop() || document.location.href.split('/').pop();
        const subjectKey = (fileName || '').toLowerCase().replace('.html', '');

        // Don't inject on index or signup or reference pages
        if (!subjectKey || ['index.html', 'index', 'signup.html', 'signup', 'reference.html', 'reference'].includes(fileName)) return;

        // If page already contains common resource headings, skip injection
        const pageText = document.body.innerText.toLowerCase();
        if (pageText.includes('youtube') || pageText.includes('practice') || pageText.includes('recommended project')) {
            return;
        }

        const resourcesData = {
            html: {
                tutorials: [ {label: 'MDN HTML Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML'}, {label: 'W3Schools HTML', url: 'https://www.w3schools.com/html/'} ],
                practice: [ {label: 'freeCodeCamp HTML Exercises', url: 'https://www.freecodecamp.org'}, {label: 'Frontend Mentor (HTML challenges)', url: 'https://www.frontendmentor.io'} ],
                youtube: [ {label: 'Traversy Media', url: 'https://www.youtube.com/user/TechGuyWeb'}, {label: 'Kevin Powell', url: 'https://www.youtube.com/kepowob'} ],
                visualizers: [ {label: 'CodePen Live Editor', url: 'https://codepen.io'} ],
                certifications: [ {label: 'freeCodeCamp Responsive Web Design', url: 'https://www.freecodecamp.org/learn/responsive-web-design/'} ],
                projects: ['Personal portfolio homepage', 'Landing page clone']
            },
            css: {
                tutorials: [ {label: 'MDN CSS Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS'}, {label: 'CSS-Tricks', url: 'https://css-tricks.com'} ],
                practice: [ {label: 'CSS Battle', url: 'https://cssbattle.dev'}, {label: 'Frontend Mentor (CSS)', url: 'https://www.frontendmentor.io'} ],
                youtube: [ {label: 'Kevin Powell', url: 'https://www.youtube.com/kepowob'}, {label: 'The Net Ninja', url: 'https://www.youtube.com/channel/UCW5YeuERMmlnqo4oq8vwUpg'} ],
                visualizers: [ {label: 'CSS Grid Generator', url: 'https://cssgrid-generator.netlify.app/' } ],
                certifications: [],
                projects: ['Responsive landing page', 'Portfolio with CSS Grid/Flexbox']
            },
            react: {
                tutorials: [ {label: 'React Official Docs', url: 'https://react.dev/'}, {label: 'React Tutorial (Codecademy/freeCodeCamp)', url: 'https://www.freecodecamp.org/learn'} ],
                practice: [ {label: 'Frontend Mentor (React)', url: 'https://www.frontendmentor.io'}, {label: 'Build small apps', url: 'https://github.com' } ],
                youtube: [ {label: 'Traversy Media React', url: 'https://www.youtube.com/user/TechGuyWeb'}, {label: 'Academind', url: 'https://www.youtube.com/c/Academind'} ],
                visualizers: [ {label: 'React DevTools', url: 'https://react.dev/tools'} ],
                certifications: [],
                projects: ['To-do React App', 'Weather app with API']
            },
            java: {
                tutorials: [ {label: 'Oracle Java Documentation', url: 'https://docs.oracle.com/en/java/'}, {label: 'GeeksforGeeks Java', url: 'https://www.geeksforgeeks.org/java/'} ],
                practice: [ {label: 'HackerRank Java', url: 'https://www.hackerrank.com/domains/java'}, {label: 'CodingBat Java', url: 'https://codingbat.com/java'} ],
                youtube: [ {label: 'Telusko', url: 'https://www.youtube.com/c/Telusko'}, {label: 'Bro Code', url: 'https://www.youtube.com/c/BroCode'} ],
                visualizers: [],
                certifications: [ {label: 'Coursera Java Specialization', url: 'https://www.coursera.org'} ],
                projects: ['Student record CLI app', 'Simple REST API with Spring Boot']
            },
            postgresql: {
                tutorials: [ {label: 'PostgreSQL Docs', url: 'https://www.postgresql.org/docs/'}, {label: 'Postgres Tutorial', url: 'https://www.postgresqltutorial.com/'} ],
                practice: [ {label: 'Mode SQL Tutorial', url: 'https://mode.com/sql-tutorial/'}, {label: 'LeetCode SQL', url: 'https://leetcode.com/problemset/database/'} ],
                youtube: [ {label: 'freeCodeCamp SQL', url: 'https://www.youtube.com/freecodecamp'}, {label: 'Caleb Curry (SQL)', url: 'https://www.youtube.com/user/CalebTheVideoMaker2'} ],
                visualizers: [],
                certifications: [],
                projects: ['Design a student database schema', 'Implement queries and reports']
            },
            dbms: {
                tutorials: [ {label: 'DBMS Concepts (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/dbms/'}, {label: 'Database Systems (tutorialspoint)', url: 'https://www.tutorialspoint.com/dbms/'} ],
                practice: [ {label: 'SQLZoo', url: 'https://sqlzoo.net/'}, {label: 'LeetCode Database', url: 'https://leetcode.com/problemset/database/'} ],
                youtube: [ {label: 'thenewboston', url: 'https://www.youtube.com/user/thenewboston'}, {label: 'mycodeschool', url: 'https://www.youtube.com/user/mycodeschool'} ],
                visualizers: [],
                certifications: [],
                projects: ['ER modeling and normalization exercises', 'Implement relational schemas']
            },
            os: {
                tutorials: [ {label: 'Operating Systems (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/operating-systems/'}, {label: 'OS Concepts (Tutorialspoint)', url: 'https://www.tutorialspoint.com/operating_system/'} ],
                practice: [ {label: 'GATE/DSA practice sets', url: 'https://gateoverflow.in/' } ],
                youtube: [ {label: 'Neso Academy', url: 'https://www.youtube.com/c/nesoacademy'}, {label: 'Gaurav Sen', url: 'https://www.youtube.com/c/GauravSen'} ],
                visualizers: [],
                certifications: [],
                projects: ['Simulate scheduling algorithms', 'Memory management simulation']
            },
            cn: {
                tutorials: [ {label: 'Computer Networks (GeeksforGeeks)', url: 'https://www.geeksforgeeks.org/computer-network-tutorials/'}, {label: 'TCP/IP Guide', url: 'http://www.tcpipguide.com/'} ],
                practice: [ {label: 'Wireshark exercises', url: 'https://www.wireshark.org/docs/' } ],
                youtube: [ {label: 'Computerphile', url: 'https://www.youtube.com/user/Computerphile'}, {label: 'Neso Academy', url: 'https://www.youtube.com/c/nesoacademy'} ],
                visualizers: [],
                certifications: [],
                projects: ['Packet capture analysis with Wireshark', 'Build a basic socket chat program']
            },
            default: {
                tutorials: [
                    {label: 'Official Docs', url: 'https://www.google.com/search?q=' + encodeURIComponent(subjectKey + ' documentation')},
                    {label: 'freeCodeCamp Tutorials', url: 'https://www.freecodecamp.org'}
                ],
                practice: [
                    {label: 'HackerRank', url: 'https://www.hackerrank.com'},
                    {label: 'GeeksforGeeks Practice', url: 'https://practice.geeksforgeeks.org'}
                ],
                youtube: [
                    {label: 'freeCodeCamp', url: 'https://www.youtube.com/freecodecamp'},
                    {label: 'Traversy Media', url: 'https://www.youtube.com/user/TechGuyWeb'}
                ],
                visualizers: [],
                certifications: [
                    {label: 'Coursera / edX - Search', url: 'https://www.coursera.org'},
                ],
                projects: [
                    'Mini project to practice core concepts',
                    'One intermediate build integrating libraries or APIs',
                    'Capstone-style small application demonstrating end-to-end flow'
                ]
            },
            c: {
                tutorials: [ {label: 'Learn-C.org', url: 'https://www.learn-c.org'}, {label: 'TutorialsPoint C', url: 'https://www.tutorialspoint.com/cprogramming/'} ],
                practice: [ {label: 'HackerRank C', url: 'https://www.hackerrank.com/domains/c'} ],
                youtube: [ {label: 'Neso Academy', url: 'https://www.youtube.com/c/nesoacademy'}, {label: 'Apna College', url: 'https://www.youtube.com/channel/UC1u9L4W8t1j5Z1nKZVQW7Gg'} ],
                visualizers: [ {label: 'OnlineGDB (debugger)', url: 'https://www.onlinegdb.com/online_c_compiler'} ],
                certifications: [],
                projects: ['Simple calculator', 'Student DB system', 'Tic-Tac-Toe game']
            },
            python: {
                tutorials: [ {label: 'Python.org Docs', url: 'https://docs.python.org/3/'}, {label: 'Real Python', url: 'https://realpython.com/'} ],
                practice: [ {label: 'HackerRank Python', url: 'https://www.hackerrank.com/domains/python'}, {label: 'LeetCode', url: 'https://leetcode.com'} ],
                youtube: [ {label: 'Corey Schafer', url: 'https://www.youtube.com/user/schafer5'}, {label: 'freeCodeCamp', url: 'https://www.youtube.com/freecodecamp'} ],
                visualizers: [ {label: 'Python Tutor', url: 'http://pythontutor.com/visualize.html'} ],
                certifications: [ {label: 'Coursera - Python for Everybody', url: 'https://www.coursera.org/specializations/python'} ],
                projects: ['Data processing script', 'Web scraper', 'Small Flask web app']
            },
            javascript: {
                tutorials: [ {label: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'}, {label: 'JavaScript.info', url: 'https://javascript.info/'} ],
                practice: [ {label: 'freeCodeCamp JS', url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/'}, {label: 'Codewars', url: 'https://www.codewars.com'} ],
                youtube: [ {label: 'Traversy Media', url: 'https://www.youtube.com/user/TechGuyWeb'}, {label: 'The Net Ninja', url: 'https://www.youtube.com/channel/UCW5YeuERMmlnqo4oq8vwUpg'} ],
                visualizers: [ {label: 'JS Tutor & Console', url: 'https://pythontutor.com/javascript.html'} ],
                certifications: [],
                projects: ['Interactive to-do app', 'Single-page portfolio', 'API-based dashboard']
            },
            sql: {
                tutorials: [ {label: 'SQLBolt', url: 'https://sqlbolt.com/'}, {label: 'W3Schools SQL', url: 'https://www.w3schools.com/sql/'} ],
                practice: [ {label: 'Mode SQL Tutorial', url: 'https://mode.com/sql-tutorial/'}, {label: 'LeetCode SQL', url: 'https://leetcode.com/problemset/database/'} ],
                youtube: [ {label: 'thenewboston', url: 'https://www.youtube.com/user/thenewboston'} ],
                visualizers: [],
                certifications: [ {label: 'IBM Data Science / SQL', url: 'https://www.coursera.org/learn/sql-data-science'} ],
                projects: ['Student records DB', 'Inventory management schema']
            }
        };

        const data = resourcesData[subjectKey] || resourcesData.default;

        // Roadmap.sh mapping
        const ROADMAP_SH_MAP = {
            'html': 'https://roadmap.sh/html',
            'css': 'https://roadmap.sh/css',
            'javascript': 'https://roadmap.sh/javascript',
            'python': 'https://roadmap.sh/python',
            'c': 'https://roadmap.sh/c',
            'java': 'https://roadmap.sh/java',
            'sql': 'https://roadmap.sh/sql',
            'postgresql': 'https://roadmap.sh/postgresql',
            'dbms': 'https://roadmap.sh/sql',
            'os': 'https://roadmap.sh/computer-science',
            'cn': 'https://roadmap.sh/computer-science',
            'react': 'https://roadmap.sh/react',
            'dsa': 'https://roadmap.sh/computer-science'
        };
        const pageRoadmapUrl = ROADMAP_SH_MAP[subjectKey] || null;

        // Build HTML
        const container = document.createElement('section');
        container.id = 'resources-section';
        container.innerHTML = `
            <h3>Study Resources & Roadmap</h3>
            <div id="page-progress-container"></div>
            <h4>Roadmap</h4>
            <ul class="resource-roadmap">
                <li>Follow the syllabus: fundamentals → intermediate → projects</li>
                ${pageRoadmapUrl ? `<li>🗺️ <strong>Interactive Path:</strong> <a href="${pageRoadmapUrl}" target="_blank" style="font-weight: bold; text-decoration: underline;">View roadmap.sh Roadmap</a></li>` : ''}
            </ul>
            <h4>Checkpoints</h4>
            <ul class="resource-checkpoints">
                <li><label><input type="checkbox" id="${subjectKey}-task-1" class="progress-check"> Core syntax and basics</label></li>
                <li><label><input type="checkbox" id="${subjectKey}-task-2" class="progress-check"> Data structures and common patterns</label></li>
                <li><label><input type="checkbox" id="${subjectKey}-task-3" class="progress-check"> Debugging and testing</label></li>
                <li><label><input type="checkbox" id="${subjectKey}-task-4" class="progress-check"> Build a small project</label></li>
            </ul>
            <h4>Practice Problems & Challenges</h4>
            <ul class="resource-practice">
                ${data.practice.map(p => `<li><a href="${p.url}" target="_blank">${p.label}</a></li>`).join('')}
            </ul>
            ${data.visualizers && data.visualizers.length ? `<h4>Visualizers & Debuggers</h4><ul>${data.visualizers.map(v=>`<li><a href="${v.url}" target="_blank">${v.label}</a></li>`).join('')}</ul>` : ''}
            <h4>Tutorials & Documentation</h4>
            <ul class="resource-tutorials">
                ${data.tutorials.map(t => `<li><a href="${t.url}" target="_blank">${t.label}</a></li>`).join('')}
            </ul>
            ${data.certifications && data.certifications.length ? `<h4>Certifications</h4><ul>${data.certifications.map(c=>`<li><a href="${c.url}" target="_blank">${c.label}</a></li>`).join('')}</ul>` : ''}
            <h4>YouTube Channels (language preferences)</h4>
            <ul class="resource-youtube">
                ${data.youtube.map(y => `<li><a href="${y.url}" target="_blank">${y.label}</a></li>`).join('')}
            </ul>
            <h4>Projects</h4>
            <ul class="resource-projects">
                ${data.projects.map(p => `<li>${p}</li>`).join('')}
            </ul>
        `;

        // Find a sensible insertion point: after the last main heading or at body end
        const mainCandidate = document.querySelector('main') || document.querySelector('article') || document.body;
        mainCandidate.appendChild(container);

        // Re-run tracker initialization on newly inserted checkboxes
        const newChecks = container.querySelectorAll('.progress-check');
        newChecks.forEach(function(checkbox) {
            const id = checkbox.getAttribute('id');
            if (id && localStorage.getItem(id) === 'true') checkbox.checked = true;
            checkbox.addEventListener('change', function() {
                if (id) {
                    localStorage.setItem(id, checkbox.checked ? 'true' : 'false');
                    syncProgressToBackend(id, checkbox.checked);
                }
                if (window.updateHomepageProgress) window.updateHomepageProgress();
            });
        });

        // If there is a local reference sheet for this subject, try to fetch and embed it
        (function tryEmbedLocalReference() {
            const localRefMap = {
                'c': 'C.html',
                'python': 'Python.html',
                'java': 'Java.html',
                'javascript': 'JavaScript.html',
                'html': 'HTML.html',
                'css': 'CSS.html',
                'sql': 'SQL.html',
                'postgresql': 'PostgreSQL.html',
                'dbms': 'DBMS.html',
                'os': 'OS.html',
                'cn': 'CN.html',
                'react': 'ReactJS.html',
                'reactjs': 'ReactJS.html'
            };

            const candidate = localRefMap[subjectKey] || (subjectKey ? (subjectKey.charAt(0).toUpperCase() + subjectKey.slice(1)) + '.html' : null);
            if (!candidate) return;

            // Avoid embedding the same file into itself
            const currentFile = fileName || '';
            if (candidate.toLowerCase() === currentFile.toLowerCase()) return;

            fetch(candidate).then(function(resp) {
                if (!resp.ok) throw new Error('Not found');
                return resp.text();
            }).then(function(htmlText) {
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlText, 'text/html');
                    const bodyContent = doc.body ? doc.body.innerHTML : htmlText;

                    const embedSection = document.createElement('section');
                    embedSection.className = 'local-reference-embed';
                    embedSection.innerHTML = `<h4>Local Reference (embedded): <small><a href="${candidate}" target="_blank">open</a></small></h4>` + bodyContent;

                    // Append after resources container
                    container.appendChild(embedSection);
                } catch (e) {
                    console.warn('Failed to parse local reference:', e);
                }
            }).catch(function() {
                // no local reference available - silently ignore
            });
        })();

    } catch (e) {
        console.error('Error injecting resources section:', e);
    }
});

// Simple client-side search utilities for home and references pages
(function() {
    function normalize(s) { return (s || '').toString().toLowerCase(); }

    function searchAndShowResults(query, resultsContainer) {
        const q = normalize(query).trim();
        if (!resultsContainer) return;
        resultsContainer.innerHTML = '';
        if (!q) {
            resultsContainer.classList.remove('active');
            return;
        }

        // Find matching anchors and headings
        const matches = [];
        document.querySelectorAll('a, h1, h2, h3, h4, p, li').forEach(function(el) {
            // Avoid matching headers, navigation links, and settings dropdowns to reduce clutter
            if (el.closest('nav') || el.closest('#site-settings-bar') || el.closest('.search-row') || el.closest('.search-results')) {
                return;
            }
            if (normalize(el.innerText).includes(q)) {
                let text = el.innerText.trim();
                let href = el.getAttribute('href') || null;
                if (text && text.length < 150 && !matches.some(m => m.text === text)) {
                    matches.push({text, href});
                }
            }
        });

        if (matches.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results-text">No results found.</div>';
            resultsContainer.classList.add('active');
            return;
        }

        const ul = document.createElement('ul');
        matches.slice(0, 10).forEach(function(m) {
            const li = document.createElement('li');
            if (m.href) {
                const a = document.createElement('a');
                a.href = m.href;
                a.target = '_blank';
                a.innerText = m.text;
                li.appendChild(a);
            } else {
                li.innerText = m.text;
            }
            ul.appendChild(li);
        });
        resultsContainer.appendChild(ul);
        resultsContainer.classList.add('active');
    }

    // Reference page: hide non-matching sections grouped by h3
    function filterReferenceSections(query) {
        const q = normalize(query).trim();
        const headings = document.querySelectorAll('h3');
        headings.forEach(function(h3) {
            // Collect group text (h3 + following siblings until next h3)
            let groupText = h3.innerText + ' ';
            let node = h3.nextElementSibling;
            while (node && node.tagName.toLowerCase() !== 'h3') {
                groupText += ' ' + node.innerText;
                node = node.nextElementSibling;
            }
            const matched = q === '' || normalize(groupText).includes(q);
            // show/hide h3 and its following nodes
            h3.style.display = matched ? '' : 'none';
            node = h3.nextElementSibling;
            while (node && node.tagName.toLowerCase() !== 'h3') {
                node.style.display = matched ? '' : 'none';
                node = node.nextElementSibling;
            }
        });
    }

    // Wire up inputs if present on page
    document.addEventListener('DOMContentLoaded', function() {
        const homeInput = document.getElementById('home-search');
        const homeBtn = document.getElementById('home-search-btn');
        const homeResults = document.getElementById('home-search-results');
        if (homeInput) {
            const handler = function() {
                searchAndShowResults(homeInput.value, homeResults);
            };
            homeInput.addEventListener('input', handler);
            if (homeBtn) homeBtn.addEventListener('click', handler);
        }

        const refInput = document.getElementById('ref-search');
        const refBtn = document.getElementById('ref-search-btn');
        const refResults = document.getElementById('ref-search-results');
        if (refInput) {
            const handlerRef = function() {
                // populate results and also filter sections
                searchAndShowResults(refInput.value, refResults);
                filterReferenceSections(refInput.value);
            };
            refInput.addEventListener('input', handlerRef);
            if (refBtn) refBtn.addEventListener('click', handlerRef);
        }
    });

    // Expose for debugging
    window.searchPage = function(q) {
        const r = document.getElementById('home-search-results') || document.getElementById('ref-search-results');
        searchAndShowResults(q, r);
        filterReferenceSections(q);
    };
})();

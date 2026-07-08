// Pravio Notes Concept Replay Visualizer

export class Visualizer {
    constructor(app) {
        this.app = app;
        this.isRunning = false;
        this.shouldStop = false;
    }

    async play(note) {
        if (this.isRunning) {
            this.shouldStop = true;
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        this.isRunning = true;
        this.shouldStop = false;

        const screen = document.getElementById('viz-screen-player');
        if (!screen) return;

        // Choose animation depending on note category/language
        if (note.id === 'n-eventloop' || note.tags.includes('JavaScript')) {
            await this.animateEventLoop(screen);
        } else if (note.id === 'n-bubblesort' || note.tags.includes('Sorting')) {
            await this.animateSorting(screen);
        } else if (note.id === 'n-sqljoins' || note.tags.includes('SQL')) {
            await this.animateSqlJoin(screen);
        } else {
            // Default generic array animation
            await this.animateGenericArray(screen);
        }

        this.isRunning = false;
    }

    async animateEventLoop(screen) {
        screen.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%; height: 100%; gap: 16px; font-family: var(--font-sans); padding: 10px;">
                <div style="display: flex; justify-content: space-between; flex: 1; gap: 10px;">
                    <!-- Call Stack -->
                    <div style="flex: 1; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px; display: flex; flex-direction: column-reverse; gap: 6px; background: rgba(0,0,0,0.2);">
                        <div style="text-align: center; font-size: 0.65rem; color: var(--text-muted); font-weight: 700; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px;">CALL STACK</div>
                        <div id="stack-box" style="display: flex; flex-direction: column-reverse; gap: 4px;"></div>
                    </div>

                    <!-- Event Loop Spin Wheel -->
                    <div style="width: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
                        <div class="event-loop-wheel" id="loop-wheel">
                            <i data-lucide="refresh-cw" style="color: var(--color-primary); width: 24px; height: 24px;"></i>
                        </div>
                        <span style="font-size: 0.6rem; color: var(--text-muted); font-weight: 600; text-align: center;">EVENT LOOP</span>
                    </div>

                    <!-- Web APIs -->
                    <div style="flex: 1; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px; display: flex; flex-direction: column; gap: 6px; background: rgba(0,0,0,0.2);">
                        <div style="text-align: center; font-size: 0.65rem; color: var(--text-muted); font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px;">WEB APIS</div>
                        <div id="web-api-box" style="display: flex; flex-direction: column; gap: 4px;"></div>
                    </div>
                </div>

                <!-- Callback Queue -->
                <div style="height: 64px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px; display: flex; flex-direction: column; gap: 4px; background: rgba(0,0,0,0.2);">
                    <div style="font-size: 0.6rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Callback Queue (MacroTasks)</div>
                    <div id="queue-box" style="display: flex; gap: 6px; align-items: center;"></div>
                </div>

                <!-- Console Console -->
                <div style="height: 80px; background-color: #000; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); padding: 8px; overflow-y: auto; font-family: var(--font-mono); font-size: 0.7rem; color: #a3e635;">
                    <div style="font-size: 0.55rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 4px; margin-bottom: 4px;">Console Outputs</div>
                    <div id="viz-console-lines"></div>
                </div>
            </div>
        `;
        lucide.createIcons();

        const stack = screen.querySelector('#stack-box');
        const webApi = screen.querySelector('#web-api-box');
        const queue = screen.querySelector('#queue-box');
        const loopWheel = screen.querySelector('#loop-wheel');
        const logs = screen.querySelector('#viz-console-lines');

        const writeLog = (txt) => {
            logs.innerHTML += `<div style="margin-bottom: 2px;">&gt; ${txt}</div>`;
            logs.scrollTop = logs.scrollHeight;
        };

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        if (this.shouldStop) return;

        // Step 1: console.log("Start")
        stack.innerHTML = `<div class="arr-element" style="height: 30px; font-size: 0.75rem; width: 100%;">console.log("Start")</div>`;
        writeLog("Start");
        await sleep(1000);
        if (this.shouldStop) return;
        stack.innerHTML = '';

        // Step 2: setTimeout(..., 0)
        stack.innerHTML = `<div class="arr-element" style="height: 30px; font-size: 0.75rem; width: 100%;">setTimeout(fn, 0)</div>`;
        await sleep(600);
        if (this.shouldStop) return;
        
        // Push to Web API
        webApi.innerHTML = `<div class="arr-element" style="height: 30px; font-size: 0.7rem; width: 100%; background: var(--color-accent);">Timer (0ms)</div>`;
        stack.innerHTML = '';
        await sleep(800);
        if (this.shouldStop) return;

        // Web API timer triggers callback push to Queue
        queue.innerHTML = `<div class="arr-element" style="height: 30px; font-size: 0.7rem; width: 60px; background: var(--color-secondary);">cb()</div>`;
        webApi.innerHTML = '';
        await sleep(800);
        if (this.shouldStop) return;

        // Step 3: console.log("End")
        stack.innerHTML = `<div class="arr-element" style="height: 30px; font-size: 0.75rem; width: 100%;">console.log("End")</div>`;
        writeLog("End");
        await sleep(1000);
        if (this.shouldStop) return;
        stack.innerHTML = '';

        // Step 4: Event loop triggers
        loopWheel.classList.add('spinning');
        await sleep(1000);
        if (this.shouldStop) return;

        // Push callback to Call stack
        stack.innerHTML = `<div class="arr-element" style="height: 30px; font-size: 0.75rem; width: 100%;">cb()</div>`;
        queue.innerHTML = '';
        loopWheel.classList.remove('spinning');
        await sleep(600);
        if (this.shouldStop) return;

        // Call stack runs callback contents
        stack.innerHTML += `<div class="arr-element" style="height: 30px; font-size: 0.75rem; width: 100%;">console.log("Timeout")</div>`;
        writeLog("Async Timeout Callback");
        await sleep(1000);
        
        stack.innerHTML = '';
    }

    async animateSorting(screen) {
        screen.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%; height: 100%; align-items: center; justify-content: center; gap: 20px;">
                <div style="display: flex; align-items: flex-end; justify-content: center; gap: 8px; height: 180px; width: 100%; border-bottom: 2px solid rgba(255,255,255,0.05); padding-bottom: 10px;" id="viz-bars-container">
                    <!-- Dynamic Bars -->
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);" id="viz-sort-status">
                    Bubble Sorting Array...
                </div>
            </div>
        `;

        const container = screen.querySelector('#viz-bars-container');
        const status = screen.querySelector('#viz-sort-status');
        
        const array = [60, 20, 80, 40, 50];
        const bars = [];

        // Build bars
        array.forEach(val => {
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = `${val}%`;
            bar.style.width = '30px';
            bar.style.background = 'linear-gradient(180deg, var(--color-primary), rgba(99,102,241,0.4))';
            bar.style.borderRadius = '4px 4px 0 0';
            
            const barVal = document.createElement('span');
            barVal.style.fontSize = '0.65rem';
            barVal.style.color = '#fff';
            barVal.style.display = 'block';
            barVal.style.textAlign = 'center';
            barVal.style.marginTop = '-16px';
            barVal.innerText = val;
            bar.appendChild(barVal);

            container.appendChild(bar);
            bars.push(bar);
        });

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Simple bubble sort run
        for (let i = 0; i < array.length; i++) {
            for (let j = 0; j < array.length - i - 1; j++) {
                if (this.shouldStop) return;

                // Highlight compare
                bars[j].style.background = 'var(--color-secondary)';
                bars[j+1].style.background = 'var(--color-secondary)';
                status.innerText = `Compare indices ${j} & ${j+1} (${array[j]} vs ${array[j+1]})`;
                await sleep(600);
                if (this.shouldStop) return;

                if (array[j] > array[j + 1]) {
                    // swap in array
                    const temp = array[j];
                    array[j] = array[j + 1];
                    array[j + 1] = temp;

                    // swap heights and text
                    const tempH = bars[j].style.height;
                    bars[j].style.height = bars[j+1].style.height;
                    bars[j+1].style.height = tempH;

                    const tempText = bars[j].querySelector('span').innerText;
                    bars[j].querySelector('span').innerText = bars[j+1].querySelector('span').innerText;
                    bars[j+1].querySelector('span').innerText = tempText;

                    bars[j].style.background = 'var(--color-accent)';
                    bars[j+1].style.background = 'var(--color-accent)';
                    status.innerText = `Swap elements ${array[j]} & ${array[j+1]}`;
                    await sleep(600);
                }

                // Reset colors
                bars[j].style.background = 'linear-gradient(180deg, var(--color-primary), rgba(99,102,241,0.4))';
                bars[j+1].style.background = 'linear-gradient(180deg, var(--color-primary), rgba(99,102,241,0.4))';
            }
            // Mark sorted
            bars[array.length - i - 1].style.background = 'var(--color-secondary)';
        }

        status.innerText = 'Sorting Completed!';
    }

    async animateSqlJoin(screen) {
        screen.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%; height: 100%; gap: 10px; font-family: var(--font-sans); padding: 8px;">
                <div style="display: flex; gap: 8px; justify-content: space-between; flex: 1;">
                    <!-- Users Table -->
                    <div style="flex: 1; border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 4px; background: rgba(0,0,0,0.15);">
                        <div style="font-size: 0.6rem; color: var(--text-muted); font-weight: 700; text-align: center; margin-bottom: 4px;">USERS TABLE</div>
                        <div class="sql-table-grid" id="sql-users-box">
                            <div class="sql-row" style="font-weight:700;">ID</div><div class="sql-row" style="font-weight:700;">Name</div><div class="sql-row" style="font-weight:700;">Status</div>
                            <div class="sql-row u-row" data-id="1">1</div><div class="sql-row u-row" data-id="1">Alice</div><div class="sql-row u-row" data-id="1">Act</div>
                            <div class="sql-row u-row" data-id="2">2</div><div class="sql-row u-row" data-id="2">Bob</div><div class="sql-row u-row" data-id="2">Act</div>
                        </div>
                    </div>

                    <!-- Orders Table -->
                    <div style="flex: 1; border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 4px; background: rgba(0,0,0,0.15);">
                        <div style="font-size: 0.6rem; color: var(--text-muted); font-weight: 700; text-align: center; margin-bottom: 4px;">ORDERS TABLE</div>
                        <div class="sql-table-grid" id="sql-orders-box">
                            <div class="sql-row" style="font-weight:700;">ID</div><div class="sql-row" style="font-weight:700;">UID</div><div class="sql-row" style="font-weight:700;">Amt</div>
                            <div class="sql-row o-row" data-uid="1">10</div><div class="sql-row o-row" data-uid="1">1</div><div class="sql-row o-row" data-uid="1">$40</div>
                            <div class="sql-row o-row" data-uid="3">20</div><div class="sql-row o-row" data-uid="3">3</div><div class="sql-row o-row" data-uid="3">$80</div>
                        </div>
                    </div>
                </div>

                <!-- Joined output -->
                <div style="height: 100px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px; background: rgba(0,0,0,0.25);">
                    <div style="font-size: 0.6rem; color: var(--color-secondary); font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Joined ResultSet (INNER JOIN)</div>
                    <div class="sql-table-grid" id="sql-joined-box" style="grid-template-columns: repeat(3, 1fr);">
                        <div class="sql-row" style="font-weight:700; background:rgba(255,255,255,0.05);">Name</div>
                        <div class="sql-row" style="font-weight:700; background:rgba(255,255,255,0.05);">UID</div>
                        <div class="sql-row" style="font-weight:700; background:rgba(255,255,255,0.05);">Amount</div>
                    </div>
                </div>
            </div>
        `;

        const users = screen.querySelectorAll('.u-row');
        const orders = screen.querySelectorAll('.o-row');
        const joined = screen.querySelector('#sql-joined-box');

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        if (this.shouldStop) return;

        // Step 1: Scan Alice (uid 1)
        users.forEach(u => {
            if (u.getAttribute('data-id') === '1') u.classList.add('matched');
        });
        await sleep(800);
        if (this.shouldStop) return;

        // Scan orders looking for user_id = 1
        orders.forEach(o => {
            if (o.getAttribute('data-uid') === '1') o.classList.add('matched');
        });
        await sleep(800);
        if (this.shouldStop) return;

        // Found match -> Push to joined set
        joined.innerHTML += `
            <div class="sql-row matched" style="background:rgba(20,184,166,0.1);">Alice</div>
            <div class="sql-row matched" style="background:rgba(20,184,166,0.1);">1</div>
            <div class="sql-row matched" style="background:rgba(20,184,166,0.1);">$40</div>
        `;
        await sleep(1000);
        if (this.shouldStop) return;

        // Reset highlight
        users.forEach(u => u.classList.remove('matched'));
        orders.forEach(o => o.classList.remove('matched'));

        // Step 2: Scan Bob (uid 2)
        users.forEach(u => {
            if (u.getAttribute('data-id') === '2') u.classList.add('matched');
        });
        await sleep(800);
        if (this.shouldStop) return;

        // Scan orders for uid 2
        orders.forEach(o => {
            if (o.getAttribute('data-uid') === '2') {
                o.classList.add('matched');
            } else {
                o.style.opacity = '0.3'; // highlight unmatched check
            }
        });
        await sleep(1000);
        
        // Bob has no orders -> No match added (Inner join)
        orders.forEach(o => {
            o.style.opacity = '1';
            o.classList.remove('matched');
        });
        users.forEach(u => u.classList.remove('matched'));
    }

    async animateGenericArray(screen) {
        screen.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%; height: 100%; align-items: center; justify-content: center; gap: 20px;">
                <div style="display: flex; gap: 8px;" id="viz-arr-box">
                    <div class="arr-element">10</div>
                    <div class="arr-element">25</div>
                    <div class="arr-element">40</div>
                    <div class="arr-element">55</div>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);" id="viz-arr-status">
                    Replaying Array insertion at index 1...
                </div>
            </div>
        `;

        const container = screen.querySelector('#viz-arr-box');
        const status = screen.querySelector('#viz-arr-status');
        const elements = Array.from(container.children);

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        if (this.shouldStop) return;

        // Highlight shifting index 2, 3
        elements[2].classList.add('highlighted');
        elements[3].classList.add('highlighted');
        status.innerText = 'Shift elements at indices 2 & 3 rightward';
        await sleep(1000);
        if (this.shouldStop) return;

        // Insert new element
        const newEl = document.createElement('div');
        newEl.className = 'arr-element highlighted';
        newEl.style.background = 'var(--color-secondary)';
        newEl.innerText = '99';
        
        container.insertBefore(newEl, elements[1]);
        status.innerText = 'Insert element 99 at index 1';
        await sleep(1000);
        
        newEl.classList.remove('highlighted');
        elements.forEach(el => el.classList.remove('highlighted'));
        status.innerText = 'Insertion Completed!';
    }
}

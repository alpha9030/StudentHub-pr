// Pravio Notes Flowchart & Diagram Board

export class FlowchartBoard {
    constructor(app) {
        this.app = app;
        this.selectedNode = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
    }

    render(container, note) {
        if (!note.flowchart || !note.flowchart.nodes) {
            note.flowchart = { nodes: [], links: [] };
        }

        container.innerHTML = `
            <div class="canvas-panel" style="height: auto; margin-bottom: 24px; display: flex; flex-direction: column;">
                <!-- Flowchart toolbar -->
                <div class="canvas-toolbar" style="gap: 8px;">
                    <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-right: auto;">
                        FLOWCHART & DIAGRAM SUITE
                    </span>
                    <span style="font-size: 0.7rem; color: var(--text-muted);">Click shapes on the left to add them. Drag to move. Connect on the right.</span>
                </div>

                <div style="display: flex; gap: 16px; margin-top: 12px; flex-wrap: wrap;">
                    <!-- Left Sidebar: Visual Shapes Library -->
                    <div id="flowchart-shapes-library" style="width: 170px; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; gap: 12px;">
                        <h4 style="font-weight: 700; color: var(--text-main); font-size: 0.8rem; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; margin-bottom: 4px;">Shapes Library</h4>
                        
                        <!-- Start/End shape card -->
                        <div class="shape-library-item" id="lib-shape-start" style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px; cursor: pointer; text-align: center; background-color: var(--bg-input); transition: border-color 0.15s, background-color 0.15s;">
                            <svg width="100" height="30" style="display: block; margin: 0 auto 6px auto;">
                                <rect x="10" y="5" width="80" height="20" rx="10" ry="10" fill="none" stroke="var(--color-primary-light)" stroke-width="1.5"/>
                                <text x="50" y="15" font-size="8" fill="var(--text-main)" text-anchor="middle" dominant-baseline="middle" font-weight="600">Start / End</text>
                            </svg>
                        </div>

                        <!-- Process shape card -->
                        <div class="shape-library-item" id="lib-shape-process" style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px; cursor: pointer; text-align: center; background-color: var(--bg-input); transition: border-color 0.15s, background-color 0.15s;">
                            <svg width="100" height="30" style="display: block; margin: 0 auto 6px auto;">
                                <rect x="10" y="5" width="80" height="20" rx="2" fill="none" stroke="var(--color-primary-light)" stroke-width="1.5"/>
                                <text x="50" y="15" font-size="8" fill="var(--text-main)" text-anchor="middle" dominant-baseline="middle" font-weight="600">Process Step</text>
                            </svg>
                        </div>

                        <!-- Decision (Rhombus) shape card -->
                        <div class="shape-library-item" id="lib-shape-decision" style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px; cursor: pointer; text-align: center; background-color: var(--bg-input); transition: border-color 0.15s, background-color 0.15s;">
                            <svg width="100" height="35" style="display: block; margin: 0 auto 4px auto;">
                                <polygon points="50,2 90,17 50,32 10,17" fill="none" stroke="var(--color-primary-light)" stroke-width="1.5"/>
                                <text x="50" y="17" font-size="8" fill="var(--text-main)" text-anchor="middle" dominant-baseline="middle" font-weight="600">Rhombus</text>
                            </svg>
                        </div>

                        <!-- Data I/O shape card -->
                        <div class="shape-library-item" id="lib-shape-io" style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px; cursor: pointer; text-align: center; background-color: var(--bg-input); transition: border-color 0.15s, background-color 0.15s;">
                            <svg width="100" height="30" style="display: block; margin: 0 auto 6px auto;">
                                <polygon points="18,5 92,5 82,25 8,25" fill="none" stroke="var(--color-primary-light)" stroke-width="1.5"/>
                                <text x="50" y="15" font-size="8" fill="var(--text-main)" text-anchor="middle" dominant-baseline="middle" font-weight="600">Data I/O</text>
                            </svg>
                        </div>

                        <!-- Triangle shape card -->
                        <div class="shape-library-item" id="lib-shape-triangle" style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px; cursor: pointer; text-align: center; background-color: var(--bg-input); transition: border-color 0.15s, background-color 0.15s;">
                            <svg width="100" height="35" style="display: block; margin: 0 auto 4px auto;">
                                <polygon points="50,4 85,28 15,28" fill="none" stroke="var(--color-primary-light)" stroke-width="1.5"/>
                                <text x="50" y="19" font-size="8" fill="var(--text-main)" text-anchor="middle" dominant-baseline="middle" font-weight="600">Triangle</text>
                            </svg>
                        </div>
                    </div>

                    <!-- Middle: SVG Canvas Area -->
                    <div class="flowchart-canvas" style="flex: 1; min-width: 320px; height: 420px; border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden; position: relative;">
                        <svg class="flowchart-svg" id="flowchart-canvas-svg" style="background-color: var(--bg-input); width: 100%; height: 100%;">
                            <!-- Markers for arrows -->
                            <defs>
                                <marker id="flow-arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text-muted)" />
                                </marker>
                            </defs>
                            <g id="flow-links-group"></g>
                            <g id="flow-nodes-group"></g>
                        </svg>
                    </div>

                    <!-- Right: Sidebar Properties Panel -->
                    <div id="flowchart-properties-panel" style="width: 250px; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 16px;">
                        <!-- Filled dynamically -->
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();
        this.draw(note);
        this.setupEvents(container, note);
    }

    draw(note) {
        const svg = document.getElementById('flowchart-canvas-svg');
        if (!svg) return;

        const nodesGroup = svg.getElementById('flow-nodes-group');
        const linksGroup = svg.getElementById('flow-links-group');

        // Draw Links first
        linksGroup.innerHTML = note.flowchart.links.map(link => {
            const fromNode = note.flowchart.nodes.find(n => n.id === link.from);
            const toNode = note.flowchart.nodes.find(n => n.id === link.to);
            if (!fromNode || !toNode) return '';

            // Calculate simple straight line
            return `
                <g class="flow-link-group">
                    <line class="flow-link" x1="${fromNode.x}" y1="${fromNode.y}" x2="${toNode.x}" y2="${toNode.y}" marker-end="url(#flow-arrow)"/>
                    ${link.label ? `
                        <rect x="${(fromNode.x + toNode.x)/2 - 25}" y="${(fromNode.y + toNode.y)/2 - 8}" width="50" height="15" fill="var(--bg-card)" rx="4"/>
                        <text x="${(fromNode.x + toNode.x)/2}" y="${(fromNode.y + toNode.y)/2 + 2}" font-size="8" fill="var(--text-muted)" text-anchor="middle" dominant-baseline="middle">${link.label}</text>
                    ` : ''}
                </g>
            `;
        }).join('');

        // Draw Nodes
        nodesGroup.innerHTML = note.flowchart.nodes.map(node => {
            const isActive = this.selectedNode && this.selectedNode.id === node.id;
            const strokeColor = isActive ? 'var(--color-primary)' : 'var(--color-primary-light)';
            const nodeFill = isActive ? 'var(--color-primary-glow)' : 'var(--bg-card)';
            
            let shapeHtml = '';
            if (node.type === 'start') {
                // Rounded pill (Start/End)
                shapeHtml = `<rect class="flow-node" x="${node.x - 60}" y="${node.y - 20}" width="120" height="40" rx="20" ry="20" fill="${nodeFill}" stroke="${strokeColor}" stroke-width="2"/>`;
            } else if (node.type === 'decision') {
                // Diamond / Rhombus
                shapeHtml = `<polygon class="flow-node" points="${node.x},${node.y - 22} ${node.x + 60},${node.y} ${node.x},${node.y + 22} ${node.x - 60},${node.y}" fill="${nodeFill}" stroke="${strokeColor}" stroke-width="2"/>`;
            } else if (node.type === 'io') {
                // Parallelogram (Input/Output)
                shapeHtml = `<polygon class="flow-node" points="${node.x - 50},${node.y - 20} ${node.x + 70},${node.y - 20} ${node.x + 50},${node.y + 20} ${node.x - 70},${node.y + 20}" fill="${nodeFill}" stroke="${strokeColor}" stroke-width="2"/>`;
            } else if (node.type === 'triangle') {
                // Triangle (pointing up)
                shapeHtml = `<polygon class="flow-node" points="${node.x},${node.y - 24} ${node.x + 60},${node.y + 20} ${node.x - 60},${node.y + 20}" fill="${nodeFill}" stroke="${strokeColor}" stroke-width="2"/>`;
            } else {
                // Rectangle (Process - default)
                shapeHtml = `<rect class="flow-node" x="${node.x - 60}" y="${node.y - 20}" width="120" height="40" rx="4" fill="${nodeFill}" stroke="${strokeColor}" stroke-width="2"/>`;
            }

            const textY = node.type === 'triangle' ? node.y + 6 : node.y;

            return `
                <g class="flow-node-element" data-id="${node.id}" style="cursor: move;">
                    ${shapeHtml}
                    <text class="flow-node-text" x="${node.x}" y="${textY}" fill="var(--text-main)" font-family="var(--font-sans)" font-size="11" font-weight="600" text-anchor="middle" dominant-baseline="middle">${node.text}</text>
                </g>
            `;
        }).join('');

        this.updatePropertiesPanel(note);
    }

    setupEvents(container, note) {
        const svg = document.getElementById('flowchart-canvas-svg');
        if (!svg) return;

        const getMousePos = (e) => {
            const rect = svg.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        // Node drag and drop
        svg.addEventListener('mousedown', (e) => {
            const nodeEl = e.target.closest('.flow-node-element');
            if (nodeEl) {
                const id = nodeEl.getAttribute('data-id');
                this.selectedNode = note.flowchart.nodes.find(n => n.id === id);
                this.isDragging = true;
                
                const pos = getMousePos(e);
                this.dragOffset.x = pos.x - this.selectedNode.x;
                this.dragOffset.y = pos.y - this.selectedNode.y;
                
                this.draw(note);
            } else {
                this.selectedNode = null;
                this.draw(note);
            }
        });

        svg.addEventListener('mousemove', (e) => {
            if (this.isDragging && this.selectedNode) {
                const pos = getMousePos(e);
                this.selectedNode.x = Math.round(pos.x - this.dragOffset.x);
                this.selectedNode.y = Math.round(pos.y - this.dragOffset.y);
                this.draw(note);
            }
        });

        svg.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.app.saveToLocalStorage();
            }
        });

        // Shapes Library click triggers
        const registerLibShape = (id, type, defaultLabel) => {
            const el = container.querySelector(id);
            if (el) {
                el.addEventListener('click', () => {
                    const text = prompt(`Enter label for ${defaultLabel}:`, defaultLabel);
                    if (text) {
                        const newNode = {
                            id: 'fn-' + Date.now(),
                            text: text,
                            type: type,
                            x: 120 + Math.random() * 80,
                            y: 120 + Math.random() * 80
                        };
                        note.flowchart.nodes.push(newNode);
                        this.selectedNode = newNode; // Auto-select newly created node
                        this.draw(note);
                        this.app.saveToLocalStorage();
                    }
                });
            }
        };

        registerLibShape('#lib-shape-start', 'start', 'Start/End');
        registerLibShape('#lib-shape-process', 'process', 'Process Step');
        registerLibShape('#lib-shape-decision', 'decision', 'Decision?');
        registerLibShape('#lib-shape-io', 'io', 'Input Data');
        registerLibShape('#lib-shape-triangle', 'triangle', 'Triangle');
    }

    updatePropertiesPanel(note) {
        const panel = document.getElementById('flowchart-properties-panel');
        if (!panel) return;
        
        if (!this.selectedNode) {
            panel.innerHTML = `
                <h4 style="font-weight: 700; color: var(--text-main); font-size: 0.85rem; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">Element Settings</h4>
                <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.5; margin-top: 10px;">
                    Click on any shape inside the flowchart canvas to edit its text, connect it to other steps, or delete it from the diagram.
                </p>
            `;
            return;
        }
        
        const otherNodes = note.flowchart.nodes.filter(n => n.id !== this.selectedNode.id);
        
        panel.innerHTML = `
            <h4 style="font-weight: 700; color: var(--text-main); font-size: 0.85rem; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 12px;">Shape Settings</h4>
            
            <!-- Edit label -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 0.65rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px;">STEP LABEL</label>
                <input type="text" id="prop-node-text" value="${this.selectedNode.text}" style="padding: 6px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-main); font-size: 0.8rem; outline: none; width: 100%;" />
            </div>

            <!-- Connect to another shape -->
            <div style="display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: 12px;">
                <label style="font-size: 0.65rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px;">CONNECT TO SHAPE</label>
                <div style="display: flex; gap: 6px;">
                    <select id="prop-link-target" style="flex: 1; padding: 6px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-main); font-size: 0.8rem; cursor: pointer; outline: none;">
                        <option value="">-- Select Target --</option>
                        ${otherNodes.map(n => `<option value="${n.id}">${n.text}</option>`).join('')}
                    </select>
                    <button class="btn btn-primary btn-sm" id="prop-btn-link" style="padding: 6px 10px;">Link</button>
                </div>
                <input type="text" id="prop-link-label" placeholder="Link label (e.g. Yes, No, Next)" style="padding: 6px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-main); font-size: 0.75rem; outline: none; width: 100%;" />
            </div>

            <!-- Delete shape / links -->
            <div style="display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: auto;">
                <button class="btn btn-secondary btn-sm" id="prop-btn-clear-links" style="color: var(--text-muted); border-color: var(--border-color); width: 100%; font-size: 0.75rem; padding: 6px 12px;">
                    Clear Connections
                </button>
                <button class="btn btn-secondary btn-sm" id="prop-btn-delete" style="color: var(--color-accent); border-color: var(--color-accent); width: 100%; font-size: 0.75rem; padding: 6px 12px;">
                    Delete Shape
                </button>
            </div>
        `;
        
        // Bind settings event listeners
        const textInput = panel.querySelector('#prop-node-text');
        textInput.addEventListener('input', (e) => {
            this.selectedNode.text = e.target.value;
            this.draw(note);
            this.app.saveToLocalStorage();
        });
        
        const linkBtn = panel.querySelector('#prop-btn-link');
        linkBtn.addEventListener('click', () => {
            const targetSelect = panel.querySelector('#prop-link-target');
            const targetId = targetSelect.value;
            if (targetId) {
                const labelInput = panel.querySelector('#prop-link-label');
                const label = labelInput.value.trim() || null;
                
                note.flowchart.links.push({
                    from: this.selectedNode.id,
                    to: targetId,
                    label: label
                });
                
                labelInput.value = '';
                targetSelect.value = '';
                
                this.draw(note);
                this.app.saveToLocalStorage();
            }
        });
        
        const clearLinksBtn = panel.querySelector('#prop-btn-clear-links');
        clearLinksBtn.addEventListener('click', () => {
            note.flowchart.links = note.flowchart.links.filter(l => l.from !== this.selectedNode.id && l.to !== this.selectedNode.id);
            this.draw(note);
            this.app.saveToLocalStorage();
        });
        
        const deleteBtn = panel.querySelector('#prop-btn-delete');
        deleteBtn.addEventListener('click', () => {
            note.flowchart.links = note.flowchart.links.filter(l => l.from !== this.selectedNode.id && l.to !== this.selectedNode.id);
            note.flowchart.nodes = note.flowchart.nodes.filter(n => n.id !== this.selectedNode.id);
            this.selectedNode = null;
            
            this.draw(note);
            this.app.saveToLocalStorage();
        });
    }
}
export const FlowchartBoardMock = FlowchartBoard;

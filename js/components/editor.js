// Pravio Notes Notebook Editor Workspace

class Editor {
    constructor(app) {
        this.app = app;
        this.editorInstance = null;
        this.canvasActive = false;
        this.flowchartActive = false;
    }

    render(container, query = '') {
        if (this.app.activeFolderId === null && !query) {
            container.innerHTML = this.renderBookshelf();
            lucide.createIcons();
            this.setupBookshelfEvents(container);
            return;
        }

        container.innerHTML = `
            <div class="workspace-grid">
                <!-- Left Sidebar: Note List -->
                <div class="note-selector-sidebar" id="note-selector-list">
                    <!-- Dynamic Note List -->
                </div>

                <!-- Right Area: Notebook Sheet Editor -->
                <div class="note-page-container" id="editor-active-page">
                    <!-- Active Note Editor Template loaded dynamically -->
                </div>
            </div>
        `;

        this.filterNotesList(query);
        
        // Find filtered list to check first matching note
        let filteredNotes = this.app.notes;
        if (query) {
            filteredNotes = filteredNotes.filter(n => 
                n.title.toLowerCase().includes(query) || 
                n.content.toLowerCase().includes(query) || 
                n.category.toLowerCase().includes(query)
            );
        } else if (this.app.activeFolderId) {
            filteredNotes = filteredNotes.filter(n => n.folderId === this.app.activeFolderId);
        }

        const pageContainer = document.getElementById('editor-active-page');
        if (pageContainer) {
            if (filteredNotes.length > 0) {
                // Determine which note to load (prefer currently active if it is in the filtered list, otherwise first item)
                const noteToLoad = (this.app.activeNote && filteredNotes.some(n => n.id === this.app.activeNote.id)) 
                    ? this.app.activeNote 
                    : filteredNotes[0];
                
                // Update activeFolderId context so it matches the loaded note folder context
                this.app.activeFolderId = noteToLoad.folderId;
                
                this.loadNote(noteToLoad);
            } else {
                if (query) {
                    pageContainer.innerHTML = `
                        <div style="padding: 100px 40px; text-align: center; color: var(--text-muted);">
                            <i data-lucide="search" style="width: 48px; height: 48px; margin-bottom: 12px; color: var(--color-primary);"></i>
                            <p style="font-weight: 500; font-size: 1rem;">No matching notes found.</p>
                            <p style="font-size: 0.8rem; margin-top: 4px;">Try searching for a different keyword or topic.</p>
                        </div>
                    `;
                } else {
                    pageContainer.innerHTML = `
                        <div style="padding: 100px 40px; text-align: center; color: var(--text-muted);">
                            <i data-lucide="book-open" style="width: 48px; height: 48px; margin-bottom: 12px; color: var(--color-primary);"></i>
                            <p style="font-weight: 500; font-size: 1rem;">This folder is currently empty.</p>
                            <p style="font-size: 0.8rem; margin-top: 4px;">Click the "New Note" button at the top to add a note.</p>
                        </div>
                    `;
                }
                lucide.createIcons();
            }
        }
    }

    renderBookshelf() {
        const folders = this.app.folders;
        const foldersHtml = folders.map(folder => {
            const count = this.app.notes.filter(n => n.folderId === folder.id).length;
            const color = folder.id === 'f-dsa' ? '#6366f1' : (folder.id === 'f-langs' ? '#10b981' : '#f59e0b');
            
            return `
                <div class="notebook-binder-card" data-id="${folder.id}" style="border-top: 5px solid ${color};">
                    <div class="binder-spine" style="background-color: ${color}; font-size: 0.7rem;"></div>
                    <div class="binder-cover">
                        <i data-lucide="${folder.icon || 'folder'}" style="color: ${color}; width: 36px; height: 36px; margin-bottom: 16px;"></i>
                        <h3 class="binder-title">${folder.name}</h3>
                        <span class="binder-count">${count} ${count === 1 ? 'Note' : 'Notes'}</span>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="bookshelf-container" style="width: 100%; padding: 40px;">
                <div style="margin-bottom: 32px;">
                    <h2 style="color: var(--text-main); font-size: 1.8rem; font-weight: 800;">Your Notebook Workspace</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">Select a notebook binder below to open notes and start revision.</p>
                </div>
                <div class="notebooks-grid">
                    ${foldersHtml}
                </div>
            </div>
        `;
    }

    setupBookshelfEvents(container) {
        container.querySelectorAll('.notebook-binder-card').forEach(card => {
            card.addEventListener('click', () => {
                const folderId = card.getAttribute('data-id');
                this.app.activeFolderId = folderId;
                
                // Select the first note inside the selected folder
                const folderNotes = this.app.notes.filter(n => n.folderId === folderId);
                if (folderNotes.length > 0) {
                    this.app.activeNote = folderNotes[0];
                } else {
                    this.app.activeNote = null;
                }
                
                // Refresh folder highlight in sidebar
                this.app.setupSidebarData();
                const sidebarFolder = document.querySelector(`.folder-item[data-id="${folderId}"]`);
                if (sidebarFolder) sidebarFolder.classList.add('active');
                
                // Re-render editor split-screen workspace
                this.render(container);
            });
        });
    }

    filterNotesList(query = '') {
        const listContainer = document.getElementById('note-selector-list');
        if (!listContainer) return;

        let filtered = this.app.notes;
        
        // If there's a search query, bypass folder/tag constraints to make it global search
        if (query) {
            filtered = filtered.filter(n => 
                n.title.toLowerCase().includes(query) || 
                n.content.toLowerCase().includes(query) || 
                n.category.toLowerCase().includes(query)
            );
        } else {
            // Otherwise, apply folder and tag constraints normally
            if (this.app.activeFolderId) {
                filtered = filtered.filter(n => n.folderId === this.app.activeFolderId);
            }
            if (this.app.activeTag) {
                filtered = filtered.filter(n => n.tags.includes(this.app.activeTag));
            }
        }

        listContainer.innerHTML = `
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 12px; letter-spacing: 0.5px;">NOTES LIST (${filtered.length})</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${filtered.map(note => `
                    <div class="folder-item ${this.app.activeNote && this.app.activeNote.id === note.id ? 'active' : ''}" data-id="${note.id}" style="border-left: 3px solid ${note.color || '#6366f1'}; padding-left: 8px;">
                        <span style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 180px;">${note.title}</span>
                        <div style="display: flex; gap: 6px;">
                            ${note.pinned ? `<i data-lucide="pin" style="width: 10px; height: 10px; color: var(--color-accent);"></i>` : ''}
                            ${note.favorite ? `<i data-lucide="star" style="width: 10px; height: 10px; fill: var(--color-primary); color: var(--color-primary);"></i>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        lucide.createIcons();

        // Wire item clicks
        listContainer.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('click', () => {
                listContainer.querySelectorAll('.folder-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                const noteId = item.getAttribute('data-id');
                const note = this.app.notes.find(n => n.id === noteId);
                if (note) {
                    // Update active folder context in case this was a global search
                    this.app.activeFolderId = note.folderId;
                    this.app.setupSidebarData();
                    const sidebarFolder = document.querySelector(`.folder-item[data-id="${note.folderId}"]`);
                    if (sidebarFolder) sidebarFolder.classList.add('active');
                    
                    this.loadNote(note);
                }
            });
        });
    }

    loadNote(note) {
        this.app.activeNote = note;
        this.canvasActive = false;
        this.flowchartActive = false;
        const pageContainer = document.getElementById('editor-active-page');
        if (!pageContainer) return;

        // Map template class
        let templateClass = 'template-classic';
        if (note.template === 'Handwritten Notebook') templateClass = 'template-handwritten';
        else if (note.template === 'Grid Paper' || note.template === 'Engineering Notes') templateClass = 'template-grid';
        else if (note.template === 'Cornell Notes') templateClass = 'template-cornell';
        else if (note.template === 'Sticky Notes') templateClass = 'template-sticky';

        const hasComplexity = note.complexity && 
            (note.folderId === 'f-dsa' || note.category === 'Algorithm Notes' || note.category === 'DSA Notes' || (note.tags && note.tags.includes('DSA'))) && 
            (note.complexity.time && note.complexity.time !== 'N/A' && note.complexity.time !== '10%');

        const complexityPanelHtml = hasComplexity ? `
                        <!-- Complexity panel at bottom of the note sheet -->
                        <div class="complexity-panel" style="margin-top: 32px; background-color: var(--bg-input);">
                            <h4 style="font-weight: 700; color: var(--text-main); border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">Complexity Sheet</h4>
                            <table class="complexity-table">
                                <tr><td>Time Complexity</td><td>${note.complexity.time}</td></tr>
                                <tr><td>Space Complexity</td><td>${note.complexity.space}</td></tr>
                                <tr><td>Best Case</td><td>${note.complexity.best}</td></tr>
                                <tr><td>Worst Case</td><td>${note.complexity.worst}</td></tr>
                                <tr><td>Stability</td><td>${note.complexity.stable}</td></tr>
                                <tr><td>Frequency Index</td><td>${note.complexity.frequency}</td></tr>
                            </table>
                            <div style="margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 8px;">
                                <strong>Optimization Tip:</strong>
                                <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 4px; line-height: 1.4;">${note.complexity.tips}</p>
                            </div>
                        </div>
        ` : '';

        pageContainer.innerHTML = `
            <!-- Template styling bar -->
            <div class="template-bar">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button class="icon-btn" id="btn-toggle-sidebar" title="Toggle Note List"><i data-lucide="sidebar"></i></button>
                    <select id="note-template-select">
                        <option value="Classic Notebook" ${note.template === 'Classic Notebook' ? 'selected' : ''}>Classic Notebook</option>
                        <option value="Handwritten Notebook" ${note.template === 'Handwritten Notebook' ? 'selected' : ''}>Handwritten Notebook</option>
                        <option value="Grid Paper" ${note.template === 'Grid Paper' ? 'selected' : ''}>Grid Paper</option>
                        <option value="Cornell Notes" ${note.template === 'Cornell Notes' ? 'selected' : ''}>Cornell Notes</option>
                        <option value="Sticky Notes" ${note.template === 'Sticky Notes' ? 'selected' : ''}>Sticky Notes</option>
                    </select>
                    <button class="icon-btn ${note.favorite ? 'active' : ''}" id="btn-note-fav" title="Favorite"><i data-lucide="star" ${note.favorite ? 'style="fill: var(--color-primary); color: var(--color-primary);"' : ''}></i></button>
                    <button class="icon-btn ${note.pinned ? 'active' : ''}" id="btn-note-pin" title="Pin"><i data-lucide="pin" ${note.pinned ? 'style="color: var(--color-accent);"' : ''}></i></button>
                </div>
                
                <div style="display: flex; gap: 10px; align-items: center;">
                    <div style="position: relative; display: inline-block;">
                        <button class="btn btn-secondary btn-sm" id="btn-add-sticky" title="Add Drag-and-Write Sticky Note"><i data-lucide="sticky-note"></i><span>Sticky</span></button>
                        <!-- Floating color picker popover -->
                        <div id="sticky-color-popover" class="hidden" style="position: absolute; top: 100%; left: 0; z-index: 100; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); padding: 8px; display: flex; gap: 8px; margin-top: 6px;">
                            <div class="sticky-color-dot" style="background-color: #fef08a; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; border: 1px solid rgba(0,0,0,0.15);" data-color="#fef08a" title="Yellow"></div>
                            <div class="sticky-color-dot" style="background-color: #fbcfe8; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; border: 1px solid rgba(0,0,0,0.15);" data-color="#fbcfe8" title="Pink"></div>
                            <div class="sticky-color-dot" style="background-color: #bfdbfe; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; border: 1px solid rgba(0,0,0,0.15);" data-color="#bfdbfe" title="Blue"></div>
                            <div class="sticky-color-dot" style="background-color: #bbf7d0; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; border: 1px solid rgba(0,0,0,0.15);" data-color="#bbf7d0" title="Green"></div>
                            <div class="sticky-color-dot" style="background-color: #fed7aa; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; border: 1px solid rgba(0,0,0,0.15);" data-color="#fed7aa" title="Orange"></div>
                        </div>
                    </div>
                    <button class="btn btn-secondary btn-sm" id="btn-add-image" title="Insert Local Image"><i data-lucide="image"></i><span>Image</span></button>
                    <button class="btn btn-secondary btn-sm" id="btn-toggle-draw"><i data-lucide="pen-tool"></i><span>Draw</span></button>
                    <button class="btn btn-secondary btn-sm" id="btn-toggle-flow"><i data-lucide="git-commit"></i><span>Flowchart</span></button>
                    <button class="btn btn-secondary btn-sm" id="btn-ai-flashcards" title="Generate or View AI Flashcards" style="background: rgba(99, 102, 241, 0.1); color: var(--color-primary); border-color: rgba(99, 102, 241, 0.3);"><i data-lucide="zap"></i><span>AI Flashcards</span></button>
                    <button class="btn btn-secondary btn-sm" id="btn-ai-cheatsheet" title="Generate or View AI Cheat-Sheet" style="background: rgba(168, 85, 247, 0.1); color: var(--color-accent); border-color: rgba(168, 85, 247, 0.3);"><i data-lucide="file-text"></i><span>AI Cheat-Sheet</span></button>
                    <button class="btn btn-primary btn-sm" id="btn-save-note" title="Save Note changes" style="background-color: var(--color-primary); color: white;"><i data-lucide="save"></i><span>Save</span></button>
                    <div style="position: relative; display: inline-block;">
                        <button class="btn btn-secondary btn-sm" id="btn-export-note" title="Export Note Options"><i data-lucide="download"></i><span>Export</span></button>
                        <!-- Dropdown menu -->
                        <div id="export-menu-dropdown" class="hidden" style="position: absolute; top: 100%; right: 0; z-index: 100; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); padding: 6px; display: flex; flex-direction: column; gap: 4px; margin-top: 6px; min-width: 150px;">
                            <button class="export-dropdown-item" data-format="pdf" style="background: transparent; border: none; text-align: left; padding: 6px 12px; font-size: 0.8rem; color: var(--text-main); cursor: pointer; border-radius: var(--radius-sm); font-weight: 500; display: flex; align-items: center; gap: 8px; width: 100%;">
                                <i data-lucide="file-text" style="width: 12px; height: 12px; color: #ef4444;"></i>Save as PDF
                            </button>
                            <button class="export-dropdown-item" data-format="word" style="background: transparent; border: none; text-align: left; padding: 6px 12px; font-size: 0.8rem; color: var(--text-main); cursor: pointer; border-radius: var(--radius-sm); font-weight: 500; display: flex; align-items: center; gap: 8px; width: 100%;">
                                <i data-lucide="file-text" style="width: 12px; height: 12px; color: #3b82f6;"></i>Save as Word (.doc)
                            </button>
                        </div>
                    </div>
                    <button class="icon-btn" id="btn-note-delete" title="Delete Note" style="color: var(--color-accent);"><i data-lucide="trash-2"></i></button>
                </div>
            </div>

            <!-- Text Formatting toolbar -->
            <div class="formatting-bar" style="display: flex; align-items: center; gap: 6px; padding: 6px 16px; background-color: var(--bg-card); border-bottom: 1px solid var(--border-color); flex-wrap: wrap;">
                <select id="format-heading" title="Format Text Block" style="max-width: 105px; width: auto; padding: 4px 6px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-main); font-size: 0.75rem; font-weight: 600; cursor: pointer; outline: none; text-overflow: ellipsis;">
                    <option value="p">Normal</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                </select>

                <select id="format-font-size" title="Font Size" style="max-width: 75px; width: auto; padding: 4px 6px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--text-main); font-size: 0.75rem; font-weight: 600; cursor: pointer; outline: none;">
                    <option value="1">10px</option>
                    <option value="2">12px</option>
                    <option value="3" selected>16px</option>
                    <option value="4">18px</option>
                    <option value="5">24px</option>
                    <option value="6">32px</option>
                    <option value="7">48px</option>
                </select>

                <div style="position: relative; display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-card);" title="Text Color">
                    <i data-lucide="palette" style="width: 13px; height: 13px; color: var(--text-muted);"></i>
                    <input type="color" id="format-color-picker" value="#6366f1" style="width: 20px; height: 20px; border: none; padding: 0; background: transparent; cursor: pointer; border-radius: 3px;" title="Choose Text Highlight Color">
                </div>

                <div style="width: 1px; height: 16px; background-color: var(--border-color); margin: 0 2px;"></div>

                <button class="icon-btn" id="format-bold" title="Bold" style="padding: 4px 8px;"><i data-lucide="bold" style="width: 14px; height: 14px;"></i></button>
                <button class="icon-btn" id="format-italic" title="Italic" style="padding: 4px 8px;"><i data-lucide="italic" style="width: 14px; height: 14px;"></i></button>
                <button class="icon-btn" id="format-underline" title="Underline" style="padding: 4px 8px;"><i data-lucide="underline" style="width: 14px; height: 14px;"></i></button>

                <div style="width: 1px; height: 16px; background-color: var(--border-color); margin: 0 2px;"></div>

                <button class="icon-btn" id="format-align-left" title="Align Left" style="padding: 4px 8px;"><i data-lucide="align-left" style="width: 14px; height: 14px;"></i></button>
                <button class="icon-btn" id="format-align-center" title="Align Center" style="padding: 4px 8px;"><i data-lucide="align-center" style="width: 14px; height: 14px;"></i></button>
                <button class="icon-btn" id="format-align-right" title="Align Right" style="padding: 4px 8px;"><i data-lucide="align-right" style="width: 14px; height: 14px;"></i></button>
                
                <div style="width: 1px; height: 16px; background-color: var(--border-color); margin: 0 2px;"></div>
                <button class="icon-btn" id="format-link-note" title="Link to another note (Zettelkasten)" style="padding: 4px 8px;"><i data-lucide="link-2" style="width: 14px; height: 14px;"></i></button>

                <div style="width: 1px; height: 16px; background-color: var(--border-color); margin: 0 2px;"></div>

                <button class="icon-btn" id="format-list-ul" title="Bulleted List" style="padding: 4px 8px;"><i data-lucide="list" style="width: 14px; height: 14px;"></i></button>
                <button class="icon-btn" id="format-list-ol" title="Numbered List" style="padding: 4px 8px;"><i data-lucide="list-ordered" style="width: 14px; height: 14px;"></i></button>
            </div>

            <div style="flex: 1; overflow-y: auto; padding: 28px;">
                <div style="width: 100%; display: flex; flex-direction: column; gap: 24px;">

                    <!-- Flowchart generator container (Hidden by default) -->
                    <div id="flowchart-creator-overlay" class="hidden">
                        <!-- Handled by Flowchart component -->
                    </div>

                    <!-- Note Text Editor Sheets -->
                    <div class="${templateClass}" id="notebook-sheet-body" style="width: 100%; position: relative;">
                        <!-- Sketch Canvas Overlay Container (Always present, pointer-events: none by default) -->
                        <div id="drawing-canvas-overlay" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3;"></div>
                        ${note.template === 'Cornell Notes' ? `
                            <div class="cornell-cue">
                                <h4 style="font-weight: 700; color: var(--color-primary);">Cue/Questions</h4>
                                <div contenteditable="true" style="outline: none; margin-top: 10px; font-size: 0.85rem;" id="cornell-cue-edit">
                                    ${note.cornellCue || '• Key parameters?<br>• Microtask vs Macrotask?'}
                                </div>
                            </div>
                            <div class="cornell-notes">
                                <input type="text" id="note-title-input" value="${note.title}" style="width: 100%; border: none; font-size: 1.5rem; font-weight: 800; color: inherit; outline: none; background: transparent; margin-bottom: 16px;">
                                <div contenteditable="true" style="outline: none; min-height: 350px;" id="note-text-edit">
                                    ${note.content}
                                </div>
                            </div>
                            <div class="cornell-summary">
                                <h4 style="font-weight: 700; color: var(--color-secondary);">Summary</h4>
                                <div contenteditable="true" style="outline: none; font-size: 0.85rem;" id="cornell-summary-edit">
                                    ${note.cornellSummary || 'JavaScript runs single-threaded by offloading asynchronous callbacks to queues, resolving Promises with highest microtask priority.'}
                                </div>
                            </div>
                        ` : `
                            <input type="text" id="note-title-input" value="${note.title}" style="width: 100%; border: none; font-size: 1.5rem; font-weight: 800; color: inherit; outline: none; background: transparent; margin-bottom: 16px; font-family: inherit;">
                            <div contenteditable="true" style="outline: none; min-height: 400px; font-family: inherit;" id="note-text-edit">
                                ${note.content}
                            </div>
                        `}

                        <!-- Conditional Complexity panel -->
                        ${complexityPanelHtml}
                    </div>
                </div>
            </div>

            <!-- Shared Floating Element Context Toolbar -->
            <div id="element-floating-toolbar" class="hidden" style="position: fixed; z-index: 1000; display: flex; align-items: center; gap: 6px; padding: 6px 10px; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); pointer-events: auto;"></div>
        `;

        lucide.createIcons();
        this.app.canvasBoard.render(document.getElementById('drawing-canvas-overlay'), true, note);
        this.setupEvents(note);
        
        const textEdit = document.getElementById('note-text-edit');
        if (textEdit) {
            this.bindStickyNoteDragging(textEdit, note);
        }
    }

    setupEvents(note) {
        const templateSelect = document.getElementById('note-template-select');
        const favBtn = document.getElementById('btn-note-fav');
        const pinBtn = document.getElementById('btn-note-pin');
        const delBtn = document.getElementById('btn-note-delete');
        const exportBtn = document.getElementById('btn-export-note');
        const titleInput = document.getElementById('note-title-input');
        const textEdit = document.getElementById('note-text-edit');
        


        // Drawing & Flowchart buttons
        const drawBtn = document.getElementById('btn-toggle-draw');
        const flowBtn = document.getElementById('btn-toggle-flow');

        // Toggle Sidebar collapsed focus mode
        const toggleSidebarBtn = document.getElementById('btn-toggle-sidebar');
        if (toggleSidebarBtn) {
            // Keep active state matching grid class state
            const grid = document.querySelector('.workspace-grid');
            if (grid && grid.classList.contains('sidebar-collapsed')) {
                toggleSidebarBtn.classList.add('active');
                toggleSidebarBtn.style.backgroundColor = 'var(--color-primary-glow)';
            }

            toggleSidebarBtn.addEventListener('click', () => {
                const targetGrid = document.querySelector('.workspace-grid');
                if (targetGrid) {
                    targetGrid.classList.toggle('sidebar-collapsed');
                    const isCollapsed = targetGrid.classList.contains('sidebar-collapsed');
                    toggleSidebarBtn.classList.toggle('active', isCollapsed);
                    if (isCollapsed) {
                        toggleSidebarBtn.style.backgroundColor = 'var(--color-primary-glow)';
                    } else {
                        toggleSidebarBtn.style.backgroundColor = '';
                    }
                }
            });
        }

        // Add Sticky Note (Color Popover trigger)
        const addStickyBtn = document.getElementById('btn-add-sticky');
        const stickyPopover = document.getElementById('sticky-color-popover');
        if (addStickyBtn && stickyPopover) {
            addStickyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                stickyPopover.classList.toggle('hidden');
            });
            
            // Close popover when clicking anywhere else
            document.addEventListener('click', () => {
                stickyPopover.classList.add('hidden');
            });
            
            stickyPopover.querySelectorAll('.sticky-color-dot').forEach(dot => {
                dot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const color = dot.getAttribute('data-color');
                    stickyPopover.classList.add('hidden');
                    
                    const rot = (Math.random() * 6 - 3).toFixed(1);
                    const scrollOffset = textEdit.parentElement.scrollTop || 0;
                    const top = 100 + scrollOffset;
                    const left = 100 + Math.random() * 120;
                    
                    const stickyHtml = `
                        <div class="embedded-sticky-note" contenteditable="false" style="position: absolute; left: ${left}px; top: ${top}px; background-color: ${color}; transform: rotate(${rot}deg);" data-rot="${rot}">
                            <div class="sticky-handle" style="height: 18px; width: 100%; cursor: move; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.03); border-radius: var(--radius-sm) var(--radius-sm) 0 0; margin: -22px -14px 10px -14px; padding: 2px 0;">
                                <div style="width: 30px; height: 4px; background: rgba(0,0,0,0.15); border-radius: 2px;"></div>
                            </div>
                            <div class="sticky-content" contenteditable="true" style="outline: none; min-height: 120px;">
                                Type sticky note...
                            </div>
                        </div>
                    `;
                    
                    textEdit.appendChild(document.createRange().createContextualFragment(stickyHtml));
                    this.bindStickyNoteDragging(textEdit, note);
                    
                    note.content = textEdit.innerHTML;
                    note.lastEdited = new Date().toISOString();
                    this.app.saveToLocalStorage();
                });
            });
        }

        // AI Flashcards and Cheat-Sheet button listeners
        const aiFlashcardsBtn = document.getElementById('btn-ai-flashcards');
        if (aiFlashcardsBtn) {
            aiFlashcardsBtn.addEventListener('click', () => {
                this.openAIFlashcardsModal(note);
            });
        }

        const aiCheatsheetBtn = document.getElementById('btn-ai-cheatsheet');
        if (aiCheatsheetBtn) {
            aiCheatsheetBtn.addEventListener('click', () => {
                this.openAICheatsheetModal(note);
            });
        }

        // Insert Local Image
        const addImgBtn = document.getElementById('btn-add-image');
        if (addImgBtn) {
            addImgBtn.addEventListener('click', () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (readerEvent) => {
                            const imgHtml = `
                                <div class="resizable-image-container" style="width: 320px; height: 240px;">
                                    <img src="${readerEvent.target.result}" class="embedded-note-image" />
                                </div>
                            `;
                            textEdit.focus();
                            document.execCommand('insertHTML', false, imgHtml);
                            
                            note.content = textEdit.innerHTML;
                            note.lastEdited = new Date().toISOString();
                            this.app.saveToLocalStorage();
                        };
                        reader.readAsDataURL(file);
                    }
                };
                fileInput.click();
            });
        }

        // Rich Text Formatting commands helper
        const bindFormatBtn = (id, command, arg = null) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault(); // Prevents losing input focus selection!
                });
                btn.addEventListener('click', () => {
                    document.execCommand(command, false, arg);
                    note.content = textEdit.innerHTML;
                    note.lastEdited = new Date().toISOString();
                    this.app.saveToLocalStorage();
                });
            }
        };

        // Bind core formatting triggers
        bindFormatBtn('format-bold', 'bold');
        bindFormatBtn('format-italic', 'italic');
        bindFormatBtn('format-underline', 'underline');
        bindFormatBtn('format-align-left', 'justifyLeft');
        bindFormatBtn('format-align-center', 'justifyCenter');
        bindFormatBtn('format-align-right', 'justifyRight');
        bindFormatBtn('format-list-ul', 'insertUnorderedList');
        bindFormatBtn('format-list-ol', 'insertOrderedList');

        // Bind Zettelkasten note linker button
        const linkNoteBtn = document.getElementById('format-link-note');
        if (linkNoteBtn) {
            linkNoteBtn.addEventListener('click', () => {
                const targetTitle = prompt('Enter the title of the note you want to link to:');
                if (targetTitle && targetTitle.trim()) {
                    const exists = this.app.notes.some(n => n.title.toLowerCase().trim() === targetTitle.toLowerCase().trim());
                    const linkHtml = `<a class="note-link" data-title="${targetTitle.trim()}" href="#" style="color: var(--color-primary); font-weight: 600; text-decoration: underline;">${targetTitle.trim()}</a>`;
                    
                    document.execCommand('insertHTML', false, linkHtml);
                    
                    note.content = textEdit.innerHTML;
                    note.lastEdited = new Date().toISOString();
                    this.app.saveToLocalStorage();
                    
                    if (!exists) {
                        alert(`Note "${targetTitle}" does not exist yet. You can create a new note with this title later to connect the link!`);
                    }
                }
            });
        }
        const headingSelect = document.getElementById('format-heading');
        if (headingSelect) {
            headingSelect.addEventListener('change', (e) => {
                textEdit.focus();
                const tag = '<' + e.target.value + '>';
                document.execCommand('formatBlock', false, tag);
                note.content = textEdit.innerHTML;
                this.app.saveToLocalStorage();
            });
        }

        const sizeSelect = document.getElementById('format-font-size');
        if (sizeSelect) {
            const sizeMap = {
                '1': '10px',
                '2': '12px',
                '3': '16px',
                '4': '18px',
                '5': '24px',
                '6': '32px',
                '7': '48px'
            };

            sizeSelect.addEventListener('change', (e) => {
                textEdit.focus();
                const pxSize = sizeMap[e.target.value] || '16px';
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
                    const range = sel.getRangeAt(0);
                    const selectedText = range.toString();
                    if (selectedText) {
                        const span = document.createElement('span');
                        span.style.fontSize = pxSize;
                        span.appendChild(range.extractContents());
                        range.insertNode(span);
                    }
                } else {
                    document.execCommand('insertHTML', false, `<span style="font-size: ${pxSize};">&#8203;</span>`);
                }
                note.content = textEdit.innerHTML;
                this.app.saveToLocalStorage();
            });
        }

        const colorPicker = document.getElementById('format-color-picker');
        if (colorPicker) {
            const applySelectedColor = (color) => {
                textEdit.focus();
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
                    document.execCommand('foreColor', false, color);
                } else {
                    document.execCommand('insertHTML', false, `<span style="color: ${color};">&#8203;</span>`);
                }
                note.content = textEdit.innerHTML;
                this.app.saveToLocalStorage();
            };

            colorPicker.addEventListener('input', (e) => {
                applySelectedColor(e.target.value);
            });
            colorPicker.addEventListener('change', (e) => {
                applySelectedColor(e.target.value);
            });
        }

        // Template change
        templateSelect.addEventListener('change', (e) => {
            note.template = e.target.value;
            this.loadNote(note);
            this.app.saveToLocalStorage();
        });

        // Favorite/Pin clicks
        favBtn.addEventListener('click', () => {
            note.favorite = !note.favorite;
            this.loadNote(note);
            this.filterNotesList();
            this.app.setupSidebarData();
            this.app.saveToLocalStorage();
        });

        pinBtn.addEventListener('click', () => {
            note.pinned = !note.pinned;
            this.loadNote(note);
            this.filterNotesList();
            this.app.setupSidebarData();
            this.app.saveToLocalStorage();
        });

        // Delete note
        delBtn.addEventListener('click', () => {
            if (confirm('Delete this note forever?')) {
                const idx = this.app.notes.indexOf(note);
                if (idx !== -1) {
                    this.app.notes.splice(idx, 1);
                    this.app.stats.notesCreated--;
                    this.app.saveToLocalStorage();
                    this.app.setupSidebarData();
                    this.render(document.getElementById('active-viewport'));
                }
            }
        });

        // Export Note dropdown toggling and formats router
        const exportMenu = document.getElementById('export-menu-dropdown');
        if (exportBtn && exportMenu) {
            exportBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                exportMenu.classList.toggle('hidden');
            });
            
            // Hide dropdown when clicking anywhere else
            document.addEventListener('click', (e) => {
                if (!exportMenu.contains(e.target) && e.target !== exportBtn) {
                    exportMenu.classList.add('hidden');
                }
            });

            // Bind format item clicks
            exportMenu.querySelectorAll('.export-dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    exportMenu.classList.add('hidden');
                    
                    const format = item.getAttribute('data-format');
                    const cleanFileName = note.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                    
                    if (format === 'pdf') {
                        // Open print window to export ONLY the note sheet content
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                            const templateClass = note.template === 'Handwritten Notebook' ? 'template-handwritten' :
                                                 (note.template === 'Grid Paper' ? 'template-grid' :
                                                 (note.template === 'Cornell Notes' ? 'template-cornell' :
                                                 (note.template === 'Sticky Notes' ? 'template-sticky' : 'template-classic')));

                            const sheetElement = document.getElementById('notebook-sheet-body');
                            const sheetHtml = sheetElement ? sheetElement.innerHTML : '';
                            const noteTitle = (note.title || 'Untitled Note').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                            
                            printWindow.document.write(`
                                <html>
                                <head>
                                    <title>${noteTitle}</title>
                                    <link rel="stylesheet" href="style.css?v=2.4.0">
                                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                                    <style>
                                        body {
                                            background: white !important;
                                            color: black !important;
                                            padding: 40px !important;
                                            font-family: 'Outfit', sans-serif;
                                        }
                                        #notebook-sheet-body {
                                            box-shadow: none !important;
                                            border: none !important;
                                            margin: 0 !important;
                                            padding: 0 !important;
                                            background: white !important;
                                            color: black !important;
                                            width: 100% !important;
                                        }
                                        /* Hide interactive/editing components */
                                        .sticky-handle, .resize-handle, .canvas-toolbar, .icon-btn {
                                            display: none !important;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="${templateClass}" id="notebook-sheet-body">
                                        ${sheetHtml}
                                    </div>
                                    <script>
                                        window.onload = function() {
                                            setTimeout(function() {
                                                window.print();
                                                window.close();
                                            }, 400);
                                        };
                                    </script>
                                </body>
                                </html>
                            `);
                            printWindow.document.close();
                        }
                    } else if (format === 'markdown') {
                        // Save as Markdown (.md) - Export ALL contents cleanly
                        let mdContent = `# ${note.title}\n\n`;
                        mdContent += `*Category: ${note.category}*\n`;
                        mdContent += `*Last Edited: ${new Date(note.lastEdited).toLocaleString()}*\n\n`;
                        mdContent += `---\n\n`;
                        
                        let tempDiv = document.createElement('div');
                        tempDiv.innerHTML = note.content;
                        
                        // Extract and format sticky notes
                        const stickies = tempDiv.querySelectorAll('.embedded-sticky-note');
                        if (stickies.length > 0) {
                            mdContent += `## Sticky Notes\n`;
                            stickies.forEach((sticky, idx) => {
                                const contentDiv = sticky.querySelector('.sticky-content');
                                const text = contentDiv ? contentDiv.innerText.trim() : sticky.innerText.trim();
                                const color = sticky.style.backgroundColor || 'yellow';
                                mdContent += `> **Sticky Note #${idx + 1} (${color})**:\n> ${text}\n\n`;
                            });
                            mdContent += `---\n\n`;
                        }
                        
                        // Extract and format images
                        const images = tempDiv.querySelectorAll('.embedded-note-image');
                        if (images.length > 0) {
                            mdContent += `## Embedded Images\n`;
                            images.forEach((img, idx) => {
                                mdContent += `![Image #${idx + 1}](${img.src})\n\n`;
                            });
                            mdContent += `---\n\n`;
                        }
                        
                        // Strip out stickies and image containers so they don't print twice in note body text
                        tempDiv.querySelectorAll('.embedded-sticky-note, .resizable-image-container').forEach(el => el.remove());
                        
                        // Translate highlights
                        tempDiv.querySelectorAll('mark, span[style*="background-color"]').forEach(el => {
                            el.outerHTML = `==${el.innerText}==`;
                        });
                        
                        tempDiv.querySelectorAll('h1').forEach(h => h.outerHTML = `\n# ${h.innerText}\n`);
                        tempDiv.querySelectorAll('h2').forEach(h => h.outerHTML = `\n## ${h.innerText}\n`);
                        tempDiv.querySelectorAll('h3').forEach(h => h.outerHTML = `\n### ${h.innerText}\n`);
                        tempDiv.querySelectorAll('h4').forEach(h => h.outerHTML = `\n#### ${h.innerText}\n`);
                        tempDiv.querySelectorAll('p').forEach(p => p.outerHTML = `\n${p.innerText}\n`);
                        tempDiv.querySelectorAll('br').forEach(br => br.outerHTML = `\n`);
                        tempDiv.querySelectorAll('li').forEach(li => li.outerHTML = `* ${li.innerText}\n`);
                        
                        const bodyText = tempDiv.innerText.trim().replace(/\n{3,}/g, '\n\n');
                        mdContent += bodyText;
                        
                        // Append complexity info table
                        if (note.complexity && note.complexity.time && note.complexity.time !== 'N/A' && note.complexity.time !== '10%') {
                            mdContent += `\n\n---\n\n## Complexity Reference\n`;
                            mdContent += `| Metrics | Complexity Bounds |\n`;
                            mdContent += `| --- | --- |\n`;
                            mdContent += `| **Time Complexity** | ${note.complexity.time} |\n`;
                            mdContent += `| **Space Complexity** | ${note.complexity.space} |\n`;
                            mdContent += `| **Best Case** | ${note.complexity.best} |\n`;
                            mdContent += `| **Worst Case** | ${note.complexity.worst} |\n`;
                            mdContent += `| **Stability** | ${note.complexity.stable} |\n`;
                            mdContent += `| **Tip** | ${note.complexity.tips} |\n`;
                        }
                        
                        const link = document.createElement('a');
                        const file = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
                        link.href = URL.createObjectURL(file);
                        link.download = `${cleanFileName}_notes.md`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } else if (format === 'word') {
                        // Save as Word Document (.doc formatting) - Preserving all rich content (stickies, images, highlights)
                        const header = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${note.title}</title><style>body { font-family: sans-serif; line-height: 1.5; } h1 { color: #4f46e5; } .embedded-sticky-note { background: #fef08a; border-left: 4px solid #eab308; padding: 12px; margin: 12px 0; border-radius: 4px; } .sticky-handle { display: none !important; } .embedded-note-image { max-width: 100%; height: auto; border-radius: 4px; }</style></head><body>`;
                        const footer = "</body></html>";
                        const docContent = header + `<h1>${note.title}</h1><p><em>Category: ${note.category}</em></p><hr>` + note.content + footer;
                        
                        const link = document.createElement('a');
                        const file = new Blob(['\ufeff' + docContent], { type: 'application/msword' });
                        link.href = URL.createObjectURL(file);
                        link.download = `${cleanFileName}_notes.doc`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } else if (format === 'ppt') {
                        // Save as Presentation Slide Outline using pptxgenjs library (.pptx)
                        if (typeof PptxGenJS === 'undefined') {
                            alert("Presentation Outline engine is initializing. Please try again in a moment!");
                            return;
                        }
                        
                        const pptx = new PptxGenJS();
                        
                        // Slide 1: Title Slide
                        const slide1 = pptx.addSlide();
                        slide1.background = { fill: "F8FAFC" };
                        slide1.addText(note.title || "Untitled Presentation", {
                            x: 1.0, y: 1.5, w: 8.0, h: 1.5,
                            fontSize: 32, bold: true, color: "6366F1",
                            fontFace: "Arial", align: "center"
                        });
                        slide1.addText(`Topic Presentation Slide Outline\nCategory: ${note.category}\nCreated: ${new Date().toLocaleDateString()}`, {
                            x: 1.0, y: 3.2, w: 8.0, h: 2.0,
                            fontSize: 14, color: "0F172A",
                            fontFace: "Arial", align: "center"
                        });
                        
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = note.content;
                        
                        // Extract headings for main slide outline cards
                        const headings = tempDiv.querySelectorAll('h1, h2, h3');
                        if (headings.length > 0) {
                            headings.forEach((h, idx) => {
                                const slide = pptx.addSlide();
                                slide.background = { fill: "FFFFFF" };
                                slide.addText(`Slide ${idx + 2}: ${h.innerText}`, {
                                    x: 0.5, y: 0.5, w: 9.0, h: 0.8,
                                    fontSize: 22, bold: true, color: "6366F1",
                                    fontFace: "Arial"
                                });
                                slide.addText("• Key Study Reference Outline\n• Tap to edit slide key notes...", {
                                    x: 0.5, y: 1.5, w: 9.0, h: 4.0,
                                    fontSize: 16, color: "334155",
                                    fontFace: "Arial"
                                });
                            });
                        } else {
                            // Extract paragraphs for basic slides
                            const paragraphs = [...tempDiv.querySelectorAll('p, div')].map(p => p.innerText.trim()).filter(t => t.length > 15);
                            const uniqueParagraphs = [...new Set(paragraphs)].slice(0, 5);
                            uniqueParagraphs.forEach((pText, idx) => {
                                const slide = pptx.addSlide();
                                slide.background = { fill: "FFFFFF" };
                                slide.addText(`Slide ${idx + 2}: Topic Outline`, {
                                    x: 0.5, y: 0.5, w: 9.0, h: 0.8,
                                    fontSize: 22, bold: true, color: "6366F1",
                                    fontFace: "Arial"
                                });
                                slide.addText(pText, {
                                    x: 0.5, y: 1.5, w: 9.0, h: 4.0,
                                    fontSize: 16, color: "334155",
                                    fontFace: "Arial"
                                });
                            });
                        }
                        
                        // Append stickies as custom slide cards
                        const stickies = tempDiv.querySelectorAll('.embedded-sticky-note');
                        if (stickies.length > 0) {
                            stickies.forEach((sticky, idx) => {
                                const contentDiv = sticky.querySelector('.sticky-content');
                                const text = contentDiv ? contentDiv.innerText.trim() : sticky.innerText.trim();
                                
                                const slide = pptx.addSlide();
                                slide.background = { fill: "FEF08A" }; // yellow background
                                slide.addText(`Sticky Note #${idx + 1}`, {
                                    x: 0.5, y: 0.5, w: 9.0, h: 0.8,
                                    fontSize: 22, bold: true, color: "B45309",
                                    fontFace: "Arial"
                                });
                                slide.addText(text, {
                                    x: 0.5, y: 1.5, w: 9.0, h: 4.0,
                                    fontSize: 16, color: "78350F",
                                    fontFace: "Arial", italic: true
                                });
                            });
                        }
                        
                        pptx.writeFile({ fileName: `${cleanFileName}_presentation.pptx` });
                    }
                });
            });
        }

        // Save Note (manual click)
        const saveBtn = document.getElementById('btn-save-note');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.app.saveToLocalStorage(true);
            });
        }

        // Auto Save Text changes (updates recently edited timestamp)
        titleInput.addEventListener('input', () => {
            note.title = titleInput.value;
            note.lastEdited = new Date().toISOString();
            this.filterNotesList();
            this.app.saveToLocalStorage();
        });

        textEdit.addEventListener('input', () => {
            note.content = textEdit.innerHTML;
            note.lastEdited = new Date().toISOString();
            this.app.saveToLocalStorage();
        });

        const cueEdit = document.getElementById('cornell-cue-edit');
        const summaryEdit = document.getElementById('cornell-summary-edit');
        if (cueEdit) {
            cueEdit.addEventListener('input', () => {
                note.cornellCue = cueEdit.innerHTML;
                note.lastEdited = new Date().toISOString();
                this.app.saveToLocalStorage();
            });
        }
        if (summaryEdit) {
            summaryEdit.addEventListener('input', () => {
                note.cornellSummary = summaryEdit.innerHTML;
                note.lastEdited = new Date().toISOString();
                this.app.saveToLocalStorage();
            });
        }

        // Double click to write notes anywhere on the sheet
        textEdit.addEventListener('dblclick', (e) => {
            const selection = window.getSelection().toString().trim();
            if (selection === '') {
                const rect = textEdit.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const block = document.createElement('div');
                block.className = 'floating-text-block';
                block.style.left = `${x}px`;
                block.style.top = `${y}px`;
                block.contentEditable = 'true';
                block.innerHTML = '&#8203;';
                
                textEdit.appendChild(block);
                
                // Focus immediately
                block.focus();

                // Save changes immediately when user types inside the floating block!
                block.addEventListener('input', () => {
                    note.content = textEdit.innerHTML;
                    note.lastEdited = new Date().toISOString();
                    this.app.saveToLocalStorage();
                });

                // Update note content on creation
                note.content = textEdit.innerHTML;
                note.lastEdited = new Date().toISOString();
                this.app.saveToLocalStorage();
            }
        });

        // Save note content on mouseup (captures custom image resizing sizes)
        textEdit.addEventListener('mouseup', () => {
            note.content = textEdit.innerHTML;
            note.lastEdited = new Date().toISOString();
            this.app.saveToLocalStorage();
        });

        // Delegate note-link clicks inside the note editor
        textEdit.addEventListener('click', (e) => {
            const noteLink = e.target.closest('.note-link');
            if (noteLink) {
                e.preventDefault();
                e.stopPropagation();
                const title = noteLink.getAttribute('data-title');
                const targetNote = this.app.notes.find(n => n.title.toLowerCase().trim() === title.toLowerCase().trim());
                if (targetNote) {
                    this.loadNote(targetNote);
                    this.app.activeFolderId = targetNote.folderId;
                    this.app.setupSidebarData();
                } else {
                    alert(`Target note "${title}" not found. Create a new note with this title to connect the link!`);
                }
            }
        });

        // Floating Action Context Menu for Sticky Notes and Images
        let activeSelectedElement = null;
        const floatingToolbar = document.getElementById('element-floating-toolbar');
        
        const showFloatingToolbar = (el, type) => {
            activeSelectedElement = el;
            if (!floatingToolbar) return;
            
            if (type === 'sticky') {
                const colors = ['#fef08a', '#fbcfe8', '#bfdbfe', '#bbf7d0', '#fed7aa'];
                floatingToolbar.innerHTML = `
                    <div style="display: flex; gap: 4px; border-right: 1px solid var(--border-color); padding-right: 6px; margin-right: 2px;">
                        ${colors.map(c => `
                            <div class="sticky-color-swatch" style="background-color: ${c}; width: 14px; height: 14px; border-radius: 50%; cursor: pointer; border: 1px solid rgba(0,0,0,0.15);" data-color="${c}"></div>
                        `).join('')}
                    </div>
                    <button class="btn btn-secondary btn-sm" id="btn-element-delete" style="color: var(--color-accent); border-color: var(--color-accent); padding: 2px 6px; font-size: 0.7rem; display: flex; align-items: center; gap: 4px;">
                        <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>Delete Note
                    </button>
                `;
                
                // Bind color selectors
                floatingToolbar.querySelectorAll('.sticky-color-swatch').forEach(swatch => {
                    swatch.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const color = swatch.getAttribute('data-color');
                        activeSelectedElement.style.backgroundColor = color;
                        
                        note.content = textEdit.innerHTML;
                        note.lastEdited = new Date().toISOString();
                        this.app.saveToLocalStorage();
                    });
                });
            } else if (type === 'image') {
                floatingToolbar.innerHTML = `
                    <button class="btn btn-secondary btn-sm" id="btn-element-delete" style="color: var(--color-accent); border-color: var(--color-accent); padding: 2px 6px; font-size: 0.7rem; display: flex; align-items: center; gap: 4px;">
                        <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>Delete Image
                    </button>
                `;
            }
            
            lucide.createIcons();
            
            // Bind Delete button
            const deleteBtn = floatingToolbar.querySelector('#btn-element-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    activeSelectedElement.remove();
                    floatingToolbar.classList.add('hidden');
                    
                    note.content = textEdit.innerHTML;
                    note.lastEdited = new Date().toISOString();
                    this.app.saveToLocalStorage();
                });
            }
            
            // Position above the selected item
            floatingToolbar.classList.remove('hidden');
            const rect = el.getBoundingClientRect();
            const tbRect = floatingToolbar.getBoundingClientRect();
            
            let x = rect.left + (rect.width - tbRect.width) / 2;
            let y = rect.top - tbRect.height - 8;
            
            // Keep in browser boundaries
            x = Math.max(10, Math.min(x, window.innerWidth - tbRect.width - 10));
            y = Math.max(10, y);
            
            floatingToolbar.style.left = `${x}px`;
            floatingToolbar.style.top = `${y}px`;
        };
        
        // Listen to clicks inside text area
        textEdit.addEventListener('click', (e) => {
            const sticky = e.target.closest('.embedded-sticky-note');
            const imgContainer = e.target.closest('.resizable-image-container');
            
            if (sticky) {
                e.stopPropagation();
                showFloatingToolbar(sticky, 'sticky');
            } else if (imgContainer) {
                e.stopPropagation();
                showFloatingToolbar(imgContainer, 'image');
            } else {
                if (floatingToolbar) floatingToolbar.classList.add('hidden');
            }
        });
        
        // Close menu on outer document clicks
        document.addEventListener('click', (e) => {
            if (floatingToolbar && !floatingToolbar.contains(e.target)) {
                floatingToolbar.classList.add('hidden');
            }
        });
        
        // Close menu on drag start
        textEdit.addEventListener('mousedown', (e) => {
            const handle = e.target.closest('.sticky-handle');
            if (handle && floatingToolbar) {
                floatingToolbar.classList.add('hidden');
            }
        });





        // Toggles Canvas sketching overlay
        drawBtn.addEventListener('click', () => {
            this.canvasActive = !this.canvasActive;
            const container = document.getElementById('drawing-canvas-overlay');

            if (container) {
                container.classList.toggle('drawing-active', this.canvasActive);
                drawBtn.classList.toggle('active', this.canvasActive);
                
                if (this.canvasActive) {
                    drawBtn.style.backgroundColor = 'var(--color-primary-glow)';
                } else {
                    drawBtn.style.backgroundColor = '';
                }
            }
        });

        // Toggles Flowchart SVG drawing
        flowBtn.addEventListener('click', () => {
            this.flowchartActive = !this.flowchartActive;
            const container = document.getElementById('flowchart-creator-overlay');
            if (container) {
                container.classList.toggle('hidden', !this.flowchartActive);
                flowBtn.classList.toggle('active', this.flowchartActive);
                
                if (this.flowchartActive) {
                    flowBtn.style.backgroundColor = 'var(--color-primary-glow)';
                    this.app.flowchartBoard.render(container, note);
                } else {
                    flowBtn.style.backgroundColor = '';
                }
            }
        });

    }

    bindStickyNoteDragging(textEdit, note) {
        textEdit.querySelectorAll('.embedded-sticky-note').forEach(sticky => {
            // Remove serialized drag wire state to re-enable dragging on note load
            sticky.removeAttribute('data-drag-wired');
            delete sticky.dataset.dragWired;

            // Auto-migrate old sticky notes to include the top drag handle if missing
            let handle = sticky.querySelector('.sticky-handle');
            if (!handle) {
                handle = document.createElement('div');
                handle.className = 'sticky-handle';
                handle.style.height = '18px';
                handle.style.width = '100%';
                handle.style.cursor = 'move';
                handle.style.display = 'flex';
                handle.style.alignItems = 'center';
                handle.style.justifyContent = 'center';
                handle.style.background = 'rgba(0,0,0,0.03)';
                handle.style.borderRadius = 'var(--radius-sm) var(--radius-sm) 0 0';
                handle.style.margin = '-22px -14px 10px -14px';
                handle.style.padding = '2px 0';
                handle.innerHTML = '<div style="width: 30px; height: 4px; background: rgba(0,0,0,0.15); border-radius: 2px;"></div>';
                
                let contentDiv = sticky.querySelector('.sticky-content');
                if (!contentDiv) {
                    contentDiv = document.createElement('div');
                    contentDiv.className = 'sticky-content';
                    contentDiv.contentEditable = 'true';
                    contentDiv.style.outline = 'none';
                    contentDiv.style.minHeight = '120px';
                    
                    // Move existing elements to contentDiv
                    while (sticky.firstChild) {
                        contentDiv.appendChild(sticky.firstChild);
                    }
                    sticky.appendChild(handle);
                    sticky.appendChild(contentDiv);
                } else {
                    sticky.insertBefore(handle, sticky.firstChild);
                }
            }
            
            // Set content editable on the main container off, keeping it on sticky-content only!
            sticky.setAttribute('contenteditable', 'false');
            const contentEditableDiv = sticky.querySelector('.sticky-content');
            if (contentEditableDiv) {
                contentEditableDiv.setAttribute('contenteditable', 'true');
                
                // Add input event listener to capture typed edits inside sticky notes live
                contentEditableDiv.addEventListener('input', () => {
                    note.content = textEdit.innerHTML;
                    note.lastEdited = new Date().toISOString();
                    this.app.saveToLocalStorage();
                });
            }

            if (sticky.dataset.dragWired) return;
            sticky.dataset.dragWired = 'true';
            
            let isDragging = false;
            let clickOffsetX = 0, clickOffsetY = 0;
            
            sticky.addEventListener('mousedown', (e) => {
                const clickedHandle = e.target.closest('.sticky-handle');
                if (clickedHandle) {
                    isDragging = true;
                    sticky.style.cursor = 'grabbing';
                    
                    const sheet = document.getElementById('notebook-sheet-body');
                    const sheetRect = sheet.getBoundingClientRect();
                    const stickyRect = sticky.getBoundingClientRect();
                    
                    clickOffsetX = e.clientX - stickyRect.left;
                    clickOffsetY = e.clientY - stickyRect.top;
                    
                    const onMouseMove = (ev) => {
                        if (!isDragging) return;
                        const currentSheetRect = sheet.getBoundingClientRect();
                        let x = ev.clientX - currentSheetRect.left - clickOffsetX;
                        let y = ev.clientY - currentSheetRect.top - clickOffsetY;
                        
                        // Relaxed bounds: allow dragging anywhere on the page
                        x = Math.max(-50, x);
                        y = Math.max(0, y);
                        
                        sticky.style.left = `${x}px`;
                        sticky.style.top = `${y}px`;
                    };
                    
                    const onMouseUp = () => {
                        isDragging = false;
                        sticky.style.cursor = 'default';
                        
                        note.content = textEdit.innerHTML;
                        note.lastEdited = new Date().toISOString();
                        this.app.saveToLocalStorage();
                        
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                    };
                    
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
            
            // Auto save on text edits
            const contentDiv = sticky.querySelector('.sticky-content');
            if (contentDiv) {
                contentDiv.addEventListener('input', () => {
                    note.content = textEdit.innerHTML;
                    this.app.saveToLocalStorage();
                });
            }
        });
    }

    openAIFlashcardsModal(note) {
        let modalBackdrop = document.getElementById('ai-flashcards-modal-backdrop');
        if (!modalBackdrop) {
            modalBackdrop = document.createElement('div');
            modalBackdrop.id = 'ai-flashcards-modal-backdrop';
            modalBackdrop.className = 'modal-backdrop';
            modalBackdrop.style.cssText = 'position: fixed; top:0; left:0; width:100%; height:100%; z-index:9999; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px);';
            document.body.appendChild(modalBackdrop);
        }

        modalBackdrop.innerHTML = `
            <div class="modal" style="position:relative; width:520px; max-width:92%; background:var(--bg-container); border:1px solid var(--border-color); border-radius:16px; padding:24px; box-shadow:var(--shadow-lg);">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:12px; margin-bottom:16px;">
                    <h3 style="font-weight:800; color:var(--text-main); font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                        <i data-lucide="zap" style="color:var(--color-primary);"></i> AI Flashcards: ${note.title}
                    </h3>
                    <button class="modal-close" onclick="document.getElementById('ai-flashcards-modal-backdrop').remove()"><i data-lucide="x"></i></button>
                </div>
                <div id="ai-flashcard-body-content">
                    <!-- Cards or Loader injected here -->
                </div>
            </div>
        `;
        lucide.createIcons();
        modalBackdrop.classList.remove('hidden');

        const bodyContainer = document.getElementById('ai-flashcard-body-content');
        this.renderFlashcardDeckView(note, bodyContainer);
    }

    renderFlashcardDeckView(note, container) {
        if (!note.flashcards || note.flashcards.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:30px 10px;">
                    <i data-lucide="sparkles" style="width:40px; height:40px; color:var(--color-primary); margin-bottom:12px;"></i>
                    <h4 style="font-weight:700; color:var(--text-main); margin-bottom:6px;">No AI Flashcards Generated Yet</h4>
                    <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:20px;">Ask Pravio AI to analyze this topic notes and create high-yield Q&A flashcards for exam preparation.</p>
                    <button id="btn-generate-ai-cards-action" class="btn btn-primary" style="margin:0 auto; padding:10px 20px; font-weight:700;">
                        <i data-lucide="zap"></i> Generate Topic Flashcards
                    </button>
                </div>
            `;
            lucide.createIcons();
            const genBtn = container.querySelector('#btn-generate-ai-cards-action');
            if (genBtn) {
                genBtn.addEventListener('click', () => this.generateFlashcardsWithAI(note, container));
            }
            return;
        }

        let currentIndex = 0;
        let isFlipped = false;

        const updateCardView = () => {
            const currentCard = note.flashcards[currentIndex];
            container.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:0.8rem; font-weight:700; color:var(--text-muted);">
                    <span>CARD ${currentIndex + 1} OF ${note.flashcards.length}</span>
                    <button id="btn-re-generate-cards" style="background:transparent; border:none; color:var(--color-primary); cursor:pointer; font-size:0.8rem; font-weight:600; display:flex; align-items:center; gap:4px;">
                        <i data-lucide="refresh-cw" style="width:12px; height:12px;"></i> Regenerate
                    </button>
                </div>
                <div id="ai-flip-card" style="min-height:180px; padding:24px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; cursor:pointer; transition:all 0.3s ease; box-shadow:var(--shadow-sm);">
                    <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--color-primary); margin-bottom:8px;">
                        ${isFlipped ? 'ANSWER' : 'QUESTION'} (Click to Flip)
                    </div>
                    <div style="font-size:1rem; font-weight:600; color:var(--text-main); line-height:1.5;">
                        ${isFlipped ? currentCard.answer : currentCard.question}
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
                    <button id="btn-prev-card" class="btn btn-secondary" ${currentIndex === 0 ? 'disabled style="opacity:0.5;"' : ''}>Previous</button>
                    <button id="btn-flip-card" class="btn btn-primary">Flip Card</button>
                    <button id="btn-next-card" class="btn btn-secondary" ${currentIndex === note.flashcards.length - 1 ? 'disabled style="opacity:0.5;"' : ''}>Next</button>
                </div>
            `;
            lucide.createIcons();

            const cardBox = container.querySelector('#ai-flip-card');
            const flipBtn = container.querySelector('#btn-flip-card');
            const prevBtn = container.querySelector('#btn-prev-card');
            const nextBtn = container.querySelector('#btn-next-card');
            const regenBtn = container.querySelector('#btn-re-generate-cards');

            const toggleFlip = () => {
                isFlipped = !isFlipped;
                updateCardView();
            };

            if (cardBox) cardBox.addEventListener('click', toggleFlip);
            if (flipBtn) flipBtn.addEventListener('click', toggleFlip);

            if (prevBtn && currentIndex > 0) {
                prevBtn.addEventListener('click', () => {
                    currentIndex--;
                    isFlipped = false;
                    updateCardView();
                });
            }

            if (nextBtn && currentIndex < note.flashcards.length - 1) {
                nextBtn.addEventListener('click', () => {
                    currentIndex++;
                    isFlipped = false;
                    updateCardView();
                });
            }

            if (regenBtn) {
                regenBtn.addEventListener('click', () => this.generateFlashcardsWithAI(note, container));
            }
        };

        updateCardView();
    }

    async generateFlashcardsWithAI(note, container) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px 10px;">
                <i data-lucide="loader" class="icon-spin" style="width:36px; height:36px; color:var(--color-primary); margin-bottom:12px;"></i>
                <h4 style="font-weight:700; color:var(--text-main); margin-bottom:4px;">Pravio AI is generating flashcards...</h4>
                <p style="font-size:0.8rem; color:var(--text-muted);">Extracting high-yield exam concepts for "${note.title}"</p>
            </div>
        `;
        lucide.createIcons();

        try {
            const API_BASE = (window.location.protocol === 'file:' || window.location.port === '8000' || window.location.port === '8001' || window.location.port === '8002') ? 'http://localhost:3008' : '';
            const plainTextNotes = note.content.replace(/<[^>]+>/g, ' ').substring(0, 1200);
            
            const response = await fetch(API_BASE + '/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{
                        role: 'user',
                        parts: [{ text: `Generate 5 high-yield exam study flashcards for topic: "${note.title}". Topic Context: ${plainTextNotes}. Return ONLY a raw JSON array of objects with "question" and "answer" keys. No code block quotes or markdown wrappers.` }]
                    }],
                    stream: false
                })
            });

            if (!response.ok) throw new Error('AI Server offline');
            const data = await response.json();
            let text = data.text || '';
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed) && parsed.length > 0) {
                note.flashcards = parsed;
                this.app.saveToLocalStorage();
                this.renderFlashcardDeckView(note, container);
            } else {
                throw new Error('Invalid flashcard array');
            }
        } catch (err) {
            console.error('Flashcard AI generation error:', err);
            note.flashcards = [
                { question: `What is the primary concept of ${note.title}?`, answer: `Core principle: ${note.title} organizes key technical logic efficiently.` },
                { question: `Why is ${note.title} important in exams?`, answer: `It tests fundamental algorithmic efficiency and implementation details.` },
                { question: `What is a key optimization technique for ${note.title}?`, answer: `Reducing memory allocations and using optimal data structures.` }
            ];
            this.app.saveToLocalStorage();
            this.renderFlashcardDeckView(note, container);
        }
    }

    openAICheatsheetModal(note) {
        let modalBackdrop = document.getElementById('ai-cheatsheet-modal-backdrop');
        if (!modalBackdrop) {
            modalBackdrop = document.createElement('div');
            modalBackdrop.id = 'ai-cheatsheet-modal-backdrop';
            modalBackdrop.className = 'modal-backdrop';
            modalBackdrop.style.cssText = 'position: fixed; top:0; left:0; width:100%; height:100%; z-index:9999; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px);';
            document.body.appendChild(modalBackdrop);
        }

        modalBackdrop.innerHTML = `
            <div class="modal" style="position:relative; width:600px; max-width:92%; background:var(--bg-container); border:1px solid var(--border-color); border-radius:16px; padding:24px; box-shadow:var(--shadow-lg);">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:12px; margin-bottom:16px;">
                    <h3 style="font-weight:800; color:var(--text-main); font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                        <i data-lucide="file-text" style="color:var(--color-accent);"></i> AI Cheat-Sheet: ${note.title}
                    </h3>
                    <button class="modal-close" onclick="document.getElementById('ai-cheatsheet-modal-backdrop').remove()"><i data-lucide="x"></i></button>
                </div>
                <div id="ai-cheatsheet-body-content" style="max-height:480px; overflow-y:auto;">
                    <!-- Content injected dynamically -->
                </div>
            </div>
        `;
        lucide.createIcons();
        modalBackdrop.classList.remove('hidden');

        const bodyContainer = document.getElementById('ai-cheatsheet-body-content');
        this.renderCheatsheetView(note, bodyContainer);
    }

    renderCheatsheetView(note, container) {
        if (!note.cheatsheetText) {
            container.innerHTML = `
                <div style="text-align:center; padding:30px 10px;">
                    <i data-lucide="sparkles" style="width:40px; height:40px; color:var(--color-accent); margin-bottom:12px;"></i>
                    <h4 style="font-weight:700; color:var(--text-main); margin-bottom:6px;">No AI Cheat-Sheet Generated Yet</h4>
                    <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:20px;">Ask Pravio AI to generate a quick 1-page formula & summary cheat-sheet for revision.</p>
                    <button id="btn-generate-ai-cs-action" class="btn btn-primary" style="margin:0 auto; padding:10px 20px; font-weight:700; background:var(--color-accent); border:none;">
                        <i data-lucide="file-text"></i> Generate Topic Cheat-Sheet
                    </button>
                </div>
            `;
            lucide.createIcons();
            const genBtn = container.querySelector('#btn-generate-ai-cs-action');
            if (genBtn) {
                genBtn.addEventListener('click', () => this.generateCheatsheetWithAI(note, container));
            }
            return;
        }

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">SAVED REVISION CHEAT-SHEET</span>
                <div style="display:flex; gap:8px;">
                    <button id="btn-copy-cs-text" class="btn btn-secondary btn-sm"><i data-lucide="copy" style="width:12px; height:12px;"></i> Copy</button>
                    <button id="btn-regen-cs-text" class="btn btn-secondary btn-sm"><i data-lucide="refresh-cw" style="width:12px; height:12px;"></i> Regenerate</button>
                </div>
            </div>
            <div style="padding:16px; background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; font-size:0.88rem; color:var(--text-main); line-height:1.6; white-space:pre-wrap; font-family:var(--font-mono);">
${note.cheatsheetText}
            </div>
        `;
        lucide.createIcons();

        const copyBtn = container.querySelector('#btn-copy-cs-text');
        const regenBtn = container.querySelector('#btn-regen-cs-text');

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(note.cheatsheetText).then(() => {
                    copyBtn.innerText = 'Copied!';
                    setTimeout(() => { copyBtn.innerHTML = '<i data-lucide="copy" style="width:12px; height:12px;"></i> Copy'; lucide.createIcons(); }, 2000);
                });
            });
        }

        if (regenBtn) {
            regenBtn.addEventListener('click', () => this.generateCheatsheetWithAI(note, container));
        }
    }

    async generateCheatsheetWithAI(note, container) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px 10px;">
                <i data-lucide="loader" class="icon-spin" style="width:36px; height:36px; color:var(--color-accent); margin-bottom:12px;"></i>
                <h4 style="font-weight:700; color:var(--text-main); margin-bottom:4px;">Pravio AI is compiling your Cheat-Sheet...</h4>
                <p style="font-size:0.8rem; color:var(--text-muted);">Condensing key formulas and concepts for "${note.title}"</p>
            </div>
        `;
        lucide.createIcons();

        try {
            const API_BASE = (window.location.protocol === 'file:' || window.location.port === '8000' || window.location.port === '8001' || window.location.port === '8002') ? 'http://localhost:3008' : '';
            const plainTextNotes = note.content.replace(/<[^>]+>/g, ' ').substring(0, 1200);

            const response = await fetch(API_BASE + '/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{
                        role: 'user',
                        parts: [{ text: `Create a concise 1-page revision Cheat-Sheet for topic: "${note.title}". Topic Context: ${plainTextNotes}. Include key definitions, formulas/code snippets, and top exam tips.` }]
                    }],
                    stream: false
                })
            });

            if (!response.ok) throw new Error('AI Server offline');
            const data = await response.json();
            const csText = data.text || `Cheatsheet for ${note.title}:\n\n1. Overview: Core concepts and definitions.\n2. Key Formulas / Code: See notes.\n3. Exam Tip: Focus on edge cases.`;

            note.cheatsheetText = csText;
            this.app.saveToLocalStorage();
            this.renderCheatsheetView(note, container);
        } catch (err) {
            console.error('Cheatsheet AI generation error:', err);
            note.cheatsheetText = `# ${note.title} - Revision Cheat Sheet\n\n- Key Definition: Fundamental logic for ${note.title}.\n- Main Formula / Logic: Ensure optimal efficiency.\n- Exam Focus: Edge cases and time complexity.`;
            this.app.saveToLocalStorage();
            this.renderCheatsheetView(note, container);
        }
    }
}

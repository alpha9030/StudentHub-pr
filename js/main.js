// Pravio Notes Central App Coordinator
import { initialFolders, initialNotes, initialQuizzes, initialFlashcards } from './database.js';
import { Dashboard } from './components/dashboard.js';
import { Editor } from './components/editor.js';
import { CanvasBoard } from './components/canvas.js';
import { StudyHub } from './components/study-hub.js';
import { AIAssistant } from './components/ai-assistant.js';
import { FlowchartBoard } from './components/flowchart.js';

class App {
    constructor() {
        this.activeTab = 'dashboard';
        
        // App Database State (Load from localStorage if exists)
        this.folders = JSON.parse(localStorage.getItem('pravio_folders')) || [...initialFolders];
        this.notes = JSON.parse(localStorage.getItem('pravio_notes')) || [...initialNotes];

        // Self-healing migration to split Web Dev and Programming Languages folders
        let migrated = false;
        const oldFolderIdx = this.folders.findIndex(f => f.id === 'f-langs' && (f.name.includes('Web Dev') || f.name === 'Web Dev & Languages'));
        if (oldFolderIdx !== -1) {
            this.folders[oldFolderIdx].name = 'Programming Languages';
            this.folders[oldFolderIdx].icon = 'code';
            
            if (!this.folders.some(f => f.id === 'f-webdev')) {
                this.folders.push({ id: 'f-webdev', name: 'Web Development', icon: 'globe' });
            }
            migrated = true;
        }

        // Permanently filter out all built-in/pre-installed notes
        const builtInIds = ['n-eventloop', 'n-bubblesort', 'n-sqljoins', 'n-python-generators'];
        const originalNotesLength = this.notes.length;
        this.notes = this.notes.filter(note => !builtInIds.includes(note.id));
        if (this.notes.length !== originalNotesLength) {
            migrated = true;
        }

        if (migrated) {
            localStorage.setItem('pravio_folders', JSON.stringify(this.folders));
            localStorage.setItem('pravio_notes', JSON.stringify(this.notes));
        }
        const mockCheatsheets = [
            { id: 'cs-1', name: 'JavaScript Array Methods.pdf', type: 'pdf', size: '245 KB', date: 'Jul 06, 2026', data: '#' },
            { id: 'cs-2', name: 'Git Cheat Sheet.png', type: 'image', size: '420 KB', date: 'Jul 07, 2026', data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%236366f1"/><text x="50" y="55" fill="white" font-family="sans-serif" font-size="12" text-anchor="middle">Git Cheatsheet</text></svg>' }
        ];
        this.cheatsheets = JSON.parse(localStorage.getItem('pravio_cheatsheets')) || mockCheatsheets;
        this.quizzes = [...initialQuizzes];
        
        // Populate flashcard deck from initial global cards + all note-specific cards
        const collectedFlashcards = [...initialFlashcards];
        this.notes.forEach(note => {
            if (note.flashcards) {
                note.flashcards.forEach(fc => {
                    if (!collectedFlashcards.some(c => c.question === fc.question)) {
                        collectedFlashcards.push({
                            category: note.category || 'Topic Study',
                            question: fc.question,
                            answer: fc.answer,
                            known: false
                        });
                    }
                });
            }
        });
        this.flashcards = collectedFlashcards;

        this.activeFolderId = null;
        this.activeTag = null;
        this.activeNote = null;
        
        // Stats
        this.stats = {
            notesCreated: this.notes.length,
            notesRead: 14,
            studyTime: 120, // mins
            streak: 6,
            quizzesCompleted: 8,
            cardsPracticed: 15
        };

        // Cache Elements
        this.navBtns = document.querySelectorAll('.nav-btn');
        this.viewport = document.getElementById('active-viewport');
        this.searchBar = document.getElementById('search-input');
        this.btnThemeToggle = document.getElementById('btn-theme-toggle');
        this.btnCreateNote = document.getElementById('btn-create-note');
        this.btnAddFolder = document.getElementById('btn-add-folder');
        
        // Modal elements
        this.btnImport = document.getElementById('btn-import-file');
        this.importBackdrop = document.getElementById('import-modal-backdrop');
        this.importModal = document.getElementById('import-modal');
        this.btnCloseImport = document.getElementById('btn-close-import');
        this.importDropzone = document.getElementById('import-drop-area');
        this.filePicker = document.getElementById('file-picker');
        this.importLoader = document.getElementById('import-loader');

        // Components
        this.dashboard = new Dashboard(this);
        this.editor = new Editor(this);
        this.canvasBoard = new CanvasBoard(this);
        this.studyHub = new StudyHub(this);
        this.aiAssistant = new AIAssistant(this);
        this.flowchartBoard = new FlowchartBoard(this);

        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupSidebarData();
        this.setupThemeToggle();
        this.setupNoteCreation();
        this.setupSearch();
        this.setupImportModal();
        this.setupFolderCreation();

        // Load Default View
        this.switchTab('dashboard');
    }

    setupNavigation() {
        this.navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const tab = btn.getAttribute('data-tab');
                if (tab === 'notes') {
                    this.activeFolderId = null;
                    this.activeNote = null;
                    const folders = document.querySelectorAll('.folder-item');
                    folders.forEach(f => f.classList.remove('active'));
                }
                this.switchTab(tab);
            });
        });
    }

    switchTab(tab) {
        this.activeTab = tab;
        this.viewport.innerHTML = ''; // Clear viewport

        // Sync sidebar active class
        this.navBtns.forEach(btn => {
            const btnTab = btn.getAttribute('data-tab');
            btn.classList.toggle('active', btnTab === tab);
        });

        // Load view layout
        if (tab === 'dashboard') {
            this.dashboard.render(this.viewport);
        } else if (tab === 'notes') {
            this.editor.render(this.viewport);
        } else if (tab === 'cheatsheet') {
            this.renderCheatsheet(this.viewport);
        } else if (tab === 'flashcards') {
            this.studyHub.renderFlashcards(this.viewport);
        } else if (tab === 'canvas') {
            this.canvasBoard.render(this.viewport);
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderCheatsheet(container) {
        // Create templates for Cheatsheet cards
        const renderCardIcon = (type) => {
            if (type === 'pdf') {
                return `<i data-lucide="file-text" style="color: #ef4444; width: 28px; height: 28px;"></i>`;
            } else if (type === 'word') {
                return `<i data-lucide="file-text" style="color: #3b82f6; width: 28px; height: 28px;"></i>`;
            } else if (type === 'image') {
                return `<i data-lucide="image" style="color: #10b981; width: 28px; height: 28px;"></i>`;
            } else {
                return `<i data-lucide="edit-3" style="color: #f59e0b; width: 28px; height: 28px;"></i>`;
            }
        };

        const gridHtml = this.cheatsheets.length > 0 ? this.cheatsheets.map(cs => `
            <div class="notebook-binder-card" style="height: auto; flex-direction: column; padding: 18px; display: flex; gap: 12px; border-top: 4px solid ${cs.type === 'pdf' ? '#ef4444' : (cs.type === 'image' ? '#10b981' : '#f59e0b')};" data-id="${cs.id}">
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <div style="width: 44px; height: 44px; border-radius: var(--radius-sm); background: var(--bg-input); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        ${renderCardIcon(cs.type)}
                    </div>
                    <div style="flex: 1; overflow: hidden;">
                        <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;" title="${cs.name}">${cs.name}</h4>
                        <div style="display: flex; gap: 8px; font-size: 0.7rem; color: var(--text-muted); font-weight: 600;">
                            <span>${cs.type.toUpperCase()}</span>
                            <span>•</span>
                            <span>${cs.size}</span>
                        </div>
                    </div>
                </div>
                
                ${cs.type === 'image' && cs.data.startsWith('data:') ? `
                    <div style="width: 100%; height: 90px; border-radius: var(--radius-sm); overflow: hidden; background-color: var(--bg-input); border: 1px solid var(--border-color);">
                        <img src="${cs.data}" style="width: 100%; height: 100%; object-fit: cover;" />
                    </div>
                ` : ''}

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; border-top: 1px solid var(--border-color); padding-top: 12px;">
                    <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 500;">Added ${cs.date}</span>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn btn-secondary btn-sm btn-view-cs" data-id="${cs.id}" style="padding: 4px 8px; font-size: 0.75rem;">
                            View
                        </button>
                        <button class="icon-btn btn-delete-cs" data-id="${cs.id}" style="color: var(--color-accent); padding: 4px;" title="Delete Cheatsheet">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('') : `
            <div style="grid-column: 1 / -1; padding: 60px 40px; text-align: center; color: var(--text-muted); background: var(--bg-card); border: 1px dashed var(--border-color); border-radius: var(--radius-lg);">
                <i data-lucide="help-circle" style="width: 48px; height: 48px; margin-bottom: 12px; color: var(--color-primary); opacity: 0.7;"></i>
                <h4 style="font-weight: 700; color: var(--text-main); font-size: 1rem;">No cheatsheets in your vault</h4>
                <p style="font-size: 0.8rem; margin-top: 4px; max-width: 320px; margin-left: auto; margin-right: auto;">Upload reference documents or write your own custom study cards to review them anytime.</p>
            </div>
        `;

        container.innerHTML = `
            <div style="max-width: 960px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; padding-top: 10px;">
                <!-- Header Block -->
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 42px; height: 42px; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: white;">
                            <i data-lucide="help-circle" style="width: 22px; height: 22px;"></i>
                        </div>
                        <div>
                            <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); line-height: 1.2;">Cheatsheet Vault</h2>
                            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">Your personal reference repository. Upload files or create quick reference notes.</p>
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button class="btn btn-secondary" id="btn-create-cheatsheet">
                            <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>Write Custom Note
                        </button>
                        <button class="btn btn-primary" id="btn-upload-cheatsheet">
                            <i data-lucide="upload-cloud" style="width: 16px; height: 16px;"></i>Upload File (PDF/Doc/Img)
                        </button>
                        <input type="file" id="cheatsheet-file-input" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt" style="display: none;" />
                    </div>
                </div>

                <!-- Main Card Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px;">
                    ${gridHtml}
                </div>
            </div>

            <!-- Modal for Creating Cheatsheet -->
            <div id="cs-modal-backdrop" class="modal-backdrop hidden" style="display: flex; align-items: center; justify-content: center;">
                <div class="modal" style="position: relative; top: auto; left: auto; transform: none; width: 450px;">
                    <div class="modal-header">
                        <h3 style="font-weight: 700; color: var(--text-main); font-size: 1rem;">Create Custom Cheatsheet</h3>
                        <button class="modal-close" id="btn-close-cs-modal"><i data-lucide="x"></i></button>
                    </div>
                    <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <label style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted);">CHEATSHEET TITLE</label>
                            <input type="text" id="cs-modal-title" placeholder="e.g. SQL Syntax Cheat Sheet" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-input); color: var(--text-main); font-size: 0.85rem; outline: none; width: 100%;" />
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <label style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted);">CONTENT (NOTES / FORMULAS)</label>
                            <textarea id="cs-modal-content" placeholder="Type or paste your formulas and definitions here..." rows="8" style="padding: 8px 12px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-input); color: var(--text-main); font-size: 0.85rem; outline: none; resize: vertical; width: 100%; font-family: var(--font-mono);"></textarea>
                        </div>
                        <button class="btn btn-primary" id="btn-save-cs-modal" style="width: 100%; justify-content: center; margin-top: 8px;">
                            Save Cheatsheet
                        </button>
                    </div>
                </div>
            </div>

            <!-- Viewer Modal Dialog -->
            <div id="cs-viewer-backdrop" class="modal-backdrop hidden" style="display: flex; align-items: center; justify-content: center;">
                <div class="modal" style="position: relative; top: auto; left: auto; transform: none; width: 600px; max-width: 90%;">
                    <div class="modal-header">
                        <h3 id="cs-viewer-title" style="font-weight: 700; color: var(--text-main); font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 400px;">Cheatsheet Viewer</h3>
                        <button class="modal-close" id="btn-close-cs-viewer"><i data-lucide="x"></i></button>
                    </div>
                    <div class="modal-body" id="cs-viewer-body" style="padding: 20px; overflow-y: auto; max-height: 480px;">
                        <!-- Injected dynamically -->
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();

        // 1. Upload file handlers
        const fileBtn = container.querySelector('#btn-upload-cheatsheet');
        const fileInput = container.querySelector('#cheatsheet-file-input');
        
        if (fileBtn && fileInput) {
            fileBtn.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', () => {
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const reader = new FileReader();
                    
                    reader.onload = (e) => {
                        const type = file.type.includes('image') ? 'image' : (file.name.endsWith('.pdf') ? 'pdf' : (file.name.endsWith('.doc') || file.name.endsWith('.docx') ? 'word' : 'text'));
                        const size = file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : (file.size / 1024).toFixed(0) + ' KB';
                        
                        const newCs = {
                            id: 'cs-' + Date.now(),
                            name: file.name,
                            type: type,
                            size: size,
                            date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                            data: e.target.result // base64 string
                        };
                        
                        this.cheatsheets.unshift(newCs);
                        this.saveToLocalStorage();
                        this.renderCheatsheet(container); // Refresh
                    };
                    
                    reader.readAsDataURL(file);
                }
            });
        }

        // 2. Custom creation modal handlers
        const createBtn = container.querySelector('#btn-create-cheatsheet');
        const modalBackdrop = container.querySelector('#cs-modal-backdrop');
        const closeCsModalBtn = container.querySelector('#btn-close-cs-modal');
        const saveCsModalBtn = container.querySelector('#btn-save-cs-modal');

        if (createBtn) {
            createBtn.addEventListener('click', () => {
                modalBackdrop.classList.remove('hidden');
            });
        }
        if (closeCsModalBtn) {
            closeCsModalBtn.addEventListener('click', () => {
                modalBackdrop.classList.add('hidden');
            });
        }
        if (saveCsModalBtn) {
            saveCsModalBtn.addEventListener('click', () => {
                const titleInput = container.querySelector('#cs-modal-title');
                const contentInput = container.querySelector('#cs-modal-content');
                const title = titleInput.value.trim();
                const content = contentInput.value.trim();

                if (title && content) {
                    const newCs = {
                        id: 'cs-' + Date.now(),
                        name: title,
                        type: 'text',
                        size: (new Blob([content]).size / 1024).toFixed(1) + ' KB',
                        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                        data: content
                    };

                    this.cheatsheets.unshift(newCs);
                    this.saveToLocalStorage();

                    // reset modal
                    titleInput.value = '';
                    contentInput.value = '';
                    modalBackdrop.classList.add('hidden');

                    this.renderCheatsheet(container); // Refresh
                } else {
                    alert('Please fill out both the title and text content!');
                }
            });
        }

        // 3. Item action handlers
        container.querySelectorAll('.btn-view-cs').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const cs = this.cheatsheets.find(item => item.id === id);
                if (cs) {
                    const viewerBackdrop = container.querySelector('#cs-viewer-backdrop');
                    const viewerTitle = container.querySelector('#cs-viewer-title');
                    const viewerBody = container.querySelector('#cs-viewer-body');
                    
                    viewerTitle.textContent = cs.name;
                    
                    if (cs.type === 'image') {
                        viewerBody.innerHTML = `
                            <div style="text-align: center;">
                                <img src="${cs.data}" style="max-width: 100%; max-height: 400px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);" />
                                <div style="margin-top: 16px;">
                                    <a class="btn btn-primary" href="${cs.data}" download="${cs.name}" style="display: inline-flex; width: auto; margin: 0 auto;">
                                        <i data-lucide="download" style="width: 14px; height: 14px;"></i>Download Image
                                    </a>
                                </div>
                            </div>
                        `;
                    } else if (cs.type === 'text') {
                        viewerBody.innerHTML = `
                            <pre style="font-family: var(--font-mono); white-space: pre-wrap; font-size: 0.8rem; line-height: 1.5; color: var(--text-main); background: var(--bg-input); padding: 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); max-height: 380px; overflow-y: auto;">${cs.data}</pre>
                            <div style="text-align: right; margin-top: 14px;">
                                <button class="btn btn-secondary btn-sm" id="btn-copy-cs-text" style="display: inline-flex; gap: 4px;">
                                    <i data-lucide="copy" style="width: 12px; height: 12px;"></i>Copy to Clipboard
                                </button>
                            </div>
                        `;
                        
                        // Copy text handler
                        const copyBtn = viewerBody.querySelector('#btn-copy-cs-text');
                        if (copyBtn) {
                            copyBtn.addEventListener('click', () => {
                                navigator.clipboard.writeText(cs.data);
                                copyBtn.innerHTML = `<i data-lucide="check" style="width: 12px; height: 12px;"></i>Copied!`;
                                setTimeout(() => {
                                    copyBtn.innerHTML = `<i data-lucide="copy" style="width: 12px; height: 12px;"></i>Copy to Clipboard`;
                                    lucide.createIcons();
                                }, 1500);
                                lucide.createIcons();
                            });
                        }
                    } else {
                        // PDF or Word documents
                        viewerBody.innerHTML = `
                            <div style="text-align: center; padding: 30px 20px;">
                                <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--bg-input); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
                                    <i data-lucide="file-text" style="width: 32px; height: 32px; color: ${cs.type === 'pdf' ? '#ef4444' : '#3b82f6'};"></i>
                                </div>
                                <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">${cs.name}</h4>
                                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 24px;">This file type (${cs.type.toUpperCase()}) cannot be rendered directly in the browser viewer.</p>
                                <a class="btn btn-primary" href="${cs.data}" download="${cs.name}" style="display: inline-flex; width: auto; margin: 0 auto; gap: 8px;">
                                    <i data-lucide="download-cloud" style="width: 16px; height: 16px;"></i>Download to Open File
                                </a>
                            </div>
                        `;
                    }
                    
                    lucide.createIcons();
                    viewerBackdrop.classList.remove('hidden');
                    
                    // Close viewer triggers
                    const closeViewerBtn = container.querySelector('#btn-close-cs-viewer');
                    if (closeViewerBtn) {
                        closeViewerBtn.addEventListener('click', () => {
                            viewerBackdrop.classList.add('hidden');
                        });
                    }
                }
            });
        });

        container.querySelectorAll('.btn-delete-cs').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this cheatsheet from your vault?')) {
                    this.cheatsheets = this.cheatsheets.filter(item => item.id !== id);
                    this.saveToLocalStorage();
                    this.renderCheatsheet(container); // Refresh
                }
            });
        });
    }

    setupSidebarData() {
        // Folders list
        const folderList = document.getElementById('folder-list');
        if (!folderList) return;

        folderList.innerHTML = this.folders.map(folder => `
            <li class="folder-item" data-id="${folder.id}" style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding-right: 6px;">
                <div class="folder-meta" style="display: flex; align-items: center; gap: 8px;">
                    <i data-lucide="${folder.icon || 'folder'}"></i>
                    <span>${folder.name}</span>
                </div>
                <button class="icon-btn btn-delete-folder" data-id="${folder.id}" title="Delete Notebook" style="padding: 4px; border: none; background: transparent; cursor: pointer; color: var(--color-accent); opacity: 0.5; transition: opacity 0.15s; display: flex; align-items: center;">
                    <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                </button>
            </li>
        `).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind folder delete clicks
        folderList.querySelectorAll('.btn-delete-folder').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Avoid triggering folder selection click
                const folderId = btn.getAttribute('data-id');
                const folder = this.folders.find(f => f.id === folderId);
                if (folder) {
                    const notesCount = this.notes.filter(n => n.folderId === folderId).length;
                    const confirmMsg = `Are you sure you want to delete the notebook "${folder.name}" completely?\nThis will permanently delete the folder and all its ${notesCount} notes!`;
                    if (confirm(confirmMsg)) {
                        // Delete folder
                        this.folders = this.folders.filter(f => f.id !== folderId);
                        
                        // Delete notes
                        this.notes = this.notes.filter(n => n.folderId !== folderId);
                        
                        // Reset active states
                        if (this.activeFolderId === folderId) {
                            this.activeFolderId = null;
                        }
                        if (this.activeNote && this.activeNote.folderId === folderId) {
                            this.activeNote = null;
                        }
                        
                        // Save changes
                        this.saveToLocalStorage();
                        
                        // Re-render
                        this.setupSidebarData();
                        this.switchTab('dashboard');
                    }
                }
            });
            
            // Hover effect to light up trash can
            btn.addEventListener('mouseenter', () => btn.style.opacity = '1');
            btn.addEventListener('mouseleave', () => btn.style.opacity = '0.5');
        });

        folderList.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('click', () => {
                folderList.querySelectorAll('.folder-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                this.activeFolderId = item.getAttribute('data-id');
                this.activeTag = null;
                
                // Automatically find and open the first note inside this folder
                const folderNotes = this.notes.filter(n => n.folderId === this.activeFolderId);
                if (folderNotes.length > 0) {
                    this.activeNote = folderNotes[0];
                } else {
                    this.activeNote = null;
                }
                
                // Route to Notes list
                this.switchTab('notes');
                this.editor.filterNotesList();
            });
        });


    }

    setupFolderCreation() {
        if (this.btnAddFolder) {
            this.btnAddFolder.addEventListener('click', (e) => {
                e.stopPropagation();
                const folderName = prompt('Enter name for the new folder:');
                if (folderName && folderName.trim()) {
                    const newFolder = {
                        id: 'f-' + Date.now(),
                        name: folderName.trim(),
                        icon: 'folder'
                    };
                    this.folders.push(newFolder);
                    this.saveToLocalStorage();
                    this.setupSidebarData();
                }
            });
        }
    }



    setupThemeToggle() {
        this.btnThemeToggle.addEventListener('click', () => {
            const body = document.body;
            const darkIcon = this.btnThemeToggle.querySelector('.dark-icon');
            const lightIcon = this.btnThemeToggle.querySelector('.light-icon');

            if (body.classList.contains('light-mode')) {
                body.classList.replace('light-mode', 'dark-mode');
                darkIcon.classList.add('hidden');
                lightIcon.classList.remove('hidden');
            } else {
                body.classList.replace('dark-mode', 'light-mode');
                darkIcon.classList.remove('hidden');
                lightIcon.classList.add('hidden');
            }
        });
    }

    setupNoteCreation() {
        this.btnCreateNote.addEventListener('click', () => {
            const newNote = {
                id: 'n-' + Date.now(),
                folderId: this.activeFolderId || this.folders[0].id,
                title: 'Untitled Note',
                category: 'Programming Notes',
                template: 'Classic Notebook',
                pinned: false,
                favorite: false,
                tags: ['General'],
                color: '#6366f1',
                lastEdited: new Date().toISOString(),
                content: '<h3>Start writing here...</h3><p>Use the templates or drawing canvas to capture your ideas.</p>',
                code: '// Write code here',
                language: 'javascript',
                complexity: {
                    time: 'O(1)',
                    space: 'O(1)',
                    best: 'O(1)',
                    average: 'O(1)',
                    worst: 'O(1)',
                    stable: 'Yes',
                    recursive: 'Iterative',
                    inplace: 'In-place',
                    difficulty: 'Easy',
                    frequency: '10%',
                    applications: 'General operations',
                    tips: 'Write simple readable variables.'
                },
                flowchart: { nodes: [], links: [] },
                quizzes: [],
                flashcards: []
            };

            this.notes.unshift(newNote);
            this.activeNote = newNote;
            this.stats.notesCreated++;
            this.saveToLocalStorage();
            
            // Re-render sidebar details & open note
            this.setupSidebarData();
            this.switchTab('notes');
            this.editor.loadNote(newNote);
        });
    }

    setupSearch() {
        this.searchBar.addEventListener('input', () => {
            const query = this.searchBar.value.toLowerCase().trim();
            
            // Auto switch tabs to notes when starting to search from other pages
            if (query && this.activeTab !== 'notes') {
                this.activeTab = 'notes';
                this.navBtns.forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-tab') === 'notes');
                });
            }
            
            if (this.activeTab === 'notes') {
                this.editor.render(this.viewport, query);
            }
        });
    }

    setupImportModal() {
        const toggleModal = (show) => {
            this.importBackdrop.classList.toggle('hidden', !show);
            this.importModal.classList.toggle('hidden', !show);
            if (!show) {
                this.importLoader.classList.add('hidden');
                this.importDropzone.classList.remove('hidden');
            }
        };

        this.btnImport.addEventListener('click', () => toggleModal(true));
        this.btnCloseImport.addEventListener('click', () => toggleModal(false));
        this.importBackdrop.addEventListener('click', () => toggleModal(false));

        this.importDropzone.addEventListener('click', () => {
            this.filePicker.click();
        });

        this.filePicker.addEventListener('change', () => {
            if (this.filePicker.files.length > 0) {
                this.processImport(this.filePicker.files[0]);
            }
        });
    }

    async processImport(file) {
        this.importDropzone.classList.add('hidden');
        this.importLoader.classList.remove('hidden');

        // Simulate AI import parsing
        await new Promise(resolve => setTimeout(resolve, 2000));

        const baseName = file.name.split('.')[0];
        const generatedNote = {
            id: 'n-' + Date.now(),
            folderId: this.activeFolderId || this.folders[0].id,
            title: `AI Notes: ${baseName}`,
            category: 'AI Generated Notes',
            template: 'Classic Notebook',
            pinned: false,
            favorite: false,
            tags: ['AI-Imported', 'Revision'],
            color: '#14b8a6',
            lastEdited: new Date().toISOString(),
            content: `<h3>AI Generated summary of ${file.name}</h3>
<p>Extracted main programming concepts. This syllabus details memory layouts and compilation rules.</p>
<div class="note-box note-box-note">
    <strong>Syllabus Focus:</strong> Code complexity optimization, data structure selections, and compilation pipeline properties.
</div>`,
            code: `// Extracted example code\nfunction executeTask() {\n    console.log("Syllabus logic");\n}`,
            language: 'javascript',
            complexity: {
                time: 'O(N)',
                space: 'O(N)',
                best: 'O(1)',
                average: 'O(N)',
                worst: 'O(N)',
                stable: 'Yes',
                recursive: 'Iterative',
                inplace: 'Out-of-place',
                difficulty: 'Medium',
                frequency: '65%',
                applications: 'Process flows.',
                tips: 'Optimize recursion using iteration.'
            },
            flowchart: { nodes: [], links: [] },
            quizzes: [
                {
                    type: 'mcq',
                    question: 'What is compilation pipeline output?',
                    options: ['Assembly / Bytecode', 'Source code', 'Pseudocode'],
                    answer: 0,
                    explanation: 'Compilers translate source code directly into low level machine bytes or assembly.'
                }
            ],
            flashcards: [
                {
                    question: 'Difference between compiler and interpreter?',
                    answer: 'Compilers compile the entire code ahead of execution, whereas interpreters evaluate it line-by-line during runtime.'
                }
            ]
        };

        this.notes.unshift(generatedNote);
        this.activeNote = generatedNote;
        this.saveToLocalStorage();
        
        // Push generated quiz & flashcard to global lists
        this.quizzes.push(...generatedNote.quizzes);
        this.flashcards.push(...generatedNote.flashcards);

        // Reset UI states
        this.setupSidebarData();
        this.switchTab('notes');
        this.editor.loadNote(generatedNote);

        // Close modal
        this.importBackdrop.classList.add('hidden');
        this.importModal.classList.add('hidden');
        this.importLoader.classList.add('hidden');
        this.importDropzone.classList.remove('hidden');

        // Confetti!
        confetti({
            particleCount: 80,
            spread: 50,
            origin: { y: 0.6 }
        });
    }

    saveToLocalStorage(manual = false) {
        localStorage.setItem('pravio_folders', JSON.stringify(this.folders));
        localStorage.setItem('pravio_notes', JSON.stringify(this.notes));
        localStorage.setItem('pravio_cheatsheets', JSON.stringify(this.cheatsheets));
        
        // Pulse save indicator badge only when manually clicked
        const indicator = document.getElementById('autosave-indicator');
        if (indicator) {
            if (manual) {
                indicator.classList.remove('hidden');
                indicator.classList.remove('saving-fade');
                void indicator.offsetWidth; // Trigger reflow
                indicator.classList.add('saving-fade');
                
                if (this.saveIndicatorTimeout) {
                    clearTimeout(this.saveIndicatorTimeout);
                }
                this.saveIndicatorTimeout = setTimeout(() => {
                    indicator.classList.add('hidden');
                }, 2000);
            }
        }
    }
}

window.app = new App();

// Pravio Notes Learning Dashboard Render Helper

class Dashboard {
    constructor(app) {
        this.app = app;
    }

    render(container) {
        const stats = this.app.stats;
        
        // Pinned & Favorite Notes
        const pinned = this.app.notes.filter(n => n.pinned);
        const favorites = this.app.notes.filter(n => n.favorite);
        const recentlyEdited = [...this.app.notes]
            .sort((a, b) => new Date(b.lastEdited || 0) - new Date(a.lastEdited || 0))
            .slice(0, 3);

        container.innerHTML = `
            <div class="dashboard-title-row">
                <h2>Welcome Back to Pravio Notebook</h2>
            </div>

            <!-- Stats Analytics row -->
            <div class="analytics-grid" style="margin-top: 20px;">
                <div class="analytic-card">
                    <div class="analytic-val">${stats.notesCreated}</div>
                    <div class="analytic-lbl">Notes Created</div>
                </div>
            </div>

            <!-- Dashboard Columns -->
            <div class="dashboard-grid">
                <!-- Column 1: Pinned / Heatmap / Edits -->
                <div class="dashboard-col-left">


                    <!-- Pinned Notes -->
                    <div class="dashboard-panel">
                        <div class="section-header">
                            <span>PINNED STUDY NOTES</span>
                        </div>
                        <div class="recent-notes-list">
                            ${pinned.map(n => `
                                <div class="note-grid-card pinned" data-id="${n.id}">
                                    <h4>${n.title}</h4>
                                    <p>${n.content.replace(/<[^>]*>/g, '').substring(0, 80)}...</p>
                                    <div class="note-card-footer">
                                        <span>${n.category}</span>
                                        <i data-lucide="pin" style="width: 12px; height: 12px; color: var(--color-accent);"></i>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Recently Edited -->
                    <div class="dashboard-panel">
                        <div class="section-header">
                            <span>RECENTLY EDITED</span>
                        </div>
                        <div class="recent-notes-list">
                            ${recentlyEdited.map(n => `
                                <div class="note-grid-card" data-id="${n.id}" style="border-left-color: ${n.color || '#6366f1'}">
                                    <h4>${n.title}</h4>
                                    <p>${n.content.replace(/<[^>]*>/g, '').substring(0, 80)}...</p>
                                    <div class="note-card-footer">
                                        <span>${n.category}</span>
                                        <span>Edit: ${n.lastEdited ? new Date(n.lastEdited).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }) : '7/7/26'}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Column 2: Favorites / Quick Revision -->
                <div class="dashboard-col-right">
                    <!-- Favorite Notes -->
                    <div class="dashboard-panel">
                        <div class="section-header">
                            <span>FAVORITE TOPICS</span>
                        </div>
                        <div class="recent-notes-list" style="grid-template-columns: 1fr; gap: 12px;">
                            ${favorites.map(n => `
                                <div class="note-grid-card" data-id="${n.id}" style="border-left-color: ${n.color || '#6366f1'}">
                                    <h4>${n.title}</h4>
                                    <div class="note-card-footer">
                                        <span>${n.category}</span>
                                        <i data-lucide="star" style="width: 12px; height: 12px; fill: var(--color-primary); color: var(--color-primary);"></i>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                </div>
            </div>
        `;

        this.setupEvents(container);
    }



    setupEvents(container) {
        // Pinned/Edited note cards click routing
        const noteCards = container.querySelectorAll('.note-grid-card');
        noteCards.forEach(card => {
            card.addEventListener('click', () => {
                const noteId = card.getAttribute('data-id');
                const note = this.app.notes.find(n => n.id === noteId);
                if (note) {
                    this.app.activeFolderId = note.folderId;
                    this.app.activeNote = note;
                    
                    // Highlight selected folder in sidebar
                    this.app.setupSidebarData();
                    const sidebarFolder = document.querySelector(`.folder-item[data-id="${note.folderId}"]`);
                    if (sidebarFolder) sidebarFolder.classList.add('active');
                    
                    this.app.switchTab('notes');
                    this.app.editor.loadNote(note);
                }
            });
        });
    }
}

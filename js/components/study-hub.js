// Pravio Notes Quizzes and Spaced Repetition Flashcards Practice Decks

export class StudyHub {
    constructor(app) {
        this.app = app;
        this.cardIndex = 0;
        this.cardFlipped = false;
        
        // Quiz state
        this.quizIndex = 0;
        this.selectedAnswer = null;
        this.hasAnswered = false;
        this.score = 0;
    }

    // ==========================================
    // FLASHCARDS DECK
    // ==========================================
    renderFlashcards(container) {
        const cards = this.app.flashcards;
        
        if (cards.length === 0) {
            container.innerHTML = `
                <div class="flashcards-layout">
                    <h3 style="color: var(--text-main);">No study flashcards generated yet!</h3>
                    <p style="color: var(--text-muted); font-size: 0.85rem;">Create code blocks inside your notes and click "Gen Flashcards" to auto-populate terms.</p>
                </div>
            `;
            return;
        }

        if (this.cardIndex >= cards.length) this.cardIndex = 0;
        const currentCard = cards[this.cardIndex];

        container.innerHTML = `
            <div class="flashcards-layout">
                <div class="dashboard-title-row" style="text-align: center; width: 100%;">
                    <h2>Flashcard Practice</h2>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">Spaced Repetition: Flip cards to test your recall.</p>
                </div>

                <div class="fc-scene">
                    <div class="fc-card ${this.cardFlipped ? 'is-flipped' : ''}" id="flashcard-box">
                        <!-- Front Face -->
                        <div class="fc-face fc-face-front" style="display: flex; flex-direction: column; justify-content: space-between; padding: 24px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                                <span class="tag-badge" style="background-color: var(--color-primary-glow); color: var(--color-primary); font-weight:700;">
                                    ${currentCard.category || 'Topic Study'}
                                </span>
                                <span style="font-size: 0.7rem; font-weight: 700; color: var(--color-secondary);">
                                    ${(currentCard.box === 3) ? '🎓 Box 3: Mastered' : (currentCard.box === 2) ? '⏳ Box 2: Medium' : '📅 Box 1: Daily'}
                                </span>
                            </div>
                            <div class="fc-question" style="margin: auto 0; font-size: 1.15rem; font-weight: 600;">${currentCard.question}</div>
                            <div style="text-align: center; font-size: 0.75rem; color: var(--text-muted);">
                                Click card to reveal answer
                            </div>
                        </div>

                        <!-- Back Face -->
                        <div class="fc-face fc-face-back" style="display: flex; flex-direction: column; justify-content: space-between; padding: 24px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                                <span class="tag-badge" style="background-color: var(--color-secondary-glow); color: var(--color-secondary); font-weight:700;">
                                    RECALL ANSWER
                                </span>
                            </div>
                            <div class="fc-answer" style="margin: auto 0; font-size: 1.05rem; line-height: 1.5; color: var(--text-main);">${currentCard.answer}</div>
                            <div style="text-align: center; font-size: 0.75rem; color: var(--text-muted);">
                                Click card to flip back
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Learning markers & pagination -->
                <div style="display: flex; gap: 16px; align-items: center; justify-content: center; width:100%;">
                    <button class="btn btn-secondary btn-sm" id="btn-card-wrong" style="color: var(--color-accent); border-color: rgba(244,63,94,0.2);" title="Reset to Box 1 for Daily Practice">
                        <i data-lucide="x-circle"></i>
                        <span>Forgot It (Reset Box 1)</span>
                    </button>
                    <button class="btn btn-secondary btn-sm" id="btn-card-correct" style="color: var(--color-secondary); border-color: rgba(20,184,166,0.2);" title="Promote to Next Leitner Box">
                        <i data-lucide="check-circle"></i>
                        <span>Knew It (Promote Box)</span>
                    </button>
                </div>

                <div class="card-navigation" style="display: flex; align-items: center; gap: 20px; margin-top: 10px;">
                    <button class="btn btn-secondary btn-icon" id="btn-card-prev" ${this.cardIndex === 0 ? 'disabled' : ''}>
                        <i data-lucide="arrow-left"></i>
                    </button>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">
                        Card ${this.cardIndex + 1} of ${cards.length}
                    </span>
                    <button class="btn btn-secondary btn-icon" id="btn-card-next" ${this.cardIndex === cards.length - 1 ? 'disabled' : ''}>
                        <i data-lucide="arrow-right"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" id="btn-card-shuffle">
                        <i data-lucide="shuffle"></i>
                        <span>Shuffle</span>
                    </button>
                </div>
            </div>
        `;

        lucide.createIcons();
        this.setupFlashcardEvents(container, cards);
    }

    setupFlashcardEvents(container, cards) {
        const cardBox = container.querySelector('#flashcard-box');
        const prev = container.querySelector('#btn-card-prev');
        const next = container.querySelector('#btn-card-next');
        const shuffle = container.querySelector('#btn-card-shuffle');
        
        const markWrong = container.querySelector('#btn-card-wrong');
        const markCorrect = container.querySelector('#btn-card-correct');

        cardBox.addEventListener('click', () => {
            this.cardFlipped = !this.cardFlipped;
            cardBox.classList.toggle('is-flipped', this.cardFlipped);
        });

        const changeCard = (idx) => {
            this.cardIndex = idx;
            this.cardFlipped = false;
            this.renderFlashcards(container);
        };

        prev.addEventListener('click', () => {
            if (this.cardIndex > 0) changeCard(this.cardIndex - 1);
        });

        next.addEventListener('click', () => {
            if (this.cardIndex < cards.length - 1) changeCard(this.cardIndex + 1);
        });

        shuffle.addEventListener('click', () => {
            cards.sort(() => Math.random() - 0.5);
            changeCard(0);
        });

        markCorrect.addEventListener('click', () => {
            const card = cards[this.cardIndex];
            const oldBox = card.box || 1;
            const newBox = Math.min(3, oldBox + 1);
            card.box = newBox;
            card.known = (newBox === 3);
            
            this.app.stats.cardsPracticed++;
            this.app.saveToLocalStorage();
            
            alert(`Knew it! Promoted to Leitner Box ${newBox} (${newBox === 3 ? 'Mastered 🎓' : newBox === 2 ? 'Intermediate ⏳' : 'Daily 📅'}). Interval extended!`);
            
            if (this.cardIndex < cards.length - 1) {
                changeCard(this.cardIndex + 1);
            } else {
                changeCard(0); // Loop back
            }
        });

        markWrong.addEventListener('click', () => {
            const card = cards[this.cardIndex];
            card.box = 1; // Reset to daily review
            card.known = false;
            
            this.app.stats.cardsPracticed++;
            this.app.saveToLocalStorage();
            
            alert('Forgot it! Card reset back to Leitner Box 1 (Daily Review 📅). Keep practicing!');
            
            if (this.cardIndex < cards.length - 1) {
                changeCard(this.cardIndex + 1);
            } else {
                changeCard(0); // Loop back
            }
        });
    }
}
export const StudyHubMock = StudyHub;

// Pravio Notes AI Assistant Side Panel and Voice Narration Helpers

class AIAssistant {
    constructor(app) {
        this.app = app;
        this.isRecording = false;
        this.mediaRecorder = null;
    }

    init() {
        this.setupEvents();
    }

    setupEvents() {
        const sendBtn = document.getElementById('btn-ask-ai');
        const input = document.getElementById('copilot-input');
        const voiceBtn = document.getElementById('btn-record-voice');

        sendBtn.addEventListener('click', () => {
            const val = input.value.trim();
            if (val) {
                this.askAI(val);
                input.value = '';
            }
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendBtn.click();
            }
        });

        voiceBtn.addEventListener('click', () => {
            this.toggleVoiceRecording(voiceBtn);
        });
    }

    async askAI(promptText) {
        const chatHistory = document.getElementById('copilot-chat-history');
        if (!chatHistory) return;

        // 1. Append User Bubble
        chatHistory.innerHTML += `
            <div class="chat-bubble user">
                <p>${promptText}</p>
            </div>
        `;
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // 2. Append AI Loading bubble
        const aiBubbleId = 'ai-response-' + Date.now();
        chatHistory.innerHTML += `
            <div class="chat-bubble ai" id="${aiBubbleId}">
                <i data-lucide="loader" class="icon-spin" style="width: 14px; height: 14px; color: var(--color-secondary);"></i>
                <span>Thinking...</span>
            </div>
        `;
        lucide.createIcons();
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // Simulate streaming response
        await new Promise(resolve => setTimeout(resolve, 1500));

        const aiBubble = document.getElementById(aiBubbleId);
        if (!aiBubble) return;

        // Formulate standard helpful responses depending on keywords
        let responseHTML = '';
        if (promptText.toLowerCase().includes('explain') || promptText.toLowerCase().includes('simplify')) {
            responseHTML = `
                <h4>Pravio AI Explanation</h4>
                <p style="margin-top:6px;">This algorithm operates by breaking down inputs into subproblems. Here is a simplified breakdown:</p>
                <ul style="margin: 8px 0; padding-left: 16px;">
                    <li><strong>Recursive Step:</strong> Solves base states first, avoiding endless loops.</li>
                    <li><strong>Memoization Cache:</strong> Saves computed branches so they are never executed twice.</li>
                </ul>
                <p>Think of it like writing down answers on a scratchpad so you don't have to re-do addition steps.</p>
            `;
        } else if (promptText.toLowerCase().includes('optimize') || promptText.toLowerCase().includes('mistakes')) {
            responseHTML = `
                <h4>Optimization Analysis</h4>
                <p style="margin-top:6px;">We can optimize the code from O(N²) down to O(N log N) by avoiding nested iterations:</p>
                <div class="code-block-wrapper" style="margin-top:10px;">
                    <div class="code-block-header"><span>Optimized Logic</span></div>
                    <pre style="font-family:var(--font-mono); font-size:0.7rem; color:#cbd5e1; padding:8px;">function optimizedSearch(arr) {\n  // Using hash table lookups\n  const lookup = new Set(arr);\n  return lookup;\n}</pre>
                </div>
            `;
        } else if (promptText.toLowerCase().includes('quiz') || promptText.toLowerCase().includes('question')) {
            responseHTML = `
                <h4>AI Generated Quiz Question</h4>
                <p style="margin-top:6px;">Let's test your understanding. What is the complexity of this step?</p>
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 6px;">
                    <button class="btn btn-secondary btn-sm" onclick="alert('Correct! O(1) space auxiliary.')">Option A: O(1) auxiliary space</button>
                    <button class="btn btn-secondary btn-sm" onclick="alert('Incorrect! Think about recursion depth.')">Option B: O(N) auxiliary space</button>
                </div>
            `;
        } else {
            responseHTML = `
                <h4>AI Notebook Assistant</h4>
                <p style="margin-top:6px;">I've parsed your note. Here is a quick memory trick (mnemonic) to help review this topic:</p>
                <p style="margin: 8px 0; color: var(--color-primary); font-weight:600;">"L.I.F.O - Stack is like piling plates: Last In is First Out!"</p>
                <p>Let me know if you would like me to generate flashcards or quizzes for this note!</p>
            `;
        }

        aiBubble.innerHTML = responseHTML;
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    async toggleVoiceRecording(btn) {
        if (this.isRecording) {
            // Stop recording
            this.isRecording = false;
            btn.style.backgroundColor = 'var(--bg-input)';
            btn.style.color = 'var(--text-dark)';
            btn.innerHTML = '<i data-lucide="mic"></i>';
            lucide.createIcons();

            // Simulate speech transcription
            const chatHistory = document.getElementById('copilot-chat-history');
            chatHistory.innerHTML += `
                <div class="chat-bubble user">
                    <span style="font-style:italic; font-size:0.8rem; color:var(--text-muted);"><i data-lucide="mic" style="width:10px; height:10px; vertical-align:middle; margin-right:4px;"></i>Voice note recorded...</span>
                </div>
            `;
            lucide.createIcons();
            chatHistory.scrollTop = chatHistory.scrollHeight;

            await new Promise(resolve => setTimeout(resolve, 1000));
            this.askAI("Create summary notes about recursion stacks");
        } else {
            // Start recording
            this.isRecording = true;
            btn.style.backgroundColor = 'var(--color-accent)';
            btn.style.color = 'white';
            btn.innerHTML = '<i data-lucide="square" class="icon-spin"></i>';
            lucide.createIcons();
        }
    }

    speak(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop current speech
            const cleanText = text.replace(/<[^>]*>/g, ''); // strip HTML tags
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Voice Narration is not supported in this browser environment.');
        }
    }
}

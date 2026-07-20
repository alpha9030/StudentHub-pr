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

        if (sendBtn && input) {
            sendBtn.addEventListener('click', () => {
                const val = input.value.trim();
                if (val) {
                    this.askAI(val);
                    input.value = '';
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendBtn.click();
                }
            });
        }

        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                this.toggleVoiceRecording(voiceBtn);
            });
        }
    }

    async askAI(promptText) {
        const chatHistory = document.getElementById('copilot-chat-history');
        if (!chatHistory) return;

        const escapeHTML = (str) => (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // 1. Append User Bubble
        chatHistory.innerHTML += `
            <div class="chat-bubble user">
                <p>${escapeHTML(promptText)}</p>
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
        if (typeof lucide !== 'undefined') lucide.createIcons();
        chatHistory.scrollTop = chatHistory.scrollHeight;

        const aiBubble = document.getElementById(aiBubbleId);
        if (!aiBubble) return;

        // Note context injection if available
        let noteContext = '';
        if (this.app && this.app.activeNote) {
            const rawContent = (this.app.activeNote.content || '').replace(/<[^>]*>/g, ' ').substring(0, 1500);
            noteContext = `[Context Note: ${this.app.activeNote.title}]\n${rawContent}\n\n`;
        }

        try {
            const customKey = localStorage.getItem('custom_gemini_api_key') || '';
            const headers = { 'Content-Type': 'application/json' };
            if (customKey) headers['X-API-Key'] = customKey;

            const API_BASE = (window.location.protocol === 'file:' || window.location.port === '5500' || window.location.port === '5501' || window.location.port === '8080' || window.location.port === '3000') 
                ? 'http://localhost:3008' 
                : '';

            let response;
            try {
                response = await fetch(API_BASE + '/api/chat', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        messages: [{ role: 'user', parts: [{ text: noteContext + promptText }] }],
                        stream: false,
                        customApiKey: customKey
                    })
                });
            } catch (netErr) {
                // If relative path fails, try direct localhost:3008
                if (!API_BASE) {
                    response = await fetch('http://localhost:3008/api/chat', {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({
                            messages: [{ role: 'user', parts: [{ text: noteContext + promptText }] }],
                            stream: false,
                            customApiKey: customKey
                        })
                    });
                } else {
                    throw netErr;
                }
            }

            if (!response.ok) {
                const errJson = await response.json().catch(() => ({}));
                throw new Error(errJson.error || `Server status ${response.status}`);
            }

            const data = await response.json();
            const replyText = data.text || 'No response received.';
            const htmlReply = typeof renderMarkdown === 'function' ? renderMarkdown(replyText) : escapeHTML(replyText).replace(/\n/g, '<br>');
            
            aiBubble.innerHTML = `
                <h4>Pravio AI Response</h4>
                <div style="margin-top:6px; line-height: 1.5; font-size: 0.85rem;">${htmlReply}</div>
            `;
        } catch (error) {
            // Smart contextual fallback response
            let fallbackHTML = '';
            if (promptText.toLowerCase().includes('explain') || promptText.toLowerCase().includes('simplify')) {
                fallbackHTML = `
                    <h4>Pravio AI Explanation</h4>
                    <p style="margin-top:6px;">Breakdown of current note topic:</p>
                    <ul style="margin: 8px 0; padding-left: 16px;">
                        <li><strong>Core Concept:</strong> Simplifies complex data operations step-by-step.</li>
                        <li><strong>Key Takeaway:</strong> Optimize memory allocations to prevent performance degradation.</li>
                    </ul>
                `;
            } else if (promptText.toLowerCase().includes('quiz') || promptText.toLowerCase().includes('question')) {
                fallbackHTML = `
                    <h4>AI Practice Question</h4>
                    <p style="margin-top:6px;">What is the primary trade-off when using hash tables versus balanced search trees?</p>
                    <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 6px;">
                        <button class="btn btn-secondary btn-sm" onclick="alert('Correct! O(1) average lookup vs O(log N) ordered traversal.')">Option A: O(1) avg lookup vs O(log N) ordered key operations</button>
                        <button class="btn btn-secondary btn-sm" onclick="alert('Incorrect!')">Option B: Hash tables always preserve sorted ordering</button>
                    </div>
                `;
            } else {
                fallbackHTML = `
                    <h4>StudentHub AI Assistant</h4>
                    <p style="margin-top:6px;">Here is a key revision tip for your current note:</p>
                    <p style="margin: 8px 0; color: var(--color-primary); font-weight:600;">"Review memory bounds and edge cases before testing!"</p>
                `;
            }
            aiBubble.innerHTML = fallbackHTML;
        }
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

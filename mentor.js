/**
 * StudentHub AI Mentor
 * Intelligent educational assistant for career guidance, study planning, college recommendations, and doubt solving.
 * Integrates directly with the Gemini API and stores chat histories/study plans via Flask backend APIs.
 */

(function() {
    // 1. Initial State & Configurations
    let chatMemory = []; // Session history formatted for Gemini API
    let isTyping = false;
    let studentProfile = {
        name: 'Student',
        email: '',
        dept: '',
        grade: '',
        isLoggedIn: false
    };

    // Initialize module on page load
    window.addEventListener('DOMContentLoaded', () => {
        initMentor();
    });

    // Check if view switching triggers mentor reload
    const originalShowView = window.showView;
    window.showView = function(viewId) {
        if (originalShowView) originalShowView(viewId);
        if (viewId === 'mentor') {
            loadStudentProfile();
            loadMentorPreferences();
            checkApiKeyStatus();
            loadChatHistory();
            loadSavedPlans();
        }
    };

    // Initialize all components
    function initMentor() {
        loadStudentProfile();
        loadMentorPreferences();
        checkApiKeyStatus();
        
        // Load history and plans if already on the mentor view at startup
        const currentHash = window.location.hash.replace('#', '');
        if (currentHash === 'mentor' || (document.getElementById('mentor-panel') && document.getElementById('mentor-panel').classList.contains('active'))) {
            loadChatHistory();
            loadSavedPlans();
        }
        
        // Listen to storage changes (e.g. if key is updated in Aura chatbot settings)
        window.addEventListener('storage', (e) => {
            if (e.key === 'aura_api_key') {
                checkApiKeyStatus();
            }
        });
    }

    // Load student profile from localStorage
    function loadStudentProfile() {
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
        studentProfile.isLoggedIn = loggedIn;
        if (loggedIn) {
            studentProfile.name = localStorage.getItem('studentName') || 'Student';
            studentProfile.email = localStorage.getItem('studentEmail') || '';
            studentProfile.dept = localStorage.getItem('studentDept') || '';
            studentProfile.grade = localStorage.getItem('studentGrade') || '';
            
            // Sync API key and histories from backend DB
            syncApiKeyFromBackend();
        } else {
            studentProfile.name = 'Guest';
            studentProfile.email = '';
            studentProfile.dept = '';
            studentProfile.grade = '';
        }
    }

    // Synchronize API key from chatbot settings backend
    async function syncApiKeyFromBackend() {
        if (!studentProfile.email) return;
        try {
            const resp = await fetch(`/api/chatbot?email=${encodeURIComponent(studentProfile.email)}`);
            const data = await resp.json();
            if (data.success && data.settings && data.settings.aura_api_key) {
                const currentKey = localStorage.getItem('aura_api_key');
                if (!currentKey || currentKey !== data.settings.aura_api_key) {
                    localStorage.setItem('aura_api_key', data.settings.aura_api_key);
                    checkApiKeyStatus();
                }
            }
        } catch (e) {
            console.warn("Could not sync API key from settings backend:", e);
        }
    }

    // Load user mentor inputs (interests, marks, etc.) from localStorage
    function loadMentorPreferences() {
        const suffix = studentProfile.email ? '_' + studentProfile.email.replace(/[^a-zA-Z0-9]/g, '') : '_guest';
        
        document.getElementById('mentor-interests').value = localStorage.getItem('mentor_interests' + suffix) || '';
        document.getElementById('mentor-marks').value = localStorage.getItem('mentor_marks' + suffix) || '';
        document.getElementById('mentor-goals').value = localStorage.getItem('mentor_goals' + suffix) || '';
        
        document.getElementById('mentor-rank').value = localStorage.getItem('mentor_rank' + suffix) || '';
        document.getElementById('mentor-branch').value = localStorage.getItem('mentor_branch' + suffix) || 'cse';
        document.getElementById('mentor-state').value = localStorage.getItem('mentor_state' + suffix) || '';
        document.getElementById('mentor-category').value = localStorage.getItem('mentor_category' + suffix) || 'General';
        
        document.getElementById('mentor-exam-date').value = localStorage.getItem('mentor_exam_date' + suffix) || '';
        document.getElementById('mentor-exam-subjects').value = localStorage.getItem('mentor_exam_subjects' + suffix) || '';
        document.getElementById('mentor-weak-areas').value = localStorage.getItem('mentor_weak_areas' + suffix) || '';
        document.getElementById('mentor-study-hours').value = localStorage.getItem('mentor_study_hours' + suffix) || '';
    }

    // Save user mentor inputs to localStorage
    window.saveMentorPreferences = function() {
        const suffix = studentProfile.email ? '_' + studentProfile.email.replace(/[^a-zA-Z0-9]/g, '') : '_guest';
        
        const interests = document.getElementById('mentor-interests').value.trim();
        const marks = document.getElementById('mentor-marks').value.trim();
        const goals = document.getElementById('mentor-goals').value.trim();
        
        const rank = document.getElementById('mentor-rank').value.trim();
        const branch = document.getElementById('mentor-branch').value;
        const state = document.getElementById('mentor-state').value.trim();
        const category = document.getElementById('mentor-category').value;
        
        const examDate = document.getElementById('mentor-exam-date').value;
        const examSubjects = document.getElementById('mentor-exam-subjects').value.trim();
        const weakAreas = document.getElementById('mentor-weak-areas').value.trim();
        const studyHours = document.getElementById('mentor-study-hours').value.trim();

        localStorage.setItem('mentor_interests' + suffix, interests);
        localStorage.setItem('mentor_marks' + suffix, marks);
        localStorage.setItem('mentor_goals' + suffix, goals);
        
        localStorage.setItem('mentor_rank' + suffix, rank);
        localStorage.setItem('mentor_branch' + suffix, branch);
        localStorage.setItem('mentor_state' + suffix, state);
        localStorage.setItem('mentor_category' + suffix, category);
        
        localStorage.setItem('mentor_exam_date' + suffix, examDate);
        localStorage.setItem('mentor_exam_subjects' + suffix, examSubjects);
        localStorage.setItem('mentor_weak_areas' + suffix, weakAreas);
        localStorage.setItem('mentor_study_hours' + suffix, studyHours);

        alert("Preferences saved successfully!");
    };

    // Check if Gemini API key is configured
    function checkApiKeyStatus() {
        const key = localStorage.getItem('aura_api_key') || '';
        const banner = document.getElementById('mentor-api-banner');
        const chatInput = document.getElementById('mentor-chat-input');
        const sendBtn = document.querySelector('.mentor-send-btn');
        const quickBtns = document.querySelectorAll('.quick-action-btn');

        if (!key) {
            banner.style.display = 'flex';
            chatInput.disabled = true;
            sendBtn.disabled = true;
            quickBtns.forEach(btn => btn.disabled = true);
        } else {
            banner.style.display = 'none';
            chatInput.disabled = false;
            sendBtn.disabled = false;
            quickBtns.forEach(btn => btn.disabled = false);
        }
    }

    // Modal controllers for configuring Gemini key
    window.openMentorKeyModal = function() {
        const modal = document.getElementById('mentor-key-modal');
        const keyInput = document.getElementById('mentor-key-input');
        keyInput.value = localStorage.getItem('aura_api_key') || '';
        modal.classList.add('active');
    };

    window.closeMentorKeyModal = function() {
        const modal = document.getElementById('mentor-key-modal');
        modal.classList.remove('active');
    };

    window.saveMentorKey = function() {
        const keyInput = document.getElementById('mentor-key-input').value.trim();
        if (!keyInput) {
            alert("Please enter a valid Gemini API Key!");
            return;
        }

        localStorage.setItem('aura_api_key', keyInput);
        
        // Also sync key to database if logged in
        if (studentProfile.isLoggedIn && studentProfile.email) {
            const userName = studentProfile.name;
            const mode = localStorage.getItem('aura_mode') || 'gemini';
            fetch('/api/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: studentProfile.email,
                    aura_mode: mode,
                    aura_api_key: keyInput,
                    aura_user_name: userName
                })
            }).catch(err => console.warn("Failed to sync new API Key with backend:", err));
        }

        checkApiKeyStatus();
        closeMentorKeyModal();
        alert("API Key saved successfully!");
        
        // If chat is currently empty, show the welcome screen
        if (chatMemory.length === 0) {
            loadChatHistory();
        }
    };

    // Load Chat History from DB or Local Memory
    async function loadChatHistory() {
        const container = document.getElementById('mentor-messages-container');
        container.innerHTML = '';
        chatMemory = [];

        showTyping();

        if (studentProfile.isLoggedIn && studentProfile.email) {
            try {
                const resp = await fetch(`/api/mentor/chats?email=${encodeURIComponent(studentProfile.email)}`);
                const data = await resp.json();
                hideTyping();
                if (data.success && data.chats && data.chats.length > 0) {
                    data.chats.forEach(chat => {
                        appendMessageUI(chat.sender === 'user' ? 'user' : 'bot', chat.message, new Date(chat.timestamp));
                        // Save in memory history
                        chatMemory.push({
                            role: chat.sender === 'user' ? 'user' : 'model',
                            parts: [{ text: chat.message }]
                        });
                    });
                    scrollChatBottom();
                    return;
                }
            } catch (e) {
                console.warn("Could not load chat history from database:", e);
            }
        }
        
        // Fallback to local session storage / welcome screen
        hideTyping();
        const guestHistory = sessionStorage.getItem('mentor_chat_history_guest');
        if (guestHistory) {
            try {
                const parsed = JSON.parse(guestHistory);
                parsed.forEach(chat => {
                    appendMessageUI(chat.role === 'user' ? 'user' : 'bot', chat.parts[0].text);
                    chatMemory.push(chat);
                });
                scrollChatBottom();
                return;
            } catch(e) {}
        }

        // Show Default Welcome Message
        showInitialWelcome();
    }

    function showInitialWelcome() {
        const container = document.getElementById('mentor-messages-container');
        container.innerHTML = '';
        
        const welcomeText = `👋 Hello **${studentProfile.name}**! Welcome to your **AI Academic Mentor Space**. 🎓

I am here to act as your personalized educational counselor. You can use the buttons on the left or type directly to request:
1. **Career Guidance**: Personalized career recommendations, tech roadmaps, and portfolio projects.
2. **Study Planner**: Custom schedules and study timetables based on your targets.
3. **College Predictor**: Suitable colleges tailored to your rank, state, and category.
4. **Ask a Doubt**: Clear explanations of any concepts or doubts.

*Please fill in your preferences on the left sidebar so I can customize my answers to your exact academic profile.*`;

        appendMessageUI('bot', welcomeText);
    }

    // Save chat message (sync to DB if logged in)
    async function saveChatMessage(sender, message) {
        if (studentProfile.isLoggedIn && studentProfile.email) {
            try {
                await fetch('/api/mentor/chats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: studentProfile.email,
                        sender: sender,
                        message: message
                    })
                });
            } catch(e) {
                console.warn("Failed to sync message to backend:", e);
            }
        } else {
            // Save in session storage
            sessionStorage.setItem('mentor_chat_history_guest', JSON.stringify(chatMemory));
        }
    }

    // Append Message to UI
    function appendMessageUI(sender, text, timestamp = new Date()) {
        const container = document.getElementById('mentor-messages-container');
        
        const msgDiv = document.createElement('div');
        msgDiv.className = `mentor-message ${sender}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = formatMarkdown(text);
        
        msgDiv.appendChild(bubble);
        
        // Add "Save Plan" button if bot output contains a study table or plan
        if (sender === 'bot' && (text.toLowerCase().includes('study plan') || text.toLowerCase().includes('timetable') || text.includes('|'))) {
            const saveBtn = document.createElement('button');
            saveBtn.className = 'btn btn-secondary';
            saveBtn.style.padding = '4px 8px';
            saveBtn.style.fontSize = '11px';
            saveBtn.style.marginTop = '8px';
            saveBtn.style.display = 'inline-flex';
            saveBtn.style.alignItems = 'center';
            saveBtn.style.gap = '4px';
            saveBtn.innerHTML = '💾 Save Study Plan';
            saveBtn.addEventListener('click', () => {
                saveGeneratedPlan(text);
            });
            bubble.appendChild(saveBtn);
        }

        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        msgDiv.appendChild(timeSpan);
        
        container.appendChild(msgDiv);
        scrollChatBottom();
    }

    // Scroll Chat to the bottom
    function scrollChatBottom() {
        const container = document.getElementById('mentor-messages-container');
        container.scrollTop = container.scrollHeight;
    }

    // Handle Input Box Keyboard
    window.handleMentorInputKey = function(event) {
        if (event.key === 'Enter') {
            sendMentorMessage();
        }
    };

    // Send Message Triggered by Button/Enter
    window.sendMentorMessage = async function() {
        const input = document.getElementById('mentor-chat-input');
        const text = input.value.trim();
        if (!text || isTyping) return;

        input.value = '';
        
        // Display user message in UI
        appendMessageUI('user', text);
        
        // Push user message into memory
        chatMemory.push({
            role: 'user',
            parts: [{ text: text }]
        });
        if (chatMemory.length > 20) {
            chatMemory = chatMemory.slice(-20);
        }

        // Sync to backend DB
        await saveChatMessage('user', text);

        // Fetch AI Response
        await callGeminiMentorAPI(text);
    };

    // Typing Indicators
    function showTyping() {
        if (isTyping) return;
        isTyping = true;
        
        const container = document.getElementById('mentor-messages-container');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'mentor-message bot typing-indicator-container';
        typingDiv.id = 'mentor-typing-indicator';
        
        const dots = document.createElement('div');
        dots.className = 'mentor-typing';
        dots.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        typingDiv.appendChild(dots);
        container.appendChild(typingDiv);
        scrollChatBottom();
    }

    function hideTyping() {
        isTyping = false;
        const typingDiv = document.getElementById('mentor-typing-indicator');
        if (typingDiv) {
            typingDiv.remove();
        }
    }

    // Clear Memory
    window.clearMentorChat = async function() {
        if (confirm("Are you sure you want to clear your conversation history?")) {
            chatMemory = [];
            document.getElementById('mentor-messages-container').innerHTML = '';
            
            if (studentProfile.isLoggedIn && studentProfile.email) {
                try {
                    await fetch(`/api/mentor/chats?email=${encodeURIComponent(studentProfile.email)}`, {
                        method: 'DELETE'
                    });
                } catch(e) {
                    console.warn("Failed to clear chat history on server:", e);
                }
            } else {
                sessionStorage.removeItem('mentor_chat_history_guest');
            }
            
            showInitialWelcome();
        }
    };

    // Call Gemini API
    async function callGeminiMentorAPI(lastUserMsg) {
        const apiKey = localStorage.getItem('aura_api_key');
        if (!apiKey) {
            alert("Please configure a Gemini API key first!");
            return;
        }

        showTyping();
        document.getElementById('mentor-status').textContent = 'Thinking...';

        const suffix = studentProfile.email ? '_' + studentProfile.email.replace(/[^a-zA-Z0-9]/g, '') : '_guest';
        
        // Compile student profile information
        const studentInfo = {
            name: studentProfile.name,
            dept: studentProfile.dept || localStorage.getItem('mentor_branch' + suffix) || 'Computer Science & Engineering',
            year: studentProfile.grade || 'unspecified standing',
            interests: localStorage.getItem('mentor_interests' + suffix) || 'general computing',
            marks: localStorage.getItem('mentor_marks' + suffix) || 'unspecified GPA',
            goals: localStorage.getItem('mentor_goals' + suffix) || 'successful software engineering career',
            examRank: localStorage.getItem('mentor_rank' + suffix) || 'unspecified',
            state: localStorage.getItem('mentor_state' + suffix) || 'unspecified',
            category: localStorage.getItem('mentor_category' + suffix) || 'General'
        };

        const systemInstruction = {
            parts: [{
                text: `You are a friendly, highly experienced academic counselor and student mentor at Student Hub.
Your tone is supportive, encouragement-focused, professional, and student-centric. Provide highly customized, actionable advice.

Student Profile Information (Use this to contextualize your replies, and do NOT make up contradictive academic details):
- Scholar Name: ${studentInfo.name}
- Department: ${studentInfo.dept}
- Year Standing: ${studentInfo.year}
- Areas of Interest: ${studentInfo.interests}
- Academic Marks/GPA: ${studentInfo.marks}
- Career/Academic Goals: ${studentInfo.goals}
- Exam Rank/Percentile: ${studentInfo.examRank}
- State/Region of Preference: ${studentInfo.state}
- Category: ${studentInfo.category}

Instructions:
1. Provide personalized career guidance based on interest, marks, and goals.
2. Recommend suitable engineering or degree colleges based on the student's rank, branch, state, and category. Provide realistic predictions (e.g., IITs/NITs, top state colleges, private universities) based on typical admissions thresholds.
3. Generate structured study plans and daily study schedules. When generating study plans, always include a daily hourly timetable formatted as a markdown table.
4. Solve conceptual doubts, strategy queries, and other academic problems.
5. Refer students to check references.html and local guides (HTML.html, CSS.html, DSA.html, SQL.html) when relevant to their query.
6. Speak directly to the student (${studentInfo.name}). Maintain conversational history and memory.`
            }]
        };

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: chatMemory,
                    systemInstruction: systemInstruction
                })
            });

            hideTyping();
            document.getElementById('mentor-status').textContent = 'Ready to assist you';

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const botMsg = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (botMsg) {
                // Save bot reply to memory
                chatMemory.push({
                    role: 'model',
                    parts: [{ text: botMsg }]
                });
                
                // Display bot reply in UI
                appendMessageUI('bot', botMsg);
                
                // Sync bot message to database
                await saveChatMessage('bot', botMsg);
            } else {
                throw new Error("Invalid response format from Gemini API");
            }
        } catch (e) {
            console.error("Gemini API Error:", e);
            hideTyping();
            document.getElementById('mentor-status').textContent = 'Connection error';
            
            // Remove user message from chatMemory so it doesn't pollute the prompt sequence
            chatMemory.pop();

            appendMessageUI('bot', `🔴 **Mentor Connection Error:** ${e.message}
            
Please verify your network connection and confirm that your Gemini API Key is active. Click **Key** in the top right to verify.`);
        }
    }

    // Quick Action Buttons
    window.triggerQuickAction = function(actionType) {
        const suffix = studentProfile.email ? '_' + studentProfile.email.replace(/[^a-zA-Z0-9]/g, '') : '_guest';
        
        let promptText = '';
        if (actionType === 'career') {
            const interests = localStorage.getItem('mentor_interests' + suffix) || '';
            const marks = localStorage.getItem('mentor_marks' + suffix) || '';
            const goals = localStorage.getItem('mentor_goals' + suffix) || '';
            
            promptText = `Can you provide me with personalized career guidance?
My profile details:
- Department: ${studentProfile.dept || 'unspecified'}
- Interests: ${interests || 'general computing'}
- Marks/GPA: ${marks || 'unspecified'}
- Goals: ${goals || 'a successful tech career'}

What roles are ideal for me, what skills should I focus on learning, and what projects should I build?`;
        } 
        else if (actionType === 'planner') {
            const examDate = localStorage.getItem('mentor_exam_date' + suffix) || '';
            const subjects = localStorage.getItem('mentor_exam_subjects' + suffix) || '';
            const weakAreas = localStorage.getItem('mentor_weak_areas' + suffix) || '';
            const hours = localStorage.getItem('mentor_study_hours' + suffix) || '4';

            if (!examDate || !subjects) {
                alert("Please fill in the 'Study Planner Details' in the sidebar (Exam Date and Subjects) before requesting a study plan!");
                return;
            }

            promptText = `Please generate a personalized study plan and daily timetable for my upcoming exam.
Details:
- Exam Date: ${examDate}
- Subjects: ${subjects}
- My Weak Areas: ${weakAreas || 'none specified'}
- Available study hours per day: ${hours}

Please include a daily study timetable in a tabular markdown layout!`;
        } 
        else if (actionType === 'predictor') {
            const rank = localStorage.getItem('mentor_rank' + suffix) || '';
            const branch = localStorage.getItem('mentor_branch' + suffix) || 'cse';
            const state = localStorage.getItem('mentor_state' + suffix) || '';
            const category = localStorage.getItem('mentor_category' + suffix) || 'General';

            if (!rank) {
                alert("Please enter your Exam Rank/Percentile in the College Predictor details in the sidebar first!");
                return;
            }

            promptText = `Based on my entrance exam results, can you predict suitable engineering colleges for me?
Parameters:
- Rank/Percentile: ${rank}
- Preferred Branch: ${branch.toUpperCase()}
- Preferred State: ${state || 'any state'}
- Admission Category: ${category}

Suggest realistic options ranging from premium, moderate, and fallback options.`;
        } 
        else if (actionType === 'doubt') {
            promptText = "I have a concept/subject doubt. Can you help me clarify it?";
        }

        if (promptText) {
            document.getElementById('mentor-chat-input').value = promptText;
            document.getElementById('mentor-chat-input').focus();
        }
    };

    // Save Generated Study Plan
    async function saveGeneratedPlan(planText) {
        let title = prompt("Enter a title for this Study Plan (e.g. 30-Day DSA Plan, Final Exam Timetable):", "My Custom Study Plan");
        if (title === null) return; // Cancelled
        title = title.trim() || "My Study Plan";

        if (studentProfile.isLoggedIn && studentProfile.email) {
            try {
                const resp = await fetch('/api/mentor/plans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: studentProfile.email,
                        title: title,
                        plan_data: planText
                    })
                });
                const data = await resp.json();
                if (data.success) {
                    alert("Study plan saved successfully!");
                    loadSavedPlans();
                } else {
                    alert("Failed to save study plan: " + data.message);
                }
            } catch (e) {
                alert("Error saving study plan: " + e.message);
            }
        } else {
            // Save to localStorage for guest
            const guestPlans = JSON.parse(localStorage.getItem('mentor_study_plans_guest') || '[]');
            guestPlans.unshift({
                id: Date.now(),
                title: title,
                plan_data: planText,
                created_at: new Date().toISOString()
            });
            localStorage.setItem('mentor_study_plans_guest', JSON.stringify(guestPlans));
            alert("Study plan saved to local storage (Guest Mode)!");
            loadSavedPlans();
        }
    }

    // Load Saved Study Plans
    async function loadSavedPlans() {
        const listContainer = document.getElementById('saved-plans-list');
        listContainer.innerHTML = '';

        let plans = [];
        if (studentProfile.isLoggedIn && studentProfile.email) {
            try {
                const resp = await fetch(`/api/mentor/plans?email=${encodeURIComponent(studentProfile.email)}`);
                const data = await resp.json();
                if (data.success) {
                    plans = data.plans || [];
                }
            } catch(e) {
                console.warn("Could not load study plans from backend database:", e);
            }
        } else {
            plans = JSON.parse(localStorage.getItem('mentor_study_plans_guest') || '[]');
        }

        if (plans.length === 0) {
            listContainer.innerHTML = '<p style="font-size: 11.5px; color: var(--text-muted); margin: 0; text-align: center; padding: 10px 0;">No saved study plans yet.</p>';
            return;
        }

        plans.forEach(plan => {
            const item = document.createElement('div');
            item.className = 'plan-item';
            
            const info = document.createElement('div');
            info.className = 'plan-item-info';
            info.addEventListener('click', () => {
                openPlanViewerModal(plan.title, plan.plan_data);
            });
            
            const titleSpan = document.createElement('div');
            titleSpan.className = 'plan-item-title';
            titleSpan.textContent = plan.title;
            
            const dateSpan = document.createElement('div');
            dateSpan.className = 'plan-item-date';
            const date = new Date(plan.created_at);
            dateSpan.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            info.appendChild(titleSpan);
            info.appendChild(dateSpan);
            
            const actions = document.createElement('div');
            actions.className = 'plan-item-actions';
            
            const viewBtn = document.createElement('button');
            viewBtn.className = 'plan-action-btn';
            viewBtn.innerHTML = '👁️';
            viewBtn.title = 'View Study Plan';
            viewBtn.addEventListener('click', () => {
                openPlanViewerModal(plan.title, plan.plan_data);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'plan-action-btn delete';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Delete Plan';
            deleteBtn.addEventListener('click', () => {
                deletePlan(plan.id);
            });

            actions.appendChild(viewBtn);
            actions.appendChild(deleteBtn);
            
            item.appendChild(info);
            item.appendChild(actions);
            listContainer.appendChild(item);
        });
    }

    // Delete saved plan
    async function deletePlan(planId) {
        if (!confirm("Are you sure you want to delete this study plan?")) return;

        if (studentProfile.isLoggedIn && studentProfile.email) {
            try {
                const resp = await fetch(`/api/mentor/plans?email=${encodeURIComponent(studentProfile.email)}&id=${planId}`, {
                    method: 'DELETE'
                });
                const data = await resp.json();
                if (data.success) {
                    alert("Study plan deleted successfully.");
                    loadSavedPlans();
                } else {
                    alert("Failed to delete study plan: " + data.message);
                }
            } catch (e) {
                alert("Error deleting study plan: " + e.message);
            }
        } else {
            // Guest Mode
            let guestPlans = JSON.parse(localStorage.getItem('mentor_study_plans_guest') || '[]');
            guestPlans = guestPlans.filter(p => p.id !== planId);
            localStorage.setItem('mentor_study_plans_guest', JSON.stringify(guestPlans));
            alert("Study plan deleted from local storage.");
            loadSavedPlans();
        }
    }

    // Modal controllers for viewing saved plan
    window.openPlanViewerModal = function(title, planText) {
        const modal = document.getElementById('plan-viewer-modal');
        document.getElementById('plan-viewer-title').textContent = title;
        document.getElementById('plan-viewer-body').innerHTML = formatMarkdown(planText);
        modal.classList.add('active');
    };

    window.closePlanViewerModal = function() {
        const modal = document.getElementById('plan-viewer-modal');
        modal.classList.remove('active');
    };


    // ==========================================
    // MARKDOWN FORMATTER HELPER
    // ==========================================

    function formatMarkdown(text) {
        // Escape HTML entities to prevent XSS
        let html = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Code blocks: ```lang ... ```
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, function(match, lang, code) {
            return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
        });

        // Inline code: `code`
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Headers
        html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Italics
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Bullet lists
        html = html.replace(/^\s*[\*\-]\s+(.*)$/gm, '<li>$1</li>');
        html = html.replace(/(?:<li>.*<\/li>\s*)+/g, function(match) {
            return `<ul>${match}</ul>`;
        });

        // Simple Table Parsing
        const lines = html.split('\n');
        let inTable = false;
        let tableRows = [];
        let processedLines = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (line.startsWith('|') && line.endsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    tableRows = [];
                }
                tableRows.push(line);
            } else {
                if (inTable) {
                    processedLines.push(renderHTMLTable(tableRows));
                    inTable = false;
                }
                processedLines.push(lines[i]);
            }
        }
        if (inTable) {
            processedLines.push(renderHTMLTable(tableRows));
        }
        html = processedLines.join('\n');

        // Clean newlines in formatted sections
        const preBlocks = [];
        html = html.replace(/<pre>[\s\S]*?<\/pre>/g, function(match) {
            preBlocks.push(match);
            return `__PRE_BLOCK_${preBlocks.length - 1}__`;
        });

        const tableBlocks = [];
        html = html.replace(/<table[\s\S]*?<\/table>/g, function(match) {
            tableBlocks.push(match);
            return `__TABLE_BLOCK_${tableBlocks.length - 1}__`;
        });

        html = html.replace(/\n/g, '<br>');

        preBlocks.forEach((block, idx) => {
            html = html.replace(`__PRE_BLOCK_${idx}__`, block);
        });

        tableBlocks.forEach((block, idx) => {
            html = html.replace(`__TABLE_BLOCK_${idx}__`, block);
        });

        return html;
    }

    function renderHTMLTable(rows) {
        if (rows.length < 1) return "";
        
        let html = "<table>";
        let hasHeader = false;
        
        if (rows.length > 1 && rows[1].includes('-')) {
            hasHeader = true;
        }
        
        for (let i = 0; i < rows.length; i++) {
            if (i === 1 && hasHeader) continue; // Skip dashed alignment line
            
            let row = rows[i];
            let cols = row.split('|').map(c => c.trim());
            if (cols[0] === '') cols.shift();
            if (cols[cols.length - 1] === '') cols.pop();
            
            html += "<tr>";
            for (let j = 0; j < cols.length; j++) {
                if (i === 0 && hasHeader) {
                    html += `<th>${cols[j]}</th>`;
                } else {
                    html += `<td>${cols[j]}</td>`;
                }
            }
            html += "</tr>";
        }
        
        html += "</table>";
        return html;
    }

})();

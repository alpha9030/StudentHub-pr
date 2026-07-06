/**
 * LUMINA CHAT - Frontend Application Controller
 * Features: LocalStorage sync, search, pin, export (TXT, JSON, PDF), SSE stream reading,
 * markdown parsing, syntax highlighting, keyboard navigation, and theme toggling.
 */

// Application State
let chats = [];
let activeChatId = null;
let abortController = null;
let isGenerating = false;
let attachedFiles = []; // Currently attached files
let recognition = null; // SpeechRecognition reference
let isListening = false; // Speech state reference
const HEALTH_CHECK_INTERVAL = 30000; // Check server health every 30s

const API_BASE = '';

// Theme Management
const THEME_KEY = 'siteTheme';
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'default';
  const resolvedTheme = savedTheme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', resolvedTheme);
  updateThemeIcons(resolvedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
  updateThemeIcons(newTheme);
  
  // Post message to parent window to sync theme
  window.parent.postMessage({ type: 'sync-theme', theme: newTheme }, '*');
}

// Listen to theme sync messages from parent window
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'sync-theme') {
    const newTheme = event.data.theme;
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    updateThemeIcons(newTheme);
  }
});

function updateThemeIcons(theme) {
  const icons = document.querySelectorAll('.theme-icon');
  icons.forEach(icon => {
    if (theme === 'dark') {
      icon.className = 'fas fa-moon theme-icon';
    } else {
      icon.className = 'fas fa-sun theme-icon';
    }
  });
}

// Storage Helpers
const STORAGE_KEY = 'lumina_conversations';
function loadConversations() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      chats = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse conversations, resetting', e);
      chats = [];
    }
  }
}

function saveConversations() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

// Custom Markdown Parser with Built-in Code Highlighter
function renderMarkdown(text) {
  if (!text) return '';

  // 1. Escape HTML characters to protect against XSS (except those we explicitly create)
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Temporary storage for code blocks so other formatting doesn't affect them
  const codeBlocks = [];
  
  // 2. Extract code blocks ```lang\ncode\n```
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  html = html.replace(codeBlockRegex, (match, lang, code) => {
    const placeholder = `__CODE_BLOCK_PLACEHOLDER_${codeBlocks.length}__`;
    codeBlocks.push({ lang: lang.trim(), code: code });
    return placeholder;
  });

  // 3. Blockquotes
  html = html.replace(/^&gt;\s+(.*)$/gm, '<blockquote>$1</blockquote>');

  // 4. Headers (matched from deepest nesting to shallowest)
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');

  // 5. Bold & Italics
  html = html.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([\s\S]*?)\*/g, '<em>$1</em>');
  html = html.replace(/_([\s\S]*?)_/g, '<em>$1</em>');

  // 6. Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 7. Bullet lists (unordered)
  html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
  // Wrap sequential <li> tags with <ul>. Since it's regex we can check lists
  html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');

  // 8. Numbered lists (ordered)
  html = html.replace(/^\s*\d+\.\s+(.*)$/gm, '<li class="ord-li">$1</li>');
  html = html.replace(/(<li class="ord-li">.*<\/li>)+/g, '<ol>$&</ol>').replace(/class="ord-li"/g, '');

  // 9. Paragraphs (split by double newlines, wrap non-block elements)
  const lines = html.split(/\n\n+/);
  html = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    // If it's already a block element, don't wrap in <p>
    if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol') || trimmed.startsWith('<block') || trimmed.startsWith('__CODE_BLOCK')) {
      return trimmed;
    }
    return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  // 10. Re-insert code blocks and highlight them
  codeBlocks.forEach((block, idx) => {
    const placeholder = `__CODE_BLOCK_PLACEHOLDER_${idx}__`;
    const highlighted = highlightCode(block.code, block.lang);
    const wrapper = `
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-block-lang">${block.lang || 'code'}</span>
          <button class="code-copy-btn" onclick="copyCode(this)"><i class="far fa-copy"></i> Copy</button>
        </div>
        <pre><code class="language-${block.lang}">${highlighted}</code></pre>
      </div>
    `;
    html = html.replace(placeholder, wrapper);
  });

  return html;
}

// Fast regex-based syntax highlighter for common languages
function highlightCode(code, lang) {
  const language = (lang || '').toLowerCase();
  
  // Clean whitespace
  let cleanCode = code;

  // Basic JS/Python/HTML/CSS highlighting rules using HTML spans
  if (language === 'js' || language === 'javascript' || language === 'typescript' || language === 'ts') {
    return cleanCode
      // Comments
      .replace(/(\/\/[^\n]*)/g, '<span class="hl-comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')
      // Strings
      .replace(/(["'`])([\s\S]*?)\1/g, '<span class="hl-string">$1$2$1</span>')
      // Keywords
      .replace(/\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|extends|new|import|export|from|async|await|try|catch|finally|throw|default)\b/g, '<span class="hl-keyword">$1</span>')
      // Numbers
      .replace(/\b(\d+)\b/g, '<span class="hl-number">$1</span>')
      // Functions
      .replace(/\b(\w+)(?=\()/g, '<span class="hl-function">$1</span>');
  } 
  
  if (language === 'python' || language === 'py') {
    return cleanCode
      // Comments
      .replace(/(#[^\n]*)/g, '<span class="hl-comment">$1</span>')
      // Strings
      .replace(/(["'])([\s\S]*?)\1/g, '<span class="hl-string">$1$2$1</span>')
      // Keywords
      .replace(/\b(def|class|return|if|elif|else|for|while|try|except|finally|import|from|as|in|is|and|or|not|lambda|pass|break|continue|with|print)\b/g, '<span class="hl-keyword">$1</span>')
      // Numbers
      .replace(/\b(\d+)\b/g, '<span class="hl-number">$1</span>');
  }

  if (language === 'html' || language === 'xml') {
    return cleanCode
      // Comments
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hl-comment">$1</span>')
      // Tags
      .replace(/(&lt;\/?)(\w+)(.*?&gt;)/g, (match, p1, p2, p3) => {
        // Highlight attributes inside tags
        const attrs = p3.replace(/(\w+)=(&quot;.*?&quot;|'.*?'|[^\s&gt;]+)/g, '<span class="hl-attr-name">$1</span>=<span class="hl-attr-val">$2</span>');
        return `${p1}<span class="hl-tag">${p2}</span>${attrs}`;
      });
  }

  if (language === 'css') {
    return cleanCode
      // Comments
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')
      // Properties & Values
      .replace(/([\w-]+)\s*:\s*([^;]+);/g, '<span class="hl-property">$1</span>: <span class="hl-value">$2</span>;')
      // Selectors
      .replace(/([^{]+)(?=\s*\{)/g, '<span class="hl-keyword">$1</span>');
  }

  if (language === 'json') {
    return cleanCode
      // Strings
      .replace(/(["'])([\s\S]*?)\1/g, '<span class="hl-string">$1$2$1</span>')
      // Keywords / Constants
      .replace(/\b(true|false|null)\b/g, '<span class="hl-keyword">$1</span>')
      // Numbers
      .replace(/\b(\d+)\b/g, '<span class="hl-number">$1</span>');
  }

  // Plain Text fallback
  return cleanCode;
}

// Copy Code Block function
window.copyCode = function(button) {
  const code = button.closest('.code-block-wrapper').querySelector('code').innerText;
  navigator.clipboard.writeText(code).then(() => {
    button.classList.add('copied');
    button.innerHTML = '<i class="fas fa-check"></i> Copied';
    setTimeout(() => {
      button.classList.remove('copied');
      button.innerHTML = '<i class="far fa-copy"></i> Copy';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text', err);
  });
};

// Copy Full Message function
window.copyMessage = function(button, messageId) {
  const chat = chats.find(c => c.id === activeChatId);
  if (!chat) return;
  const message = chat.messages.find(m => m.id === messageId);
  if (!message) return;

  navigator.clipboard.writeText(message.text).then(() => {
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => {
      button.innerHTML = '<i class="far fa-copy"></i> Copy Response';
    }, 2000);
  }).catch(err => {
    console.error('Could not copy response', err);
  });
};

// DOM Elements Bindings
const DOMElements = {
  landingPage: document.getElementById('landing-page'),
  chatDashboard: document.getElementById('chat-dashboard'),
  
  btnHeroLaunch: document.getElementById('btn-hero-launch'),
  btnStartChat: document.getElementById('btn-start-chat'),
  
  sidebar: document.getElementById('chat-sidebar'),
  btnSidebarToggle: document.getElementById('btn-sidebar-toggle'),
  btnSidebarCollapse: document.getElementById('btn-sidebar-collapse'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
  
  btnNewChat: document.getElementById('btn-new-chat'),
  searchChats: document.getElementById('search-chats'),
  btnClearSearch: document.getElementById('btn-clear-search'),
  pinnedChatsSection: document.getElementById('pinned-chats-section'),
  pinnedChatsList: document.getElementById('pinned-chats-list'),
  recentChatsSection: document.getElementById('recent-chats-section'),
  recentChatsList: document.getElementById('recent-chats-list'),
  emptyHistoryView: document.getElementById('empty-history-view'),
  
  statusDot: document.getElementById('status-dot'),
  statusText: document.getElementById('status-text'),
  connectionBanner: document.getElementById('connection-banner'),
  
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
  btnExportDropdown: document.getElementById('btn-export-dropdown'),
  exportDropdownMenu: document.getElementById('export-dropdown-menu'),
  btnClearAll: document.getElementById('btn-clear-all'),
  
  btnExportTxt: document.getElementById('btn-export-txt'),
  btnExportMd: document.getElementById('btn-export-md'),
  btnExportPdf: document.getElementById('btn-export-pdf'),
  btnExportJson: document.getElementById('btn-export-json'),
  
  btnSettingsKey: document.getElementById('btn-settings-key'),
  apiKeyModal: document.getElementById('api-key-modal'),
  btnCloseKeyModal: document.getElementById('btn-close-key-modal'),
  btnKeyModalCancel: document.getElementById('btn-key-modal-cancel'),
  btnKeyModalSave: document.getElementById('btn-key-modal-save'),
  inputCustomApiKey: document.getElementById('input-custom-api-key'),
  chkShowKey: document.getElementById('chk-show-key'),
  apiKeyStatusText: document.getElementById('api-key-status-text'),
  
  activeChatTitle: document.getElementById('active-chat-title'),
  btnPinActive: document.getElementById('btn-pin-active'),
  btnLeaveChat: document.getElementById('btn-leave-chat'),
  
  chatOutputContainer: document.getElementById('chat-output-container'),
  chatWelcomeScreen: document.getElementById('chat-welcome-screen'),
  messagesList: document.getElementById('messages-list'),
  aiTypingIndicator: document.getElementById('ai-typing-indicator'),
  
  generationControlPanel: document.getElementById('generation-control-panel'),
  btnStopGeneration: document.getElementById('btn-stop-generation'),
  
  chatInputForm: document.getElementById('chat-input-form'),
  chatTextarea: document.getElementById('chat-textarea'),
  btnSendMessage: document.getElementById('btn-send-message'),
  btnAttachFile: document.getElementById('btn-attach-file'),
  fileInput: document.getElementById('file-input'),
  btnVoiceInput: document.getElementById('btn-voice-input'),
  filePreviewsContainer: document.getElementById('file-previews-container'),
  dragDropOverlay: document.getElementById('drag-drop-overlay')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadConversations();
  setupEventListeners();
  renderSidebarChats();
  checkServerHealth();
  updateKeyStatusUI();
  setInterval(checkServerHealth, HEALTH_CHECK_INTERVAL);
  
  // Set up connection event handlers
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus();
});

// Event Listeners Routing
function setupEventListeners() {
  // Theme Switches
  DOMElements.btnThemeToggle.addEventListener('click', toggleTheme);
  
  // Screen Router
  if (DOMElements.btnHeroLaunch) {
    DOMElements.btnHeroLaunch.addEventListener('click', switchToChatScreen);
  }
  DOMElements.btnStartChat.addEventListener('click', switchToChatScreen);
  DOMElements.btnLeaveChat.addEventListener('click', switchToLandingScreen);
  
  // Sidebar actions
  DOMElements.btnSidebarToggle.addEventListener('click', openMobileSidebar);
  DOMElements.btnSidebarCollapse.addEventListener('click', closeMobileSidebar);
  DOMElements.sidebarOverlay.addEventListener('click', closeMobileSidebar);
  
  DOMElements.btnNewChat.addEventListener('click', () => createNewChat());
  DOMElements.searchChats.addEventListener('input', filterChats);
  DOMElements.btnClearSearch.addEventListener('click', clearSearch);
  
  DOMElements.btnClearAll.addEventListener('click', clearAllChats);
  
  // Export Dropdown
  DOMElements.btnExportDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
    DOMElements.exportDropdownMenu.classList.toggle('hidden');
  });
  
  document.addEventListener('click', () => {
    DOMElements.exportDropdownMenu.classList.add('hidden');
  });
  
  DOMElements.btnExportTxt.addEventListener('click', exportActiveChatTxt);
  DOMElements.btnExportMd.addEventListener('click', exportActiveChatMd);
  DOMElements.btnExportJson.addEventListener('click', exportAllChatsJson);
  DOMElements.btnExportPdf.addEventListener('click', exportActiveChatPdf);
  
  // Pin & Title in Chat Header
  DOMElements.btnPinActive.addEventListener('click', togglePinActiveChat);
  DOMElements.activeChatTitle.addEventListener('blur', renameActiveChat);
  DOMElements.activeChatTitle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      DOMElements.activeChatTitle.blur();
    }
  });
  
  // Suggested prompt quick triggers
  const promptButtons = document.querySelectorAll('.suggested-prompt-btn');
  promptButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.innerText;
      sendPromptMessage(text);
    });
  });
  
  // File Upload Handlers
  DOMElements.btnAttachFile.addEventListener('click', () => DOMElements.fileInput.click());
  DOMElements.fileInput.addEventListener('change', handleFileInputChange);

  // Drag and Drop support
  const dropZone = DOMElements.chatDashboard;
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, showDragDropOverlay, false);
  });
  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, hideDragDropOverlay, false);
  });
  dropZone.addEventListener('drop', handleFileDrop, false);

  // Voice Input Handlers
  DOMElements.btnVoiceInput.addEventListener('click', toggleSpeechRecognition);

  // Message submission form
  DOMElements.chatInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitUserMessage();
  });
  
  // Dynamic textarea scaling and keystrokes
  DOMElements.chatTextarea.addEventListener('input', autoScaleTextarea);
  DOMElements.chatTextarea.addEventListener('keydown', handleTextareaKeydown);
  
  // Streaming Controller
  DOMElements.btnStopGeneration.addEventListener('click', stopResponseGeneration);

  // API Key Settings Modal Trigger
  if (DOMElements.btnSettingsKey) {
    DOMElements.btnSettingsKey.addEventListener('click', () => {
      const savedKey = localStorage.getItem('custom_gemini_api_key') || '';
      DOMElements.inputCustomApiKey.value = savedKey;
      DOMElements.inputCustomApiKey.type = 'password';
      DOMElements.chkShowKey.checked = false;
      updateKeyStatusUI();
      DOMElements.apiKeyModal.classList.remove('hidden');
    });
  }

  if (DOMElements.btnCloseKeyModal) {
    DOMElements.btnCloseKeyModal.addEventListener('click', () => {
      DOMElements.apiKeyModal.classList.add('hidden');
    });
  }

  if (DOMElements.btnKeyModalCancel) {
    DOMElements.btnKeyModalCancel.addEventListener('click', () => {
      DOMElements.apiKeyModal.classList.add('hidden');
    });
  }

  if (DOMElements.btnKeyModalSave) {
    DOMElements.btnKeyModalSave.addEventListener('click', () => {
      let newKey = DOMElements.inputCustomApiKey.value.trim();
      newKey = newKey.replace(/^GEMINI_API_KEY\s*=\s*/i, '');
      newKey = newKey.replace(/^['"]|['"]$/g, '').trim();
      localStorage.setItem('custom_gemini_api_key', newKey);
      DOMElements.apiKeyModal.classList.add('hidden');
      updateKeyStatusUI();
      checkServerHealth(); // Instantly verify the new API key status
    });
  }

  if (DOMElements.chkShowKey) {
    DOMElements.chkShowKey.addEventListener('change', (e) => {
      DOMElements.inputCustomApiKey.type = e.target.checked ? 'text' : 'password';
    });
  }
}

// Screen Routing Actions
function switchToChatScreen() {
  DOMElements.landingPage.classList.remove('active');
  DOMElements.chatDashboard.classList.add('active');
  
  // Select active conversation or make a new one if history is empty
  if (chats.length > 0) {
    // Select last active chat or first chat
    const lastActive = chats[0]; // Recent lists are sorted by time
    selectChat(lastActive.id);
  } else {
    createNewChat();
  }
}

function switchToLandingScreen() {
  DOMElements.chatDashboard.classList.remove('active');
  DOMElements.landingPage.classList.add('active');
}

// Collapsible Mobile Sidebar actions
function openMobileSidebar() {
  DOMElements.sidebar.classList.add('open');
  DOMElements.sidebarOverlay.classList.add('active');
}

function closeMobileSidebar() {
  DOMElements.sidebar.classList.remove('open');
  DOMElements.sidebarOverlay.classList.remove('active');
}

// Conversation Management Functions
function createNewChat(initialText = '') {
  const newChat = {
    id: 'chat_' + Date.now(),
    title: initialText ? (initialText.substring(0, 24) + '...') : 'New Conversation',
    isPinned: false,
    createdAt: new Date().toISOString(),
    messages: []
  };
  
  chats.unshift(newChat);
  saveConversations();
  renderSidebarChats();
  selectChat(newChat.id);
  
  if (initialText) {
    sendPromptMessage(initialText);
  }
  
  closeMobileSidebar();
}

function selectChat(chatId) {
  activeChatId = chatId;
  const chat = chats.find(c => c.id === chatId);
  if (!chat) return;
  
  // Update header content
  DOMElements.activeChatTitle.innerText = chat.title;
  if (chat.isPinned) {
    DOMElements.btnPinActive.classList.add('pinned');
    DOMElements.btnPinActive.querySelector('i').className = 'fas fa-thumbtack';
  } else {
    DOMElements.btnPinActive.classList.remove('pinned');
    DOMElements.btnPinActive.querySelector('i').className = 'far fa-thumbtack';
  }
  
  // Render workspace messages
  renderChatMessages();
  
  // Highlight active sidebar item
  document.querySelectorAll('.chat-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-id') === chatId) {
      item.classList.add('active');
    }
  });

  // Focus input
  DOMElements.chatTextarea.focus();
}

function togglePinChat(chatId, event) {
  if (event) event.stopPropagation();
  
  const chat = chats.find(c => c.id === chatId);
  if (!chat) return;
  
  chat.isPinned = !chat.isPinned;
  saveConversations();
  renderSidebarChats();
  
  // Update header pin if it is active chat
  if (chatId === activeChatId) {
    selectChat(chatId);
  }
}

function togglePinActiveChat() {
  if (!activeChatId) return;
  togglePinChat(activeChatId);
}

function renameChat(chatId, newTitle) {
  const chat = chats.find(c => c.id === chatId);
  if (!chat) return;
  
  const trimmed = newTitle.trim();
  chat.title = trimmed || 'Untitled Conversation';
  saveConversations();
  renderSidebarChats();
  
  // If active, update title block
  if (chatId === activeChatId) {
    DOMElements.activeChatTitle.innerText = chat.title;
  }
}

function renameActiveChat() {
  if (!activeChatId) return;
  const newTitle = DOMElements.activeChatTitle.innerText;
  renameChat(activeChatId, newTitle);
}

function deleteChat(chatId, event) {
  if (event) event.stopPropagation();
  
  const chatIndex = chats.findIndex(c => c.id === chatId);
  if (chatIndex === -1) return;
  
  if (confirm(`Are you sure you want to delete this conversation?`)) {
    chats.splice(chatIndex, 1);
    saveConversations();
    renderSidebarChats();
    
    // Adjust active state
    if (activeChatId === chatId) {
      if (chats.length > 0) {
        selectChat(chats[0].id);
      } else {
        createNewChat();
      }
    }
  }
}

function deleteMessage(messageId) {
  const chat = chats.find(c => c.id === activeChatId);
  if (!chat) return;
  
  if (confirm('Delete this message?')) {
    chat.messages = chat.messages.filter(m => m.id !== messageId);
    saveConversations();
    renderChatMessages();
  }
}

function clearAllChats() {
  if (confirm('Warning: This will delete ALL stored conversations. Are you sure?')) {
    chats = [];
    saveConversations();
    renderSidebarChats();
    createNewChat();
  }
}

// Sidebar Rendering Controller
function renderSidebarChats() {
  const searchQuery = DOMElements.searchChats.value.toLowerCase().trim();
  
  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery) ||
    chat.messages.some(m => m.text.toLowerCase().includes(searchQuery))
  );

  // Separate pinned and recent
  const pinned = filteredChats.filter(c => c.isPinned);
  const recent = filteredChats.filter(c => !c.isPinned);

  // Render Pinned Chats
  if (pinned.length > 0) {
    DOMElements.pinnedChatsSection.classList.remove('hidden');
    DOMElements.pinnedChatsList.innerHTML = pinned.map(chat => createChatItemHTML(chat)).join('');
  } else {
    DOMElements.pinnedChatsSection.classList.add('hidden');
    DOMElements.pinnedChatsList.innerHTML = '';
  }

  // Render Recent Chats
  if (recent.length > 0) {
    DOMElements.recentChatsSection.classList.remove('hidden');
    DOMElements.recentChatsList.innerHTML = recent.map(chat => createChatItemHTML(chat)).join('');
  } else {
    DOMElements.recentChatsSection.classList.add('hidden');
    DOMElements.recentChatsList.innerHTML = '';
  }

  // Handle Empty State
  if (filteredChats.length === 0) {
    DOMElements.emptyHistoryView.classList.remove('hidden');
  } else {
    DOMElements.emptyHistoryView.classList.add('hidden');
  }
  
  // Highlight active
  if (activeChatId) {
    const activeItem = document.querySelector(`.chat-item[data-id="${activeChatId}"]`);
    if (activeItem) activeItem.classList.add('active');
  }
}

function createChatItemHTML(chat) {
  const pinIcon = chat.isPinned ? 'fas fa-thumbtack' : 'far fa-thumbtack';
  const pinTitle = chat.isPinned ? 'Unpin chat' : 'Pin chat';
  
  return `
    <li class="chat-item" data-id="${chat.id}" onclick="selectChat('${chat.id}')">
      <span class="chat-item-icon"><i class="${chat.isPinned ? 'fas fa-thumbtack' : 'far fa-comment-alt'}"></i></span>
      <span class="chat-title-text">${escapeHTML(chat.title)}</span>
      <div class="chat-item-actions">
        <button class="chat-action-btn" title="${pinTitle}" onclick="togglePinChat('${chat.id}', event)">
          <i class="${pinIcon}"></i>
        </button>
        <button class="chat-action-btn" title="Rename conversation" onclick="triggerRenamePrompt('${chat.id}', event)">
          <i class="far fa-edit"></i>
        </button>
        <button class="chat-action-btn delete-btn" title="Delete conversation" onclick="deleteChat('${chat.id}', event)">
          <i class="far fa-trash-alt"></i>
        </button>
      </div>
    </li>
  `;
}

function triggerRenamePrompt(chatId, event) {
  if (event) event.stopPropagation();
  const chat = chats.find(c => c.id === chatId);
  if (!chat) return;
  
  const newName = prompt('Enter a new title for this conversation:', chat.title);
  if (newName !== null) {
    renameChat(chatId, newName);
  }
}

// Workspace Messages Rendering
function renderChatMessages() {
  const chat = chats.find(c => c.id === activeChatId);
  if (!chat || chat.messages.length === 0) {
    // Show welcome screen
    DOMElements.chatWelcomeScreen.classList.remove('hidden');
    DOMElements.messagesList.innerHTML = '';
    return;
  }
  
  DOMElements.chatWelcomeScreen.classList.add('hidden');
  
  const messagesHTML = chat.messages.map(msg => {
    const isUser = msg.role === 'user';
    // Skip rendering empty model message if it is currently generating
    if (!isUser && !msg.text && isGenerating) {
      return '';
    }

    const alignClass = isUser ? 'user' : 'model';
    const avatarIcon = isUser ? '<i class="far fa-user"></i>' : '🎓';
    const senderName = isUser ? 'You' : 'Pravio AI';
    
    let formattedText = '';
    if (isUser) {
      formattedText = escapeHTML(msg.text);
    } else if (msg.text.startsWith('Error:')) {
      formattedText = `<span style="color: #ef4444; font-weight: 500; display: inline-flex; align-items: center; gap: 6px;"><i class="fas fa-exclamation-triangle"></i> ${escapeHTML(msg.text)}</span>`;
    } else {
      formattedText = renderMarkdown(msg.text);
    }
    
    // Format message bubble attachments if any exist
    let attachmentsHTML = '';
    if (isUser && msg.attachments && msg.attachments.length > 0) {
      attachmentsHTML = `
        <div class="message-bubble-attachments">
          ${msg.attachments.map(att => {
            if (att.isImage) {
              return `<div class="msg-attachment-thumb" onclick="viewAttachmentImage('${att.data}', '${att.name}')"><img src="${att.data}" alt="${att.name}" title="${att.name}"></div>`;
            } else {
              return `<div class="msg-attachment-pill" title="${att.name}"><i class="far fa-file-alt"></i> <span>${escapeHTML(att.name)}</span></div>`;
            }
          }).join('')}
        </div>
      `;
    }

    // Action buttons inside bubbles
    const actionRow = isUser 
      ? `
        <div class="message-actions">
          <button class="msg-action-btn delete-msg-btn" onclick="deleteMessage('${msg.id}')"><i class="far fa-trash-alt"></i> Delete</button>
        </div>
      `
      : `
        <div class="message-actions">
          <button class="msg-action-btn" onclick="copyMessage(this, '${msg.id}')"><i class="far fa-copy"></i> Copy Response</button>
          <button class="msg-action-btn speak-msg-btn" onclick="speakMessage(this, '${msg.id}')"><i class="fas fa-volume-up"></i> Speak</button>
          ${chat.messages[chat.messages.length - 1].id === msg.id ? `<button class="msg-action-btn" onclick="regenerateLastResponse()"><i class="fas fa-sync-alt"></i> Regenerate</button>` : ''}
          <button class="msg-action-btn delete-msg-btn" onclick="deleteMessage('${msg.id}')"><i class="far fa-trash-alt"></i> Delete</button>
        </div>
      `;

    return `
      <div class="message-block ${alignClass}" data-msg-id="${msg.id}">
        <div class="avatar ${isUser ? 'user-avatar' : 'ai-avatar'}">${avatarIcon}</div>
        <div class="message-bubble">
          <div class="message-meta">
            <span class="message-sender">${senderName}</span>
            <span class="message-time">${formatTime(msg.timestamp)}</span>
          </div>
          <div class="bubble-content">${formattedText}${attachmentsHTML}</div>
          ${actionRow}
        </div>
      </div>
    `;
  }).join('');
  
  DOMElements.messagesList.innerHTML = messagesHTML;
  scrollToLatestMessage();
}

// Send user prompt triggers
function sendPromptMessage(text) {
  DOMElements.chatTextarea.value = text;
  submitUserMessage();
}

// User Message Submission Flow
async function submitUserMessage() {
  if (isGenerating) return;
  
  const text = DOMElements.chatTextarea.value.trim();
  if (!text && attachedFiles.length === 0) return;
  
  // Reset input field height & content
  DOMElements.chatTextarea.value = '';
  DOMElements.chatTextarea.style.height = 'auto';
  
  const chat = chats.find(c => c.id === activeChatId);
  if (!chat) return;

  // If first user message, update title dynamically
  if (chat.messages.length === 0) {
    chat.title = generateSmartTitle(text, attachedFiles);
    DOMElements.activeChatTitle.innerText = chat.title;
    renderSidebarChats();
  }

  // Push User Message with attached files
  const userMsgId = 'msg_' + Date.now();
  const userMsg = {
    id: userMsgId,
    role: 'user',
    text: text,
    timestamp: new Date().toISOString(),
    attachments: [...attachedFiles] // Save attachments history
  };
  chat.messages.push(userMsg);
  
  // Reset current uploads
  attachedFiles = [];
  renderFilePreviews();
  
  saveConversations();
  renderChatMessages();

  // Create empty AI response bubble
  const aiMsgId = 'msg_' + (Date.now() + 1);
  const aiMsg = {
    id: aiMsgId,
    role: 'model',
    text: '',
    timestamp: new Date().toISOString()
  };
  chat.messages.push(aiMsg);
  
  // Show typing animation
  isGenerating = true;
  DOMElements.aiTypingIndicator.classList.remove('hidden');
  DOMElements.generationControlPanel.classList.remove('hidden');
  scrollToLatestMessage();

  // Prep headers and query payload
  abortController = new AbortController();
  
  // Gemini API expects previous context formatting
  // We format attachments: images become inlineData parts, docs text becomes prompt context
  const apiHistory = chat.messages.slice(0, -1).map(msg => {
    const parts = [];
    let combinedText = msg.text || '';
    
    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach(att => {
        if (att.isImage) {
          const base64Data = att.data.split(',')[1] || att.data;
          parts.push({
            inlineData: {
              mimeType: att.type,
              data: base64Data
            }
          });
        } else {
          // Document context injection
          combinedText = `[File Attachment Context - ${att.name}]:\n\`\`\`\n${att.data}\n\`\`\`\n\n` + combinedText;
        }
      });
    }
    
    // Add text prompt part
    if (combinedText || parts.length === 0) {
      parts.unshift({ text: combinedText || ' ' });
    }
    
    return {
      role: msg.role,
      parts: parts
    };
  });

  try {
    const customKey = localStorage.getItem('custom_gemini_api_key') || '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (customKey) {
      headers['X-API-Key'] = customKey;
    }

    const response = await fetch(API_BASE + '/api/chat', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        messages: apiHistory,
        stream: true,
        customApiKey: customKey
      }),
      signal: abortController.signal
    });

    DOMElements.aiTypingIndicator.classList.add('hidden');

    if (!response.ok) {
      // Handle server error responses
      const errorJson = await response.json().catch(() => ({}));
      let errMsg = errorJson.error || `Server responded with status ${response.status}`;
      if (response.status === 401 || response.status === 403 || errMsg.includes('API key') || errMsg.includes('api_key_invalid') || errMsg.includes('not configured')) {
        errMsg = 'AI service is temporarily unavailable. Please try again later.';
      }
      throw new Error(errMsg);
    }

    // Process Stream responses
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedText = '';
    
    // Inject rendering bubble in DOM directly to keep performance smooth
    const dummyAiBlock = document.createElement('div');
    dummyAiBlock.className = 'message-block model';
    dummyAiBlock.setAttribute('data-msg-id', aiMsgId);
    dummyAiBlock.innerHTML = `
      <div class="avatar ai-avatar" style="font-size:1.15rem; line-height:1; display:flex; align-items:center; justify-content:center;">🎓</div>
      <div class="message-bubble">
        <div class="message-meta">
          <span class="message-sender">Pravio AI</span>
          <span class="message-time">${formatTime(aiMsg.timestamp)}</span>
        </div>
        <div class="bubble-content"></div>
        <div class="message-actions hidden">
          <button class="msg-action-btn" onclick="copyMessage(this, '${aiMsgId}')"><i class="far fa-copy"></i> Copy Response</button>
          <button class="msg-action-btn" onclick="regenerateLastResponse()"><i class="fas fa-sync-alt"></i> Regenerate</button>
          <button class="msg-action-btn delete-msg-btn" onclick="deleteMessage('${aiMsgId}')"><i class="far fa-trash-alt"></i> Delete</button>
        </div>
      </div>
    `;
    
    // Hide welcome view if it was there and append bubble
    DOMElements.chatWelcomeScreen.classList.add('hidden');
    DOMElements.messagesList.appendChild(dummyAiBlock);
    const textBubble = dummyAiBlock.querySelector('.bubble-content');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataContent = line.slice(6).trim();
          if (dataContent === '[DONE]') {
            break;
          }
          
          try {
            const parsed = JSON.parse(dataContent);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              accumulatedText += parsed.text;
              textBubble.innerHTML = renderMarkdown(accumulatedText);
              scrollToLatestMessage();
            }
          } catch (jsonErr) {
            // Avoid failing on broken line parsing
          }
        }
      }
    }

    // Save final response text in state
    aiMsg.text = accumulatedText;
    saveConversations();
    
    // Reveal actions on the bubble
    dummyAiBlock.querySelector('.message-actions').classList.remove('hidden');
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Streaming generation aborted by user.');
      // Keep whatever text was accumulated
      const textBubble = document.querySelector(`[data-msg-id="${aiMsgId}"] .bubble-content`);
      if (textBubble) {
        aiMsg.text = textBubble.innerText + ' [Generation Stopped]';
        saveConversations();
      }
    } else {
      console.error('Fetch error:', error);
      DOMElements.aiTypingIndicator.classList.add('hidden');
      
      let errMsg = error.message;
      if (errMsg.includes('API key') || errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('not configured')) {
        errMsg = 'AI service is temporarily unavailable. Please try again later.';
      }
      aiMsg.text = `Error: ${errMsg}`;
      saveConversations();
    }
  } finally {
    isGenerating = false;
    abortController = null;
    DOMElements.generationControlPanel.classList.add('hidden');
    renderChatMessages(); // Final refresh to ensure timestamps & indices are correct
  }
}

// Stop Response Generation
function stopResponseGeneration() {
  if (abortController) {
    abortController.abort();
  }
}

// Regenerate Last AI Response
window.regenerateLastResponse = function() {
  const chat = chats.find(c => c.id === activeChatId);
  if (!chat || chat.messages.length < 2) return;
  
  // Remove last message if it is from AI
  const lastMsg = chat.messages[chat.messages.length - 1];
  if (lastMsg.role === 'model') {
    chat.messages.pop(); // Remove AI msg
  }
  
  // Extract text from user's last message, pop it, and resubmit
  const lastUserMsg = chat.messages.pop();
  if (lastUserMsg && lastUserMsg.role === 'user') {
    DOMElements.chatTextarea.value = lastUserMsg.text;
    submitUserMessage();
  }
};

// Clear search filters
function clearSearch() {
  DOMElements.searchChats.value = '';
  DOMElements.btnClearSearch.classList.add('hidden');
  renderSidebarChats();
}

function filterChats() {
  const val = DOMElements.searchChats.value;
  if (val) {
    DOMElements.btnClearSearch.classList.remove('hidden');
  } else {
    DOMElements.btnClearSearch.classList.add('hidden');
  }
  renderSidebarChats();
}

// Textarea scale dynamically
function autoScaleTextarea() {
  DOMElements.chatTextarea.style.height = 'auto';
  DOMElements.chatTextarea.style.height = DOMElements.chatTextarea.scrollHeight + 'px';
}

// Textarea Keystrokes (Enter to send, Shift+Enter for new line)
function handleTextareaKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitUserMessage();
  }
}

// Scroll to bottom helper
function scrollToLatestMessage() {
  DOMElements.chatOutputContainer.scrollTop = DOMElements.chatOutputContainer.scrollHeight;
}

// Export Chat History as Plain Text
function exportActiveChatTxt() {
  const chat = chats.find(c => c.id === activeChatId);
  if (!chat || chat.messages.length === 0) {
    alert('No messages to export.');
    return;
  }

  let txtContent = `Lumina Chat Conversation Log: ${chat.title}\n`;
  txtContent += `Date Created: ${new Date(chat.createdAt).toLocaleString()}\n`;
  txtContent += `==================================================\n\n`;

  chat.messages.forEach(msg => {
    const sender = msg.role === 'user' ? 'YOU' : 'LUMINA AI';
    txtContent += `[${new Date(msg.timestamp).toLocaleString()}] ${sender}:\n`;
    txtContent += `${msg.text}\n`;
    txtContent += `--------------------------------------------------\n\n`;
  });

  downloadFile(txtContent, `${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_history.txt`, 'text/plain');
}

// Export All Chats as JSON Backup
function exportAllChatsJson() {
  if (chats.length === 0) {
    alert('No chat history to export.');
    return;
  }
  const jsonString = JSON.stringify(chats, null, 2);
  downloadFile(jsonString, `lumina_chats_backup.json`, 'application/json');
}

// Export Active Chat as PDF Document
function exportActiveChatPdf() {
  const chat = chats.find(c => c.id === activeChatId);
  if (!chat || chat.messages.length === 0) {
    alert('No messages to export.');
    return;
  }

  // Ensure html2pdf is available
  if (typeof html2pdf === 'undefined') {
    alert('PDF generation library is loading. Please try again in a moment.');
    return;
  }

  // Create temporary container styled nicely for PDF conversion
  const pdfContainer = document.getElementById('pdf-export-canvas');
  pdfContainer.classList.remove('hidden');
  
  let html = `
    <div style="padding: 24px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111827; background-color: #ffffff;">
      <h1 style="font-size: 24px; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; margin-bottom: 4px; color: #7c3aed;">Lumina Chat Transcript</h1>
      <p style="font-size: 12px; color: #6b7280; margin-bottom: 24px;">Conversation: <strong>${chat.title}</strong> | Exported on ${new Date().toLocaleString()}</p>
  `;

  chat.messages.forEach(msg => {
    const isUser = msg.role === 'user';
    const sender = isUser ? 'User' : 'Lumina AI';
    const bg = isUser ? '#f3f4f6' : '#ffffff';
    const border = isUser ? 'none' : '1px solid #e5e7eb';
    
    html += `
      <div style="margin-bottom: 18px; padding: 12px 16px; background-color: ${bg}; border: ${border}; border-radius: 8px; page-break-inside: avoid;">
        <div style="font-size: 10px; font-weight: bold; color: #7c3aed; margin-bottom: 6px;">${sender} &bull; ${new Date(msg.timestamp).toLocaleString()}</div>
        <div style="font-size: 13px; line-height: 1.5; color: #1f2937;">${isUser ? escapeHTML(msg.text).replace(/\n/g, '<br>') : renderMarkdown(msg.text)}</div>
      </div>
    `;
  });

  html += `</div>`;
  pdfContainer.innerHTML = html;

  // Options for pdf generation
  const options = {
    margin: 10,
    filename: `${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().from(pdfContainer).set(options).save().then(() => {
    pdfContainer.innerHTML = '';
    pdfContainer.classList.add('hidden');
  }).catch(err => {
    console.error('PDF export failed', err);
    pdfContainer.innerHTML = '';
    pdfContainer.classList.add('hidden');
    alert('Failed to export PDF document.');
  });
}

// Download File Helper
function downloadFile(content, fileName, contentType) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}

function updateKeyStatusUI() {
  const savedKey = localStorage.getItem('custom_gemini_api_key') || '';
  if (savedKey) {
    if (DOMElements.apiKeyStatusText) {
      DOMElements.apiKeyStatusText.innerText = `Custom Key (${savedKey.substring(0, 7)}...)`;
      DOMElements.apiKeyStatusText.style.color = '#10b981'; // Green online
    }
  } else {
    if (DOMElements.apiKeyStatusText) {
      DOMElements.apiKeyStatusText.innerText = 'Shared System Key';
      DOMElements.apiKeyStatusText.style.color = 'var(--primary-color)';
    }
  }
}

// Ping Server Health Status
async function checkServerHealth() {
  try {
    const customKey = localStorage.getItem('custom_gemini_api_key') || '';
    const headers = {};
    if (customKey) {
      headers['X-API-Key'] = customKey;
    }
    const res = await fetch(API_BASE + '/health', { headers });
    const data = await res.json();
    if (data.status === 'healthy' || data.status === 'ok') {
      const isConfigured = !!(data.geminiConfigured || data.ai === 'connected');
      updateServerStatus(true, isConfigured);
    } else {
      updateServerStatus(false);
    }
  } catch (err) {
    updateServerStatus(false);
  }
}

function updateServerStatus(isHealthy, geminiConfigured = false) {
  if (isHealthy) {
    DOMElements.statusDot.className = 'status-dot online';
    if (!geminiConfigured) {
      DOMElements.statusText.innerText = 'Connected (API Key Missing)';
      DOMElements.statusDot.style.backgroundColor = '#f59e0b'; // Amber warning
      DOMElements.statusDot.style.boxShadow = '0 0 6px #f59e0b';
    } else {
      DOMElements.statusText.innerText = 'Connected';
      DOMElements.statusDot.style.backgroundColor = '#10b981'; // Green online
      DOMElements.statusDot.style.boxShadow = '0 0 6px #10b981';
    }
  } else {
    DOMElements.statusDot.className = 'status-dot offline';
    DOMElements.statusText.innerText = 'Offline';
    DOMElements.statusDot.style.backgroundColor = '#ef4444'; // Red offline
    DOMElements.statusDot.style.boxShadow = '0 0 6px #ef4444';
  }
}

function updateNetworkStatus() {
  if (navigator.onLine) {
    DOMElements.connectionBanner.classList.add('offline-hidden');
    checkServerHealth();
  } else {
    DOMElements.connectionBanner.classList.remove('offline-hidden');
    updateServerStatus(false);
  }
}

// Helper utility functions
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTime(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

// Open attachment image viewer in a new tab
window.viewAttachmentImage = function(data, name) {
  const w = window.open();
  if (w) {
    w.document.write(`
      <title>${escapeHTML(name)}</title>
      <body style="margin:0;background:#050508;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
        <div style="text-align:center;">
          <h4 style="color:#9ca3af;margin-bottom:12px;">${escapeHTML(name)}</h4>
          <img src="${data}" style="max-width:90vw;max-height:80vh;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
        </div>
      </body>
    `);
  }
};

// Export Active Chat as Markdown (.md)
function exportActiveChatMd() {
  const chat = chats.find(c => c.id === activeChatId);
  if (!chat || chat.messages.length === 0) {
    alert('No messages to export.');
    return;
  }

  let md = `# Lumina Chat Conversation: ${chat.title}\n`;
  md += `*Date Created: ${new Date(chat.createdAt).toLocaleString()}*\n\n---\n\n`;

  chat.messages.forEach(msg => {
    const sender = msg.role === 'user' ? '👤 **You**' : '🤖 **Lumina AI**';
    md += `### ${sender} *(at ${new Date(msg.timestamp).toLocaleTimeString()})*\n\n`;
    md += `${msg.text}\n\n`;
    
    // Add attachments note
    if (msg.attachments && msg.attachments.length > 0) {
      md += `*Attachments:*\n`;
      msg.attachments.forEach(att => {
        md += `- [${att.name}] (${att.isImage ? 'Image' : 'Document'} - ${formatBytes(att.size)})\n`;
      });
      md += `\n`;
    }
    
    md += `---\n\n`;
  });

  downloadFile(md, `${chat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.md`, 'text/markdown');
}

// Drag & Drop event helpers
function showDragDropOverlay(e) {
  e.preventDefault();
  e.stopPropagation();
  DOMElements.dragDropOverlay.classList.remove('hidden');
}

function hideDragDropOverlay(e) {
  e.preventDefault();
  e.stopPropagation();
  DOMElements.dragDropOverlay.classList.add('hidden');
}

function handleFileDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  DOMElements.dragDropOverlay.classList.add('hidden');
  
  if (e.dataTransfer && e.dataTransfer.files) {
    handleFilesUpload(e.dataTransfer.files);
  }
}

function handleFileInputChange(e) {
  if (e.target.files) {
    handleFilesUpload(e.target.files);
  }
}

// File Processor & Text Extraction Engine (Backend-based)
async function handleFilesUpload(files) {
  if (files.length === 0) return;
  
  const maxUploadCount = 5;
  if (attachedFiles.length + files.length > maxUploadCount) {
    alert(`You can upload at most ${maxUploadCount} files at a time.`);
    return;
  }

  DOMElements.filePreviewsContainer.classList.remove('hidden');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Limit file size to 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File "${file.name}" exceeds the 10MB limit. Skipping.`);
      continue;
    }

    const name = file.name;
    const size = file.size;
    const type = file.type;
    const ext = name.split('.').pop().toLowerCase();
    
    const isImage = type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext);
    const isSupportedDoc = ['pdf', 'docx', 'txt', 'csv', 'xlsx', 'pptx'].includes(ext);

    if (!isImage && !isSupportedDoc) {
      alert(`Format of "${name}" is not supported. Supported: PDF, Word, Excel, PPTX, Text, CSV, Images.`);
      continue;
    }

    // Create unique preview item
    const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const previewObj = {
      id: fileId,
      name: name,
      size: size,
      type: type || (isImage ? 'image/' + ext : 'text/plain'),
      isImage: isImage,
      data: null,
      loading: true,
      progress: 0
    };
    
    attachedFiles.push(previewObj);
    renderFilePreviews();

    // Perform upload to server using XMLHttpRequest to track upload progress
    try {
      const result = await uploadFileToServer(file, fileId);
      previewObj.data = result.data; // Extracted text or image Base64 URL
      previewObj.type = result.type || previewObj.type;
      previewObj.loading = false;
      previewObj.progress = 100;
    } catch (err) {
      console.error(`Upload/Parsing failed for "${name}":`, err);
      alert(`Failed to upload or parse "${name}": ${err.message}`);
      // Remove failed file preview
      attachedFiles = attachedFiles.filter(f => f.id !== fileId);
    }
    
    renderFilePreviews();
  }
}

// XHR wrapper supporting upload progress listener
function uploadFileToServer(file, fileId) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    
    // Listen for progress updates
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        // Map 0-90% to upload progress, leave last 10% for backend processing
        const percent = Math.round((e.loaded / e.total) * 90);
        updateProgress(fileId, percent);
      }
    });

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            updateProgress(fileId, 100);
            resolve(response);
          } catch (e) {
            reject(new Error('Invalid response format from server.'));
          }
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            reject(new Error(response.error || `Server responded with status ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Server error: status ${xhr.status}`));
          }
        }
      }
    };

    xhr.open('POST', API_BASE + '/api/upload', true);
    const customKey = localStorage.getItem('custom_gemini_api_key') || '';
    if (customKey) {
      xhr.setRequestHeader('X-API-Key', customKey);
    }
    xhr.send(formData);
  });
}

// Update Upload progress bars
function updateProgress(fileId, percent) {
  const file = attachedFiles.find(f => f.id === fileId);
  if (file) {
    file.progress = percent;
    const cardEl = document.querySelector(`[data-file-id="${fileId}"]`);
    if (cardEl) {
      const progressBar = cardEl.querySelector('.file-progress-bar');
      if (progressBar) progressBar.style.width = `${percent}%`;
    }
  }
}

// Render uploaded previews panel
function renderFilePreviews() {
  if (attachedFiles.length === 0) {
    DOMElements.filePreviewsContainer.classList.add('hidden');
    DOMElements.filePreviewsContainer.innerHTML = '';
    return;
  }

  DOMElements.filePreviewsContainer.classList.remove('hidden');
  
  const html = attachedFiles.map((file, index) => {
    let previewContent = '';
    if (file.isImage && file.data) {
      previewContent = `<img src="${file.data}" alt="${escapeHTML(file.name)}">`;
    } else {
      let icon = 'far fa-file-alt';
      if (file.name.endsWith('.pdf')) icon = 'far fa-file-pdf';
      else if (file.name.endsWith('.docx')) icon = 'far fa-file-word';
      else if (file.name.endsWith('.xlsx')) icon = 'far fa-file-excel';
      else if (file.name.endsWith('.pptx')) icon = 'far fa-file-powerpoint';
      
      previewContent = `<i class="${icon}"></i>`;
    }

    return `
      <div class="file-preview-card" data-file-id="${file.id}">
        <button class="file-preview-remove-btn" onclick="removeAttachedFile(${index})" title="Remove file"><i class="fas fa-times"></i></button>
        <div class="file-preview-thumbnail">
          ${previewContent}
        </div>
        <span class="file-preview-name" title="${escapeHTML(file.name)}">${escapeHTML(file.name)}</span>
        <span class="file-preview-size">${formatBytes(file.size)}</span>
        ${file.loading ? `<div class="file-progress-bar" style="width: ${file.progress}%"></div>` : ''}
      </div>
    `;
  }).join('');

  DOMElements.filePreviewsContainer.innerHTML = html;
}

window.removeAttachedFile = function(index) {
  attachedFiles.splice(index, 1);
  renderFilePreviews();
};

// Helper formats bytes size
function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Speech Recognition Handlers
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  
  const rec = new SpeechRecognition();
  rec.continuous = false;
  rec.interimResults = false;
  rec.lang = 'en-US';
  
  rec.onstart = () => {
    isListening = true;
    DOMElements.btnVoiceInput.classList.add('active');
    DOMElements.btnVoiceInput.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    DOMElements.chatTextarea.placeholder = 'Listening... Speak now.';
  };
  
  rec.onend = () => {
    isListening = false;
    DOMElements.btnVoiceInput.classList.remove('active');
    DOMElements.btnVoiceInput.innerHTML = '<i class="fas fa-microphone"></i>';
    DOMElements.chatTextarea.placeholder = 'Message Lumina AI or ask about files...';
  };
  
  rec.onresult = (event) => {
    const text = event.results[0][0].transcript;
    if (text) {
      const val = DOMElements.chatTextarea.value;
      DOMElements.chatTextarea.value = val ? (val + ' ' + text) : text;
      autoScaleTextarea();
      DOMElements.chatTextarea.focus();
    }
  };
  
  rec.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    alert(`Voice Recognition Error: ${event.error}`);
  };
  
  return rec;
}

function toggleSpeechRecognition() {
  if (!recognition) {
    recognition = initSpeechRecognition();
  }
  
  if (!recognition) {
    alert('Voice input is not supported in this browser. Please use Chrome or Safari.');
    return;
  }
  
  if (isListening) {
    recognition.stop();
  } else {
    recognition.start();
  }
}

// Text-To-Speech speak readout controls
let currentUtterance = null;
let speakingButton = null;

window.speakMessage = function(button, messageId) {
  const chat = chats.find(c => c.id === activeChatId);
  if (!chat) return;
  const message = chat.messages.find(m => m.id === messageId);
  if (!message) return;
  
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    if (speakingButton) {
      speakingButton.classList.remove('speaking');
      speakingButton.innerHTML = '<i class="fas fa-volume-up"></i> Speak';
    }
    
    if (speakingButton === button) {
      speakingButton = null;
      return;
    }
  }
  
  speakingButton = button;
  button.classList.add('speaking');
  button.innerHTML = '<i class="fas fa-stop"></i> Stop';
  
  const cleanText = message.text
    .replace(/```[\s\S]*?```/g, '[Code block skipped]')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#+ (.*)/g, '$1');
    
  currentUtterance = new SpeechSynthesisUtterance(cleanText);
  
  currentUtterance.onend = () => {
    button.classList.remove('speaking');
    button.innerHTML = '<i class="fas fa-volume-up"></i> Speak';
    if (speakingButton === button) {
      speakingButton = null;
    }
  };
  
  currentUtterance.onerror = () => {
    button.classList.remove('speaking');
    button.innerHTML = '<i class="fas fa-volume-up"></i> Speak';
    if (speakingButton === button) {
      speakingButton = null;
    }
  };
  
  window.speechSynthesis.speak(currentUtterance);
};

// ==========================================
// SMART CONVERSATION TITLES GENERATOR
// ==========================================
function generateSmartTitle(text, files) {
  if (!text) {
    if (files && files.length > 0) {
      return `Analyzed: ${files[0].name}`;
    }
    return 'New Conversation';
  }
  
  const lowerText = text.toLowerCase();
  if (lowerText.includes('study plan') || lowerText.includes('study schedule')) return 'Study Planner';
  if (lowerText.includes('roadmap') || lowerText.includes('career roadmap')) return 'Learning Roadmap';
  if (lowerText.includes('resume') || lowerText.includes('cover letter')) return 'Resume Assistant';
  if (lowerText.includes('interview') || lowerText.includes('mock interview')) return 'Interview Prep';
  if (lowerText.includes('college') || lowerText.includes('eligibility')) return 'College Advisor';
  if (lowerText.includes('smart notes') || lowerText.includes('flashcard') || lowerText.includes('mind map')) return 'Smart Notes';
  if (lowerText.includes('summarize') && files.length > 0) return 'Doc Summary';
  if (lowerText.includes('optimize') || lowerText.includes('dsa') || lowerText.includes('debug')) return 'Coding Assistant';
  
  // Extract core concepts for other general questions
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^(explain|what is|how to|write a|create a|give me a|help me|tell me about|analyze|summarize)\s+/i, '');
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  cleaned = cleaned.replace(/[?.,!]+$/, '');
  
  if (cleaned.length > 22) {
    return cleaned.substring(0, 22) + '...';
  }
  return cleaned;
}

// ==========================================
// TO-DO GOALS SIDEBAR WIDGET
// ==========================================
let todoTasks = [];

function loadTodoTasks() {
  try {
    const saved = localStorage.getItem('pravioTodoTasks');
    todoTasks = saved ? JSON.parse(saved) : [];
  } catch (e) {
    todoTasks = [];
  }
  renderTodoTasks();
}

function saveTodoTasks() {
  localStorage.setItem('pravioTodoTasks', JSON.stringify(todoTasks));
}

function renderTodoTasks() {
  const listEl = document.getElementById('todo-tasks-list');
  if (!listEl) return;
  
  if (todoTasks.length === 0) {
    listEl.innerHTML = '<li class="todo-item" style="color: var(--text-muted); justify-content: center; width: 100%;">No active goals</li>';
    return;
  }
  
  listEl.innerHTML = todoTasks.map((task, idx) => `
    <li class="todo-item ${task.completed ? 'completed' : ''}">
      <label>
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTodoTask(${idx})">
        <span>${escapeHTML(task.text)}</span>
      </label>
      <button class="todo-del-btn" onclick="deleteTodoTask(${idx})" title="Delete"><i class="far fa-trash-alt"></i></button>
    </li>
  `).join('');
}

window.toggleTodoTask = function(index) {
  if (todoTasks[index]) {
    todoTasks[index].completed = !todoTasks[index].completed;
    saveTodoTasks();
    renderTodoTasks();
  }
};

window.deleteTodoTask = function(index) {
  todoTasks.splice(index, 1);
  saveTodoTasks();
  renderTodoTasks();
};

function addTodoTask() {
  const inputEl = document.getElementById('todo-new-task');
  if (!inputEl) return;
  const text = inputEl.value.trim();
  if (!text) return;
  
  todoTasks.push({ text: text, completed: false });
  inputEl.value = '';
  saveTodoTasks();
  renderTodoTasks();
}

// Bind To-Do UI trigger actions
document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('btn-add-todo');
  const inputEl = document.getElementById('todo-new-task');
  if (addBtn) addBtn.addEventListener('click', addTodoTask);
  if (inputEl) {
    inputEl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addTodoTask();
      }
    });
  }
  // Initialize tasks
  loadTodoTasks();
});

// ==========================================
// AI ASSISTANT MODALS & QUICK ACTIONS
// ==========================================
let activeModalTool = '';

const toolFormConfigs = {
  'study-planner': {
    title: 'Study Planner Generator',
    render: () => `
      <label for="planner-type">Plan Duration & Type</label>
      <select id="planner-type">
        <option value="Daily Study Plan">Daily Study Plan</option>
        <option value="Weekly Study Schedule">Weekly Study Schedule</option>
        <option value="Exam Preparation Planner">Exam Preparation Planner</option>
        <option value="Revision Planner">Revision Planner</option>
      </select>
      
      <label for="planner-subjects">Subjects to Study (Comma-separated)</label>
      <input type="text" id="planner-subjects" placeholder="e.g. Data Structures, Database Systems, Computer Networks" value="">
      
      <label for="planner-priority">Subject Prioritization (Highest Priority)</label>
      <input type="text" id="planner-priority" placeholder="e.g. Data Structures" value="">
      
      <label for="planner-hours">Custom Study Hours Per Day</label>
      <select id="planner-hours">
        <option value="2 hours">2 hours</option>
        <option value="4 hours" selected>4 hours</option>
        <option value="6 hours">6 hours</option>
        <option value="8 hours">8 hours</option>
      </select>
    `,
    buildPrompt: () => {
      const type = document.getElementById('planner-type').value;
      const subjects = document.getElementById('planner-subjects').value.trim() || 'Core Subjects';
      const priority = document.getElementById('planner-priority').value.trim() || 'None';
      const hours = document.getElementById('planner-hours').value;
      return `Act as a premium AI academic advisor. Generate a highly structured study plan for subjects: "${subjects}" with priority: "${priority}" and "${hours}" of study per day, in the form of a "${type}". Format the output with clear hourly schedules, milestones, objectives, and time-management tips. Include suggestions to take relevant mock tests on the StudentHub dashboard whenever applicable.`;
    }
  },
  'roadmap': {
    title: 'Learning Roadmap Generator',
    render: () => `
      <label for="roadmap-career">Target Career Path</label>
      <select id="roadmap-career">
        <option value="Full Stack Development">Full Stack Development</option>
        <option value="Artificial Intelligence">Artificial Intelligence</option>
        <option value="Machine Learning">Machine Learning</option>
        <option value="Data Science">Data Science</option>
        <option value="Cybersecurity">Cybersecurity</option>
        <option value="Cloud Computing">Cloud Computing</option>
        <option value="DevOps">DevOps</option>
        <option value="UI/UX Design">UI/UX Design</option>
        <option value="Mobile App Development">Mobile App Development</option>
      </select>
      
      <label for="roadmap-level">Current Skill Level</label>
      <select id="roadmap-level">
        <option value="Beginner">Beginner (No prior knowledge)</option>
        <option value="Intermediate" selected>Intermediate (Some basic knowledge)</option>
        <option value="Advanced">Advanced (Looking to specialize)</option>
      </select>
    `,
    buildPrompt: () => {
      const career = document.getElementById('roadmap-career').value;
      const level = document.getElementById('roadmap-level').value;
      return `Act as a senior engineering mentor. Generate a comprehensive, step-by-step learning roadmap for a "${level}" student pursuing a career in "${career}". Break it down into clear sequential stages, listing: 1. Core skills to learn in recommended order. 2. Practice resources (books, docs, tutorials). 3. Practical hands-on projects to build at each stage. 4. Industry-standard certifications. Additionally, suggest relevant learning roadmaps and study resources inside the StudentHub platform.`;
    }
  },
  'resume': {
    title: 'Resume Assistant & Critic',
    render: () => {
      const hasFiles = attachedFiles.length > 0;
      return `
        ${!hasFiles ? `
        <div class="modal-alert">
          <i class="fas fa-exclamation-triangle"></i>
          <span>Tip: For best results, attach your resume file (PDF, DOCX, TXT) first using the paperclip button in the chat area!</span>
        </div>` : `
        <div class="modal-alert" style="background: rgba(16, 185, 129, 0.1); border-color: #10b981;">
          <i class="fas fa-check-circle" style="color: #10b981;"></i>
          <span>Resume file detected. Ready to analyze!</span>
        </div>`}
        
        <label for="resume-job">Target Job / Role</label>
        <input type="text" id="resume-job" placeholder="e.g. Frontend React Engineer" value="">
        
        <label for="resume-action">Assistance Type</label>
        <select id="resume-action">
          <option value="Analyze my resume, score it, and suggest general improvements">Analyze Resume & Suggest Improvements</option>
          <option value="Improve my resume formatting and suggest modern phrasing">Improve Formatting & Phrasing</option>
          <option value="Conduct a skill gap analysis and recommend missing skills">Recommend Missing Skills</option>
          <option value="Generate a high-impact, professional summary for my profile">Generate Professional Summary</option>
          <option value="Generate a tailored, professional cover letter matching my details">Generate Cover Letter</option>
        </select>
      `;
    },
    buildPrompt: () => {
      const job = document.getElementById('resume-job').value.trim() || 'Software Engineer';
      const action = document.getElementById('resume-action').value;
      return `Act as a professional recruitment consultant. Using the provided resume details, perform the following action: "${action}" targeting the role: "${job}". Evaluate the experience, suggest modern styling improvements, specify missing skills, and output high-impact bullet points. Advise me to practice mock tests and refer to subject notes on the StudentHub platform to boost placement preparation.`;
    }
  },
  'career': {
    title: 'Career Guidance Advisor',
    render: () => `
      <label for="career-focus">Focus Guidance Area</label>
      <select id="career-focus">
        <option value="Career path recommendations based on my background">Career Path Suggestions</option>
        <option value="Skill gap analysis and recommendation list">Skill Gap Analysis</option>
        <option value="Internship applications, timelines, and guidance">Internship Guidance</option>
        <option value="Placement preparation strategy and standard templates">Placement Preparation</option>
        <option value="Higher education guidance (GATE, MS, MBA, PhD)">Higher Education Guidance</option>
      </select>
      
      <label for="career-skills">My Current Skills & Interests</label>
      <textarea id="career-skills" rows="3" placeholder="e.g. B.Tech Computer Science student, know basic Java, Python. Interested in Web Development."></textarea>
    `,
    buildPrompt: () => {
      const focus = document.getElementById('career-focus').value;
      const skills = document.getElementById('career-skills').value.trim() || 'Computer Science student';
      return `Act as a premium academic counselor. Help me with: "${focus}". Based on my skills and background: "${skills}", provide a highly tailored, step-by-step career path suggestion, internship/placement guides, skill gap details, or higher education timelines. Intelligently recommend visiting StudentHub's References directory for study resources.`;
    }
  },
  'interview': {
    title: 'Interview Preparation Prep',
    render: () => `
      <label for="interview-role">Target Role / Specialty</label>
      <input type="text" id="interview-role" placeholder="e.g. Java Spring Boot Developer" value="">
      
      <label for="interview-type">Preparation Mode</label>
      <select id="interview-type">
        <option value="HR Interview Questions (Behavioral & general)">HR Interview Questions</option>
        <option value="Technical Interview Questions (Core concepts)">Technical Interview Questions</option>
        <option value="Coding & Algorithm preparation challenges">Coding Interview & Algorithms</option>
        <option value="Behavioral situation prep (using STAR method)">Behavioral Situations</option>
        <option value="Interactive Mock Interview session (Ask questions one by one)">Interactive Mock Interview (Interactive)</option>
      </select>
    `,
    buildPrompt: () => {
      const role = document.getElementById('interview-role').value.trim() || 'Software Engineer';
      const type = document.getElementById('interview-type').value;
      const isInteractive = type.includes('Interactive');
      
      if (isInteractive) {
        return `Act as an expert technical interviewer. I want to start an interactive mock interview for the role of "${role}". Please ask me only the first question (technical or HR) and wait for my response before asking the next one. Keep your questions professional, concise, and wait for my answer.`;
      }
      return `Act as an expert technical interviewer. Provide a high-yield preparation guide for a "${role}" interview, focusing on: "${type}". Give 5 standard questions, detailed explanations, coding/algorithms challenges, and behavioural tips. Suggest practicing mock tests and referring to notes on the StudentHub platform.`;
    }
  },
  'college': {
    title: 'College Admissions Advisor',
    render: () => `
      <label for="college-score">Entrance Rank / Exam Scores</label>
      <input type="text" id="college-score" placeholder="e.g. GATE Score 650, JEE Rank 15000" value="">
      
      <label for="college-budget">Budget Preference</label>
      <select id="college-budget">
        <option value="Affordable / Low budget">Affordable / Low budget</option>
        <option value="Medium budget" selected>Medium budget</option>
        <option value="Premium / No budget constraint">Premium / No budget constraint</option>
      </select>
      
      <label for="college-location">Preferred Location</label>
      <input type="text" id="college-location" placeholder="e.g. Bangalore, Mumbai, or No Preference" value="">
    `,
    buildPrompt: () => {
      const score = document.getElementById('college-score').value.trim() || 'General Score';
      const budget = document.getElementById('college-budget').value;
      const location = document.getElementById('college-location').value.trim() || 'No Preference';
      return `Act as a premium college admissions advisor. Suggest and compare top colleges for me based on entrance scores: "${score}", budget constraints: "${budget}", and preferred location: "${location}". Explain the eligibility, admission criteria, and placement records. Guide me to use the StudentHub College Predictor tool to check precise cut-offs and predictions.`;
    }
  },
  'notes': {
    title: 'Smart Notes & Summaries',
    render: () => {
      const hasFiles = attachedFiles.length > 0;
      return `
        ${hasFiles ? `
        <div class="modal-alert" style="background: rgba(16, 185, 129, 0.1); border-color: #10b981;">
          <i class="fas fa-check-circle" style="color: #10b981;"></i>
          <span>Document detected! Notes will be generated based on the file content.</span>
        </div>` : ''}
        
        <label for="notes-topic">Topic or Concepts (If not uploading file)</label>
        <input type="text" id="notes-topic" placeholder="e.g. Dijkstra's Algorithm or Neural Networks" value="">
        
        <label for="notes-format">Notes Output Format</label>
        <select id="notes-format">
          <option value="Detailed Study Notes with explanations">Detailed Study Notes</option>
          <option value="Interactive Study Flashcards (Q&A style)">Interactive Flashcards</option>
          <option value="Text-based Mind Map hierarchy visualization">Mind Map Hierarchy</option>
          <option value="Quick bullet-point Chapter Summary">Chapter Summary</option>
          <option value="Rapid Exam Revision Notes">Revision Notes</option>
        </select>
      `;
    },
    buildPrompt: () => {
      const topic = document.getElementById('notes-topic').value.trim() || 'Main Topic';
      const format = document.getElementById('notes-format').value;
      return `Act as an academic tutor. Create high-yield "${format}" for the topic/material: "${topic}". Structure them clearly with key concepts, definitions, mind maps (using text-based hierarchical layout), and exam points. Suggest referencing notes and references in StudentHub's References directory for deep study.`;
    }
  },
  'doc-intel': {
    title: 'Document Intelligence',
    render: () => {
      const hasFiles = attachedFiles.length > 0;
      return `
        ${!hasFiles ? `
        <div class="modal-alert">
          <i class="fas fa-exclamation-triangle"></i>
          <span>Please attach your document file (PDF, DOCX, PPTX, TXT, CSV, XLSX) first using the paperclip button!</span>
        </div>` : `
        <div class="modal-alert" style="background: rgba(16, 185, 129, 0.1); border-color: #10b981;">
          <i class="fas fa-check-circle" style="color: #10b981;"></i>
          <span>Documents ready for analysis!</span>
        </div>`}
        
        <label for="doc-action">Action to Perform</label>
        <select id="doc-action">
          <option value="Summarize the key findings and goals of the document">Summarize Document</option>
          <option value="Explain the presentation slides structure and content in simple terms">Explain Presentation Slides</option>
          <option value="Generate a 5-question multiple-choice quiz based on the document text">Generate Quiz from Document</option>
          <option value="Extract all core bullet-points, data lists, and figures from this text">Extract Key Points & Highlights</option>
          <option value="Compare the documents and summarize key commonalities and conflicts">Compare Documents</option>
        </select>
        
        <label for="doc-query">Custom Question / Query (Optional)</label>
        <input type="text" id="doc-query" placeholder="e.g. What does section 3 say about..." value="">
      `;
    },
    buildPrompt: () => {
      const action = document.getElementById('doc-action').value;
      const query = document.getElementById('doc-query').value.trim();
      let prompt = `Analyze the attached document content. ${action}.`;
      if (query) {
        prompt += ` Specifically answer this custom query: "${query}".`;
      }
      prompt += ` Guide me to relevant study resources on StudentHub references for more context.`;
      return prompt;
    }
  },
  'coding': {
    title: 'Coding Assistant & Helper',
    render: () => `
      <label for="coding-lang">Programming Language</label>
      <input type="text" id="coding-lang" placeholder="e.g. Python, Java, JavaScript, SQL" value="">
      
      <label for="coding-task">Task Type</label>
      <select id="coding-task">
        <option value="Generate clean, well-commented code snippet for">Code Generation</option>
        <option value="Debug, locate bugs, and explain fixes for this code snippet">Debugging & Fix Errors</option>
        <option value="Optimize runtime, space complexity, and refactor this code">Code Optimization</option>
        <option value="Explain how this algorithm works step-by-step">Algorithm Explanation</option>
        <option value="Provide standard Data Structures & Algorithms (DSA) solution for">DSA Solutions</option>
        <option value="Generate clean, compliant SQL query for">SQL Query Generation</option>
        <option value="Provide 3 creative, modern project ideas for">Project Ideas</option>
      </select>
      
      <label for="coding-desc">Description / Code Snippet</label>
      <textarea id="coding-desc" rows="4" placeholder="e.g. Implement a binary search tree insertion, or paste your error message/code snippet here..."></textarea>
    `,
    buildPrompt: () => {
      const lang = document.getElementById('coding-lang').value.trim() || 'Any Language';
      const task = document.getElementById('coding-task').value;
      const desc = document.getElementById('coding-desc').value.trim() || 'Core Algorithm';
      return `Act as an expert software architect. For language: "${lang}", perform this task: "${task}". Details/snippet:\n\`\`\`\n${desc}\n\`\`\`\nOutput clean code, optimizations, debugging notes, or step-by-step algorithms. Suggest studying relevant programming references in StudentHub's References directory.`;
    }
  },
  'research': {
    title: 'Research Assistant',
    render: () => `
      <label for="research-topic">Research Paper / Technical Topic</label>
      <input type="text" id="research-topic" placeholder="e.g. Transformer models in NLP, or paper title" value="">
      
      <label for="research-goal">Research Objective</label>
      <select id="research-goal">
        <option value="Summarize the core abstract, contributions, and findings of the research paper">Summarize Research Paper</option>
        <option value="Explain this complex technical research topic in simple terms">Explain Technical Topics</option>
        <option value="Compare the competing technologies and summarize the pros/cons of each">Compare Technologies</option>
        <option value="Generate a structured, professional research brief summarizing">Generate Structured Research Summary</option>
      </select>
    `,
    buildPrompt: () => {
      const topic = document.getElementById('research-topic').value.trim() || 'General NLP / AI Research';
      const goal = document.getElementById('research-goal').value;
      return `Act as a senior computer science researcher. Help me with this task: "${goal}" on the topic: "${topic}". Structure the output with research summaries, methodology overviews, technology comparisons, and structured briefs. Suggest study materials in StudentHub for further learning.`;
    }
  },
  'productivity': {
    title: 'Productivity Planner',
    render: () => `
      <label for="prod-type">Planning Tool</label>
      <select id="prod-type">
        <option value="Create a structured, prioritize study To-Do List for">To-Do List Generation</option>
        <option value="Outline key milestones and tracking points for this Goal Plan">Goal Planning & Milestones</option>
        <option value="Design an hourly weekly study planner for">Weekly Planner</option>
        <option value="Suggest practical, high-yield time management tips (like Pomodoro)">Time Management Suggestions</option>
      </select>
      
      <label for="prod-desc">Plan Details & Description</label>
      <input type="text" id="prod-desc" placeholder="e.g. Master React Hooks and deploy a small mock app" value="">
    `,
    buildPrompt: () => {
      const type = document.getElementById('prod-type').value;
      const desc = document.getElementById('prod-desc').value.trim() || 'My study goals';
      return `Act as a productivity coach. Generate a high-yield productivity layout: "${type}" for: "${desc}". Provide actionable tips, time management suggestions, and weekly milestones. Remind me that I can track my academic study goals in the scholastic dashboard on StudentHub.`;
    }
  }
};

function openAssistantModal(toolId) {
  const config = toolFormConfigs[toolId];
  if (!config) return;
  
  activeModalTool = toolId;
  document.getElementById('modal-title').innerText = config.title;
  document.getElementById('modal-content-area').innerHTML = config.render();
  document.getElementById('assistant-modal').classList.remove('hidden');
}

function closeAssistantModal() {
  document.getElementById('assistant-modal').classList.add('hidden');
  activeModalTool = '';
}

// Bind quick actions chips
document.addEventListener('click', (e) => {
  const chip = e.target.closest('.quick-action-chip');
  if (chip) {
    const toolId = chip.getAttribute('data-tool');
    if (toolId) openAssistantModal(toolId);
  }
});

// Modal button listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-close-modal')?.addEventListener('click', closeAssistantModal);
  document.getElementById('btn-modal-cancel')?.addEventListener('click', closeAssistantModal);
  document.getElementById('btn-modal-submit')?.addEventListener('click', () => {
    const config = toolFormConfigs[activeModalTool];
    if (config) {
      const prompt = config.buildPrompt();
      closeAssistantModal();
      
      // Auto-fill textarea and trigger submit
      DOMElements.chatTextarea.value = prompt;
      // Auto resize textarea
      DOMElements.chatTextarea.style.height = 'auto';
      submitUserMessage();
    }
  });
});

// ==========================================
// STUDENT HUB RECOMMENDATION CARD ENGINE
// ==========================================
// Intercept messages on render to insert visual cards pointing back to StudentHub
const originalRenderMarkdown = window.renderMarkdown;
window.renderMarkdown = function(markdownText) {
  let html = originalRenderMarkdown ? originalRenderMarkdown(markdownText) : markdownText;
  
  // Look for keywords and append recommendation chips/cards
  const lower = markdownText.toLowerCase();
  let recommendations = [];
  
  if (lower.includes('mock test') || lower.includes('practice test') || lower.includes('exam preparation')) {
    recommendations.push(`
      <a href="/index.html#dashboard" target="_parent" class="sh-rec-card">
        <div class="sh-rec-icon">📝</div>
        <div class="sh-rec-info">
          <div class="sh-rec-title">Practice Mock Tests</div>
          <div class="sh-rec-desc">Open StudentHub Scholastic Assessment Terminal to take full mock tests.</div>
        </div>
      </a>
    `);
  }
  
  if (lower.includes('college predictor') || lower.includes('suggest colleges') || lower.includes('cutoff') || lower.includes('cut-off')) {
    recommendations.push(`
      <a href="/index.html#dashboard" target="_parent" class="sh-rec-card">
        <div class="sh-rec-icon">🔮</div>
        <div class="sh-rec-info">
          <div class="sh-rec-title">College Predictor</div>
          <div class="sh-rec-desc">Use the StudentHub College Rank Predictor tool to analyze your ranks.</div>
        </div>
      </a>
    `);
  }

  if (lower.includes('dsa') || lower.includes('data structures') || lower.includes('algorithms') || lower.includes('dijkstra')) {
    recommendations.push(`
      <a href="/DSA.html" target="_parent" class="sh-rec-card">
        <div class="sh-rec-icon">💻</div>
        <div class="sh-rec-info">
          <div class="sh-rec-title">DSA Study Guide</div>
          <div class="sh-rec-desc">Open StudentHub Data Structures and Algorithms learning module.</div>
        </div>
      </a>
    `);
  }
  
  if (lower.includes('python')) {
    recommendations.push(`
      <a href="/Python.html" target="_parent" class="sh-rec-card">
        <div class="sh-rec-icon">🐍</div>
        <div class="sh-rec-info">
          <div class="sh-rec-title">Python learning module</div>
          <div class="sh-rec-desc">Open the Python learning course notes and syntax compiler guide.</div>
        </div>
      </a>
    `);
  }

  if (lower.includes('reference') || lower.includes('syllabus') || lower.includes('placement preparation')) {
    recommendations.push(`
      <a href="/reference.html" target="_parent" class="sh-rec-card">
        <div class="sh-rec-icon">📚</div>
        <div class="sh-rec-info">
          <div class="sh-rec-title">References Directory</div>
          <div class="sh-rec-desc">Access GATE subject notes, IT Specialties roadmaps, and Interview guides.</div>
        </div>
      </a>
    `);
  }
  
  if (recommendations.length > 0) {
    html += `
      <div class="sh-recommendations-wrapper">
        <div class="sh-rec-header"><i class="fas fa-graduation-cap"></i> Recommended StudentHub Tools:</div>
        <div class="sh-rec-list">
          ${recommendations.join('')}
        </div>
      </div>
    `;
  }
  
  return html;
};

// CSS styling helper for recommendation cards (inserted dynamically)
(function() {
  const style = document.createElement('style');
  style.textContent = `
    .sh-recommendations-wrapper {
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px dashed var(--border-color);
    }
    .sh-rec-header {
      font-size: 0.78rem;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 10px;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .sh-rec-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .sh-rec-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .sh-rec-card:hover {
      border-color: var(--primary-color);
      background: rgba(20, 184, 166, 0.05);
      transform: translateY(-1.5px);
      box-shadow: 0 4px 12px rgba(20, 184, 166, 0.05);
    }
    .sh-rec-icon {
      font-size: 1.5rem;
    }
    .sh-rec-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .sh-rec-title {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text-body);
    }
    .sh-rec-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  `;
  document.head.appendChild(style);
})();


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

// Resolve backend port or cross-origin URLs dynamically
const API_BASE = window.location.protocol.startsWith('file:') ? 'http://localhost:3008' : '';

// Theme Management
const THEME_KEY = 'siteTheme';
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'default';
  const resolvedTheme = savedTheme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', resolvedTheme);
  updateThemeIcons(resolvedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(THEME_KEY, newTheme === 'light' ? 'light' : 'default');
  updateThemeIcons(newTheme);
}

function updateThemeIcons(theme) {
  const icons = document.querySelectorAll('.theme-icon');
  icons.forEach(icon => {
    if (theme === 'dark') {
      icon.className = 'fas fa-sun theme-icon';
    } else {
      icon.className = 'fas fa-moon theme-icon';
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
  
  landingThemeToggle: document.getElementById('landing-theme-toggle'),
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
  setInterval(checkServerHealth, HEALTH_CHECK_INTERVAL);
  
  // Set up connection event handlers
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus();
});

// Event Listeners Routing
function setupEventListeners() {
  // Theme Switches
  DOMElements.landingThemeToggle.addEventListener('click', toggleTheme);
  DOMElements.btnThemeToggle.addEventListener('click', toggleTheme);
  
  // Screen Router
  DOMElements.btnHeroLaunch.addEventListener('click', switchToChatScreen);
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
    const alignClass = isUser ? 'user' : 'model';
    const avatarIcon = isUser ? '<i class="far fa-user"></i>' : '🎓';
    const senderName = isUser ? 'You' : 'Student Hub AI';
    const formattedText = isUser ? escapeHTML(msg.text) : renderMarkdown(msg.text);
    
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
    const defaultTitle = text || (attachedFiles.length > 0 ? `Analyzed ${attachedFiles[0].name}` : 'New Conversation');
    chat.title = defaultTitle.length > 25 ? defaultTitle.substring(0, 25) + '...' : defaultTitle;
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
    const response = await fetch(API_BASE + '/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: apiHistory,
        stream: true
      }),
      signal: abortController.signal
    });

    DOMElements.aiTypingIndicator.classList.add('hidden');

    if (!response.ok) {
      // Handle server error responses
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error || `Server responded with status ${response.status}`);
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
          <span class="message-sender">Student Hub AI</span>
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
            if (line.includes('error')) {
              throw new Error(dataContent);
            }
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
      
      // Inject friendly error display in bubble
      const textBubble = document.querySelector(`[data-msg-id="${aiMsgId}"] .bubble-content`);
      if (textBubble) {
        textBubble.innerHTML = `<span style="color: #ef4444; font-weight: 500;"><i class="fas fa-exclamation-triangle"></i> Error: ${error.message}</span>`;
        aiMsg.text = `Error: ${error.message}`;
        saveConversations();
      }
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

// Ping Server Health Status
async function checkServerHealth() {
  try {
    const res = await fetch(API_BASE + '/health');
    const data = await res.json();
    if (data.status === 'healthy') {
      updateServerStatus(true, data.geminiConfigured);
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


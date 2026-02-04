// assets/darc.js
// Local-only RAG-style assistant

const STORAGE_KEY = 'darc_messages';

function makeWidget() {
  if(document.getElementById('darcWidget')) return;

  // 1. Create Wrapper
  const wrapper = document.createElement('div');
  wrapper.id = 'darcWidget';
  wrapper.className = 'fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4';

  // 2. Chat Panel (Hidden by default)
  const panel = document.createElement('div');
  panel.id = 'darcPanel';
  panel.className = 'hidden w-80 h-96 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right';
  
  panel.innerHTML = `
    <div class="bg-violet-600 p-4 flex justify-between items-center text-white shadow-md">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
        <span class="font-bold tracking-wide">Darc AI</span>
      </div>
      <button id="darcClose" class="hover:text-white/80 transition transform hover:rotate-90">✕</button>
    </div>
    <div id="darcMessages" class="flex-1 overflow-y-auto p-4 space-y-3 bg-black/20 scrollbar-thin">
      </div>
    <div class="p-3 border-t border-white/10 bg-white/5 flex gap-2">
      <input id="darcInput" type="text" class="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-violet-500 transition" placeholder="Type a command..." autocomplete="off" />
      <button id="darcSend" class="text-violet-400 hover:text-white transition p-2"><i class="fas fa-paper-plane"></i> ➤</button>
    </div>
  `;

  // 3. Floating Toggle Button
  const btn = document.createElement('button');
  btn.id = 'darcToggle';
  btn.className = 'w-14 h-14 bg-gradient-to-br from-violet-600 to-blue-600 rounded-full shadow-lg shadow-violet-500/30 flex items-center justify-center text-white text-xl hover:scale-110 transition border border-white/20';
  btn.innerHTML = '🤖';
  btn.title = "Ask Darc";

  wrapper.appendChild(panel);
  wrapper.appendChild(btn);
  document.body.appendChild(wrapper);

  // --- Logic ---

  // Toggle Open/Close
  const toggleDarc = () => {
    panel.classList.toggle('hidden');
    if(!panel.classList.contains('hidden')) {
      document.getElementById('darcInput').focus();
      scrollToBottom();
    }
  };

  btn.addEventListener('click', toggleDarc);
  document.getElementById('darcClose').addEventListener('click', () => panel.classList.add('hidden'));

  // Send Logic
  const handleSend = () => {
    const input = document.getElementById('darcInput');
    const text = input.value.trim();
    if(!text) return;

    addMessage('user', text);
    input.value = '';

    // Simulate Thinking
    const typingId = showTyping();
    
    setTimeout(() => {
      removeTyping(typingId);
      const response = generateResponse(text);
      addMessage('darc', response);
    }, 600 + Math.random() * 800);
  };

  document.getElementById('darcSend').addEventListener('click', handleSend);
  document.getElementById('darcInput').addEventListener('keydown', (e) => { if(e.key === 'Enter') handleSend(); });

  // Initial Greeting
  if(getMessages().length === 0) {
    addMessage('darc', "Hello! I'm Darc. I can help you navigate the Dashboard. Try asking 'Show my tasks' or 'Go to clients'.");
  } else {
    renderHistory();
  }
}

// --- Helpers ---

function getMessages() {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]'); } catch(e) { return []; }
}

function addMessage(role, text) {
  const msgs = getMessages();
  msgs.push({ role, text, time: Date.now() });
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  renderBubble(role, text);
}

function renderHistory() {
  getMessages().forEach(m => renderBubble(m.role, m.text));
  scrollToBottom();
}

function renderBubble(role, text) {
  const container = document.getElementById('darcMessages');
  const div = document.createElement('div');
  div.className = `flex w-full ${role === 'user' ? 'justify-end' : 'justify-start'}`;
  
  const bubble = document.createElement('div');
  bubble.className = `max-w-[80%] p-3 rounded-xl text-sm ${
    role === 'user' 
      ? 'bg-violet-600 text-white rounded-br-none' 
      : 'bg-white/10 text-gray-200 border border-white/5 rounded-bl-none'
  }`;
  bubble.innerText = text;
  
  div.appendChild(bubble);
  container.appendChild(div);
  scrollToBottom();
}

function scrollToBottom() {
  const c = document.getElementById('darcMessages');
  c.scrollTop = c.scrollHeight;
}

function showTyping() {
  const container = document.getElementById('darcMessages');
  const id = 'typing-' + Date.now();
  const div = document.createElement('div');
  div.id = id;
  div.className = 'flex justify-start w-full';
  div.innerHTML = `<div class="bg-white/5 p-3 rounded-xl rounded-bl-none text-xs text-gray-400 italic">Darc is thinking...</div>`;
  container.appendChild(div);
  scrollToBottom();
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if(el) el.remove();
}

// --- The "Brain" (Intent Parser) ---
function generateResponse(input) {
  const lower = input.toLowerCase();

  // Navigation Intents
  if(lower.includes('task')) {
    window.switchTab('tasks');
    return "I've opened the Tasks OS for you.";
  }
  if(lower.includes('client') || lower.includes('partner')) {
    window.switchTab('clients');
    return "Here is your Partners & Clients directory.";
  }
  if(lower.includes('contact')) {
    window.switchTab('contacts');
    return "Opening the Contact List.";
  }
  if(lower.includes('schedule') || lower.includes('calendar')) {
    window.switchTab('schedule');
    return "Opening your Schedule.";
  }
  if(lower.includes('website') || lower.includes('edit')) {
    window.switchTab('layouts');
    return "Loading the CMS Editor for the main website.";
  }

  // Small Talk
  if(lower.includes('hello') || lower.includes('hi')) return "Greetings! Ready to work?";
  if(lower.includes('status')) return "System is online. All services operational.";
  if(lower.includes('thank')) return "You are welcome. Let's keep moving.";

  // Fallback
  return "I'm not sure about that specific command, but I can help you navigate tabs or track tasks.";
}

// Init
document.addEventListener('DOMContentLoaded', makeWidget);
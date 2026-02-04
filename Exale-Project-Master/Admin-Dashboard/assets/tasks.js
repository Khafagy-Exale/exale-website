import { db, auth } from './firebase-config.js';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let allTasks = [];

document.addEventListener('DOMContentLoaded', () => {
  initTasksListener();
  bindTaskUI();
});

function initTasksListener() {
  const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
  onSnapshot(q, (snap) => {
    allTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    ensureSerials(snap.docs);
    renderTaskList();
  });
}

async function ensureSerials(docs) {
  for(const d of docs) {
    const data = d.data();
    if(!data.serialNumber) {
      const serial = `TSK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
      try {
        await updateDoc(doc(db, 'tasks', d.id), { serialNumber: serial });
      } catch (e) { /* ignore */ }
    }
  }
}

function renderTaskList() {
  const list = document.getElementById('taskList');
  const count = document.getElementById('taskCount');
  list.innerHTML = '';
  if(!allTasks.length) {
    list.innerHTML = '<div class="p-4 text-sm text-[var(--text-sub)]">No tasks.</div>';
    count.innerText = '0';
    document.getElementById('homeTaskCount').innerText = '0';
    return;
  }
  count.innerText = String(allTasks.length);
  document.getElementById('homeTaskCount').innerText = String(allTasks.length);

  allTasks.forEach(t => {
    const item = document.createElement('div');
    item.className = 'p-3 rounded-lg hover:bg-primary/5 cursor-pointer flex items-center justify-between';
    item.innerHTML = `<div><div class="font-bold">${t.title || 'Untitled'}</div><div class="text-xs text-[var(--text-sub)]">${t.company || ''}</div></div><div class="text-xs">${t.priority || 0}</div>`;
    item.addEventListener('click', () => openTaskById(t.id));
    list.appendChild(item);
  });
}

window.openTaskById = (id) => {
  const t = allTasks.find(x => x.id === id);
  if(!t) return;
  // populate detail view
  document.getElementById('noTaskSelected').classList.add('hidden');
  document.getElementById('taskDetailView').classList.remove('hidden');
  document.getElementById('tSerial').innerText = t.serialNumber || 'Generating...';
  document.getElementById('tStatus').innerText = (t.status || 'NEW').toUpperCase();
  document.getElementById('tTitle').innerText = t.title || 'Untitled';
  document.getElementById('tSub').innerText = t.email || t.company || '';
  document.getElementById('tCompany').innerText = t.company || '-';
  document.getElementById('tContact').innerText = (t.email || '') + (t.phone ? '\n'+t.phone : '');
  document.getElementById('tAssignee').innerText = t.assignee || 'Unassigned';
  document.getElementById('tMessage').innerText = t.message || '';

  // Render comments
  const feed = document.getElementById('commentsFeed');
  feed.innerHTML = '';
  (t.comments || []).forEach(c => {
    const div = document.createElement('div');
    div.className = 'p-3 bg-[var(--bg-color)] rounded-lg border border-[var(--border-color)]';
    div.innerHTML = `<div class="flex justify-between items-center mb-1"><span class="font-bold text-sm">${c.author}</span><span class="text-xs text-[var(--text-sub)]">${new Date(c.timestamp).toLocaleString()}</span></div><p class="text-sm">${c.text}</p>`;
    feed.appendChild(div);
  });

  // show workflow actions based on status
  const w = document.getElementById('workflowActions');
  w.innerHTML = '';
  const status = (t.status || 'new');
  const statuses = ['new','inprogress','accepted','rejected'];
  statuses.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'px-4 py-2 rounded-lg text-sm border border-[var(--border-color)] hover:bg-primary/10 transition';
    btn.innerText = s.toUpperCase();
    btn.addEventListener('click', async () => {
      // update status
      try {
        await updateDoc(doc(db, 'tasks', id), { status: s });
      } catch(e) { console.error(e); }
    });
    w.appendChild(btn);
  });

  // Owner/Admin actions
  if(window.currentUserRole === 'owner' || window.currentUserRole === 'admin') {
    document.getElementById('ownerActions').classList.remove('hidden');
  } else {
    document.getElementById('ownerActions').classList.add('hidden');
  }
};

function bindTaskUI() {
  // Send comment
  document.getElementById('sendCommentBtn').addEventListener('click', async () => {
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    if(!text) return;
    const id = getCurrentTaskIdFromUI();
    if(!id) return;
    try {
      await updateDoc(doc(db, 'tasks', id), { comments: arrayUnion({ author: 'You', text: text, timestamp: Date.now() }) });
      input.value = '';
    } catch(e) { console.error(e); }
  });

  // Template clickers
  document.querySelectorAll('.tmpl-item').forEach(b => {
    b.addEventListener('click', () => {
      const text = b.dataset.text || '';
      document.getElementById('commentInput').value = text;
      document.getElementById('templateDropdown').classList.add('hidden');
    });
  });

  // Shortcut button
  document.getElementById('shortcutBtn').addEventListener('click', (e) => {
    const d = document.getElementById('templateDropdown');
    d.classList.toggle('hidden');
  });

  // Delete task (owner/admin only)
  const deleteBtn = document.getElementById('deleteBtn');
  if(deleteBtn) deleteBtn.addEventListener('click', async () => {
    const id = getCurrentTaskIdFromUI();
    if(!id) return;
    if(!confirm('Delete this task? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'tasks', id));
      // hide detail view
      document.getElementById('taskDetailView').classList.add('hidden');
      document.getElementById('noTaskSelected').classList.remove('hidden');
    } catch(e) { console.error(e); }
  });

  // Assign to current user
  const assignBtn = document.getElementById('assignBtn');
  if(assignBtn) assignBtn.addEventListener('click', async () => {
    const id = getCurrentTaskIdFromUI();
    if(!id) return;
    const user = auth.currentUser;
    if(!user) return alert('Please login to assign.');
    try {
      await updateDoc(doc(db, 'tasks', id), { assignee: user.email });
    } catch(e) { console.error(e); }
  });
}

function getCurrentTaskIdFromUI() {
  // We can extract based on the serial or title; for now keep a data attribute when opening
  // This basic implementation will match by title
  const title = document.getElementById('tTitle').innerText;
  const task = allTasks.find(t => (t.title || '') === title);
  return task ? task.id : null;
}

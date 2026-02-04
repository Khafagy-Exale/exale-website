import { db } from './firebase-config.js';
import { collection, getDocs, updateDoc, doc, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

async function loadUsers() {
  const container = document.getElementById('usersContainer');
  container.innerHTML = 'Loading...';

  try {
    const snap = await getDocs(collection(db, 'users'));
    container.innerHTML = '';
    snap.forEach(d => {
      const u = d.data();
      const row = document.createElement('div');
      row.className = 'p-3 bg-[var(--bg-color)] rounded-lg border border-[var(--border-color)] flex items-center justify-between';
      row.innerHTML = `
        <div class="flex-1 min-w-0">
          <div class="font-bold truncate">${u.name || u.email}</div>
          <div class="text-xs text-[var(--text-sub)]">${u.email}</div>
        </div>
        <div class="flex items-center gap-3">
          <select data-uid="${d.id}" class="roleSelect bg-transparent border border-[var(--border-color)] rounded px-2 py-1 text-sm">
            <option value="agent" ${u.role === 'agent' ? 'selected' : ''}>Agent</option>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="owner" ${u.role === 'owner' ? 'selected' : ''}>Owner</option>
          </select>
        </div>
      `;
      container.appendChild(row);
    });

    // Wire changes
    container.querySelectorAll('.roleSelect').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const uid = e.target.dataset.uid;
        const newRole = e.target.value;
        // Only owner allowed to change roles - client check; rules enforce server-side
        if(window.currentUserRole !== 'owner') {
          alert('Only Owner can change roles.');
          // Revert UI by reloading users list
          loadUsers();
          return;
        }
        try {
          await updateDoc(doc(db, 'users', uid), { role: newRole });
          alert('Role updated');
          loadUsers();
        } catch(e) { console.error(e); alert('Failed to update role'); loadUsers(); }
      });
    });

    // Show Seed Users button only to owner and wire it
    const seedBtn = document.getElementById('seedUsersBtn');
    if(seedBtn) {
      seedBtn.style.display = (window.currentUserRole === 'owner') ? 'inline-block' : 'none';
      seedBtn.addEventListener('click', async () => {
        if(window.currentUserRole !== 'owner') { alert('Only Owner can seed users.'); return; }
        seedBtn.innerText = 'Seeding...';
        try {
          const demo = [
            { name: 'Alice Owner', email: 'alice@exale.net', role: 'owner' },
            { name: 'Bob Admin', email: 'bob@exale.net', role: 'admin' },
            { name: 'Cathy Agent', email: 'cathy@exale.net', role: 'agent' }
          ];
          for(const u of demo) { await addDoc(collection(db, 'users'), { ...u, createdAt: Date.now() }); }
          alert('Seeded users');
          loadUsers();
        } catch (err) {
          console.error(err); alert('Failed to seed users');
        } finally { seedBtn.innerText = 'Seed Users'; }
      });
    }
  } catch (e) { console.error(e); container.innerHTML = 'Failed to load users.'; }
}

// Form handlers + init
document.addEventListener('DOMContentLoaded', () => {
  loadUsers();

  const form = document.getElementById('createUserForm');
  if(form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if(window.currentUserRole !== 'owner') { alert('Only Owner can create users'); return; }
      const name = document.getElementById('createName').value.trim();
      const email = document.getElementById('createEmail').value.trim();
      const role = document.getElementById('createRole').value;
      if(!name || !email) { alert('Name and email required'); return; }
      const btn = document.getElementById('createUserBtn');
      btn.disabled = true; btn.innerText = 'Creating...';
      try {
        await addDoc(collection(db, 'users'), { name, email, role, createdAt: Date.now() });
        alert('User created in Firestore (note: Auth account not created).');
        form.reset();
        loadUsers();
      } catch (err) { console.error(err); alert('Failed to create user'); } finally { btn.disabled = false; btn.innerText = 'Create'; }
    });
  }
});

export { loadUsers };
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Sidebar behaviors: profile, activity, priority list, menu toggles & tab switching

document.addEventListener('DOMContentLoaded', () => initSidebar());

function initSidebar() {
  // Auth -> populate sidebar info
  onAuthStateChanged(auth, (user) => {
    const nameEl = document.getElementById('sidebarName');
    const emailEl = document.getElementById('sidebarEmail');
    const avatarEl = document.getElementById('sidebarAvatar');

    if(user) {
      nameEl.innerText = user.displayName || user.email.split('@')[0];
      emailEl.innerText = user.email;
      if(user.photoURL) avatarEl.style.backgroundImage = `url(${user.photoURL})`;

      // Fetch role from Firestore users collection and expose globally
      (async () => {
        try {
          const uDoc = await getDoc(doc(db, 'users', user.uid));
          const role = (uDoc.exists() && uDoc.data().role) ? uDoc.data().role : 'agent';
          window.currentUserRole = role;

          const rb = document.getElementById('roleBadge');
          if(rb) rb.innerText = role.charAt(0).toUpperCase() + role.slice(1);

          // Show seed data button only to owner/admin
          const seed = document.getElementById('seedDataBtn');
          if(seed && (role === 'owner' || role === 'admin')) seed.classList.remove('hidden');

          // Show seed users button only to owner
          const seedUsers = document.getElementById('seedUsersBtn');
          if(seedUsers && role === 'owner') seedUsers.classList.remove('hidden');

          // Notify other modules that role is ready
          if (window.onRoleReady) window.onRoleReady(role);
        } catch (err) {
          console.warn('Could not fetch user role', err);
          window.currentUserRole = 'agent';
        }
      })();

    } else {
      nameEl.innerText = 'Guest';
      emailEl.innerText = 'guest@exale.local';
      window.currentUserRole = 'guest';
    }
  });

  // Status select
  const statusSelect = document.getElementById('statusSelect');
  statusSelect.addEventListener('change', async (e) => {
    const val = e.target.value;
    // Save to localStorage as immediate feedback
    localStorage.setItem('exale:activity', val);

    // If user is logged in, persist to Firestore user doc
    const user = auth.currentUser;
    if (user) {
      try {
        const uDoc = doc(db, 'users', user.uid);
        await updateDoc(uDoc, { activity: val });
      } catch (err) {
        // If user doc doesn't exist, ignore for now
        console.warn('Could not update user activity:', err.message);
      }
    }
  });

  // Hook up menu toggles and tab switching helpers
  window.toggleMenu = (id) => {
    const el = document.getElementById(id);
    if(!el) return;
    el.classList.toggle('hidden');
  };

  window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const show = document.getElementById('tab-' + tabId) || document.getElementById('tab-' + tabId.toLowerCase());
    if(show) show.classList.remove('hidden');
    // Update pageTitle lightly
    const title = ({home: 'Overview', tasks: 'Tasks OS', schedule: 'Schedule', updates:'Updates'})[tabId] || document.getElementById('pageTitle').innerText;
    if(title) document.getElementById('pageTitle').innerText = title;
  };

  // Top priority tasks listener
  const q = query(collection(db, 'tasks'), orderBy('priority', 'desc'), limit(3));
  onSnapshot(q, (snap) => {
    const list = document.getElementById('sidebarPriorityList');
    list.innerHTML = '';
    if(snap.empty) {
      list.innerHTML = '<div class="text-xs text-[var(--text-sub)] italic">No priority tasks.</div>';
      return;
    }
    snap.docs.forEach(d => {
      const data = { id: d.id, ...d.data() };
      const item = document.createElement('button');
      item.className = 'w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 transition text-sm flex items-center justify-between';
      item.innerHTML = `<span>${data.title || 'Untitled'}</span><span class="text-xs px-2 py-0.5 rounded bg-white/5">${data.priority || 0}</span>`;
      item.addEventListener('click', () => {
        // Delegate to global openTaskById if available
        if(window.openTaskById) window.openTaskById(data.id);
      });
      list.appendChild(item);
    });
  });

  // Wire Profile click - already an <a href> in markup; set to open profile
  const profile = document.querySelector('a[href="profile.html"]');
  if (profile) profile.addEventListener('click', () => { /* leave link behaviour */ });

  // Logout handling (there are two logout buttons possibly)
  document.querySelectorAll('#logoutBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        window.location.href = 'index.html';
      } catch (e) { console.error('Sign out failed', e); }
    });
  });

  // Theme toggle binding if present
  const themeBtn = document.getElementById('themeToggleBtn');
  if(themeBtn) themeBtn.addEventListener('click', () => {
    const html = document.documentElement;
    if(html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('exale:theme','light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('exale:theme','dark');
    }
  });
}

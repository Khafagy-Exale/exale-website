// Schedule module - integrates FullCalendar and Firestore

import { db } from './firebase-config.js';
import { collection, query, onSnapshot, addDoc, updateDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Load FullCalendar assets dynamically (CSS and script)
function loadFullCalendar() {
  return new Promise((resolve, reject) => {
    if(window.FullCalendar) return resolve(window.FullCalendar);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/main.min.css';
    document.head.appendChild(link);

    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/main.global.min.js';
    s.onload = () => resolve(window.FullCalendar);
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

async function initCalendar() {
  const FullCalendar = await loadFullCalendar();
  const calendarEl = document.getElementById('calendar');
  if(!calendarEl) return;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    selectable: true,
    editable: true,
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek,dayGridDay' },
    eventDisplay: 'block',

    dateClick: async (info) => {
      const title = prompt('Event title:');
      if(!title) return;
      const isDeadline = confirm('Mark as deadline (immutable)? Click OK for yes.');
      // Only allow marking deadlines if user is owner/admin - client will still be blocked by rules
      if(isDeadline && !(window.currentUserRole === 'owner' || window.currentUserRole === 'admin')) {
        alert('Only Owners/Admins can create protected deadlines.');
        return;
      }
      const ev = { title, start: info.dateStr, end: info.dateStr, isDeadline: isDeadline || false, ownerId: (window.currentUser && window.currentUser.uid) || null };
      try { await addDoc(collection(db, 'schedules'), ev); } catch(e) { console.error(e); alert('Failed to create event'); }
    },

    eventDrop: async (info) => {
      // Don't allow moving deadlines unless owner/admin
      const ev = info.event.extendedProps;
      if(ev && ev.isDeadline && !(window.currentUserRole === 'owner' || window.currentUserRole === 'admin')) {
        info.revert();
        alert('This is a deadline and cannot be moved.');
        return;
      }
      // Update Firestore
      try { await updateDoc(doc(db, 'schedules', info.event.id), { start: info.event.startStr, end: info.event.endStr || info.event.startStr }); } catch(e) { console.error(e); }
    },

    eventResize: async (info) => {
      const ev = info.event.extendedProps;
      if(ev && ev.isDeadline && !(window.currentUserRole === 'owner' || window.currentUserRole === 'admin')) {
        info.revert();
        alert('Deadlines cannot be resized.');
        return;
      }
      try { await updateDoc(doc(db, 'schedules', info.event.id), { end: info.event.endStr }); } catch(e) { console.error(e); }
    },

    eventClick: (info) => {
      const e = info.event;
      const immutable = e.extendedProps && e.extendedProps.isDeadline;
      const canEdit = !immutable || (window.currentUserRole === 'owner' || window.currentUserRole === 'admin');
      if(!canEdit) {
        alert('This event is a protected deadline and cannot be edited.');
        return;
      }
      const newTitle = prompt('Edit title:', e.title);
      if(newTitle !== null) {
        e.setProp('title', newTitle);
        updateDoc(doc(db, 'schedules', e.id), { title: newTitle }).catch(console.error);
      }
    }
  });

  calendar.render();

  // Firestore listener with scope filtering
  const q = query(collection(db, 'schedules'));
  let latestDocs = [];

  function renderFromDocs() {
    const scope = (document.getElementById('calendarScope') || {}).value || 'mine';
    const uid = (window.currentUser && window.currentUser.uid) || null;
    const events = latestDocs
      .map(d => ({ id: d.id, title: d.data().title, start: d.data().start, end: d.data().end || d.data().start, extendedProps: { isDeadline: d.data().isDeadline, ownerId: d.data().ownerId } }))
      .filter(ev => {
        if(scope === 'all') return true;
        if(!uid) return false;
        return ev.extendedProps.ownerId === uid;
      });

    calendar.getEvents().forEach(ev => ev.remove());
    events.forEach(ev => calendar.addEvent(ev));
  }

  onSnapshot(q, (snap) => {
    latestDocs = snap.docs;
    renderFromDocs();
  });

  // Scope selector
  const scopeSel = document.getElementById('calendarScope');
  if(scopeSel) scopeSel.addEventListener('change', () => renderFromDocs());

  // Allow other modules to notify when auth/role is ready
  window.onRoleReady = (role) => {
    // Re-render events when role/user readiness changes
    renderFromDocs();
  };
}

// Initialize on DOM
document.addEventListener('DOMContentLoaded', async () => {
  initCalendar().catch(err => console.error('Calendar failed to load', err));
});

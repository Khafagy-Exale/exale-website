import { db } from './firebase-config.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

async function seedDemoData() {
  const samples = [
    { title: 'Fix landing hero contrast', company: 'Exale', email: 'client1@example.com', message: 'Adjust hero overlay and CTA colors', priority: 90, status: 'new', createdAt: Date.now(), comments: [] },
    { title: 'Integrate payment provider', company: 'ShopCo', email: 'pm@shopco.com', message: 'Add Stripe integration to checkout', priority: 80, status: 'inprogress', createdAt: Date.now(), comments: [] },
    { title: 'Audit security rules', company: 'Internal', email: 'sec@exale.net', message: 'Review Firestore rules and auth flows', priority: 95, status: 'new', createdAt: Date.now(), comments: [] },
    { title: 'Design partner page', company: 'Foundry', email: 'hello@foundry.co', message: 'Create partners listing and modal details', priority: 70, status: 'accepted', createdAt: Date.now(), comments: [] },
    { title: 'Mobile nav accessibility', company: 'Exale', email: 'ux@exale.net', message: 'Add escape-close and aria attributes', priority: 85, status: 'inprogress', createdAt: Date.now(), comments: [] }
  ];

  try {
    for(const s of samples) {
      await addDoc(collection(db, 'tasks'), s);
    }
    alert('Seeded demo tasks.');
  } catch (e) {
    console.error('Seed failed', e);
    alert('Seed failed: ' + e.message);
  }
}

// Attach to button if present
if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('seedDataBtn');
    if(btn) btn.addEventListener('click', seedDemoData);
  });
} else {
  const btn = document.getElementById('seedDataBtn');
  if(btn) btn.addEventListener('click', seedDemoData);
}

export { seedDemoData };
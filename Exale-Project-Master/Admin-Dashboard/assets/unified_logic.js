import { db, auth } from './firebase-config.js';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc, getDocs, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { updatePassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- 1. CLIENTS MODULE (Partners Tab) ---
export function initClientsModule() {
    const grid = document.getElementById('clientGrid');
    if (!grid) return;

    // Real-time Listener
    const q = query(collection(db, "clients"), orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snapshot) => {
        grid.innerHTML = '';
        if(snapshot.empty) {
            grid.innerHTML = '<div class="col-span-full text-center py-20 text-[var(--text-sub)]">No active partners found.</div>';
            return;
        }
        
        snapshot.forEach(d => {
            const data = d.data();
            const card = document.createElement('div');
            card.className = "glass-panel p-5 rounded-xl border border-[var(--border-color)] hover:border-primary/50 transition cursor-pointer group relative";
            card.innerHTML = `
                <div class="flex items-center gap-4 mb-3">
                    <div class="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                        ${data.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 class="font-bold group-hover:text-primary transition">${data.name}</h3>
                        <p class="text-xs text-[var(--text-sub)]">${data.industry || 'Partner'}</p>
                    </div>
                </div>
                <div class="text-xs text-[var(--text-sub)] space-y-1">
                    <p>📧 ${data.email}</p>
                    <p>📅 Added: ${data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleDateString() : 'Just now'}</p>
                </div>
                <button class="delete-client-btn absolute top-3 right-3 text-red-400 opacity-0 group-hover:opacity-100 transition" data-id="${d.id}">✕</button>
            `;
            
            // Delete Logic
            card.querySelector('.delete-client-btn').addEventListener('click', async (e) => {
                e.stopPropagation();
                if(confirm('Remove this partner?')) await deleteDoc(doc(db, "clients", d.id));
            });

            grid.appendChild(card);
        });
    });

    // Add Client Logic
    const saveBtn = document.getElementById('saveClientBtn');
    if(saveBtn) {
        // Remove old listeners to prevent duplicates if function is called twice
        const newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);
        
        newBtn.addEventListener('click', async () => {
            const name = document.getElementById('cName').value;
            const email = document.getElementById('cEmail').value;
            const industry = document.getElementById('cIndustry').value;

            if(!name || !email) return alert("Company Name and Email are required.");

            newBtn.innerText = "...";
            try {
                await addDoc(collection(db, "clients"), {
                    name, email, industry, timestamp: serverTimestamp()
                });
                // Reset Form
                document.getElementById('cName').value = '';
                document.getElementById('cEmail').value = '';
                document.getElementById('cIndustry').value = '';
                document.getElementById('addClientModal').classList.add('hidden');
            } catch(e) {
                console.error(e);
                alert("Error saving client: " + e.message);
            }
            newBtn.innerText = "Save";
        });
    }
}

// --- 2. CONTACTS MODULE (Contact List Tab) ---
export function initContactsModule() {
    const grid = document.getElementById('contactGrid');
    if (!grid) return;

    const q = query(collection(db, "internal_contacts"), orderBy("timestamp", "desc"));

    onSnapshot(q, (snapshot) => {
        grid.innerHTML = '';
        if(snapshot.empty) {
            grid.innerHTML = '<div class="col-span-full text-center py-20 text-[var(--text-sub)]">No contacts added.</div>';
            return;
        }

        snapshot.forEach(d => {
            const data = d.data();
            const card = document.createElement('div');
            card.className = "glass-panel p-5 rounded-xl border border-[var(--border-color)] relative group hover:bg-[var(--bg-color)] transition";
            card.innerHTML = `
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                        ${data.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 class="font-bold text-sm">${data.name}</h3>
                        <span class="text-[10px] bg-white/10 px-2 py-0.5 rounded text-[var(--text-sub)] border border-[var(--border-color)]">${data.tag || 'Contact'}</span>
                    </div>
                </div>
                <div class="text-xs text-[var(--text-sub)] space-y-1">
                    <p class="select-all cursor-text hover:text-primary transition">📞 ${data.phone || 'N/A'}</p>
                    <p class="select-all cursor-text hover:text-primary transition">✉️ ${data.email || 'N/A'}</p>
                </div>
                <button class="delete-contact-btn absolute top-3 right-3 text-red-400 opacity-0 group-hover:opacity-100 transition" data-id="${d.id}">✕</button>
            `;

            // Delete Logic
            card.querySelector('.delete-contact-btn').addEventListener('click', async (e) => {
                if(confirm('Delete this contact?')) await deleteDoc(doc(db, "internal_contacts", d.id));
            });

            grid.appendChild(card);
        });
    });

    // Add Contact Logic
    const saveBtn = document.getElementById('saveContactBtn');
    if(saveBtn) {
        const newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);

        newBtn.addEventListener('click', async () => {
            const name = document.getElementById('coName').value;
            const phone = document.getElementById('coPhone').value;
            const email = document.getElementById('coEmail').value;
            const tag = document.getElementById('coTag').value;
            
            if(!name) return alert("Name is required.");

            newBtn.innerText = "...";
            try {
                await addDoc(collection(db, "internal_contacts"), {
                    name, phone, email, tag, timestamp: serverTimestamp()
                });
                document.getElementById('coName').value = '';
                document.getElementById('coPhone').value = '';
                document.getElementById('coEmail').value = '';
                document.getElementById('addContactModal').classList.add('hidden');
            } catch(e) {
                console.error(e);
                alert("Error saving contact.");
            }
            newBtn.innerText = "Save";
        });
    }
}

// --- 3. PROFILE MODULE (Settings Tab) ---
export function initProfileModule() {
    // Password Update
    const passBtn = document.getElementById('passBtn');
    if(passBtn) {
        const newPassBtn = passBtn.cloneNode(true);
        passBtn.parentNode.replaceChild(newPassBtn, passBtn);

        newPassBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const newPass = document.getElementById('newPass').value;
            if(newPass.length < 6) return alert("Password must be at least 6 characters.");
            
            newPassBtn.innerText = "Updating...";
            try {
                await updatePassword(auth.currentUser, newPass);
                alert("Password updated successfully!");
                document.getElementById('newPass').value = '';
            } catch(e) {
                alert("Error: " + e.message + " (Try logging out and back in if this persists).");
            }
            newPassBtn.innerText = "Update Password";
        });
    }

    // Profile Details Update
    const saveBtn = document.getElementById('saveProfileBtn');
    if(saveBtn) {
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

        newSaveBtn.addEventListener('click', async () => {
            newSaveBtn.innerText = "Saving...";
            try {
                // Find employee doc by email to update
                const q = query(collection(db, "employees"), where("email", "==", auth.currentUser.email));
                const snap = await getDocs(q);
                
                if(!snap.empty) {
                    const docId = snap.docs[0].id;
                    await updateDoc(doc(db, "employees", docId), {
                        nickname: document.getElementById('pNick').value,
                        bio: document.getElementById('pBio').value,
                        photoURL: document.getElementById('pPhoto').value
                    });
                    
                    // Show Toast
                    const toast = document.getElementById('saveToast');
                    toast.classList.remove('hidden');
                    setTimeout(() => toast.classList.add('hidden'), 3000);
                } else {
                    alert("Could not find your employee record. Contact Admin.");
                }
            } catch(e) { 
                console.error(e); 
                alert("Error updating profile."); 
            }
            newSaveBtn.innerText = "Save Profile";
        });
    }
}
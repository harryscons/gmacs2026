// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4ZBIjmz_kBUjJ8JBT9QUa5l1JV5hs2rA",
  authDomain: "gmacs2026.firebaseapp.com",
  projectId: "gmacs2026",
  databaseURL: "https://gmacs2026-default-rtdb.firebaseio.com", 
  storageBucket: "gmacs2026.firebasestorage.app",
  messagingSenderId: "517340210442",
  appId: "1:517340210442:web:ad6e31939fc516f0a3c6f3",
  measurementId: "G-5JPDE6L93P"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// State (Synced with Firebase)
let EVENTS_LIST = [];
let MAX_EVENTS = 4;
let PRICE_FIRST = 10;
let PRICE_ADDITIONAL = 5;
let users = {};
let entries = [];
let currentUser = localStorage.getItem('race_user') || null;
let sessionEntries = []; // Temporary entries for the current session
let editingEntryId = null;

// DOM Elements
const loginView = document.getElementById('login-view');
const authLanding = document.getElementById('auth-landing');
const authLogin = document.getElementById('auth-login');
const authRegister = document.getElementById('auth-register');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const profileForm = document.getElementById('profile-form');

const showLoginBtn = document.getElementById('show-login-btn');
const showRegisterBtn = document.getElementById('show-register-btn');
const backBtns = document.querySelectorAll('.back-to-landing');

const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

const regUsernameInput = document.getElementById('reg-username');
const regPasswordInput = document.getElementById('reg-password');
const regFirstNameInput = document.getElementById('reg-first-name');
const regLastNameInput = document.getElementById('reg-last-name');
const regBirthDateInput = document.getElementById('reg-birth-date');
const regPhoneInput = document.getElementById('reg-phone');
const regEmailInput = document.getElementById('reg-email');
const regGenderInput = document.getElementById('reg-gender');

const firstNameInput = document.getElementById('first-name');
const lastNameInput = document.getElementById('last-name');
const birthDateInput = document.getElementById('birth-date');
const phoneInput = document.getElementById('profile-phone');
const emailInput = document.getElementById('profile-email');
const genderInput = document.getElementById('gender');

const dashboardView = document.getElementById('dashboard-view');
const welcomeName = document.getElementById('welcome-name');
const paymentCodeDisplay = document.getElementById('payment-code-display');
const exportBtn = document.getElementById('export-btn');
const logoutBtn = document.getElementById('logout-btn');
const emptyState = document.getElementById('empty-state');
const tableWrapper = document.getElementById('table-wrapper');
const entriesTbody = document.getElementById('entries-tbody');

// Admin View Elements
const adminView = document.getElementById('admin-view');
const adminEntriesTbody = document.getElementById('admin-entries-tbody');
const adminUsersTbody = document.getElementById('admin-users-tbody');
const adminExportBtn = document.getElementById('admin-export-btn');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const adminMaxEventsInput = document.getElementById('admin-max-events');
const adminNewEventInput = document.getElementById('admin-new-event-name');
const adminAddEventBtn = document.getElementById('admin-add-event-btn');
const adminEventsList = document.getElementById('admin-events-list');
const adminPriceFirstInput = document.getElementById('admin-price-first');
const adminPriceAdditionalInput = document.getElementById('admin-price-additional');
const totalCostDisplay = document.getElementById('total-cost-display');

// Modal Elements
const modalOverlay = document.getElementById('modal-overlay');
const eventSelect = document.getElementById('event-select');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelModalBtn = document.getElementById('cancel-modal-btn');
const saveModalBtn = document.getElementById('save-modal-btn');
const addEntryBtn = document.getElementById('add-entry-btn');
const modalTitle = document.getElementById('modal-title');
const disclaimerCheckbox = document.getElementById('disclaimer-checkbox');

// New Modal Elements
const finalSaveContainer = document.getElementById('final-save-container');
const globalSaveBtn = document.getElementById('global-save-btn');
const disclaimerModal = document.getElementById('disclaimer-modal');
const finalConfirmBtn = document.getElementById('final-confirm-btn');
const cancelDisclaimerBtn = document.getElementById('cancel-disclaimer-btn');
const closeDisclaimerBtn = document.getElementById('close-disclaimer-btn');

// Admin User Modal Elements
const adminUserModal = document.getElementById('admin-user-modal');
const adminUserForm = document.getElementById('admin-user-form');
const adminEditUsername = document.getElementById('admin-edit-username');
const adminEditFirstName = document.getElementById('admin-edit-first-name');
const adminEditLastName = document.getElementById('admin-edit-last-name');
const adminEditBirthDate = document.getElementById('admin-edit-birth-date');
const adminEditPhone = document.getElementById('admin-edit-phone');
const adminEditEmail = document.getElementById('admin-edit-email');
const adminEditGender = document.getElementById('admin-edit-gender');
const saveUserModalBtn = document.getElementById('save-user-modal-btn');
const closeUserModalBtn = document.getElementById('close-user-modal-btn');
const cancelUserModalBtn = document.getElementById('cancel-user-modal-btn');

// Initialize
function init() {
    // Force Check/Create Admin on start
    db.ref('users/admin').get().then((snapshot) => {
        if (!snapshot.exists()) {
            db.ref('users/admin').set({
                password: 'admin',
                role: 'admin',
                firstName: 'System',
                lastName: 'Administrator',
                paymentCode: 'ADMIN-001'
            }).then(() => console.log("Admin account created successfully."));
        }
    });

    // Listen for Settings
    db.ref('settings').on('value', (snapshot) => {
        const settings = snapshot.val() || {};
        MAX_EVENTS = settings.maxEvents || 4;
        PRICE_FIRST = settings.priceFirst || 10;
        PRICE_ADDITIONAL = settings.priceAdditional || 5;
        
        if (settings.events) {
            EVENTS_LIST = settings.events;
        } else {
            // Upload default events if database is empty
            const defaultEvents = [
                "100μ", "200μ", "400μ", "800μ", "1500μ", "5000μ",
                "110μ Εμπόδια", "400μ Εμπόδια", "5000μ Βάδην", "Ακόντιο", 
                "Δίσκος", "Επί κοντώ", "Μήκος", "Σφαίρα", 
                "Σφύρα", "Τριπλούν", "Ύψος", "4x100", "4x400"
            ];
            db.ref('settings').update({
                events: defaultEvents,
                maxEvents: 4,
                priceFirst: 10,
                priceAdditional: 5
            });
            EVENTS_LIST = defaultEvents;
        }
        
        refreshEventSelect();
        if (currentUser === 'admin') renderAdminEventsList();
    }, (error) => {
        console.error("Firebase Settings Error:", error);
        alert("Σφάλμα σύνδεσης (Settings): " + error.message);
    });

    // Listen for Users
    db.ref('users').on('value', (snapshot) => {
        users = snapshot.val() || {};
        
        // Setup initial admin if not exists
        if (!users['admin']) {
            db.ref('users/admin').set({
                password: 'admin',
                role: 'admin',
                firstName: 'System',
                lastName: 'Administrator'
            });
        }

        if (currentUser === 'admin') renderAdminDashboard();
    }, (error) => {
        console.error("Firebase Users Error:", error);
        alert("Σφάλμα σύνδεσης (Users): " + error.message);
    });

    // Listen for Entries
    db.ref('entries').on('value', (snapshot) => {
        const data = snapshot.val() || {};
        entries = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        
        if (currentUser) {
            if (currentUser === 'admin') {
                renderAdminDashboard();
            } else {
                // If not finalized yet, sessionEntries might be different
                // But typically on load we show what's in DB
                sessionEntries = entries.filter(e => e.athleteName === currentUser).map(e => ({...e}));
                renderEntries();
            }
        }
    });

    if (currentUser) {
        authLanding.classList.add('hidden');
        if (currentUser === 'admin') {
            adminView.classList.add('active');
        } else {
            dashboardView.classList.add('active');
            const u = users[currentUser];
            if (u) {
                firstNameInput.value = u.firstName || '';
                lastNameInput.value = u.lastName || '';
                birthDateInput.value = u.birthDate || '';
                phoneInput.value = u.phone || '';
                emailInput.value = u.email || '';
                genderInput.value = u.gender || '';
            }
        }
    } else {
        authLanding.classList.remove('hidden');
    }
}

// Authentication
function generatePaymentCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let code = '';
    for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
    for (let i = 0; i < 3; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    return code;
}

async function login(name, password) {
    // If users are not loaded yet, try to fetch this specific user directly from Firebase
    let userObj = users[name];
    
    if (!userObj) {
        const snapshot = await db.ref('users/' + name).once('value');
        userObj = snapshot.val();
    }
    
    if (userObj) {
        if (userObj.password !== password) {
            alert('Λάθος κωδικός πρόσβασης.');
            return false;
        }
        
        currentUser = name;
        localStorage.setItem('race_user', name);
        
        const userData = users[currentUser];
        
        if (userData.role === 'admin') {
            loginView.classList.remove('active');
            adminView.classList.add('active');
            renderAdminDashboard();
        } else {
            welcomeName.textContent = userData.firstName + ' ' + userData.lastName;
            paymentCodeDisplay.textContent = userData.paymentCode;
            
            loginView.classList.remove('active');
            dashboardView.classList.add('active');
            
            // Populate profile form in dashboard
            firstNameInput.value = userData.firstName || '';
            lastNameInput.value = userData.lastName || '';
            birthDateInput.value = userData.birthDate || '';
            phoneInput.value = userData.phone || '';
            emailInput.value = userData.email || '';
            genderInput.value = userData.gender || '';

            // Load session entries (draft)
            sessionEntries = entries.filter(e => e.athleteName === name).map(e => ({...e}));
            
            renderEntries();
        }
        return true;
    } else {
        alert('Ο χρήστης δεν βρέθηκε. Παρακαλώ εγγραφείτε.');
        return false;
    }
}

async function register(username, password, firstName, lastName, birthDate, phone, email, gender) {
    console.log("Attempting to register:", username);
    if (!username || !password || !firstName || !lastName || !birthDate || !phone || !email || !gender) {
        alert('Παρακαλώ συμπληρώστε όλα τα πεδία.');
        return false;
    }
    if (users[username]) {
        alert('Το όνομα χρήστη υπάρχει ήδη.');
        return false;
    }

    const newUser = {
        password: password,
        paymentCode: generatePaymentCode(),
        firstName: firstName,
        lastName: lastName,
        birthDate: birthDate,
        phone: phone,
        email: email,
        gender: gender,
        role: 'athlete'
    };

    return db.ref('users/' + username).set(newUser).then(() => {
        alert('Η εγγραφή ολοκληρώθηκε! Παρακαλώ συνδεθείτε.');
        authRegister.classList.add('hidden');
        authLanding.classList.remove('hidden');
        return true;
    }).catch(error => {
        alert('Σφάλμα κατά την εγγραφή: ' + error.message);
        return false;
    });
}

function saveProfile(firstName, lastName, birthDate, phone, email, gender) {
    if (!currentUser) return;
    
    const updates = {
        firstName,
        lastName,
        birthDate,
        phone,
        email,
        gender
    };

    db.ref('users/' + currentUser).update(updates).then(() => {
        alert('Τα στοιχεία αποθηκεύτηκαν επιτυχώς!');
    }).catch(error => {
        alert('Σφάλμα κατά την αποθήκευση: ' + error.message);
    });
}

function logout() {
    currentUser = null;
    localStorage.removeItem('race_user');
    
    dashboardView.classList.remove('active');
    adminView.classList.remove('active');
    loginView.classList.add('active');
    
    // Reset to landing screen
    authLogin.classList.add('hidden');
    authRegister.classList.add('hidden');
    authLanding.classList.remove('hidden');
    
    usernameInput.value = '';
    passwordInput.value = '';
    firstNameInput.value = '';
    lastNameInput.value = '';
    birthDateInput.value = '';
    genderInput.value = '';
}

// Entries Management
function getMyEntries() {
    return sessionEntries;
}

function openDisclaimerModal() {
    disclaimerModal.classList.remove('hidden');
    disclaimerCheckbox.checked = false;
    finalConfirmBtn.disabled = true;
    finalConfirmBtn.style.opacity = '0.5';
    finalConfirmBtn.style.cursor = 'not-allowed';
}

function closeDisclaimerModal() {
    disclaimerModal.classList.add('hidden');
}

function finalizeSubmission() {
    if (!disclaimerCheckbox.checked) {
        alert('Πρέπει να αποδεχτείτε την Υπεύθυνη Δήλωση για να ολοκληρώσετε την υποβολή.');
        return;
    }
    
    // 1. Find and delete existing entries for this user
    const existingUserEntryIds = entries
        .filter(e => e.athleteName === currentUser)
        .map(e => e.id);

    const deletePromises = existingUserEntryIds.map(id => db.ref('entries/' + id).remove());

    Promise.all(deletePromises).then(() => {
        // 2. Add new session entries
        const addPromises = sessionEntries.map(entry => {
            const { id, ...data } = entry; // Remove local id to let Firebase generate one or keep it
            return db.ref('entries').push(data);
        });

        return Promise.all(addPromises);
    }).then(() => {
        alert('Η εγγραφή σας ολοκληρώθηκε και αποθηκεύτηκε επιτυχώς!');
        closeDisclaimerModal();
    }).catch(error => {
        alert('Σφάλμα κατά την αποθήκευση: ' + error.message);
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(amount);
}

function calculateTotalCost(count) {
    if (count === 0) return 0;
    return PRICE_FIRST + (count - 1) * PRICE_ADDITIONAL;
}

function renderEntries() {
    const myEntries = getMyEntries();
    
    // Update Total Cost display
    if (totalCostDisplay) {
        totalCostDisplay.textContent = formatCurrency(calculateTotalCost(myEntries.length));
    }

    if (myEntries.length === 0) {
        emptyState.classList.remove('hidden');
        tableWrapper.classList.add('hidden');
        finalSaveContainer.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        tableWrapper.classList.remove('hidden');
        finalSaveContainer.classList.remove('hidden');
        
        entriesTbody.innerHTML = '';
        myEntries.forEach((entry, index) => {
            const tr = document.createElement('tr');
            
            const countTd = document.createElement('td');
            countTd.style.fontWeight = 'bold';
            countTd.style.color = 'var(--text-light)';
            countTd.textContent = index + 1;
            
            const nameTd = document.createElement('td');
            nameTd.className = 'event-name-cell';
            nameTd.textContent = entry.eventName;
            
            const dateTd = document.createElement('td');
            dateTd.textContent = new Date(entry.createdAt).toLocaleDateString();
            
            const actionsTd = document.createElement('td');
            actionsTd.className = 'actions-cell';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'icon-button';
            editBtn.innerHTML = '<i data-feather="edit-2"></i>';
            editBtn.onclick = () => openModal(entry);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'icon-button danger';
            deleteBtn.innerHTML = '<i data-feather="trash-2"></i>';
            deleteBtn.onclick = () => deleteEntry(entry.id);
            
            actionsTd.appendChild(editBtn);
            actionsTd.appendChild(deleteBtn);
            
            tr.appendChild(countTd);
            tr.appendChild(nameTd);
            tr.appendChild(dateTd);
            tr.appendChild(actionsTd);
            
            entriesTbody.appendChild(tr);
        });
        
        feather.replace();
    }
}

function renderAdminDashboard() {
    adminEntriesTbody.innerHTML = '';
    adminUsersTbody.innerHTML = '';
    
    // Render Entries
    entries.forEach((entry, index) => {
        const tr = document.createElement('tr');
        const userData = users[entry.athleteName];
        const fullName = userData ? (userData.firstName + ' ' + userData.lastName) : entry.athleteName;

        tr.innerHTML = `
            <td style="font-weight: bold; color: var(--text-light);">${index + 1}</td>
            <td>
                <div style="font-weight: 600; color: var(--text);">${fullName}</div>
                <div style="font-size: 0.8rem; color: var(--text-light);">@${entry.athleteName}</div>
            </td>
            <td>${entry.eventName}</td>
            <td>${new Date(entry.createdAt).toLocaleDateString()}</td>
            <td class="actions-cell">
                <button class="icon-button" onclick="adminEditEntry('${entry.id}')">
                    <i data-feather="edit-2"></i>
                </button>
                <button class="icon-button danger" onclick="adminDeleteEntry('${entry.id}')">
                    <i data-feather="trash-2"></i>
                </button>
            </td>
        `;
        adminEntriesTbody.appendChild(tr);
    });

    // Render Registered Users
    const athleteUsernames = Object.keys(users).filter(u => u !== 'admin');
    athleteUsernames.forEach((username, index) => {
        const u = users[username];
        const athleteEntriesCount = entries.filter(e => e.athleteName === username).length;
        const totalCost = calculateTotalCost(athleteEntriesCount);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: bold; color: var(--text-light);">${index + 1}</td>
            <td><code style="background: #f1f5f9; padding: 2px 4px; border-radius: 4px;">${username}</code></td>
            <td style="font-weight: 500;">${u.firstName} ${u.lastName}</td>
            <td>${u.phone || '-'}</td>
            <td>${u.email || '-'}</td>
            <td>${u.birthDate}</td>
            <td>${u.gender === 'Male' ? 'Άνδρας' : (u.gender === 'Female' ? 'Γυναίκα' : 'Άλλο')}</td>
            <td><b style="color: var(--primary);">${u.paymentCode}</b></td>
            <td style="font-weight: 700; color: #059669;">${formatCurrency(totalCost)}</td>
            <td class="actions-cell">
                <button class="icon-button" onclick="adminEditUser('${username}')">
                    <i data-feather="edit-2"></i>
                </button>
            </td>
        `;
        adminUsersTbody.appendChild(tr);
    });
    
    // Render Settings
    adminMaxEventsInput.value = MAX_EVENTS;
    adminPriceFirstInput.value = PRICE_FIRST;
    adminPriceAdditionalInput.value = PRICE_ADDITIONAL;
    renderAdminEventsList();
    
    feather.replace();
}

function renderAdminEventsList() {
    adminEventsList.innerHTML = '';
    EVENTS_LIST.forEach((event, index) => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.padding = '0.5rem';
        div.style.background = 'rgba(0,0,0,0.02)';
        div.style.borderRadius = '0.25rem';
        div.innerHTML = `
            <span>${event}</span>
            <button class="icon-button danger" onclick="adminDeleteEvent(${index})" style="padding: 2px;">
                <i data-feather="x" style="width: 14px; height: 14px;"></i>
            </button>
        `;
        adminEventsList.appendChild(div);
    });
    feather.replace();
}

function adminDeleteEvent(index) {
    if (confirm('Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτό το αγώνισμα από τη λίστα επιλογών;')) {
        EVENTS_LIST.splice(index, 1);
        db.ref('settings/events').set(EVENTS_LIST);
        renderAdminEventsList();
        refreshEventSelect();
    }
}

function refreshEventSelect() {
    eventSelect.innerHTML = '<option value="" disabled selected>Επιλέξτε αγώνισμα...</option>';
    EVENTS_LIST.forEach(event => {
        const option = document.createElement('option');
        option.value = event;
        option.textContent = event;
        eventSelect.appendChild(option);
    });
}

function adminDeleteEntry(id) {
    if (confirm('Είστε βέβαιοι ότι θέλετε να διαγράψετε αυτή τη συμμετοχή ως διαχειριστής;')) {
        db.ref('entries/' + id).remove();
    }
}

function adminEditEntry(id) {
    const entry = entries.find(e => e.id === id);
    if (entry) {
        openModal(entry);
    }
}

function adminEditUser(username) {
    const u = users[username];
    if (u) {
        adminEditUsername.value = username;
        adminEditFirstName.value = u.firstName;
        adminEditLastName.value = u.lastName;
        adminEditBirthDate.value = u.birthDate;
        adminEditPhone.value = u.phone || '';
        adminEditEmail.value = u.email || '';
        adminEditGender.value = u.gender;
        adminUserModal.classList.remove('hidden');
    }
}

function adminSaveUser() {
    const username = adminEditUsername.value;
    if (username && users[username]) {
        const updates = {
            firstName: adminEditFirstName.value,
            lastName: adminEditLastName.value,
            birthDate: adminEditBirthDate.value,
            phone: adminEditPhone.value,
            email: adminEditEmail.value,
            gender: adminEditGender.value
        };

        db.ref('users/' + username).update(updates).then(() => {
            adminUserModal.classList.add('hidden');
        }).catch(error => alert('Σφάλμα: ' + error.message));
    }
}

function deleteEntry(id) {
    if (confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη συμμετοχή από τη λίστα; (Η διαγραφή θα οριστικοποιηθεί με την Αποθήκευση)')) {
        sessionEntries = sessionEntries.filter(e => e.id !== id);
        renderEntries();
    }
}

// Modal Management
function openModal(entry = null) {
    // Admin can always add/edit
    if (currentUser !== 'admin' && !entry && getMyEntries().length >= MAX_EVENTS) {
        alert('Έχετε φτάσει το μέγιστο όριο των ' + MAX_EVENTS + ' αγωνισμάτων.');
        return;
    }

    modalOverlay.classList.remove('hidden');
    
    if (entry) {
        editingEntryId = entry.id;
        modalTitle.textContent = 'Επεξεργασία Συμμετοχής';
        eventSelect.value = entry.eventName;
    } else {
        editingEntryId = null;
        modalTitle.textContent = 'Προσθήκη Αγωνίσματος';
        eventSelect.value = '';
    }
}

function closeModal() {
    modalOverlay.classList.add('hidden');
}

function saveEntry() {
    console.log("Saving entry...");
    const eventName = eventSelect.value;
    if (!eventName) {
        alert('Παρακαλώ επιλέξτε αγώνισμα');
        return;
    }
    
    if (currentUser === 'admin') {
        if (editingEntryId) {
            db.ref('entries/' + editingEntryId).update({ eventName: eventName });
        }
    } else {
        // Duplicate check
        if (editingEntryId) {
            if (sessionEntries.some(e => e.eventName === eventName && e.id !== editingEntryId)) {
                alert('Έχετε ήδη προσθέσει αυτό το αγώνισμα.');
                return;
            }
            // Edit
            const entry = sessionEntries.find(e => e.id === editingEntryId);
            if (entry) entry.eventName = eventName;
        } else {
            if (sessionEntries.some(e => e.eventName === eventName)) {
                alert('Έχετε ήδη προσθέσει αυτό το αγώνισμα.');
                return;
            }
            // Add
            sessionEntries.push({
                id: Date.now().toString(),
                athleteName: currentUser,
                eventName: eventName,
                createdAt: new Date().toISOString()
            });
        }
        renderEntries();
    }
    
    closeModal();
}



function exportToExcel() {
    if (entries.length === 0) {
        alert('Δεν υπάρχουν συμμετοχές για εξαγωγή.');
        return;
    }

    // Tab 1: Detailed Entries (One row per event)
    const dataForEntries = entries.map(entry => {
        const u = users[entry.athleteName];
        return {
            "Username": entry.athleteName,
            "Όνομα": u ? u.firstName : entry.athleteName,
            "Επώνυμο": u ? u.lastName : '-',
            "Τηλέφωνο": u ? u.phone || '-' : '-',
            "Email": u ? u.email || '-' : '-',
            "Ημερ. Γέννησης": u ? u.birthDate : '-',
            "Φύλο": u ? (u.gender === 'Male' ? 'Άνδρας' : (u.gender === 'Female' ? 'Γυναίκα' : 'Άλλο')) : '-',
            "Αγώνισμα": entry.eventName,
            "Ημερ. Εγγραφής": new Date(entry.createdAt).toLocaleDateString() + ' ' + new Date(entry.createdAt).toLocaleTimeString()
        };
    });

    // Tab 2: Financial Summary (One row per athlete)
    const athleteUsernames = Object.keys(users).filter(u => u !== 'admin');
    const dataForFinance = athleteUsernames.map(username => {
        const u = users[username];
        const userEntries = entries.filter(e => e.athleteName === username);
        const totalCost = calculateTotalCost(userEntries.length);
        const lastEntry = userEntries.length > 0 ? userEntries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] : null;

        return {
            "Username": username,
            "Όνομα": u.firstName,
            "Επώνυμο": u.lastName,
            "Τηλέφωνο": u.phone || '-',
            "Email": u.email || '-',
            "Κωδικός Πληρωμής": u.paymentCode,
            "Αριθμός Αγωνισμάτων": userEntries.length,
            "Συνολικό Ποσό": formatCurrency(totalCost),
            "Τελευταία Εγγραφή": lastEntry ? new Date(lastEntry.createdAt).toLocaleDateString() : '-'
        };
    });

    // Create workbook and worksheets
    const workbook = XLSX.utils.book_new();
    
    const wsEntries = XLSX.utils.json_to_sheet(dataForEntries);
    XLSX.utils.book_append_sheet(workbook, wsEntries, "Συμμετοχές");

    const wsFinance = XLSX.utils.json_to_sheet(dataForFinance);
    XLSX.utils.book_append_sheet(workbook, wsFinance, "Οικονομικά Στοιχεία");

    // Auto-size columns for both sheets
    wsEntries['!cols'] = [
        { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 25 }, { wch: 20 }
    ];
    wsFinance['!cols'] = [
        { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }
    ];

    // Trigger download
    XLSX.writeFile(workbook, "Track_Events_Report.xlsx");
}

// Event Listeners
if (disclaimerCheckbox) {
    disclaimerCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            saveModalBtn.disabled = false;
            saveModalBtn.style.opacity = '1';
            saveModalBtn.style.cursor = 'pointer';
        } else {
            saveModalBtn.disabled = true;
            saveModalBtn.style.opacity = '0.5';
            saveModalBtn.style.cursor = 'not-allowed';
        }
    });
}

if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => {
        authLanding.classList.add('hidden');
        authLogin.classList.remove('hidden');
    });
}

if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', () => {
        authLanding.classList.add('hidden');
        authRegister.classList.remove('hidden');
    });
}

backBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        authLogin.classList.add('hidden');
        authRegister.classList.add('hidden');
        authLanding.classList.remove('hidden');
    });
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (name && password) {
        await login(name, password);
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = regUsernameInput.value.trim();
    const password = regPasswordInput.value;
    const firstName = regFirstNameInput.value.trim();
    const lastName = regLastNameInput.value.trim();
    const birthDate = regBirthDateInput.value;
    const phone = regPhoneInput.value.trim();
    const email = regEmailInput.value.trim();
    const gender = regGenderInput.value;

    if (username && password && firstName && lastName && birthDate && phone && email && gender) {
        await register(username, password, firstName, lastName, birthDate, phone, email, gender);
    } else {
        alert('Παρακαλώ συμπληρώστε όλα τα πεδία.');
    }
});

profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const birthDate = birthDateInput.value;
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();
    const gender = genderInput.value;

    if (firstName && lastName && birthDate && phone && email && gender) {
        await saveProfile(firstName, lastName, birthDate, phone, email, gender);
    }
});

if (exportBtn) exportBtn.addEventListener('click', exportToExcel);
if (adminExportBtn) adminExportBtn.addEventListener('click', exportToExcel);
logoutBtn.addEventListener('click', logout);
if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', logout);

if (adminMaxEventsInput) {
    adminMaxEventsInput.addEventListener('change', (e) => {
        const val = parseInt(e.target.value) || 4;
        db.ref('settings/maxEvents').set(val);
    });
}

if (adminAddEventBtn) {
    adminAddEventBtn.addEventListener('click', () => {
        const newName = adminNewEventInput.value.trim();
        if (newName && !EVENTS_LIST.includes(newName)) {
            const newList = [...EVENTS_LIST, newName];
            db.ref('settings/events').set(newList).then(() => {
                adminNewEventInput.value = '';
            });
        }
    });
}

if (adminPriceFirstInput) {
    adminPriceFirstInput.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value) || 0;
        db.ref('settings/priceFirst').set(val);
    });
}

if (adminPriceAdditionalInput) {
    adminPriceAdditionalInput.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value) || 0;
        db.ref('settings/priceAdditional').set(val);
    });
}

addEntryBtn.addEventListener('click', () => openModal());
closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);
saveModalBtn.addEventListener('click', saveEntry);

if (globalSaveBtn) {
    globalSaveBtn.addEventListener('click', openDisclaimerModal);
}

if (closeDisclaimerBtn) {
    closeDisclaimerBtn.addEventListener('click', closeDisclaimerModal);
}

if (cancelDisclaimerBtn) {
    cancelDisclaimerBtn.addEventListener('click', closeDisclaimerModal);
}

if (finalConfirmBtn) {
    finalConfirmBtn.addEventListener('click', finalizeSubmission);
}

if (disclaimerCheckbox) {
    disclaimerCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            finalConfirmBtn.disabled = false;
            finalConfirmBtn.style.opacity = '1';
            finalConfirmBtn.style.cursor = 'pointer';
        } else {
            finalConfirmBtn.disabled = true;
            finalConfirmBtn.style.opacity = '0.5';
            finalConfirmBtn.style.cursor = 'not-allowed';
        }
    });
}

if (closeUserModalBtn) closeUserModalBtn.addEventListener('click', () => adminUserModal.classList.add('hidden'));
if (cancelUserModalBtn) cancelUserModalBtn.addEventListener('click', () => adminUserModal.classList.add('hidden'));
if (saveUserModalBtn) saveUserModalBtn.addEventListener('click', adminSaveUser);

// Boot
init();

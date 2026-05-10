let EVENTS_LIST = JSON.parse(localStorage.getItem('race_event_names')) || [
    "100μ", "200μ", "400μ", "800μ", "1500μ", "5000μ",
    "110μ Εμπόδια", "400μ Εμπόδια", "5000μ Βάδην", "Ακόντιο", 
    "Βαρύ Οργανο", "Δίσκος", "Επι Κοντώ", "Μήκος", "Σφαίρα", 
    "Σφύρα", "Τριπλούν", "Υψος", "4x100", "4x400"
];
let MAX_EVENTS = parseInt(localStorage.getItem('race_max_events')) || 4;
let PRICE_FIRST = parseFloat(localStorage.getItem('race_price_first')) || 10;
let PRICE_ADDITIONAL = parseFloat(localStorage.getItem('race_price_additional')) || 5;

// State
let currentUser = null;
let entries = [];
let sessionEntries = []; // Temporary entries for the current session
let editingEntryId = null;

// DOM Elements
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
    // One-time data reset as requested by user
    if (!localStorage.getItem('data_reset_v4')) {
        localStorage.removeItem('race_users');
        localStorage.removeItem('race_entries');
        localStorage.removeItem('race_user');
        localStorage.setItem('data_reset_v4', 'true');
    }

    // Ensure admin exists
    const users = JSON.parse(localStorage.getItem('race_users') || '{}');
    if (!users['admin']) {
        users['admin'] = {
            password: 'admin',
            paymentCode: 'ADMIN-001',
            firstName: 'System',
            lastName: 'Admin',
            birthDate: '1970-01-01',
            gender: 'Other',
            role: 'admin'
        };
        localStorage.setItem('race_users', JSON.stringify(users));
    }

    // Populate select options
    refreshEventSelect();

    // Check auth
    const storedUser = localStorage.getItem('race_user');
    if (storedUser) {
        // Find user data
        const users = JSON.parse(localStorage.getItem('race_users') || '{}');
        if (users[storedUser]) {
            login(storedUser, users[storedUser].password);
        } else {
            localStorage.removeItem('race_user');
        }
    }

    // Load all entries from local storage
    const storedEntries = localStorage.getItem('race_entries');
    if (storedEntries) {
        entries = JSON.parse(storedEntries);
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

function login(name, password) {
    const users = JSON.parse(localStorage.getItem('race_users') || '{}');
    
    if (users[name]) {
        const userObj = users[name];
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

function register(username, password, firstName, lastName, birthDate, phone, email, gender) {
    const users = JSON.parse(localStorage.getItem('race_users') || '{}');
    
    if (users[username]) {
        alert('Το όνομα χρήστη υπάρχει ήδη.');
        return false;
    }

    users[username] = {
        password: password,
        paymentCode: generatePaymentCode(),
        firstName: firstName,
        lastName: lastName,
        birthDate: birthDate,
        phone: phone,
        email: email,
        gender: gender
    };

    localStorage.setItem('race_users', JSON.stringify(users));
    alert('Η εγγραφή ολοκληρώθηκε επιτυχώς! Τώρα μπορείτε να συνδεθείτε.');
    
    // Switch to login form
    authRegister.classList.add('hidden');
    authLogin.classList.remove('hidden');
    usernameInput.value = username;
    passwordInput.value = password;
    
    return true;
}

function saveProfile(firstName, lastName, birthDate, phone, email, gender) {
    const users = JSON.parse(localStorage.getItem('race_users') || '{}');
    if (users[currentUser]) {
        users[currentUser].firstName = firstName;
        users[currentUser].lastName = lastName;
        users[currentUser].birthDate = birthDate;
        users[currentUser].phone = phone;
        users[currentUser].email = email;
        users[currentUser].gender = gender;
        localStorage.setItem('race_users', JSON.stringify(users));
        alert('Τα στοιχεία αποθηκεύτηκαν επιτυχώς!');
    }
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

function saveEntries() {
    localStorage.setItem('race_entries', JSON.stringify(entries));
    renderEntries();
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
    
    // Official save: Remove old entries and add current session ones
    entries = entries.filter(e => e.athleteName !== currentUser).concat(sessionEntries);
    saveEntries();
    
    alert('Η οριστική υποβολή ολοκληρώθηκε επιτυχώς! Σας ευχαριστούμε για τη συμμετοχή.');
    closeDisclaimerModal();
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
    const users = JSON.parse(localStorage.getItem('race_users') || '{}');
    
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
        localStorage.setItem('race_event_names', JSON.stringify(EVENTS_LIST));
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
        entries = entries.filter(e => e.id !== id);
        localStorage.setItem('race_entries', JSON.stringify(entries));
        renderAdminDashboard();
    }
}

function adminEditEntry(id) {
    const entry = entries.find(e => e.id === id);
    if (entry) {
        openModal(entry);
    }
}

function adminEditUser(username) {
    const users = JSON.parse(localStorage.getItem('race_users') || '{}');
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
    const users = JSON.parse(localStorage.getItem('race_users') || '{}');
    if (users[username]) {
        users[username].firstName = adminEditFirstName.value;
        users[username].lastName = adminEditLastName.value;
        users[username].birthDate = adminEditBirthDate.value;
        users[username].phone = adminEditPhone.value;
        users[username].email = adminEditEmail.value;
        users[username].gender = adminEditGender.value;
        localStorage.setItem('race_users', JSON.stringify(users));
        adminUserModal.classList.add('hidden');
        renderAdminDashboard();
        alert('Τα στοιχεία του αθλητή ενημερώθηκαν επιτυχώς!');
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
    const eventName = eventSelect.value;
    if (!eventName) {
        alert('Παρακαλώ επιλέξτε αγώνισμα');
        return;
    }
    
    if (currentUser === 'admin') {
        if (editingEntryId) {
            const entry = entries.find(e => e.id === editingEntryId);
            if (entry) entry.eventName = eventName;
        } else {
            // Admin adding for someone? (Currently no athlete select in modal)
        }
        localStorage.setItem('race_entries', JSON.stringify(entries));
        renderAdminDashboard();
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

    const users = JSON.parse(localStorage.getItem('race_users') || '{}');

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

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (name && password) {
        login(name, password);
    }
});

registerForm.addEventListener('submit', (e) => {
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
        register(username, password, firstName, lastName, birthDate, phone, email, gender);
    }
});

profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const birthDate = birthDateInput.value;
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();
    const gender = genderInput.value;

    if (firstName && lastName && birthDate && phone && email && gender) {
        saveProfile(firstName, lastName, birthDate, phone, email, gender);
    }
});

if (exportBtn) exportBtn.addEventListener('click', exportToExcel);
if (adminExportBtn) adminExportBtn.addEventListener('click', exportToExcel);
logoutBtn.addEventListener('click', logout);
if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', logout);

if (adminMaxEventsInput) {
    adminMaxEventsInput.addEventListener('change', (e) => {
        MAX_EVENTS = parseInt(e.target.value) || 4;
        localStorage.setItem('race_max_events', MAX_EVENTS.toString());
    });
}

if (adminAddEventBtn) {
    adminAddEventBtn.addEventListener('click', () => {
        const newName = adminNewEventInput.value.trim();
        if (newName && !EVENTS_LIST.includes(newName)) {
            EVENTS_LIST.push(newName);
            localStorage.setItem('race_event_names', JSON.stringify(EVENTS_LIST));
            adminNewEventInput.value = '';
            renderAdminEventsList();
            refreshEventSelect();
        }
    });
}

if (adminPriceFirstInput) {
    adminPriceFirstInput.addEventListener('change', (e) => {
        PRICE_FIRST = parseFloat(e.target.value) || 0;
        localStorage.setItem('race_price_first', PRICE_FIRST.toString());
        renderAdminDashboard();
    });
}

if (adminPriceAdditionalInput) {
    adminPriceAdditionalInput.addEventListener('change', (e) => {
        PRICE_ADDITIONAL = parseFloat(e.target.value) || 0;
        localStorage.setItem('race_price_additional', PRICE_ADDITIONAL.toString());
        renderAdminDashboard();
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

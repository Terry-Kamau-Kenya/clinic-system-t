const API_URL = '/api';

// State
let token = localStorage.getItem('token');
let userRole = localStorage.getItem('role');
let isLoginMode = true;

// DOM Elements
const sections = {
    auth: document.getElementById('authSection'),
    patient: document.getElementById('patientDashboard'),
    admin: document.getElementById('adminDashboard'),
    queue: document.getElementById('queueStatusSection')
};

const navLinks = document.getElementById('navLinks');
const logoutBtn = document.getElementById('logoutBtn');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authBtn = document.getElementById('authBtn');
const toggleAuth = document.getElementById('toggleAuth');
const authError = document.getElementById('authError');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
    if (userRole === 'patient') loadDoctors();
    if (userRole === 'admin') loadAdminData();
    if (userRole) startQueuePolling();
});

function setupEventListeners() {
    // Auth Toggle
    toggleAuth.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        authTitle.innerText = isLoginMode ? 'Login' : 'Register';
        authBtn.innerText = isLoginMode ? 'Login' : 'Register';
        toggleAuth.innerText = isLoginMode ? "Don't have an account? Register" : "Have an account? Login";
        // Show name field only in register mode
        document.getElementById('name').style.display = isLoginMode ? 'none' : 'block';
        authError.innerText = '';
    });

    // Auth Submit
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const endpoint = isLoginMode ? '/auth/login' : '/auth/register';

        let body = { email, password };
        if (!isLoginMode) body.name = name;

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.user.role);
                localStorage.setItem('name', data.user.name);
                token = data.token;
                userRole = data.user.role;
                checkAuth();
                if(userRole === 'patient') loadDoctors();
                if(userRole === 'admin') loadAdminData();
                startQueuePolling();
            } else {
                authError.innerText = data.message || 'Authentication failed';
            }
        } catch (err) {
            authError.innerText = 'Server error. Please try again.';
        }
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        location.reload();
    });

    // Booking Form
    document.getElementById('bookingForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const doctorId = document.getElementById('doctorSelect').value;
        const date = document.getElementById('dateSelect').value;
        const time = document.getElementById('timeSelect').value;

        try {
            const res = await fetch(`${API_URL}/appointments`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ doctorId, date, time })
            });
            const data = await res.json();
            if(res.ok) {
                document.getElementById('bookingMsg').innerText = "Appointment booked! Check your email.";
                loadMyAppointments();
            } else {
                alert(data.message);
            }
        } catch (err) { console.error(err); }
    });

    // Admin: Add Doctor
    document.getElementById('addDoctorForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('docName').value;
        const specialization = document.getElementById('docSpec').value;

        const res = await fetch(`${API_URL}/doctors`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, specialization })
        });

        if(res.ok) {
            alert('Doctor added');
            loadAdminData();
            e.target.reset();
        }
    });

    // Admin: Queue Actions
    document.getElementById('callNextBtn').addEventListener('click', updateQueueStatus);
    document.getElementById('completeBtn').addEventListener('click', completeQueueItem);
}

// --- Navigation & Auth Logic ---
function checkAuth() {
    if (!token) {
        showSection('auth');
        navLinks.innerHTML = '';
        logoutBtn.style.display = 'none';
    } else {
        logoutBtn.style.display = 'block';
        if (userRole === 'patient') {
            showSection('patient');
            navLinks.innerHTML = `<a onclick="showSection('patient')">Dashboard</a> <a onclick="showSection('queue')">Queue Status</a>`;
            loadMyAppointments();
        } else if (userRole === 'admin') {
            showSection('admin');
            navLinks.innerHTML = `<a onclick="showSection('admin')">Dashboard</a> <a onclick="showSection('queue')">Public Queue</a>`;
            loadAdminData();
        }
    }
}

function showSection(sectionName) {
    Object.values(sections).forEach(el => el.classList.add('hidden'));
    Object.values(sections).forEach(el => el.classList.remove('active-section'));
    
    if(sectionName === 'patient') sections.patient.classList.remove('hidden');
    else if(sectionName === 'admin') sections.admin.classList.remove('hidden');
    else if(sectionName === 'queue') sections.queue.classList.remove('hidden');
    else sections.auth.classList.remove('hidden');
}

// --- Data Loading Functions ---

async function loadDoctors() {
    const res = await fetch(`${API_URL}/doctors`);
    const doctors = await res.json();
    const select = document.getElementById('doctorSelect');
    select.innerHTML = '<option value="">Select Doctor</option>';
    doctors.forEach(doc => {
        select.innerHTML += `<option value="${doc._id}">${doc.name} (${doc.specialization})</option>`;
    });
}

async function loadMyAppointments() {
    const res = await fetch(`${API_URL}/appointments/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const appts = await res.json();
    const list = document.getElementById('myAppointmentsList');
    list.innerHTML = '';
    appts.forEach(appt => {
        list.innerHTML += `
            <li>
                <span>${appt.date} ${appt.time} - Dr. ${appt.doctor?.name}</span>
                <span class="badge ${appt.status}">${appt.status}</span>
            </li>`;
    });
}

async function loadAdminData() {
    // Load Doctors
    const docRes = await fetch(`${API_URL}/doctors`);
    const doctors = await docRes.json();
    const docList = document.getElementById('adminDoctorList');
    docList.innerHTML = doctors.map(d => `<li>${d.name} - ${d.specialization}</li>`).join('');

    // Load Queue
    updateQueueUI();
}

// --- Queue Logic ---

let queueInterval;

function startQueuePolling() {
    if(queueInterval) clearInterval(queueInterval);
    updateQueueUI();
    queueInterval = setInterval(updateQueueUI, 5000); // Refresh every 5s
}

async function updateQueueUI() {
    try {
        const res = await fetch(`${API_URL}/queue/status`);
        const data = await res.json();
        
        // Update Public Display
        document.getElementById('currentServing').innerText = data.current ? data.current.queueNumber : '--';
        document.getElementById('currentPatientName').innerText = data.current ? data.current.patientName : 'Waiting...';
        document.getElementById('nextServing').innerText = data.next ? data.next.queueNumber : '--';
        
        const waitingList = document.getElementById('waitingListDisplay');
        waitingList.innerHTML = data.waiting.map(q => `<li>Queue #${q.queueNumber} - ${q.patientName}</li>`).join('');

        // Update Admin List if visible
        if(userRole === 'admin' && !document.getElementById('adminQueueView').classList.contains('hidden')) {
             const adminList = document.getElementById('adminQueueList');
             adminList.innerHTML = data.waiting.map(q => `<li>Queue #${q.queueNumber} - ${q.patientName}</li>`).join('');
        }

    } catch (err) { console.error("Queue update failed"); }
}

async function updateQueueStatus() {
    await fetch(`${API_URL}/queue/next`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    updateQueueUI();
}

async function completeQueueItem() {
    await fetch(`${API_URL}/queue/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    updateQueueUI();
}

function showAdminView(view) {
    if(view === 'doctors') {
        document.getElementById('adminDoctorsView').classList.remove('hidden');
        document.getElementById('adminQueueView').classList.add('hidden');
    } else {
        document.getElementById('adminDoctorsView').classList.add('hidden');
        document.getElementById('adminQueueView').classList.remove('hidden');
        updateQueueUI();
    }
}
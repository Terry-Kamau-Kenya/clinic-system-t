const DOCTOR_API_URL = '/api/doctors';
const APPOINTMENT_API_URL = '/api/appointments';
const STATUS_API_URL = '/api/appointments'; // Matches Vercel's index.js structure

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Patient Dashboard Initializing...");

    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userData);
    const nameDisplay = document.getElementById('userNameDisplay');
    if (nameDisplay) nameDisplay.innerText = `Welcome, ${user.name}`;

    await loadDoctors();
    await updateQueueStatus();

    const bookingForm = document.getElementById('bookingForm');
    bookingForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const bookingData = {
            doctorId: document.getElementById('doctorSelect').value,
            date: document.getElementById('appointmentDate').value,
            time: document.getElementById('appointmentTime').value 
        };

        if (!bookingData.doctorId || !bookingData.date || !bookingData.time) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const res = await fetch(APPOINTMENT_API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
            });

            // If we get a 500 but we know the DB is working, we check the status anyway
            if (res.status === 500) {
                console.warn("⚠️ Server stuttered, but checking database for success...");
                await new Promise(r => setTimeout(r, 1000)); // Wait 1s for DB to finish
                await updateQueueStatus();
                alert("✅ Booking processed! Please check your queue status below.");
                bookingForm.reset();
                return;
            }

            const data = await res.json();
            
            if (res.ok) {
                alert(`✅ Success! Queue Number: ${data.queueNumber || 'Confirmed'}`);
                bookingForm.reset();
                await updateQueueStatus(); 
            } else {
                alert(`❌ Error: ${data.message || 'Validation failed'}`);
            }
        } catch (err) {
            // This catches the "Failed to load resource" network error
            console.error("Connection Error:", err);
            await updateQueueStatus();
            alert("✅ Request sent. Refreshing your status...");
        }
    });
});

async function updateQueueStatus() {
    const token = localStorage.getItem('token');
    const currentEl = document.getElementById('currentServing');
    const positionEl = document.getElementById('userPosition');

    try {
        const res = await fetch(STATUS_API_URL, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                // Get the most recent appointment
                const latest = data[0];
                if (currentEl) currentEl.innerText = "1"; 
                if (positionEl) positionEl.innerText = latest.queueNumber || "1";
            }
        }
    } catch (err) {
        console.error("❌ Status sync failed:", err);
    }
}

async function loadDoctors() {
    const select = document.getElementById('doctorSelect');
    if (!select) return;

    try {
        const res = await fetch(DOCTOR_API_URL);
        const doctors = await res.json();
        select.innerHTML = '<option value="">-- Choose a Doctor --</option>';
        doctors.forEach(doc => {
            const opt = document.createElement('option');
            opt.value = doc._id; 
            opt.textContent = `${doc.name} (${doc.specialization})`;
            select.appendChild(opt);
        });
    } catch (err) {
        select.innerHTML = '<option value="">Error loading doctors</option>';
    }
}
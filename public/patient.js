// 1. Double check this! If you are using Next.js, it might be 3000
const BASE_URL = 'http://localhost:5000/api'; 

document.addEventListener('DOMContentLoaded', () => {
    // GUARDRAIL: Check if 'user' exists in storage before parsing
    const userData = localStorage.getItem('user');
    if (!userData) {
        console.warn("No user found in localStorage. Redirecting...");
        // window.location.href = 'login.html'; // Optional: send them to login
        return;
    }

    const user = JSON.parse(userData);
    
    // GUARDRAIL: Ensure user object has the required properties
    if (!user || user.role !== 'patient') return;

    document.getElementById('patientView')?.classList.remove('hidden');
    loadDoctors();
    fetchQueueStatus();

    setInterval(fetchQueueStatus, 10000);

    document.getElementById('bookingForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // GUARDRAIL: Verify the token exists before fetching
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Session expired. Please log in again.");
            return;
        }

        const bookingData = {
            doctorId: document.getElementById('doctorSelect').value,
            date: document.getElementById('appointmentDate').value,
            time: document.getElementById('appointmentTime').value
        };

        try {
            const res = await fetch(`${BASE_URL}/appointments`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
            });

            const data = await res.json(); // Read the response first

            if (res.ok) {
                alert("Appointment Booked! Check your email for confirmation.");
                fetchQueueStatus();
            } else {
                alert(data.message || "Booking failed");
            }
        } catch (err) {
            console.error("Booking failed", err);
            alert("Network error. Is the server running?");
        }
    });
});

async function loadDoctors() {
    try {
        const select = document.getElementById('doctorSelect');
        const res = await fetch(`${BASE_URL}/doctors`);
        if (!res.ok) throw new Error("Could not fetch doctors");
        
        const doctors = await res.json();
        
        // Clear existing options first (except the first one)
        select.innerHTML = '<option value="">Select a Doctor</option>';
        
        doctors.forEach(doc => {
            const opt = document.createElement('option');
            opt.value = doc._id;
            opt.textContent = `Dr. ${doc.name} (${doc.specialization})`;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("Load doctors failed:", err);
    }
}

async function fetchQueueStatus() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${BASE_URL}/queue/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // SAFETY CATCH: Only update UI if the response is valid
        if (res.ok) {
            const data = await res.json();
            document.getElementById('currentServing').innerText = data.current || 'None';
            document.getElementById('userPosition').innerText = data.yourPosition || 'No active booking';
        }
    } catch (err) {
        console.log("Queue refresh failed (server might be down)");
    }
}
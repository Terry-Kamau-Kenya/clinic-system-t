document.addEventListener('DOMContentLoaded', () => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    // 1. Redirect if not logged in
    if (!token || !userData) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userData);

    // 2. Display the user's name
    const nameDisplay = document.getElementById('userNameDisplay');
    if (nameDisplay) {
        nameDisplay.innerText = `Welcome, ${user.name}`;
    }

    // 3. Show the correct view based on role
    const adminView = document.getElementById('adminView');
    const patientView = document.getElementById('patientView');

    if (user.role === 'admin' || user.role === 'doctor') {
        if (adminView) adminView.classList.remove('hidden');
    } else {
        if (patientView) patientView.classList.remove('hidden');
        loadDoctorsIntoDropdown();
    }

    // 4. Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }

    // 5. Load Doctors into Dropdown
    async function loadDoctorsIntoDropdown() {
        const doctorSelect = document.getElementById('doctorSelect');
        if (!doctorSelect) return;

        try {
            const response = await fetch('/api/doctors');
            const doctors = await response.json();

            doctorSelect.innerHTML = '<option value="">-- Select a Doctor --</option>';
            doctors.forEach(doc => {
                const option = document.createElement('option');
                option.value = doc._id; // Ensure this is doc._id from MongoDB
                option.textContent = `${doc.name} (${doc.specialization})`;
                doctorSelect.appendChild(option);
            });
        } catch (error) {
            console.error("❌ Error loading doctors:", error);
        }
    }

    // 6. 🔥 NEW: HANDLE BOOKING SUBMISSION (The fix for your 500 error)
    const bookingForm = document.getElementById('bookingForm'); // Ensure your <form> has this ID
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const doctorId = document.getElementById('doctorSelect').value;
            const date = document.getElementById('appointmentDate').value;
            const time = document.getElementById('appointmentTime').value;

            if (!doctorId || !date || !time) {
                alert("Please fill in all booking details.");
                return;
            }

            try {
                const response = await fetch('/api/appointments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // 🔑 CRITICAL: Sends your login token to the server
                    },
                    body: JSON.stringify({ doctorId, date, time })
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Booking Confirmed Successfully!");
                    bookingForm.reset();
                    // Optional: window.location.reload(); 
                } else {
                    alert("Error: " + (data.message || "Failed to book appointment"));
                }
            } catch (error) {
                console.error("❌ Booking Error:", error);
                alert("Connection failed. Check your console (F12).");
            }
        });
    }
});
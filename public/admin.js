document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') return;

    document.getElementById('adminView').classList.remove('hidden');
    loadAllAppointments();
});

async function loadAllAppointments() {
    const tableBody = document.getElementById('adminApptBody');
    try {
        const res = await fetch('http://localhost:5000/api/appointments/admin', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const appointments = await res.json();

        tableBody.innerHTML = '';
        appointments.forEach(appt => {
            const row = `
                <tr>
                    <td>${appt.patientName}</td>
                    <td>${appt.doctorName}</td>
                    <td>${appt.time}</td>
                    <td>
                        <button onclick="updateStatus('${appt._id}', 'serving')" class="btn-primary">Serve</button>
                        <button onclick="updateStatus('${appt._id}', 'completed')" class="btn-success">Complete</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (err) {
        console.error("Admin load failed");
    }
}

async function updateStatus(id, status) {
    await fetch(`http://localhost:5000/api/queue/update/${id}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
    });
    loadAllAppointments();
}

// Logout Utility (shared by both roles)
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});
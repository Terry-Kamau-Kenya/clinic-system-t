document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    // 1. Redirect if not logged in
    if (!token || !user) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Display the user's name
    document.getElementById('userNameDisplay').innerText = `Welcome, ${user.name}`;

    // 3. Show the correct view based on role
    if (user.role === 'admin' || user.role === 'doctor') {
        document.getElementById('adminView').classList.remove('hidden');
    } else {
        document.getElementById('patientView').classList.remove('hidden');
    }

    // 4. Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });
});
const BASE_URL = 'http://localhost:5000/api/auth'; // FIXED: Added /auth

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            // Save Token and User
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role
            // Ensure these .html files actually exist in your folder!
            if (data.user.role === 'patient') {
                window.location.href = 'dashboard.html'; 
            } else if (data.user.role === 'doctor') {
                window.location.href = 'doctor.html';
            } else {
                window.location.href = 'admin.html';
            }
        } else {
            alert(data.message || "Login failed. Check your email/password.");
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert("Cannot connect to server. Ensure 'node server.js' is running!");
    }
});const BASE_URL = 'http://localhost:5000/api/auth'; // FIXED: Added /auth

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            // Save Token and User
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role
            // Ensure these .html files actually exist in your folder!
            if (data.user.role === 'patient') {
                window.location.href = 'dashboard.html'; 
            } else if (data.user.role === 'doctor') {
                window.location.href = 'doctor.html';
            } else {
                window.location.href = 'admin.html';
            }
        } else {
            alert(data.message || "Login failed. Check your email/password.");
        }
    } catch (err) {
        console.error("Login Error:", err);
        alert("Cannot connect to server. Ensure 'node server.js' is running!");
    }
});

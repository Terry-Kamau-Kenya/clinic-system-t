const API_URL = 'http://localhost:5000/api/auth';

document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('authForm');
    const toggleAuth = document.getElementById('toggleAuth');
    const nameField = document.getElementById('nameFieldGroup');
    const authTitle = document.getElementById('authTitle');
    const authBtn = document.getElementById('authBtn');
    const authError = document.getElementById('authError');
    let isLogin = true;

    // 1. Toggle between Login and Register
    toggleAuth.addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;
        
        // Clear errors when switching
        authError.innerText = "";
        
        nameField.style.display = isLogin ? 'none' : 'block';
        authTitle.innerText = isLogin ? 'Login to MediQueue' : 'Register Account';
        authBtn.innerHTML = isLogin ? '<i class="fas fa-sign-in-alt"></i> Login' : '<i class="fas fa-user-plus"></i> Register';
        toggleAuth.innerText = isLogin ? 'Register here' : 'Login here';
    });

    // 2. Handle Form Submission
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const name = document.getElementById('regName').value;

        const endpoint = isLogin ? '/login' : '/register';
        
        // CORRECTION: Added 'role' to the registration body to match your Server logic
        const body = isLogin 
            ? { email, password } 
            : { name, email, password, role: 'patient' }; 

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (res.ok) {
                if (isLogin) {
                    // SUCCESSFUL LOGIN: Save data and go to dashboard
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = 'dashboard.html';
                } else {
                    // SUCCESSFUL REGISTRATION: Switch to login mode
                    alert("Registration successful! Please log in with your new account.");
                    location.reload(); 
                }
            } else {
                // SERVER ERROR (e.g., "User already exists" or "Invalid credentials")
                authError.innerText = data.message || "An error occurred.";
            }
        } catch (err) {
            // NETWORK ERROR (e.g., Server is not running)
            authError.innerText = "Connection failed. Please ensure the backend server is running on port 5000.";
            console.error("Auth Error:", err);
        }
    });
});
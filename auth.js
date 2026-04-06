// 🔄 AUTO-DETECT API URL: 
const API_URL = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
    ? 'https://clinic-system-t.vercel.app/api' 
    : '/api';

document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('authForm');
    const toggleAuth = document.getElementById('toggleAuth');
    const nameField = document.getElementById('nameFieldGroup');
    const authTitle = document.getElementById('authTitle');
    const authBtn = document.getElementById('authBtn');
    const authError = document.getElementById('authError');
    let isLogin = true;

    // 1. Toggle between Login and Register
    if (toggleAuth) {
        toggleAuth.addEventListener('click', (e) => {
            e.preventDefault();
            isLogin = !isLogin;
            
            if (authError) authError.innerText = "";
            if (nameField) nameField.style.display = isLogin ? 'none' : 'block';
            if (authTitle) authTitle.innerText = isLogin ? 'Login to MediQueue' : 'Register Account';
            if (authBtn) {
                authBtn.innerHTML = isLogin 
                    ? '<i class="fas fa-sign-in-alt"></i> Login' 
                    : '<i class="fas fa-user-plus"></i> Register';
            }
            toggleAuth.innerText = isLogin ? 'Register here' : 'Login here';
        });
    }

    // 2. Handle Form Submission
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (authError) authError.innerText = "Processing..."; 
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const nameInput = document.getElementById('regName');
        const name = nameInput ? nameInput.value : '';

        // 🛠️ FIX: Point to the 'auth' subfolder in your api directory
        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        
        const body = isLogin 
            ? { email, password } 
            : { name, email, password, role: 'patient' }; 

        const fullURL = `${API_URL}${endpoint}`;
        console.log(`Connecting to: ${fullURL}`);

        try {
            const res = await fetch(fullURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            // 🛠️ FIX: Check if the response is actually JSON before parsing
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const errorText = await res.text();
                console.error("Server raw response:", errorText);
                throw new Error("Server error (500). Please check Vercel Logs for MongoDB connection issues.");
            }

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                alert(isLogin ? "Login successful!" : "Registration successful!");
                window.location.href = 'dashboard.html'; 
            } else {
                authError.innerText = data.message || "An error occurred.";
            }
        } catch (err) {
            // 🛠️ FIX: More descriptive error for the user
            authError.innerText = "Connection Failed. Ensure your MongoDB URI is set in Vercel.";
            console.error("Full Error Object:", err);
        }
    });
});
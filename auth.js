// 🔄 AUTO-DETECT API URL: 
// If on localhost, use the full Vercel link. If on Vercel, use relative '/api'.
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
        if (authError) authError.innerText = ""; 
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Safer check for the name field
        const nameInput = document.getElementById('regName');
        const name = nameInput ? nameInput.value : '';

        const endpoint = isLogin ? '/login' : '/register';
        
        const body = isLogin 
            ? { email, password } 
            : { name, email, password, role: 'patient' }; 

        console.log(`Connecting to: ${API_URL}${endpoint}`); // Helpful for debugging F12

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            // Handle non-JSON responses (like 404s or 500s)
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const errorText = await res.text();
                console.error("Server Response:", errorText);
                throw new Error("Server error. Check Vercel Logs for database connection issues.");
            }

            const data = await res.json();

            if (res.ok) {
                // Save the ENTIRE user object and token
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                alert(isLogin ? "Login successful!" : "Registration successful!");
                window.location.href = 'dashboard.html'; 
            } else {
                authError.innerText = data.message || "An error occurred.";
            }
        } catch (err) {
            authError.innerText = err.message || "Connection failed.";
            console.error("Auth Error details:", err);
        }
    });
});
// ✅ FIX: Changed from '/api/auth' to '/api' to match your vercel.json rewrites
const API_URL = '/api'; 

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
        
        authError.innerText = "";
        if (nameField) nameField.style.display = isLogin ? 'none' : 'block';
        authTitle.innerText = isLogin ? 'Login to MediQueue' : 'Register Account';
        authBtn.innerHTML = isLogin ? '<i class="fas fa-sign-in-alt"></i> Login' : '<i class="fas fa-user-plus"></i> Register';
        toggleAuth.innerText = isLogin ? 'Register here' : 'Login here';
    });

    // 2. Handle Form Submission
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        authError.innerText = ""; // Clear previous errors
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // ✅ FIX: Safer check for the name field
        const nameInput = document.getElementById('regName');
        const name = nameInput ? nameInput.value : '';

        // This creates '/api/login' or '/api/register'
        const endpoint = isLogin ? '/login' : '/register';
        
        const body = isLogin 
            ? { email, password } 
            : { name, email, password, role: 'patient' }; 

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            // Handle non-JSON responses (like 404s or 500s)
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server did not return JSON. Check Vercel logs.");
            }

            const data = await res.json();

            if (res.ok) {
                // Save the ENTIRE user object and token
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                if (isLogin) {
                    window.location.href = 'dashboard.html';
                } else {
                    alert("Registration successful! Redirecting to dashboard...");
                    window.location.href = 'dashboard.html'; 
                }
            } else {
                authError.innerText = data.message || "An error occurred.";
            }
        } catch (err) {
            // This catches network errors OR manual throws from above
            authError.innerText = "Connection failed. Ensure you have pushed your latest vercel.json and check Vercel Logs.";
            console.error("Auth Error:", err);
        }
    });
});
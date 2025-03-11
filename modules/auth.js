import firebaseConfig from '../firebase-config.js';

// Initialize Firebase
if (!firebase.apps?.length) {
    firebase.initializeApp(firebaseConfig);
}

export function initializeAuth() {
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordField = document.getElementById('password');
    
    // Handle toggle password visibility
    togglePasswordBtn.addEventListener('click', () => {
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            togglePasswordBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            passwordField.type = 'password';
            togglePasswordBtn.innerHTML = '<i class="fas fa-eye"></i>';
        }
    });
    
    // Handle login form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const email = `${username}@safezone.example.com`; // Create email from username
        
        loginError.textContent = '';
        
        // Use Firebase auth to sign in
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(() => {
                // Login successful
                loginContainer.classList.add('hidden');
                appContainer.classList.remove('hidden');
            })
            .catch((error) => {
                // Show error message
                console.error("Login error:", error);
                loginError.textContent = 'שם משתמש או סיסמה לא נכונים';
            });
    });
    
    // Handle logout
    logoutBtn.addEventListener('click', () => {
        firebase.auth().signOut().then(() => {
            appContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
        }).catch((error) => {
            console.error("Logout error:", error);
        });
    });
    
    // Check if user is already logged in
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            loginContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
        } else {
            // User is signed out
            appContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
        }
    });
}
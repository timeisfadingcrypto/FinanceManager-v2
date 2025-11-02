// Authentication management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check for existing token
        const token = localStorage.getItem('token');
        if (token) {
            api.setToken(token);
            this.verifyToken();
        } else {
            this.showLogin();
        }

        // Bind event handlers
        this.bindEvents();
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const loginBtn = document.getElementById('loginBtn');
        
        if (!email || !password) {
            utils.showAlert('Please fill in all fields', 'warning', 'loginAlert');
            return;
        }

        try {
            // Show loading state
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Logging in...';
            loginBtn.disabled = true;

            const response = await api.login(email, password);
            
            // Store token and user data
            api.setToken(response.token);
            this.currentUser = response.user;
            localStorage.setItem('user', JSON.stringify(response.user));

            // Show success message
            utils.showAlert('Login successful!', 'success', 'loginAlert');
            
            // Redirect to dashboard
            setTimeout(() => this.showDashboard(), 1000);
            
        } catch (error) {
            console.error('Login failed:', error);
            utils.showAlert(error.message, 'danger', 'loginAlert');
        } finally {
            // Reset button
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Login';
            loginBtn.disabled = false;
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const firstName = document.getElementById('registerFirstName').value;
        const lastName = document.getElementById('registerLastName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const role = document.getElementById('registerRole').value;
        const registerBtn = document.getElementById('registerBtn');
        
        if (!firstName || !lastName || !email || !password) {
            utils.showAlert('Please fill in all fields', 'warning', 'registerAlert');
            return;
        }

        if (password.length < 6) {
            utils.showAlert('Password must be at least 6 characters', 'warning', 'registerAlert');
            return;
        }

        try {
            // Show loading state
            registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Registering...';
            registerBtn.disabled = true;

            const response = await api.register({
                firstName,
                lastName,
                email,
                password,
                role
            });
            
            // Store token and user data
            api.setToken(response.token);
            this.currentUser = response.user;
            localStorage.setItem('user', JSON.stringify(response.user));

            // Show success message
            utils.showAlert('Registration successful!', 'success', 'registerAlert');
            
            // Redirect to dashboard
            setTimeout(() => this.showDashboard(), 1000);
            
        } catch (error) {
            console.error('Registration failed:', error);
            utils.showAlert(error.message, 'danger', 'registerAlert');
        } finally {
            // Reset button
            registerBtn.innerHTML = '<i class="fas fa-user-plus me-2"></i>Register';
            registerBtn.disabled = false;
        }
    }

    handleLogout(e) {
        e.preventDefault();
        
        // Clear stored data
        api.setToken(null);
        localStorage.removeItem('user');
        this.currentUser = null;
        
        // Show login screen
        this.showLogin();
        
        utils.showAlert('Logged out successfully', 'info');
    }

    async verifyToken() {
        try {
            const response = await api.request('/auth/verify');
            this.currentUser = response.user;
            this.showDashboard();
        } catch (error) {
            console.error('Token verification failed:', error);
            // Token is invalid, show login
            api.setToken(null);
            localStorage.removeItem('user');
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('mainContent').style.display = 'none';
        document.getElementById('mainNavbar').style.display = 'none';
        
        // Clear form fields
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
        
        // Clear alerts
        document.getElementById('loginAlert').innerHTML = '';
        document.getElementById('registerAlert').innerHTML = '';
    }

    showDashboard() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        document.getElementById('mainNavbar').style.display = 'block';
        
        // Update user display name
        if (this.currentUser) {
            document.getElementById('userDisplayName').textContent = 
                `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        }
        
        // Show dashboard section by default
        window.app && window.app.showSection('dashboard');
    }

    getCurrentUser() {
        return this.currentUser || JSON.parse(localStorage.getItem('user') || 'null');
    }

    isAuthenticated() {
        return !!api.token && !!this.getCurrentUser();
    }
}

// Initialize auth manager
window.auth = new AuthManager();
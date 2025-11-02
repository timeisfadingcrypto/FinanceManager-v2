// Main application controller
class App {
    constructor() {
        this.currentSection = 'dashboard';
        this.initialized = false;
        this.init();
    }

    init() {
        // Wait for auth to be ready; do not bootstrap section managers until authenticated
        if (window.auth && (window.auth.isAuthenticated())) {
            if (!this.initialized) {
                this.bindEvents();
                this.initialized = true;
            }
            this.showSection('dashboard');
        } else {
            // Ensure login UI is visible
            const login = document.getElementById('loginSection');
            const main = document.getElementById('mainContent');
            const nav = document.getElementById('mainNavbar');
            if (login) login.style.display = 'block';
            if (main) main.style.display = 'none';
            if (nav) nav.style.display = 'none';

            // Retry until authenticated
            setTimeout(() => this.init(), 150);
        }
    }

    bindEvents() {
        // Navigation links
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) {
            targetSection.style.display = 'block';
            this.currentSection = sectionName;
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelectorAll(`[data-section="${sectionName}"]`).forEach(link => {
            link.classList.add('active');
        });

        // Load section-specific data ONLY after authentication
        if (window.auth && window.auth.isAuthenticated()) {
            this.loadSectionData(sectionName);
        }
    }

    async loadSectionData(sectionName) {
        try {
            switch (sectionName) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'transactions':
                    // Initialize and load transactions on demand
                    if (window.transactionManager) {
                        await window.transactionManager.ensureReady();
                        await window.transactionManager.loadTransactions();
                    }
                    break;
                case 'budgets':
                    // Initialize and load budgets on demand
                    if (window.budgetManager) {
                        await window.budgetManager.ensureReady();
                        await window.budgetManager.loadBudgets();
                    }
                    break;
                case 'bills':
                    // TODO: Load bills when implemented
                    break;
                case 'debts':
                    // TODO: Load debts when implemented
                    break;
                case 'goals':
                    // TODO: Load goals when implemented
                    break;
                case 'profile':
                    await this.loadProfile();
                    break;
            }
        } catch (error) {
            console.error(`Failed to load ${sectionName} data:`, error);
        }
    }

    async loadDashboard() {
        try {
            // Load transaction statistics
            const response = await api.getTransactionStats();
            const stats = response.stats;

            // Update dashboard cards
            document.getElementById('dashboardIncome').textContent = 
                utils.formatCurrency(stats.total_income || 0);
            document.getElementById('dashboardExpenses').textContent = 
                utils.formatCurrency(stats.total_expenses || 0);
            document.getElementById('dashboardNet').textContent = 
                utils.formatCurrency(stats.net_income || 0);
            document.getElementById('dashboardTransactions').textContent = 
                stats.total_transactions || 0;

            // Update net income color
            const netElement = document.getElementById('dashboardNet');
            const netIncome = stats.net_income || 0;
            netElement.className = netIncome >= 0 ? 'text-success' : 'text-danger';

        } catch (error) {
            console.error('Failed to load dashboard:', error);
            ['dashboardIncome', 'dashboardExpenses', 'dashboardNet', 'dashboardTransactions'].forEach(id => {
                const element = document.getElementById(id);
                if (element) element.textContent = '—';
            });
        }
    }

    async loadProfile() {
        try {
            const user = window.auth.getCurrentUser();
            if (user) {
                console.log('User profile:', user);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    }

    async refreshCurrentSection() {
        if (window.auth && window.auth.isAuthenticated()) {
            await this.loadSectionData(this.currentSection);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 FinanceManager v2 - Application Starting');
    
    const initApp = () => {
        if (window.auth) {
            window.app = new App();
            console.log('✅ Application initialized successfully');
        } else {
            setTimeout(initApp, 50);
        }
    };
    
    initApp();
});
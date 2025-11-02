// Main application controller
class App {
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        // Wait for auth to be ready
        if (window.auth && window.auth.isAuthenticated()) {
            this.bindEvents();
            this.showSection('dashboard');
        } else {
            // Check again after a short delay
            setTimeout(() => this.init(), 100);
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

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    async loadSectionData(sectionName) {
        try {
            switch (sectionName) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'transactions':
                    if (window.transactionManager) {
                        await window.transactionManager.loadTransactions();
                    }
                    break;
                case 'budgets':
                    // TODO: Load budgets
                    break;
                case 'bills':
                    // TODO: Load bills
                    break;
                case 'debts':
                    // TODO: Load debts
                    break;
                case 'goals':
                    // TODO: Load goals
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
            // Show error state in dashboard
            ['dashboardIncome', 'dashboardExpenses', 'dashboardNet', 'dashboardTransactions'].forEach(id => {
                const element = document.getElementById(id);
                if (element) element.textContent = 'Error';
            });
        }
    }

    async loadProfile() {
        try {
            const user = window.auth.getCurrentUser();
            if (user) {
                // TODO: Display user profile information
                console.log('User profile:', user);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    }

    // Utility method to refresh current section
    async refreshCurrentSection() {
        await this.loadSectionData(this.currentSection);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 FinanceManager v2 - Application Starting');
    
    // Wait for auth manager to be ready
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
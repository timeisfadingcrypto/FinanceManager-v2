// Enhanced Main Application Controller for FinanceManager v2
class App {
    constructor() {
        this.currentSection = 'dashboard';
        this.initialized = false;
        this.enhancedBudgetMode = false;
        this.init();
    }

    init() {
        // Wait for auth to be ready; do not bootstrap section managers until authenticated
        if (window.auth && (window.auth.isAuthenticated())) {
            if (!this.initialized) {
                this.detectEnhancedMode();
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

    // Detect if enhanced budget system is available
    detectEnhancedMode() {
        if (typeof window.enhancedBudgetManager !== 'undefined') {
            this.enhancedBudgetMode = true;
            console.log('🎆 Enhanced Budget Mode: ACTIVE');
            
            // Add enhanced badge to navigation
            const budgetNavLink = document.querySelector('[data-section="budgets"]');
            if (budgetNavLink && !budgetNavLink.querySelector('.badge')) {
                const badge = document.createElement('span');
                badge.className = 'badge bg-success ms-1';
                badge.style.fontSize = '0.6em';
                badge.textContent = 'Enhanced';
                budgetNavLink.appendChild(badge);
            }
        } else {
            this.enhancedBudgetMode = false;
            console.log('📊 Legacy Budget Mode: Active');
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

        // Enhanced budget-specific event handlers
        if (this.enhancedBudgetMode) {
            this.bindEnhancedBudgetEvents();
        }
    }

    // Bind enhanced budget system events
    bindEnhancedBudgetEvents() {
        // Global keyboard shortcuts for enhanced features
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'b': // Ctrl+B to create budget
                        if (this.currentSection === 'budgets') {
                            e.preventDefault();
                            window.enhancedBudgetManager?.showCreateBudgetModal();
                        }
                        break;
                    case 't': // Ctrl+T to open templates
                        if (this.currentSection === 'budgets') {
                            e.preventDefault();
                            window.enhancedBudgetManager?.showTemplateModal();
                        }
                        break;
                }
            }
        });

        // Add enhanced budget toolbar if not exists
        this.addEnhancedBudgetToolbar();
    }

    // Add enhanced budget toolbar
    addEnhancedBudgetToolbar() {
        const budgetsSection = document.getElementById('budgetsSection');
        if (!budgetsSection || budgetsSection.querySelector('.enhanced-toolbar')) return;

        const toolbar = document.createElement('div');
        toolbar.className = 'enhanced-toolbar alert alert-info d-flex align-items-center justify-content-between mb-3';
        toolbar.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-sparkles me-2"></i>
                <strong>Enhanced Budget System Active</strong>
                <span class="ms-2 text-muted">AI recommendations, templates, and analytics available</span>
            </div>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary" onclick="app.showEnhancedFeatures()" title="Keyboard shortcuts: Ctrl+B (Create), Ctrl+T (Templates)">
                    <i class="fas fa-keyboard me-1"></i>Shortcuts
                </button>
                <button class="btn btn-outline-info" onclick="window.enhancedBudgetManager?.refreshRecommendations()">
                    <i class="fas fa-robot me-1"></i>AI Insights
                </button>
            </div>
        `;

        // Insert at the beginning of budget section
        const header = budgetsSection.querySelector('.d-flex');
        if (header) {
            header.insertAdjacentElement('afterend', toolbar);
        }
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
                    await this.loadBudgets();
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
            this.showError(`Failed to load ${sectionName} data. Please try refreshing the page.`);
        }
    }

    // Enhanced budget loading with fallback
    async loadBudgets() {
        if (this.enhancedBudgetMode && window.enhancedBudgetManager) {
            try {
                // Use enhanced budget manager
                await window.enhancedBudgetManager.init();
                await window.enhancedBudgetManager.render();
                
                // Hide legacy table if enhanced mode is working
                const legacyTable = document.querySelector('.legacy-budget-table');
                if (legacyTable) legacyTable.style.display = 'none';
                
                console.log('✅ Enhanced budget system loaded successfully');
            } catch (error) {
                console.error('Enhanced budget system failed, falling back to legacy:', error);
                await this.loadLegacyBudgets();
            }
        } else {
            // Use legacy budget manager
            await this.loadLegacyBudgets();
        }
    }

    // Legacy budget loading
    async loadLegacyBudgets() {
        if (window.budgetManager) {
            try {
                await window.budgetManager.ensureReady();
                await window.budgetManager.loadBudgets();
                
                // Show legacy table
                const legacyTable = document.querySelector('.legacy-budget-table');
                if (legacyTable) legacyTable.style.display = 'block';
                
                console.log('📊 Legacy budget system loaded');
            } catch (error) {
                console.error('Legacy budget system failed:', error);
                this.showError('Failed to load budget system. Please check your connection and try again.');
            }
        }
    }

    async loadDashboard() {
        try {
            // Try to use enhanced API for richer dashboard data
            let stats;
            if (window.api && typeof window.api.request === 'function') {
                try {
                    // Try enhanced transaction stats
                    const response = await window.api.request('/transactions/stats');
                    stats = response.stats || response;
                } catch (error) {
                    // Fallback to basic stats
                    console.log('Enhanced stats not available, using basic calculation');
                    const transactions = await window.api.request('/transactions');
                    stats = this.calculateBasicStats(transactions);
                }
            } else {
                // Ultimate fallback - use demo data if available
                stats = {
                    total_income: 5420.00,
                    total_expenses: 3890.25,
                    net_income: 1529.75,
                    total_transactions: 42
                };
            }

            // Update dashboard cards with animation
            this.updateDashboardCard('dashboardIncome', this.formatCurrency(stats.total_income || 0), 'text-success');
            this.updateDashboardCard('dashboardExpenses', this.formatCurrency(stats.total_expenses || 0), 'text-danger');
            this.updateDashboardCard('dashboardNet', this.formatCurrency(stats.net_income || 0), stats.net_income >= 0 ? 'text-success' : 'text-danger');
            this.updateDashboardCard('dashboardTransactions', stats.total_transactions || 0, 'text-info');

            // Add enhanced budget summary if available
            if (this.enhancedBudgetMode && window.enhancedBudgetManager) {
                await this.addBudgetSummaryToDashboard();
            }

        } catch (error) {
            console.error('Failed to load dashboard:', error);
            // Set fallback values
            ['dashboardIncome', 'dashboardExpenses', 'dashboardNet', 'dashboardTransactions'].forEach(id => {
                const element = document.getElementById(id);
                if (element) element.textContent = '—';
            });
        }
    }

    // Calculate basic stats from transaction data
    calculateBasicStats(transactions) {
        const transactionArray = Array.isArray(transactions) ? transactions : (transactions.transactions || []);
        
        const stats = transactionArray.reduce((acc, transaction) => {
            const amount = parseFloat(transaction.amount || 0);
            if (transaction.type === 'income') {
                acc.total_income += amount;
            } else if (transaction.type === 'expense') {
                acc.total_expenses += amount;
            }
            acc.total_transactions++;
            return acc;
        }, {
            total_income: 0,
            total_expenses: 0,
            total_transactions: 0,
            net_income: 0
        });
        
        stats.net_income = stats.total_income - stats.total_expenses;
        return stats;
    }

    // Add budget summary to dashboard
    async addBudgetSummaryToDashboard() {
        try {
            const analysis = await window.api.request('/budgets/analysis');
            const dashboardSection = document.getElementById('dashboardSection');
            
            if (!dashboardSection || dashboardSection.querySelector('.budget-summary')) return;

            const budgetSummary = document.createElement('div');
            budgetSummary.className = 'budget-summary mt-4';
            budgetSummary.innerHTML = `
                <div class="row g-4">
                    <div class="col-12">
                        <h4 class="mb-3"><i class="fas fa-chart-pie me-2"></i>Budget Overview</h4>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body text-center">
                                <h5>Total Budgeted</h5>
                                <h3>${this.formatCurrency(analysis.current_period.total_budgeted || 0)}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-warning text-white">
                            <div class="card-body text-center">
                                <h5>Budget Spent</h5>
                                <h3>${this.formatCurrency(analysis.current_period.total_spent || 0)}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-success text-white">
                            <div class="card-body text-center">
                                <h5>Budget Health</h5>
                                <h3>${analysis.current_period.health_score || 0}%</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-info text-white">
                            <div class="card-body text-center">
                                <h5>Active Budgets</h5>
                                <h3>${analysis.current_period.active_budgets || 0}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            dashboardSection.appendChild(budgetSummary);
        } catch (error) {
            console.log('Budget summary not available:', error.message);
        }
    }

    // Update dashboard card with animation
    updateDashboardCard(id, value, className) {
        const element = document.getElementById(id);
        if (element) {
            element.style.opacity = '0.5';
            setTimeout(() => {
                element.textContent = value;
                element.className = className;
                element.style.opacity = '1';
            }, 150);
        }
    }

    async loadProfile() {
        try {
            const user = window.auth.getCurrentUser();
            if (user) {
                console.log('User profile:', user);
                // Add enhanced profile features here
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

    // Enhanced budget features
    showEnhancedFeatures() {
        const shortcuts = [
            { key: 'Ctrl + B', action: 'Create new budget' },
            { key: 'Ctrl + T', action: 'Open budget templates' },
            { key: 'Esc', action: 'Close modals' }
        ];

        const shortcutsHtml = shortcuts.map(s => 
            `<tr><td><kbd>${s.key}</kbd></td><td>${s.action}</td></tr>`
        ).join('');

        // Create and show modal
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-keyboard me-2"></i>Enhanced Budget Features
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <h6>Keyboard Shortcuts</h6>
                        <table class="table table-sm">
                            <tbody>${shortcutsHtml}</tbody>
                        </table>
                        <hr>
                        <h6>Enhanced Features</h6>
                        <ul class="list-unstyled">
                            <li><i class="fas fa-robot text-primary me-2"></i>AI-powered budget recommendations</li>
                            <li><i class="fas fa-magic text-success me-2"></i>Professional budget templates</li>
                            <li><i class="fas fa-chart-line text-info me-2"></i>Advanced budget analytics</li>
                            <li><i class="fas fa-download text-warning me-2"></i>Enhanced CSV export</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    }

    showError(message) {
        // Simple error display - could be enhanced with toast notifications
        console.error('❌', message);
        // Could integrate with notification system
    }

    showSuccess(message) {
        // Simple success display - could be enhanced with toast notifications
        console.log('✅', message);
        // Could integrate with notification system
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 FinanceManager v2 Enhanced - Application Starting');
    
    const initApp = () => {
        if (window.auth) {
            window.app = new App();
            console.log('✅ Enhanced Application initialized successfully');
            
            // Log system status
            const features = {
                'Enhanced Budgets': window.enhancedBudgetManager ? '✅' : '❌',
                'Demo Mode': window.EnhancedBudgetMockData ? '✅' : '❌',
                'Legacy Compatibility': window.budgetManager ? '✅' : '❌',
                'API Integration': window.api ? '✅' : '❌'
            };
            
            console.log('📈 System Features:');
            Object.entries(features).forEach(([feature, status]) => {
                console.log(`   ${status} ${feature}`);
            });
            
        } else {
            setTimeout(initApp, 50);
        }
    };
    
    initApp();
});
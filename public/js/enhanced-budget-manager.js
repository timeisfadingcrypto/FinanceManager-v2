/**
 * Enhanced Budget Manager - Comprehensive Budget Management System
 * Provides advanced budget functionality including templates, AI recommendations, and analytics
 */

class EnhancedBudgetManager {
    constructor() {
        this.budgets = [];
        this.categories = [];
        this.analysis = null;
        this.recommendations = [];
        this.templates = [];
        this.initialized = false;
        this.apiClient = window.api || this.createFallbackApiClient();
    }

    // Fallback API client if window.api doesn't exist
    createFallbackApiClient() {
        return {
            async request(endpoint, options = {}) {
                const token = localStorage.getItem('token');
                const headers = {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                };
                
                const response = await fetch(`/api${endpoint}`, {
                    ...options,
                    headers: { ...headers, ...options.headers }
                });
                
                if (!response.ok) {
                    throw new Error(`API request failed: ${response.statusText}`);
                }
                
                return response.json();
            }
        };
    }

    // Initialize the budget manager
    async init() {
        if (this.initialized) return;
        
        try {
            console.log('🎯 Initializing Enhanced Budget Manager...');
            
            // Load all budget data in parallel
            await Promise.all([
                this.loadBudgets(),
                this.loadCategories(),
                this.loadAnalysis(),
                this.loadTemplates()
            ]);
            
            this.bindEvents();
            this.initialized = true;
            
            console.log('✅ Enhanced Budget Manager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Enhanced Budget Manager:', error);
            this.showError('Failed to initialize budget system. Please refresh the page.');
        }
    }

    // Load budgets with enhanced data
    async loadBudgets() {
        try {
            this.budgets = await this.apiClient.request('/budgets');
            console.log(`📊 Loaded ${this.budgets.length} budgets`);
        } catch (error) {
            console.error('Error loading budgets:', error);
            this.budgets = [];
        }
    }

    // Load categories with spending insights
    async loadCategories() {
        try {
            this.categories = await this.apiClient.request('/budgets/categories');
            console.log(`📂 Loaded ${this.categories.length} categories`);
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = [];
        }
    }

    // Load budget analysis and metrics
    async loadAnalysis() {
        try {
            this.analysis = await this.apiClient.request('/budgets/analysis');
            console.log('📈 Budget analysis loaded');
        } catch (error) {
            console.error('Error loading analysis:', error);
            this.analysis = null;
        }
    }

    // Load AI recommendations
    async loadRecommendations() {
        try {
            const data = await this.apiClient.request('/budgets/recommendations');
            this.recommendations = data.recommendations || [];
            console.log(`🤖 Loaded ${this.recommendations.length} AI recommendations`);
        } catch (error) {
            console.error('Error loading recommendations:', error);
            this.recommendations = [];
        }
    }

    // Load budget templates
    async loadTemplates() {
        try {
            this.templates = await this.apiClient.request('/budgets/templates');
            console.log(`📋 Loaded ${this.templates.length} budget templates`);
        } catch (error) {
            console.error('Error loading templates:', error);
            this.templates = [];
        }
    }

    // Render the complete budget interface
    async render() {
        const budgetsSection = document.getElementById('budgetsSection');
        if (!budgetsSection) return;

        // Clear existing content
        const existingContent = budgetsSection.querySelector('.budget-content');
        if (existingContent) {
            existingContent.remove();
        }

        // Create enhanced budget interface
        const content = document.createElement('div');
        content.className = 'budget-content';
        content.innerHTML = this.generateBudgetHTML();

        // Insert after header
        const header = budgetsSection.querySelector('.d-flex');
        if (header) {
            header.insertAdjacentElement('afterend', content);
        } else {
            budgetsSection.appendChild(content);
        }

        // Render components
        this.renderMetrics();
        this.renderBudgetsList();
        await this.renderRecommendations();
        this.renderCharts();
    }

    // Generate main budget HTML structure
    generateBudgetHTML() {
        return `
            <!-- Budget Metrics -->
            <div class="row g-4 mb-4">
                <div class="col-md-3">
                    <div class="card text-center metric-card">
                        <div class="card-body">
                            <h5 class="card-title">Current Month</h5>
                            <h4 class="text-primary" id="currentMonth">${this.getCurrentMonth()}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center metric-card">
                        <div class="card-body">
                            <h5 class="card-title">Total Budget</h5>
                            <h4 class="text-info" id="totalBudget">$0.00</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center metric-card">
                        <div class="card-body">
                            <h5 class="card-title">Total Spent</h5>
                            <h4 class="text-warning" id="totalSpent">$0.00</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center metric-card">
                        <div class="card-body">
                            <h5 class="card-title">Remaining</h5>
                            <h4 class="text-success" id="remainingBudget">$0.00</h4>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Budget Charts -->
            <div class="row g-4 mb-4">
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Budget Health</h6>
                        </div>
                        <div class="card-body text-center">
                            <div class="progress-ring mb-3" id="healthScoreRing">
                                <span class="health-score-text">0%</span>
                            </div>
                            <small class="text-muted">Overall budget health</small>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Budget Status</h6>
                        </div>
                        <div class="card-body">
                            <canvas id="budgetStatusChart" width="250" height="200"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Monthly Trend</h6>
                        </div>
                        <div class="card-body">
                            <canvas id="budgetTrendChart" width="250" height="200"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- AI Recommendations Section -->
            <div id="recommendationsSection" class="mb-4" style="display: none;">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">🤖 AI Budget Recommendations</h5>
                        <button class="btn btn-outline-secondary btn-sm" onclick="enhancedBudgetManager.refreshRecommendations()">
                            <i class="fas fa-refresh me-1"></i>Refresh
                        </button>
                    </div>
                    <div class="card-body">
                        <div id="recommendationsList">Loading recommendations...</div>
                    </div>
                </div>
            </div>

            <!-- Budget Categories List -->
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Budget Categories</h5>
                    <div class="btn-group">
                        <button class="btn btn-outline-success btn-sm" onclick="enhancedBudgetManager.exportBudgets()">
                            <i class="fas fa-download me-1"></i>Export CSV
                        </button>
                        <button class="btn btn-outline-info btn-sm" onclick="enhancedBudgetManager.showTemplateModal()">
                            <i class="fas fa-magic me-1"></i>Templates
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="budgetCategoriesList">
                        <div class="text-center py-3">Loading budget categories...</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Render budget metrics
    renderMetrics() {
        if (!this.analysis) return;

        const { current_period } = this.analysis;
        
        // Update metric cards
        this.updateElement('totalBudget', this.formatCurrency(current_period.total_budgeted || 0));
        this.updateElement('totalSpent', this.formatCurrency(current_period.total_spent || 0));
        this.updateElement('remainingBudget', this.formatCurrency(current_period.total_remaining || 0));
        
        // Update health score with visual indicator
        const healthScore = parseInt(current_period.health_score || 0);
        this.updateHealthScore(healthScore);
    }

    // Update health score with progress ring
    updateHealthScore(score) {
        const ring = document.getElementById('healthScoreRing');
        const text = ring?.querySelector('.health-score-text');
        
        if (text) {
            text.textContent = `${score}%`;
            text.className = `health-score-text ${
                score >= 80 ? 'text-success' : 
                score >= 60 ? 'text-warning' : 'text-danger'
            }`;
        }
        
        // Update progress ring (simplified version)
        if (ring) {
            const color = score >= 80 ? '#28a745' : score >= 60 ? '#ffc107' : '#dc3545';
            ring.style.background = `conic-gradient(${color} ${score * 3.6}deg, #e9ecef 0deg)`;
        }
    }

    // Render budgets list with enhanced cards
    renderBudgetsList() {
        const container = document.getElementById('budgetCategoriesList');
        if (!container) return;

        if (this.budgets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-pie fa-3x mb-3 text-muted"></i>
                    <h5>No Budgets Yet</h5>
                    <p class="text-muted">Start by creating your first budget or using a template</p>
                    <button class="btn btn-primary" onclick="enhancedBudgetManager.showCreateBudgetModal()">
                        <i class="fas fa-plus me-2"></i>Create Budget
                    </button>
                </div>
            `;
            return;
        }

        const budgetCards = this.budgets.map(budget => this.createBudgetCard(budget)).join('');
        container.innerHTML = `<div class="row g-3">${budgetCards}</div>`;
    }

    // Create individual budget card
    createBudgetCard(budget) {
        const progress = Math.min(100, budget.percentage_used || 0);
        const statusClass = this.getBudgetStatusClass(budget.status);
        const statusIcon = this.getBudgetStatusIcon(budget.status);
        
        return `
            <div class="col-md-6 col-lg-4">
                <div class="card budget-card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="d-flex align-items-center">
                                <i class="${budget.category_icon || 'fas fa-circle'} me-2" style="color: ${budget.category_color || '#6c757d'}"></i>
                                <h6 class="mb-0">${budget.category || 'Unknown Category'}</h6>
                            </div>
                            <span class="badge ${statusClass}">
                                ${statusIcon} ${this.formatStatus(budget.status)}
                            </span>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between small text-muted mb-1">
                                <span>Progress</span>
                                <span>${progress.toFixed(1)}%</span>
                            </div>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar ${this.getProgressBarClass(budget.status)}" 
                                     style="width: ${Math.min(100, progress)}%"></div>
                            </div>
                        </div>
                        
                        <div class="row text-center">
                            <div class="col-4">
                                <div class="small text-muted">Budget</div>
                                <div class="fw-bold">${this.formatCurrency(budget.amount || 0)}</div>
                            </div>
                            <div class="col-4">
                                <div class="small text-muted">Spent</div>
                                <div class="fw-bold">${this.formatCurrency(budget.spent || 0)}</div>
                            </div>
                            <div class="col-4">
                                <div class="small text-muted">Remaining</div>
                                <div class="fw-bold ${budget.remaining < 0 ? 'text-danger' : 'text-success'}">
                                    ${this.formatCurrency(budget.remaining || 0)}
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-3">
                            <div class="small text-muted mb-1">
                                ${budget.transaction_count || 0} transactions • ${budget.period || 'monthly'}
                                ${budget.days_remaining ? ` • ${budget.days_remaining} days left` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-footer bg-transparent">
                        <div class="btn-group w-100">
                            <button class="btn btn-outline-primary btn-sm" onclick="enhancedBudgetManager.showPerformanceModal(${budget.id})">
                                <i class="fas fa-chart-line me-1"></i>Performance
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="enhancedBudgetManager.editBudget(${budget.id})">
                                <i class="fas fa-edit me-1"></i>Edit
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="enhancedBudgetManager.deleteBudget(${budget.id})">
                                <i class="fas fa-trash me-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Render AI recommendations
    async renderRecommendations() {
        await this.loadRecommendations();
        
        const section = document.getElementById('recommendationsSection');
        const container = document.getElementById('recommendationsList');
        
        if (!section || !container) return;
        
        if (this.recommendations.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        
        const recommendationCards = this.recommendations.map(rec => `
            <div class="card recommendation-card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-circle me-2" style="color: ${rec.color}"></i>
                                <h6 class="mb-0">${rec.category}</h6>
                                <span class="badge ms-2 ${
                                    rec.confidence === 'high' ? 'bg-success' :
                                    rec.confidence === 'medium' ? 'bg-warning' : 'bg-secondary'
                                }">${rec.confidence} confidence</span>
                            </div>
                            <p class="text-muted mb-2">${rec.reasoning}</p>
                            <div class="small">
                                <strong>${this.formatRecommendationType(rec.recommendation_type)}</strong>: 
                                ${this.formatCurrency(rec.recommended_amount)}
                                ${rec.current_budget > 0 ? ` (currently ${this.formatCurrency(rec.current_budget)})` : ''}
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn btn-primary btn-sm" 
                                    onclick="enhancedBudgetManager.applyRecommendation(${rec.category_id}, ${rec.recommended_amount}, '${rec.category}')">
                                <i class="fas fa-magic me-1"></i>Apply
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = recommendationCards;
    }

    // Bind event handlers
    bindEvents() {
        // Existing budget modal handlers
        const addBudgetBtn = document.getElementById('addBudgetBtn');
        if (addBudgetBtn) {
            addBudgetBtn.addEventListener('click', () => this.showCreateBudgetModal());
        }

        // Enhanced create budget form
        const budgetForm = document.getElementById('budgetForm');
        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => this.handleBudgetSubmit(e));
        }
    }

    // Show create budget modal with enhanced features
    showCreateBudgetModal() {
        const modal = document.getElementById('budgetModal');
        const title = document.getElementById('budgetModalTitle');
        const form = document.getElementById('budgetForm');
        
        if (title) title.textContent = 'Create Budget';
        if (form) form.reset();
        
        // Populate categories with spending insights
        this.populateCategorySelect('budgetCategory', true);
        
        // Set default start date to today
        const startDateField = document.getElementById('budgetStartDate');
        if (startDateField) {
            startDateField.value = new Date().toISOString().split('T')[0];
        }
        
        if (modal && window.bootstrap) {
            new bootstrap.Modal(modal).show();
        }
    }

    // Populate category select with enhanced data
    populateCategorySelect(selectId, showInsights = false) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '<option value="">Select Category</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            
            let text = category.name;
            if (showInsights && category.avg_monthly_spending > 0) {
                text += ` (avg: ${this.formatCurrency(category.avg_monthly_spending)})`;
            }
            
            option.textContent = text;
            option.style.color = category.color;
            
            select.appendChild(option);
        });
    }

    // Handle budget form submission
    async handleBudgetSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const budgetData = {
            category_id: parseInt(formData.get('category_id') || document.getElementById('budgetCategory')?.value),
            amount: parseFloat(formData.get('amount') || document.getElementById('budgetAmount')?.value),
            period: formData.get('period') || document.getElementById('budgetPeriod')?.value || 'monthly',
            start_date: formData.get('start_date') || document.getElementById('budgetStartDate')?.value,
            description: formData.get('description') || document.getElementById('budgetDescription')?.value || '',
            is_active: formData.get('is_active') || document.getElementById('budgetIsActive')?.checked !== false
        };
        
        try {
            const result = await this.apiClient.request('/budgets', {
                method: 'POST',
                body: JSON.stringify(budgetData)
            });
            
            this.showSuccess('Budget created successfully!');
            
            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('budgetModal'));
            if (modal) modal.hide();
            
            // Refresh data and UI
            await this.refreshAll();
            
        } catch (error) {
            console.error('Create budget error:', error);
            this.showError('Failed to create budget: ' + error.message);
        }
    }

    // Utility methods
    getCurrentMonth() {
        return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    }

    getBudgetStatusClass(status) {
        switch (status) {
            case 'over_budget': return 'bg-danger';
            case 'warning': return 'bg-warning';
            case 'on_track': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    getBudgetStatusIcon(status) {
        switch (status) {
            case 'over_budget': return '⚠️';
            case 'warning': return '📊';
            case 'on_track': return '✅';
            default: return '📋';
        }
    }

    getProgressBarClass(status) {
        switch (status) {
            case 'over_budget': return 'bg-danger';
            case 'warning': return 'bg-warning';
            case 'on_track': return 'bg-success';
            default: return 'bg-primary';
        }
    }

    formatStatus(status) {
        return (status || 'unknown').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    formatRecommendationType(type) {
        switch (type) {
            case 'create': return 'Create Budget';
            case 'increase': return 'Increase Budget';
            case 'decrease': return 'Decrease Budget';
            default: return 'Maintain Budget';
        }
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) element.textContent = content;
    }

    showSuccess(message) {
        // Implement success notification
        console.log('✅', message);
        // Could integrate with toast notification system
    }

    showError(message) {
        // Implement error notification  
        console.error('❌', message);
        // Could integrate with toast notification system
    }

    // Refresh all data and re-render
    async refreshAll() {
        await Promise.all([
            this.loadBudgets(),
            this.loadAnalysis(),
            this.loadCategories()
        ]);
        await this.render();
    }

    // Placeholder methods for future implementation
    async showTemplateModal() {
        console.log('🔧 Template modal - to be implemented');
    }

    async showPerformanceModal(budgetId) {
        console.log('🔧 Performance modal for budget', budgetId, '- to be implemented');
    }

    async editBudget(budgetId) {
        console.log('🔧 Edit budget', budgetId, '- to be implemented');
    }

    async deleteBudget(budgetId) {
        console.log('🔧 Delete budget', budgetId, '- to be implemented');
    }

    async applyRecommendation(categoryId, amount, categoryName) {
        console.log('🔧 Apply recommendation for', categoryName, '- to be implemented');
    }

    async exportBudgets() {
        console.log('🔧 Export budgets - to be implemented');
    }

    async refreshRecommendations() {
        await this.renderRecommendations();
    }

    renderCharts() {
        // Placeholder for chart rendering
        console.log('🔧 Chart rendering - to be implemented');
    }
}

// Initialize and expose globally
if (typeof window !== 'undefined') {
    window.EnhancedBudgetManager = EnhancedBudgetManager;
    window.enhancedBudgetManager = new EnhancedBudgetManager();
    console.log('🎯 Enhanced Budget Manager loaded and ready');
}
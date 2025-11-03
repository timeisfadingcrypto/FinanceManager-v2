/**
 * Enhanced Budget Management System for FinanceManager v2
 * Integrates with the comprehensive budget system including AI recommendations and templates
 */

class BudgetManager {
    constructor() {
        this.budgets = [];
        this.categories = [];
        this.currentBudget = null;
        this.ready = false;
        this.categoriesRendered = false;
        this.enhancedMode = false;
        
        // Initialize enhanced budget manager if available
        this.initializeEnhanced();
    }

    // Initialize enhanced mode if EnhancedBudgetManager is available
    initializeEnhanced() {
        if (typeof window.enhancedBudgetManager !== 'undefined') {
            this.enhancedMode = true;
            console.log('✅ Enhanced Budget Manager integration active');
        }
    }

    async ensureReady() {
        if (this.ready) return;
        
        if (this.enhancedMode) {
            // Use enhanced budget manager
            await window.enhancedBudgetManager.init();
        } else {
            // Fall back to legacy mode
            await this.loadCategories();
            this.bindEvents();
        }
        
        this.ready = true;
    }

    async loadBudgets() {
        if (this.enhancedMode) {
            // Use enhanced budget manager for loading and rendering
            await window.enhancedBudgetManager.render();
            return;
        }
        
        // Legacy budget loading
        try {
            const response = await api.request('/budgets');
            this.budgets = Array.isArray(response) ? response : (response.budgets || []);
            this.renderBudgets();
        } catch (error) {
            console.error('Failed to load budgets:', error);
            this.showAlert('Failed to load budgets', 'danger');
            this.renderError();
        }
    }

    bindEvents() {
        // Enhanced create budget button
        const addBtn = document.getElementById('addBudgetBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (this.enhancedMode) {
                    window.enhancedBudgetManager.showCreateBudgetModal();
                } else {
                    this.showModal();
                }
            });
        }

        // Legacy modal save button
        const saveBtn = document.getElementById('saveBudgetBtn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveBudget());

        // Legacy table event handlers
        const tbody = document.getElementById('budgetsList');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.action-edit');
                const deleteBtn = e.target.closest('.action-delete');
                if (editBtn) {
                    const id = parseInt(editBtn.dataset.id, 10);
                    if (!Number.isNaN(id)) this.editBudget(id);
                } else if (deleteBtn) {
                    const id = parseInt(deleteBtn.dataset.id, 10);
                    if (!Number.isNaN(id)) this.deleteBudget(id);
                }
            });
        }

        const modal = document.getElementById('budgetModal');
        if (modal) modal.addEventListener('hidden.bs.modal', () => this.resetModal());
    }

    async loadCategories() {
        try {
            if (this.categories.length === 0) {
                const response = await api.request('/categories');
                this.categories = (response.categories || response || [])
                    .filter(c => c.type === 'expense' || c.type === 'both');
            }
            this.populateCategories();
        } catch (error) {
            console.error('Failed to load categories:', error);
            this.showAlert('Failed to load categories', 'warning');
        }
    }

    populateCategories(force = false) {
        const select = document.getElementById('budgetCategory');
        if (!select) return;
        if (this.categoriesRendered && !force) return;

        const frag = document.createDocumentFragment();
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select Category';
        frag.appendChild(placeholder);

        this.categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            frag.appendChild(opt);
        });

        select.innerHTML = '';
        select.appendChild(frag);
        this.categoriesRendered = true;
    }

    // Enhanced budget rendering with fallback to legacy
    renderBudgets() {
        if (this.enhancedMode) {
            // Enhanced mode handles rendering internally
            return;
        }
        
        // Legacy rendering
        const tbody = document.getElementById('budgetsList');
        if (!tbody) return;

        if (this.budgets.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="text-muted">
                            <i class="fas fa-chart-pie fa-2x mb-2"></i>
                            <p>No budgets found. Create your first budget!</p>
                            <button class="btn btn-primary" onclick="budgetManager.showModal()">
                                <i class="fas fa-plus me-2"></i>Create Budget
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.budgets.map(budget => {
            const spent = budget.spent || 0;
            const remaining = Math.max(0, budget.amount - spent);
            const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            const progressColor = progress > 100 ? 'danger' : progress > 80 ? 'warning' : 'success';
            const statusBadge = budget.is_active ? 
                '<span class="badge bg-success">Active</span>' : 
                '<span class="badge bg-secondary">Inactive</span>';

            return `
                <tr class="fade-in">
                    <td>
                        <span class="category-badge d-inline-flex align-items-center" style="color: ${budget.category_color || '#6c757d'}">
                            <i class="${budget.category_icon || 'fas fa-circle'} me-2"></i>
                            ${budget.category || budget.category_name || 'Unknown'}
                        </span>
                    </td>
                    <td><strong>${this.formatCurrency(budget.amount)}</strong></td>
                    <td><span class="text-danger">${this.formatCurrency(spent)}</span></td>
                    <td><span class="text-${remaining > 0 ? 'success' : 'danger'}">${this.formatCurrency(remaining)}</span></td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="progress me-2" style="width: 120px; height: 20px;">
                                <div class="progress-bar bg-${progressColor}" style="width: ${Math.min(progress, 100)}%"></div>
                            </div>
                            <small class="text-muted">${progress.toFixed(0)}%</small>
                        </div>
                    </td>
                    <td>
                        ${statusBadge}
                        <small class="d-block text-muted">${budget.period}</small>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline-primary action-edit" data-id="${budget.id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger action-delete" data-id="${budget.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderError() {
        const tbody = document.getElementById('budgetsList');
        if (!tbody) return;
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="text-danger">
                        <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                        <p>Failed to load budgets. Please try again.</p>
                        <button class="btn btn-outline-primary btn-sm" onclick="budgetManager.loadBudgets()">
                            <i class="fas fa-rotate-right me-1"></i>Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    showModal(budget = null) {
        this.currentBudget = budget;
        const modal = new bootstrap.Modal(document.getElementById('budgetModal'));
        const title = document.getElementById('budgetModalTitle');
        const saveBtn = document.getElementById('saveBudgetBtn');
        
        if (budget) {
            title.textContent = 'Edit Budget';
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Update Budget';
            this.populateForm(budget);
        } else {
            title.textContent = 'Add Budget';
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Budget';
            const startDateField = document.getElementById('budgetStartDate');
            if (startDateField) {
                startDateField.value = new Date().toISOString().split('T')[0];
            }
        }
        
        modal.show();
    }

    populateForm(budget) {
        const fields = {
            budgetCategory: budget.category_id,
            budgetAmount: budget.amount,
            budgetPeriod: budget.period,
            budgetStartDate: budget.start_date,
            budgetDescription: budget.description || '',
            budgetIsActive: budget.is_active
        };
        
        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        });
    }

    resetModal() {
        this.currentBudget = null;
        const form = document.getElementById('budgetForm');
        if (form) form.reset();
        const alert = document.getElementById('budgetAlert');
        if (alert) alert.innerHTML = '';
    }

    async saveBudget() {
        try {
            // Basic validation
            const categoryId = document.getElementById('budgetCategory')?.value;
            const amount = document.getElementById('budgetAmount')?.value;
            const period = document.getElementById('budgetPeriod')?.value;
            const startDate = document.getElementById('budgetStartDate')?.value;
            
            if (!categoryId || !amount || !period || !startDate) {
                this.showAlert('Please fill in all required fields', 'warning', 'budgetAlert');
                return;
            }

            const formData = {
                category_id: parseInt(categoryId),
                amount: parseFloat(amount),
                period: period,
                start_date: startDate,
                description: document.getElementById('budgetDescription')?.value || '',
                is_active: document.getElementById('budgetIsActive')?.checked !== false
            };

            const btn = document.getElementById('saveBudgetBtn');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
            btn.disabled = true;

            let response;
            if (this.currentBudget) {
                response = await api.request(`/budgets/${this.currentBudget.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
                this.showAlert('Budget updated successfully!', 'success');
            } else {
                response = await api.request('/budgets', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                this.showAlert('Budget created successfully!', 'success');
            }

            // Close modal
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('budgetModal'));
            if (modalInstance) modalInstance.hide();
            
            // Refresh data
            await this.loadBudgets();
            
            // Refresh dashboard if we're on it
            if (window.app && window.app.currentSection === 'dashboard') {
                window.app.loadDashboard();
            }
            
        } catch (error) {
            console.error('Failed to save budget:', error);
            this.showAlert(error.message || 'Failed to save budget', 'danger', 'budgetAlert');
        } finally {
            const btn = document.getElementById('saveBudgetBtn');
            const text = this.currentBudget ? 'Update Budget' : 'Save Budget';
            btn.innerHTML = `<i class="fas fa-save me-2"></i>${text}`;
            btn.disabled = false;
        }
    }

    async editBudget(id) {
        try {
            const response = await api.request(`/budgets/${id}`);
            const budget = response.budget || response;
            this.showModal(budget);
        } catch (error) {
            console.error('Failed to load budget:', error);
            this.showAlert('Failed to load budget for editing', 'danger');
        }
    }

    async deleteBudget(id) {
        if (!confirm('Are you sure you want to delete this budget? This action cannot be undone.')) {
            return;
        }
        
        try {
            await api.request(`/budgets/${id}`, { method: 'DELETE' });
            this.showAlert('Budget deleted successfully!', 'success');
            await this.loadBudgets();
            
            if (window.app && window.app.currentSection === 'dashboard') {
                window.app.loadDashboard();
            }
        } catch (error) {
            console.error('Failed to delete budget:', error);
            this.showAlert('Failed to delete budget', 'danger');
        }
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    }

    showAlert(message, type = 'info', containerId = null) {
        // Simple alert implementation - could be enhanced with toast notifications
        const container = containerId ? document.getElementById(containerId) : null;
        if (container) {
            container.innerHTML = `
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
            // Could integrate with global notification system
        }
    }

    // Enhanced mode integration methods
    async refreshAll() {
        if (this.enhancedMode) {
            await window.enhancedBudgetManager.refreshAll();
        } else {
            await this.loadBudgets();
        }
    }

    // Export budgets (enhanced mode integration)
    async exportBudgets() {
        if (this.enhancedMode) {
            return window.enhancedBudgetManager.exportBudgets();
        }
        
        // Legacy CSV export
        try {
            const csvData = this.budgets.map(budget => ({
                'Category': budget.category || budget.category_name,
                'Budget Amount': budget.amount,
                'Amount Spent': budget.spent || 0,
                'Remaining': budget.amount - (budget.spent || 0),
                'Period': budget.period,
                'Status': budget.is_active ? 'Active' : 'Inactive',
                'Start Date': budget.start_date
            }));
            
            this.downloadCSV(csvData, 'budgets.csv');
        } catch (error) {
            console.error('Export failed:', error);
            this.showAlert('Failed to export budgets', 'danger');
        }
    }

    downloadCSV(data, filename) {
        if (data.length === 0) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Initialize global budget manager
window.budgetManager = new BudgetManager();

// Enhanced mode announcement
if (window.budgetManager.enhancedMode) {
    console.log('🎆 Enhanced Budget System Active - Full feature set available');
} else {
    console.log('📋 Legacy Budget System - Basic functionality available');
}
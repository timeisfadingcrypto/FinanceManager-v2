// Budget management
class BudgetManager {
    constructor() {
        this.budgets = [];
        this.categories = [];
        this.currentBudget = null;
        this.ready = false;
        this.categoriesRendered = false;
    }

    async ensureReady() {
        if (this.ready) return;
        await this.loadCategories();
        this.bindEvents();
        this.ready = true;
    }

    bindEvents() {
        const addBtn = document.getElementById('addBudgetBtn');
        if (addBtn) addBtn.addEventListener('click', () => this.showModal());

        const saveBtn = document.getElementById('saveBudgetBtn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveBudget());

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
                const response = await api.getCategories();
                this.categories = response.categories.filter(c => c.type === 'expense' || c.type === 'both');
            }
            this.populateCategories();
        } catch (error) {
            console.error('Failed to load categories:', error);
            utils.showAlert('Failed to load categories', 'warning');
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

    async loadBudgets() {
        try {
            const response = await api.getBudgets();
            this.budgets = response.budgets || [];
            this.renderBudgets();
        } catch (error) {
            console.error('Failed to load budgets:', error);
            utils.showAlert('Failed to load budgets', 'danger');
            this.renderError();
        }
    }

    renderBudgets() {
        const tbody = document.getElementById('budgetsList');
        if (!tbody) return;

        if (this.budgets.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="text-muted">
                            <i class="fas fa-chart-pie fa-2x mb-2"></i>
                            <p>No budgets found. Create your first budget!</p>
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
                        <span class="category-badge" style="background-color: ${budget.category_color || '#6c757d'}">
                            <i class="${budget.category_icon || 'fas fa-circle'}"></i>
                            ${budget.category_name || 'Unknown'}
                        </span>
                    </td>
                    <td><strong>${utils.formatCurrency(budget.amount)}</strong></td>
                    <td><span class="text-danger">${utils.formatCurrency(spent)}</span></td>
                    <td><span class="text-${remaining > 0 ? 'success' : 'danger'}">${utils.formatCurrency(remaining)}</span></td>
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
                        <button class="btn btn-outline-primary btn-sm" id="retryLoadBudgets">
                            <i class="fas fa-rotate-right me-1"></i>Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
        const retryBtn = document.getElementById('retryLoadBudgets');
        if (retryBtn) retryBtn.addEventListener('click', () => this.loadBudgets());
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
            document.getElementById('budgetStartDate').value = new Date().toISOString().split('T')[0];
        }
        
        modal.show();
    }

    populateForm(budget) {
        document.getElementById('budgetCategory').value = budget.category_id;
        document.getElementById('budgetAmount').value = budget.amount;
        document.getElementById('budgetPeriod').value = budget.period;
        document.getElementById('budgetStartDate').value = budget.start_date;
        document.getElementById('budgetDescription').value = budget.description || '';
        document.getElementById('budgetIsActive').checked = budget.is_active;
    }

    resetModal() {
        this.currentBudget = null;
        const form = document.getElementById('budgetForm');
        if (form) form.reset();
        document.getElementById('budgetAlert').innerHTML = '';
    }

    async saveBudget() {
        try {
            if (!utils.validateForm('budgetForm')) {
                utils.showAlert('Please fill in all required fields', 'warning', 'budgetAlert');
                return;
            }

            const formData = {
                category_id: parseInt(document.getElementById('budgetCategory').value),
                amount: parseFloat(document.getElementById('budgetAmount').value),
                period: document.getElementById('budgetPeriod').value,
                start_date: document.getElementById('budgetStartDate').value,
                description: document.getElementById('budgetDescription').value || null,
                is_active: document.getElementById('budgetIsActive').checked
            };

            const btn = document.getElementById('saveBudgetBtn');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
            btn.disabled = true;

            if (this.currentBudget) {
                await api.updateBudget(this.currentBudget.id, formData);
                utils.showAlert('Budget updated successfully!', 'success');
            } else {
                await api.createBudget(formData);
                utils.showAlert('Budget created successfully!', 'success');
            }

            bootstrap.Modal.getInstance(document.getElementById('budgetModal')).hide();
            await this.loadBudgets();
            
            if (window.app && window.app.currentSection === 'dashboard') {
                window.app.loadDashboard();
            }
        } catch (error) {
            console.error('Failed to save budget:', error);
            utils.showAlert(error.message, 'danger', 'budgetAlert');
        } finally {
            const btn = document.getElementById('saveBudgetBtn');
            const text = this.currentBudget ? 'Update Budget' : 'Save Budget';
            btn.innerHTML = `<i class="fas fa-save me-2"></i>${text}`;
            btn.disabled = false;
        }
    }

    async editBudget(id) {
        try {
            const response = await api.getBudget(id);
            this.showModal(response.budget);
        } catch (error) {
            console.error('Failed to load budget:', error);
            utils.showAlert('Failed to load budget for editing', 'danger');
        }
    }

    async deleteBudget(id) {
        if (!confirm('Are you sure you want to delete this budget? This action cannot be undone.')) return;
        try {
            await api.deleteBudget(id);
            utils.showAlert('Budget deleted successfully!', 'success');
            await this.loadBudgets();
            if (window.app && window.app.currentSection === 'dashboard') window.app.loadDashboard();
        } catch (error) {
            console.error('Failed to delete budget:', error);
            utils.showAlert('Failed to delete budget', 'danger');
        }
    }
}

window.budgetManager = new BudgetManager();
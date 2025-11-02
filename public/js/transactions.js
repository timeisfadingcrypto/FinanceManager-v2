// Transaction management
class TransactionManager {
    constructor() {
        this.transactions = [];
        this.categories = [];
        this.currentTransaction = null;
        this.ready = false;
        this.categoriesRendered = false; // prevent duplicate option rendering
    }

    async ensureReady() {
        if (this.ready) return;
        await this.loadCategories();
        this.bindEvents();
        this.ready = true;
    }

    bindEvents() {
        const addBtn = document.getElementById('addTransactionBtn');
        if (addBtn) addBtn.addEventListener('click', () => this.showModal());

        const saveBtn = document.getElementById('saveTransactionBtn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveTransaction());

        const typeSelect = document.getElementById('transactionType');
        if (typeSelect) typeSelect.addEventListener('change', () => this.filterCategories());

        const tbody = document.getElementById('transactionsList');
        if (tbody) {
            tbody.addEventListener('click', (e) => {
                const editBtn = e.target.closest('.action-edit');
                const deleteBtn = e.target.closest('.action-delete');
                if (editBtn) {
                    const id = parseInt(editBtn.dataset.id, 10);
                    if (!Number.isNaN(id)) this.editTransaction(id);
                } else if (deleteBtn) {
                    const id = parseInt(deleteBtn.dataset.id, 10);
                    if (!Number.isNaN(id)) this.deleteTransaction(id);
                }
            });
        }

        const modal = document.getElementById('transactionModal');
        if (modal) modal.addEventListener('hidden.bs.modal', () => this.resetModal());
    }

    async loadCategories() {
        try {
            if (this.categories.length === 0) {
                const response = await api.getCategories();
                this.categories = response.categories || [];
            }
            this.populateCategories();
        } catch (error) {
            console.error('Failed to load categories:', error);
            utils.showAlert('Failed to load categories', 'warning');
        }
    }

    populateCategories(force = false) {
        const select = document.getElementById('transactionCategory');
        if (!select) return;

        if (this.categoriesRendered && !force) return; // already rendered once

        // Build options once to avoid cumulative duplicates
        const frag = document.createDocumentFragment();
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select Category';
        frag.appendChild(placeholder);

        this.categories.forEach((c) => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            opt.dataset.type = c.type;
            frag.appendChild(opt);
        });

        select.innerHTML = '';
        select.appendChild(frag);
        this.categoriesRendered = true;
    }

    filterCategories() {
        const typeSelect = document.getElementById('transactionType');
        const categorySelect = document.getElementById('transactionCategory');
        if (!typeSelect || !categorySelect) return;

        const selectedType = typeSelect.value;
        const options = categorySelect.querySelectorAll('option');

        options.forEach((option) => {
            if (option.value === '') { option.style.display = 'block'; return; }
            const categoryType = option.dataset.type;
            option.style.display = (!selectedType || categoryType === 'both' || categoryType === selectedType)
                ? 'block' : 'none';
        });

        const currentOption = categorySelect.querySelector(`option[value="${categorySelect.value}"]`);
        if (currentOption && currentOption.style.display === 'none') categorySelect.value = '';
    }

    async loadTransactions() {
        try {
            const response = await api.getTransactions();
            this.transactions = response.transactions || [];
            this.renderTransactions();
        } catch (error) {
            console.error('Failed to load transactions:', error);
            utils.showAlert('Failed to load transactions', 'danger');
            this.renderError();
        }
    }

    renderTransactions() {
        const tbody = document.getElementById('transactionsList');
        if (!tbody) return;

        if (this.transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="text-muted">
                            <i class="fas fa-inbox fa-2x mb-2"></i>
                            <p>No transactions found. Add your first transaction!</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.transactions.map((t) => `
            <tr class="fade-in">
                <td>${utils.formatDate(t.transaction_date)}</td>
                <td>${t.description}</td>
                <td>
                    <span class="category-badge" style="background-color: ${t.category_color || '#6c757d'}">
                        <i class="${t.category_icon || 'fas fa-circle'}"></i>
                        ${t.category_name || 'Uncategorized'}
                    </span>
                </td>
                <td>
                    <span class="badge bg-${t.type === 'income' ? 'success' : 'danger'}">
                        ${t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                    </span>
                </td>
                <td>
                    <span class="transaction-amount ${t.type}">
                        ${t.type === 'income' ? '+' : '-'}${utils.formatCurrency(Math.abs(t.amount))}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary action-edit" data-id="${t.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger action-delete" data-id="${t.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderError() {
        const tbody = document.getElementById('transactionsList');
        if (!tbody) return;
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="text-danger">
                        <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                        <p>Failed to load transactions. Please try again.</p>
                        <button class="btn btn-outline-primary btn-sm" id="retryLoadTransactions">
                            <i class="fas fa-rotate-right me-1"></i>Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
        const retryBtn = document.getElementById('retryLoadTransactions');
        if (retryBtn) retryBtn.addEventListener('click', () => this.loadTransactions());
    }

    showModal(transaction = null) {
        this.currentTransaction = transaction;
        const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
        const title = document.getElementById('transactionModalTitle');
        const saveBtn = document.getElementById('saveTransactionBtn');
        if (transaction) {
            title.textContent = 'Edit Transaction';
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Update Transaction';
            this.populateForm(transaction);
        } else {
            title.textContent = 'Add Transaction';
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Transaction';
            document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        }
        modal.show();
    }

    populateForm(transaction) {
        document.getElementById('transactionAmount').value = transaction.amount;
        document.getElementById('transactionType').value = transaction.type;
        document.getElementById('transactionDescription').value = transaction.description;
        document.getElementById('transactionCategory').value = transaction.category_id;
        document.getElementById('transactionDate').value = transaction.transaction_date;
        document.getElementById('transactionTags').value = transaction.tags || '';
        this.filterCategories();
    }

    resetModal() {
        this.currentTransaction = null;
        const form = document.getElementById('transactionForm');
        if (form) form.reset();
        document.getElementById('transactionAlert').innerHTML = '';
        // Do NOT repopulate categories here to avoid duplicates
    }

    async saveTransaction() {
        try {
            if (!utils.validateForm('transactionForm')) {
                utils.showAlert('Please fill in all required fields', 'warning', 'transactionAlert');
                return;
            }
            const formData = {
                amount: parseFloat(document.getElementById('transactionAmount').value),
                type: document.getElementById('transactionType').value,
                description: document.getElementById('transactionDescription').value,
                category_id: parseInt(document.getElementById('transactionCategory').value),
                transaction_date: document.getElementById('transactionDate').value,
                tags: document.getElementById('transactionTags').value || null
            };
            const btn = document.getElementById('saveTransactionBtn');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
            btn.disabled = true;
            if (this.currentTransaction) {
                await api.updateTransaction(this.currentTransaction.id, formData);
                utils.showAlert('Transaction updated successfully!', 'success');
            } else {
                await api.createTransaction(formData);
                utils.showAlert('Transaction added successfully!', 'success');
            }
            bootstrap.Modal.getInstance(document.getElementById('transactionModal')).hide();
            await this.loadTransactions();
            if (window.app && window.app.currentSection === 'dashboard') window.app.loadDashboard();
        } catch (error) {
            console.error('Failed to save transaction:', error);
            utils.showAlert(error.message, 'danger', 'transactionAlert');
        } finally {
            const btn = document.getElementById('saveTransactionBtn');
            const text = this.currentTransaction ? 'Update Transaction' : 'Save Transaction';
            btn.innerHTML = `<i class="fas fa-save me-2"></i>${text}`;
            btn.disabled = false;
        }
    }

    async editTransaction(id) {
        try {
            const response = await api.getTransaction(id);
            this.showModal(response.transaction);
        } catch (error) {
            console.error('Failed to load transaction:', error);
            utils.showAlert('Failed to load transaction for editing', 'danger');
        }
    }

    async deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) return;
        try {
            await api.deleteTransaction(id);
            utils.showAlert('Transaction deleted successfully!', 'success');
            await this.loadTransactions();
            if (window.app && window.app.currentSection === 'dashboard') window.app.loadDashboard();
        } catch (error) {
            console.error('Failed to delete transaction:', error);
            utils.showAlert('Failed to delete transaction', 'danger');
        }
    }
}

window.transactionManager = new TransactionManager();

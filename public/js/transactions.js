// Transaction management
class TransactionManager {
    constructor() {
        this.transactions = [];
        this.categories = [];
        this.currentTransaction = null;
        this.ready = false;
    }

    async ensureReady() {
        if (this.ready) return;
        // Only load categories after authentication
        await this.loadCategories();
        this.bindEvents();
        this.ready = true;
    }

    bindEvents() {
        // Add transaction button
        const addBtn = document.getElementById('addTransactionBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showModal());
        }

        // Transaction form submit
        const saveBtn = document.getElementById('saveTransactionBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveTransaction());
        }

        // Transaction type change - filter categories
        const typeSelect = document.getElementById('transactionType');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => this.filterCategories());
        }

        // Modal reset on close
        const modal = document.getElementById('transactionModal');
        if (modal) {
            modal.addEventListener('hidden.bs.modal', () => this.resetModal());
        }
    }

    async loadCategories() {
        try {
            const response = await api.getCategories();
            this.categories = response.categories || [];
            this.populateCategories();
        } catch (error) {
            console.error('Failed to load categories:', error);
            utils.showAlert('Failed to load categories', 'warning');
        }
    }

    populateCategories() {
        const categorySelect = document.getElementById('transactionCategory');
        if (!categorySelect) return;

        categorySelect.innerHTML = '<option value="">Select Category</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            option.dataset.type = category.type;
            categorySelect.appendChild(option);
        });
    }

    filterCategories() {
        const typeSelect = document.getElementById('transactionType');
        const categorySelect = document.getElementById('transactionCategory');
        
        if (!typeSelect || !categorySelect) return;

        const selectedType = typeSelect.value;
        const options = categorySelect.querySelectorAll('option');

        options.forEach(option => {
            if (option.value === '') {
                option.style.display = 'block';
                return;
            }

            const categoryType = option.dataset.type;
            if (!selectedType || categoryType === 'both' || categoryType === selectedType) {
                option.style.display = 'block';
            } else {
                option.style.display = 'none';
            }
        });

        // Reset category selection if current selection is now hidden
        const currentOption = categorySelect.querySelector(`option[value="${categorySelect.value}"]`);
        if (currentOption && currentOption.style.display === 'none') {
            categorySelect.value = '';
        }
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

        tbody.innerHTML = this.transactions.map(transaction => `
            <tr class="fade-in">
                <td>${utils.formatDate(transaction.transaction_date)}</td>
                <td>${transaction.description}</td>
                <td>
                    <span class="category-badge" style="background-color: ${transaction.category_color || '#6c757d'}">
                        <i class="${transaction.category_icon || 'fas fa-circle'}"></i>
                        ${transaction.category_name || 'Uncategorized'}
                    </span>
                </td>
                <td>
                    <span class="badge bg-${transaction.type === 'income' ? 'success' : 'danger'}">
                        ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                </td>
                <td>
                    <span class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}${utils.formatCurrency(Math.abs(transaction.amount))}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary" onclick="window.transactionManager.editTransaction(${transaction.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="window.transactionManager.deleteTransaction(${transaction.id})" title="Delete">
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
                        <button class="btn btn-outline-primary btn-sm" onclick="window.transactionManager.loadTransactions()">
                            <i class="fas fa-retry me-1"></i>Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    showModal(transaction = null) {
        this.currentTransaction = transaction;
        
        const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
        const title = document.getElementById('transactionModalTitle');
        const saveBtn = document.getElementById('saveTransactionBtn');
        
        if (transaction) {
            // Edit mode
            title.textContent = 'Edit Transaction';
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Update Transaction';
            this.populateForm(transaction);
        } else {
            // Add mode
            title.textContent = 'Add Transaction';
            saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Transaction';
            // Set today's date as default
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
        
        // Filter categories based on type
        this.filterCategories();
    }

    resetModal() {
        this.currentTransaction = null;
        document.getElementById('transactionForm').reset();
        document.getElementById('transactionAlert').innerHTML = '';
        
        // Reset category options
        this.populateCategories();
    }

    async saveTransaction() {
        try {
            // Validate form
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

            const saveBtn = document.getElementById('saveTransactionBtn');
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
            saveBtn.disabled = true;

            let response;
            if (this.currentTransaction) {
                // Update existing transaction
                response = await api.updateTransaction(this.currentTransaction.id, formData);
                utils.showAlert('Transaction updated successfully!', 'success');
            } else {
                // Create new transaction
                response = await api.createTransaction(formData);
                utils.showAlert('Transaction added successfully!', 'success');
            }

            // Close modal and refresh list
            bootstrap.Modal.getInstance(document.getElementById('transactionModal')).hide();
            await this.loadTransactions();
            
            // Update dashboard if it's loaded
            if (window.app && window.app.currentSection === 'dashboard') {
                window.app.loadDashboard();
            }

        } catch (error) {
            console.error('Failed to save transaction:', error);
            utils.showAlert(error.message, 'danger', 'transactionAlert');
        } finally {
            const saveBtn = document.getElementById('saveTransactionBtn');
            const text = this.currentTransaction ? 'Update Transaction' : 'Save Transaction';
            saveBtn.innerHTML = `<i class="fas fa-save me-2"></i>${text}`;
            saveBtn.disabled = false;
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
        if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
            return;
        }

        try {
            await api.deleteTransaction(id);
            utils.showAlert('Transaction deleted successfully!', 'success');
            await this.loadTransactions();
            
            // Update dashboard if it's loaded
            if (window.app && window.app.currentSection === 'dashboard') {
                window.app.loadDashboard();
            }
        } catch (error) {
            console.error('Failed to delete transaction:', error);
            utils.showAlert('Failed to delete transaction', 'danger');
        }
    }
}

// Initialize transaction manager lazily
window.transactionManager = new TransactionManager();

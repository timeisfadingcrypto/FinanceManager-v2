// API utility functions
class API {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const contentType = response.headers.get('content-type') || '';

            // Prefer JSON when advertised, otherwise surface readable error
            if (!contentType.includes('application/json')) {
                const text = await response.text();
                if (!response.ok) {
                    throw new Error(text || `HTTP ${response.status}`);
                }
                // Try to parse if backend omitted header but sent JSON
                try {
                    return JSON.parse(text);
                } catch {
                    throw new Error('Unexpected non-JSON response from server');
                }
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            
            // Handle token expiration
            if (error.message.includes('Token expired') || error.message.includes('Invalid token')) {
                this.setToken(null);
                window.location.reload();
                return;
            }
            
            throw error;
        }
    }

    // Auth endpoints
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async getProfile() {
        return this.request('/auth/profile');
    }

    // Transaction endpoints
    async getTransactions(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/transactions?${queryString}` : '/transactions';
        return this.request(endpoint);
    }

    async getTransaction(id) {
        return this.request(`/transactions/${id}`);
    }

    async createTransaction(data) {
        return this.request('/transactions', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateTransaction(id, data) {
        return this.request(`/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteTransaction(id) {
        return this.request(`/transactions/${id}`, {
            method: 'DELETE'
        });
    }

    async getTransactionStats(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/transactions/stats/summary?${queryString}` : '/transactions/stats/summary';
        return this.request(endpoint);
    }

    // Budget endpoints
    async getBudgets(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/budgets?${queryString}` : '/budgets';
        return this.request(endpoint);
    }

    async getBudget(id) {
        return this.request(`/budgets/${id}`);
    }

    async createBudget(data) {
        return this.request('/budgets', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateBudget(id, data) {
        return this.request(`/budgets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteBudget(id) {
        return this.request(`/budgets/${id}`, {
            method: 'DELETE'
        });
    }

    // Category endpoints
    async getCategories() {
        return this.request('/categories');
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }
}

// Create global API instance
window.api = new API();

// Utility functions
window.utils = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    showAlert(message, type = 'info', containerId = null) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        if (containerId) {
            document.getElementById(containerId).innerHTML = alertHtml;
        } else {
            // Show toast notification
            const toast = document.createElement('div');
            toast.className = `toast align-items-center text-white bg-${type} border-0`;
            toast.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            `;
            
            document.body.appendChild(toast);
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
            
            toast.addEventListener('hidden.bs.toast', () => {
                document.body.removeChild(toast);
            });
        }
    },

    setLoading(elementId, loading = true) {
        const element = document.getElementById(elementId);
        if (element) {
            if (loading) {
                element.classList.add('loading');
                element.disabled = true;
            } else {
                element.classList.remove('loading');
                element.disabled = false;
            }
        }
    },

    validateForm(formId) {
        const form = document.getElementById(formId);
        return form.checkValidity();
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};
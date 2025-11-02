// Enhanced API utility functions for FinanceManager v2
class API {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('token');
        this._originalApi = null; // Store reference to preserve methods
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

            // Handle non-JSON responses gracefully
            if (!contentType.includes('application/json')) {
                const text = await response.text();
                if (!response.ok) {
                    throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
                }
                // Try to parse if backend omitted header but sent JSON
                try {
                    return JSON.parse(text);
                } catch {
                    // If it's HTML error page, give helpful message
                    if (text.includes('<html>')) {
                        throw new Error(`Server returned HTML instead of JSON for ${endpoint}. Check server logs for errors.`);
                    }
                    throw new Error(`Unexpected non-JSON response from server: ${text.substring(0, 100)}`);
                }
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error(`API Request failed [${options.method || 'GET'}] ${endpoint}:`, error);
            
            // Handle token expiration gracefully
            if (error.message.includes('Token expired') || 
                error.message.includes('Invalid token') || 
                error.message.includes('403')) {
                console.log('Token expired, clearing auth state');
                this.setToken(null);
                // Don't auto-reload, let auth.js handle this
                throw new Error('Session expired. Please login again.');
            }
            
            throw error;
        }
    }

    // Enhanced auth endpoints with better error handling
    async login(credentials) {
        // Support both object and individual parameters
        const { email, password } = typeof credentials === 'object' ? 
            credentials : { email: credentials, password: arguments[1] };
            
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        try {
            const response = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            // Auto-set token if returned
            if (response.token) {
                this.setToken(response.token);
            }
            
            return response;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            const response = await this.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            // Auto-set token if returned
            if (response.token) {
                this.setToken(response.token);
            }
            
            return response;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    async verifyToken() {
        if (!this.token) {
            throw new Error('No token to verify');
        }
        
        try {
            return await this.request('/auth/verify');
        } catch (error) {
            console.error('Token verification failed:', error);
            // Clear invalid token
            this.setToken(null);
            throw error;
        }
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

    // Enhanced Budget endpoints
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

    // Enhanced budget analysis endpoints
    async getBudgetAnalysis() {
        return this.request('/budgets/analysis');
    }

    async getBudgetRecommendations() {
        return this.request('/budgets/recommendations');
    }

    async getBudgetTemplates() {
        return this.request('/budgets/templates');
    }

    async getBudgetCategories() {
        return this.request('/budgets/categories');
    }

    async applyBudgetTemplate(templateId, totalBudget) {
        return this.request('/budgets/apply-template', {
            method: 'POST',
            body: JSON.stringify({ templateId, totalBudget })
        });
    }

    async getBudgetPerformance(budgetId) {
        return this.request(`/budgets/${budgetId}/performance`);
    }

    // Category endpoints
    async getCategories() {
        return this.request('/categories');
    }

    // Debug endpoints
    async debugBudgetSetup() {
        return this.request('/debug/budget-setup');
    }

    async debugTestBudget(categoryId = null) {
        return this.request('/debug/test-budget', {
            method: 'POST',
            body: JSON.stringify({ category_id: categoryId })
        });
    }

    async debugInitCategories() {
        return this.request('/debug/init-categories', {
            method: 'POST'
        });
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }
}

// Create global API instance
const apiInstance = new API();

// Store original API methods for compatibility
const originalMethods = {
    login: apiInstance.login.bind(apiInstance),
    register: apiInstance.register.bind(apiInstance),
    setToken: apiInstance.setToken.bind(apiInstance),
    verifyToken: apiInstance.verifyToken.bind(apiInstance),
    getProfile: apiInstance.getProfile.bind(apiInstance),
    request: apiInstance.request.bind(apiInstance),
    // Transaction methods
    getTransactions: apiInstance.getTransactions.bind(apiInstance),
    getTransaction: apiInstance.getTransaction.bind(apiInstance),
    createTransaction: apiInstance.createTransaction.bind(apiInstance),
    updateTransaction: apiInstance.updateTransaction.bind(apiInstance),
    deleteTransaction: apiInstance.deleteTransaction.bind(apiInstance),
    getTransactionStats: apiInstance.getTransactionStats.bind(apiInstance),
    // Budget methods
    getBudgets: apiInstance.getBudgets.bind(apiInstance),
    getBudget: apiInstance.getBudget.bind(apiInstance),
    createBudget: apiInstance.createBudget.bind(apiInstance),
    updateBudget: apiInstance.updateBudget.bind(apiInstance),
    deleteBudget: apiInstance.deleteBudget.bind(apiInstance),
    // Enhanced budget methods
    getBudgetAnalysis: apiInstance.getBudgetAnalysis.bind(apiInstance),
    getBudgetRecommendations: apiInstance.getBudgetRecommendations.bind(apiInstance),
    getBudgetTemplates: apiInstance.getBudgetTemplates.bind(apiInstance),
    getBudgetCategories: apiInstance.getBudgetCategories.bind(apiInstance),
    applyBudgetTemplate: apiInstance.applyBudgetTemplate.bind(apiInstance),
    getBudgetPerformance: apiInstance.getBudgetPerformance.bind(apiInstance),
    // Category methods
    getCategories: apiInstance.getCategories.bind(apiInstance),
    // Debug methods
    debugBudgetSetup: apiInstance.debugBudgetSetup.bind(apiInstance),
    debugTestBudget: apiInstance.debugTestBudget.bind(apiInstance),
    debugInitCategories: apiInstance.debugInitCategories.bind(apiInstance),
    // Utility
    healthCheck: apiInstance.healthCheck.bind(apiInstance)
};

// Enhanced API wrapper that preserves authentication methods
class EnhancedAPIWrapper {
    constructor(originalApi) {
        // Store reference to original methods
        this._original = originalApi;
        
        // Bind all original methods to this wrapper
        Object.keys(originalApi).forEach(key => {
            if (typeof originalApi[key] === 'function') {
                this[key] = originalApi[key];
            }
        });
        
        // Ensure core auth methods are always available
        this.login = originalApi.login;
        this.register = originalApi.register;
        this.setToken = originalApi.setToken;
        this.verifyToken = originalApi.verifyToken;
        this.getProfile = originalApi.getProfile;
        this.request = originalApi.request;
    }
    
    // Method to restore original API if enhanced features fail
    restoreOriginal() {
        Object.keys(this._original).forEach(key => {
            this[key] = this._original[key];
        });
        console.log('🔄 API restored to original functionality');
    }
}

// Set global API with compatibility wrapper
window.api = new EnhancedAPIWrapper(originalMethods);

// Preserve reference to original API instance
window.api._instance = apiInstance;
window.api._originalMethods = originalMethods;

// Enhanced compatibility check
if (typeof window !== 'undefined') {
    // Ensure enhanced demo mode doesn't break auth
    window.addEventListener('DOMContentLoaded', () => {
        // Verify API methods are available
        const requiredMethods = ['login', 'setToken', 'verifyToken', 'request'];
        const missingMethods = requiredMethods.filter(method => typeof window.api[method] !== 'function');
        
        if (missingMethods.length > 0) {
            console.error('❌ Missing API methods:', missingMethods);
            console.log('🔄 Restoring original API methods...');
            window.api.restoreOriginal();
        } else {
            console.log('✅ All required API methods available');
        }
    });
}

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
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = alertHtml;
            }
        } else {
            // Show toast notification if bootstrap is available
            if (typeof bootstrap !== 'undefined') {
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
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                });
            } else {
                // Fallback to console if bootstrap not available
                console.log(`${type.toUpperCase()}: ${message}`);
            }
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
        return form ? form.checkValidity() : false;
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

console.log('✅ Enhanced API loaded with auth compatibility layer');
console.log('🔑 Auth methods available:', ['login', 'setToken', 'verifyToken', 'getProfile'].every(m => typeof window.api[m] === 'function'));
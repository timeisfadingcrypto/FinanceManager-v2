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
                    // Only clear token on explicit 401
                    if (response.status === 401) {
                        console.debug('Clearing token due to 401 on', endpoint);
                        this.setToken(null);
                    }
                    throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
                }
                // Try to parse if backend omitted header but sent JSON
                try {
                    return JSON.parse(text);
                } catch {
                    if (text.includes('<html')) {
                        throw new Error(`Server returned HTML instead of JSON for ${endpoint}.`);
                    }
                    throw new Error(`Unexpected non-JSON response from server: ${text.substring(0, 100)}`);
                }
            }

            const data = await response.json();

            if (!response.ok) {
                // Only clear token on explicit 401
                if (response.status === 401) {
                    console.debug('Clearing token due to 401 JSON on', endpoint, data);
                    this.setToken(null);
                }
                throw new Error(data.error || data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error(`API Request failed [${options.method || 'GET'}] ${endpoint}:`, error);
            throw error;
        }
    }

    // Enhanced auth endpoints
    async login(credentials) {
        const { email, password } = typeof credentials === 'object' ? 
            credentials : { email: credentials, password: arguments[1] };
        if (!email || !password) throw new Error('Email and password are required');

        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (response.token) this.setToken(response.token);
        return response;
    }

    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        if (response.token) this.setToken(response.token);
        return response;
    }

    async verifyToken() {
        if (!this.token) throw new Error('No token to verify');
        return this.request('/auth/verify');
    }

    async getProfile() { return this.request('/auth/profile'); }

    // Transactions
    async getTransactions(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.request(qs ? `/transactions?${qs}` : '/transactions');
    }
    async getTransaction(id) { return this.request(`/transactions/${id}`); }
    async createTransaction(data) { return this.request('/transactions', { method: 'POST', body: JSON.stringify(data) }); }
    async updateTransaction(id, data) { return this.request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
    async deleteTransaction(id) { return this.request(`/transactions/${id}`, { method: 'DELETE' }); }
    async getTransactionStats(params = {}) { 
        const qs = new URLSearchParams(params).toString();
        return this.request(qs ? `/transactions/stats/summary?${qs}` : '/transactions/stats/summary');
    }

    // Budgets (enhanced)
    async getBudgets(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.request(qs ? `/budgets?${qs}` : '/budgets');
    }
    async getBudget(id) { return this.request(`/budgets/${id}`); }
    async createBudget(data) { return this.request('/budgets', { method: 'POST', body: JSON.stringify(data) }); }
    async updateBudget(id, data) { return this.request(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
    async deleteBudget(id) { return this.request(`/budgets/${id}`, { method: 'DELETE' }); }

    async getBudgetAnalysis() { return this.request('/budgets/analysis'); }
    async getBudgetRecommendations() { return this.request('/budgets/recommendations'); }
    async getBudgetTemplates() { return this.request('/budgets/templates'); }
    async getBudgetCategories() { return this.request('/budgets/categories'); }
    async applyBudgetTemplate(templateId, totalBudget) { return this.request('/budgets/apply-template', { method: 'POST', body: JSON.stringify({ templateId, totalBudget }) }); }
    async getBudgetPerformance(budgetId) { return this.request(`/budgets/${budgetId}/performance`); }

    async getCategories() { return this.request('/categories'); }
    async debugBudgetSetup() { return this.request('/debug/budget-setup'); }
    async debugTestBudget(categoryId = null) { return this.request('/debug/test-budget', { method: 'POST', body: JSON.stringify({ category_id: categoryId }) }); }
    async debugInitCategories() { return this.request('/debug/init-categories', { method: 'POST' }); }

    async healthCheck() { return this.request('/health'); }
}

// Global API with compatibility wrapper
const apiInstance = new API();
const originalMethods = Object.getOwnPropertyNames(API.prototype)
  .filter(k => k !== 'constructor')
  .reduce((acc, k) => { acc[k] = apiInstance[k].bind(apiInstance); return acc; }, {});

class EnhancedAPIWrapper {
    constructor(originalApi) {
        this._original = originalApi;
        Object.keys(originalApi).forEach(key => { this[key] = originalApi[key]; });
        // Ensure critical auth methods present
        ['login','setToken','verifyToken','getProfile','request'].forEach(m => { this[m] = originalApi[m]; });
    }
    restoreOriginal() {
        Object.keys(this._original).forEach(key => { this[key] = this._original[key]; });
        console.log('🔄 API restored to original functionality');
    }
}

window.api = new EnhancedAPIWrapper(originalMethods);
window.api._instance = apiInstance;
window.api._originalMethods = originalMethods;

window.addEventListener('DOMContentLoaded', () => {
    const required = ['login','setToken','verifyToken','request'];
    const missing = required.filter(m => typeof window.api[m] !== 'function');
    if (missing.length) { console.error('❌ Missing API methods:', missing); window.api.restoreOriginal(); }
    else { console.log('✅ All required API methods available'); }
});

// Utilities
window.utils = window.utils || {};
window.utils.formatCurrency = window.utils.formatCurrency || function(amount){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(amount); };
window.utils.formatDate = window.utils.formatDate || function(date){ if(!date) return ''; return new Date(date).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}); };
window.utils.showAlert = window.utils.showAlert || function(message,type='info',containerId=null){ const html=`<div class="alert alert-${type} alert-dismissible fade show" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`; if(containerId){ const el=document.getElementById(containerId); if(el) el.innerHTML=html; } else { if(typeof bootstrap!=='undefined'){ const toast=document.createElement('div'); toast.className=`toast align-items-center text-white bg-${type} border-0`; toast.innerHTML=`<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`; document.body.appendChild(toast); const bsToast=new bootstrap.Toast(toast); bsToast.show(); toast.addEventListener('hidden.bs.toast',()=>{ if(document.body.contains(toast)) document.body.removeChild(toast); }); } else { console.log(`${type.toUpperCase()}: ${message}`); } } };
window.utils.setLoading = window.utils.setLoading || function(id,loading=true){ const el=document.getElementById(id); if(el){ if(loading){ el.classList.add('loading'); el.disabled=true; } else { el.classList.remove('loading'); el.disabled=false; } } };
window.utils.validateForm = window.utils.validateForm || function(formId){ const form=document.getElementById(formId); return form ? form.checkValidity() : false; };
window.utils.debounce = window.utils.debounce || function(func,wait){ let t; return function(...args){ clearTimeout(t); t=setTimeout(()=>func(...args),wait); }; };

console.log('✅ Enhanced API loaded with guarded token clearing');
/**
 * Enhanced Demo Mode for FinanceManager v2
 * Provides comprehensive mock data for budget testing including templates and AI recommendations
 * Now with improved API integration that preserves authentication
 */

// Enhanced mock data for comprehensive budget feature testing
const EnhancedBudgetMockData = {
    // Sample budgets with comprehensive data
    budgets: [
        {
            id: 1,
            user_id: 1,
            category_id: 6,
            name: 'Food & Dining Budget',
            amount: 600.00,
            period: 'monthly',
            start_date: '2025-11-01',
            end_date: null,
            description: 'Monthly food and dining budget',
            is_active: true,
            alert_threshold: 80.00,
            notes: '',
            created_at: '2025-10-15T10:00:00Z',
            updated_at: '2025-11-01T12:00:00Z',
            category: 'Food & Dining',
            category_color: '#4ecdc4',
            category_icon: 'fas fa-utensils',
            spent: 485.50,
            transaction_count: 23,
            remaining: 114.50,
            percentage_used: 80.92,
            days_remaining: 28,
            status: 'warning'
        },
        {
            id: 2,
            user_id: 1,
            category_id: 7,
            name: 'Transportation Budget',
            amount: 300.00,
            period: 'monthly',
            start_date: '2025-11-01',
            end_date: null,
            description: 'Monthly transportation expenses',
            is_active: true,
            alert_threshold: 75.00,
            notes: '',
            created_at: '2025-10-15T10:00:00Z',
            updated_at: '2025-11-01T12:00:00Z',
            category: 'Transportation',
            category_color: '#45b7d1',
            category_icon: 'fas fa-car',
            spent: 220.30,
            transaction_count: 8,
            remaining: 79.70,
            percentage_used: 73.43,
            days_remaining: 28,
            status: 'on_track'
        },
        {
            id: 3,
            user_id: 1,
            category_id: 9,
            name: 'Entertainment Budget',
            amount: 200.00,
            period: 'monthly',
            start_date: '2025-11-01',
            end_date: null,
            description: 'Monthly entertainment and leisure',
            is_active: true,
            alert_threshold: 80.00,
            notes: '',
            created_at: '2025-10-15T10:00:00Z',
            updated_at: '2025-11-01T12:00:00Z',
            category: 'Entertainment',
            category_color: '#96ceb4',
            category_icon: 'fas fa-film',
            spent: 125.75,
            transaction_count: 6,
            remaining: 74.25,
            percentage_used: 62.88,
            days_remaining: 28,
            status: 'on_track'
        },
        {
            id: 4,
            user_id: 1,
            category_id: 10,
            name: 'Healthcare Budget',
            amount: 150.00,
            period: 'monthly',
            start_date: '2025-11-01',
            end_date: null,
            description: 'Monthly healthcare expenses',
            is_active: true,
            alert_threshold: 80.00,
            notes: '',
            created_at: '2025-10-15T10:00:00Z',
            updated_at: '2025-11-01T12:00:00Z',
            category: 'Healthcare',
            category_color: '#ff9ff3',
            category_icon: 'fas fa-heartbeat',
            spent: 285.60,
            transaction_count: 4,
            remaining: -135.60,
            percentage_used: 190.40,
            days_remaining: 28,
            status: 'over_budget'
        }
    ],
    
    // Budget analysis data
    analysis: {
        current_period: {
            total_budgets: 4,
            active_budgets: 4,
            total_budgeted: 1250.00,
            total_spent: 1117.15,
            total_remaining: 132.85,
            percentage_spent: 89.37,
            avg_utilization: 96.91,
            over_budget_count: 1,
            warning_count: 1,
            health_score: '75'
        },
        monthly_trend: [
            { month: '2025-10', spent: 1425.50, transactions: 45 },
            { month: '2025-09', spent: 1380.25, transactions: 42 },
            { month: '2025-08', spent: 1520.80, transactions: 38 },
            { month: '2025-07', spent: 1445.15, transactions: 41 },
            { month: '2025-06', spent: 1395.90, transactions: 39 },
            { month: '2025-05', spent: 1467.30, transactions: 44 }
        ]
    },
    
    // AI recommendations
    recommendations: {
        recommendations: [
            {
                category_id: 12,
                category: 'Insurance',
                color: '#fdcb6e',
                current_budget: 0,
                recommended_amount: 220,
                avg_monthly_spending: '195.50',
                max_monthly_spending: '225.00',
                spending_volatility: '15.25',
                recommendation_type: 'create',
                confidence: 'high',
                reasoning: 'Based on your average monthly spending of $195.50. This category has consistent spending patterns.',
                potential_savings: '0.00'
            },
            {
                category_id: 10,
                category: 'Healthcare',
                color: '#ff9ff3',
                current_budget: 150,
                recommended_amount: 300,
                avg_monthly_spending: '275.30',
                max_monthly_spending: '385.60',
                spending_volatility: '45.80',
                recommendation_type: 'increase',
                confidence: 'high',
                reasoning: 'Your current budget ($150.00) is below your average spending. Healthcare costs can be unpredictable.',
                potential_savings: '0.00'
            },
            {
                category_id: 11,
                category: 'Shopping',
                color: '#a29bfe',
                current_budget: 250,
                recommended_amount: 200,
                avg_monthly_spending: '175.90',
                max_monthly_spending: '220.15',
                spending_volatility: '18.60',
                recommendation_type: 'decrease',
                confidence: 'medium',
                reasoning: 'Your current budget ($250.00) may be too high based on your spending patterns.',
                potential_savings: '50.00'
            }
        ],
        summary: {
            total_categories: 3,
            create_new: 1,
            increase_budget: 1,
            decrease_budget: 1,
            maintain_budget: 0
        }
    },
    
    // Budget templates
    templates: [
        {
            id: 'basic-budget',
            name: 'Basic Monthly Budget',
            description: 'A simple budget covering essential expenses',
            categories: [
                { name: 'Housing', percentage: 30, color: '#ff6b6b' },
                { name: 'Food & Dining', percentage: 15, color: '#4ecdc4' },
                { name: 'Transportation', percentage: 12, color: '#45b7d1' },
                { name: 'Bills & Utilities', percentage: 8, color: '#feca57' },
                { name: 'Healthcare', percentage: 5, color: '#ff9ff3' },
                { name: 'Entertainment', percentage: 10, color: '#96ceb4' },
                { name: 'Shopping', percentage: 8, color: '#a29bfe' },
                { name: 'Other Expenses', percentage: 12, color: '#7f8c8d' }
            ]
        },
        {
            id: '50-30-20-budget',
            name: '50/30/20 Budget',
            description: '50% needs, 30% wants, 20% savings and debt repayment',
            categories: [
                { name: 'Housing', percentage: 25, color: '#ff6b6b' },
                { name: 'Food & Dining', percentage: 12, color: '#4ecdc4' },
                { name: 'Transportation', percentage: 8, color: '#45b7d1' },
                { name: 'Bills & Utilities', percentage: 5, color: '#feca57' },
                { name: 'Entertainment', percentage: 15, color: '#96ceb4' },
                { name: 'Shopping', percentage: 10, color: '#a29bfe' },
                { name: 'Travel', percentage: 5, color: '#e67e22' },
                { name: 'Other Expenses', percentage: 20, color: '#7f8c8d' }
            ]
        }
    ],
    
    // Categories with spending data
    categories: [
        {
            id: 5,
            name: 'Housing',
            type: 'expense',
            color: '#ff6b6b',
            icon: 'fas fa-home',
            is_default: true,
            avg_monthly_spending: 1200.00,
            months_with_data: 6,
            recent_transactions: 3,
            has_budget: false,
            current_budget: 0
        },
        {
            id: 6,
            name: 'Food & Dining',
            type: 'expense',
            color: '#4ecdc4',
            icon: 'fas fa-utensils',
            is_default: true,
            avg_monthly_spending: 485.50,
            months_with_data: 6,
            recent_transactions: 23,
            has_budget: true,
            current_budget: 600
        },
        {
            id: 7,
            name: 'Transportation',
            type: 'expense',
            color: '#45b7d1',
            icon: 'fas fa-car',
            is_default: true,
            avg_monthly_spending: 220.30,
            months_with_data: 6,
            recent_transactions: 8,
            has_budget: true,
            current_budget: 300
        },
        {
            id: 8,
            name: 'Bills & Utilities',
            type: 'expense',
            color: '#feca57',
            icon: 'fas fa-file-invoice',
            is_default: true,
            avg_monthly_spending: 165.75,
            months_with_data: 6,
            recent_transactions: 6,
            has_budget: false,
            current_budget: 0
        },
        {
            id: 9,
            name: 'Entertainment',
            type: 'expense',
            color: '#96ceb4',
            icon: 'fas fa-film',
            is_default: true,
            avg_monthly_spending: 125.75,
            months_with_data: 6,
            recent_transactions: 6,
            has_budget: true,
            current_budget: 200
        },
        {
            id: 10,
            name: 'Healthcare',
            type: 'expense',
            color: '#ff9ff3',
            icon: 'fas fa-heartbeat',
            is_default: true,
            avg_monthly_spending: 275.30,
            months_with_data: 6,
            recent_transactions: 4,
            has_budget: true,
            current_budget: 150
        },
        {
            id: 11,
            name: 'Shopping',
            type: 'expense',
            color: '#a29bfe',
            icon: 'fas fa-shopping-bag',
            is_default: true,
            avg_monthly_spending: 180.20,
            months_with_data: 6,
            recent_transactions: 11,
            has_budget: false,
            current_budget: 0
        },
        {
            id: 12,
            name: 'Insurance',
            type: 'expense',
            color: '#fdcb6e',
            icon: 'fas fa-shield-alt',
            is_default: true,
            avg_monthly_spending: 195.50,
            months_with_data: 6,
            recent_transactions: 2,
            has_budget: false,
            current_budget: 0
        }
    ]
};

// Enhanced mock API for budget features
function enhancedBudgetMockApi(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const path = endpoint.split('?')[0];
    
    console.log(`🛸 Enhanced Mock API: ${method} ${path}`);
    
    // Enhanced budget endpoints
    if (path === '/budgets' && method === 'GET') {
        return Promise.resolve(EnhancedBudgetMockData.budgets);
    }
    
    if (path === '/budgets/analysis' && method === 'GET') {
        return Promise.resolve(EnhancedBudgetMockData.analysis);
    }
    
    if (path === '/budgets/recommendations' && method === 'GET') {
        return Promise.resolve(EnhancedBudgetMockData.recommendations);
    }
    
    if (path === '/budgets/templates' && method === 'GET') {
        return Promise.resolve(EnhancedBudgetMockData.templates);
    }
    
    if (path === '/budgets/categories' && method === 'GET') {
        return Promise.resolve(EnhancedBudgetMockData.categories);
    }
    
    if (path === '/budgets/apply-template' && method === 'POST') {
        const body = JSON.parse(options.body || '{}');
        const template = EnhancedBudgetMockData.templates.find(t => t.id === body.templateId);
        if (!template) {
            return Promise.resolve({ error: 'Template not found' });
        }
        
        return Promise.resolve({
            message: 'Template applied successfully',
            template: body.templateId,
            created_budgets: template.categories.slice(0, 3).map((cat, i) => ({
                id: Date.now() + i,
                category: cat.name,
                amount: ((body.totalBudget * cat.percentage) / 100).toFixed(2),
                percentage: cat.percentage
            })),
            total_budget: body.totalBudget
        });
    }
    
    // Budget performance endpoint
    if (path.startsWith('/budgets/') && path.endsWith('/performance') && method === 'GET') {
        const budgetId = parseInt(path.split('/')[2]);
        const budget = EnhancedBudgetMockData.budgets.find(b => b.id === budgetId);
        if (!budget) {
            return Promise.resolve({ error: 'Budget not found' });
        }
        
        return Promise.resolve({
            budget_info: {
                id: budget.id,
                name: budget.name,
                category: budget.category,
                category_color: budget.category_color,
                amount: budget.amount,
                period: budget.period,
                start_date: budget.start_date,
                end_date: budget.end_date,
                alert_threshold: budget.alert_threshold
            },
            performance: {
                total_spent: budget.spent,
                remaining: budget.remaining,
                percentage_used: budget.percentage_used.toFixed(2),
                transaction_count: budget.transaction_count,
                avg_transaction: (budget.spent / budget.transaction_count).toFixed(2),
                status: budget.status,
                days_remaining: budget.days_remaining
            },
            daily_breakdown: [
                { date: '2025-11-01', spent: 45.20, transactions: 2 },
                { date: '2025-11-02', spent: 18.75, transactions: 1 },
                { date: '2025-11-03', spent: 67.40, transactions: 3 },
                { date: '2025-11-04', spent: 32.15, transactions: 2 },
                { date: '2025-11-05', spent: 0, transactions: 0 },
                { date: '2025-11-06', spent: 89.30, transactions: 4 },
                { date: '2025-11-07', spent: 25.80, transactions: 1 },
                { date: '2025-11-08', spent: 43.60, transactions: 2 }
            ]
        });
    }
    
    // Budget CRUD operations
    if (path === '/budgets' && method === 'POST') {
        const body = JSON.parse(options.body || '{}');
        const category = EnhancedBudgetMockData.categories.find(c => c.id == body.category_id);
        
        const newBudget = {
            id: Date.now(),
            user_id: 1,
            category_id: body.category_id,
            name: body.name || `${category?.name || 'Unknown'} Budget`,
            amount: parseFloat(body.amount),
            period: body.period || 'monthly',
            start_date: body.start_date,
            end_date: body.end_date || null,
            description: body.description || '',
            is_active: body.is_active !== false,
            alert_threshold: body.alert_threshold || 80,
            notes: body.notes || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            category: category?.name || 'Unknown',
            category_color: category?.color || '#6c757d',
            category_icon: category?.icon || 'fas fa-circle',
            spent: 0,
            transaction_count: 0,
            remaining: parseFloat(body.amount),
            percentage_used: 0,
            days_remaining: null,
            status: 'on_track'
        };
        
        return Promise.resolve({
            message: 'Budget created successfully',
            budget: newBudget
        });
    }
    
    if (path.startsWith('/budgets/') && method === 'PUT') {
        return Promise.resolve({ 
            message: 'Budget updated successfully',
            budget: { id: parseInt(path.split('/')[2]) }
        });
    }
    
    if (path.startsWith('/budgets/') && method === 'DELETE') {
        return Promise.resolve({ 
            message: 'Budget deleted successfully'
        });
    }
    
    // Debug endpoints
    if (path === '/debug/budget-setup' && method === 'GET') {
        return Promise.resolve({
            status: 'debug_complete',
            system_health: {
                budgets_table_exists: true,
                table_columns: 12,
                categories_available: EnhancedBudgetMockData.categories.length,
                expense_categories: EnhancedBudgetMockData.categories.filter(c => c.type === 'expense').length
            },
            available_categories: EnhancedBudgetMockData.categories,
            user_budgets: {
                count: EnhancedBudgetMockData.budgets.length,
                budgets: EnhancedBudgetMockData.budgets
            },
            recommendations: {
                next_steps: [
                    '✅ Categories available',
                    '✅ Budget table schema OK',
                    `✅ You have ${EnhancedBudgetMockData.budgets.length} budget(s)`,
                    `✅ Found spending in ${EnhancedBudgetMockData.categories.filter(c => c.avg_monthly_spending > 0).length} categories`
                ]
            }
        });
    }
    
    if (path === '/debug/init-categories' && method === 'POST') {
        return Promise.resolve({
            status: 'categories_initialized',
            message: 'Categories already exist in demo mode',
            created_count: 0,
            total_attempted: EnhancedBudgetMockData.categories.length
        });
    }
    
    if (path === '/debug/test-budget' && method === 'POST') {
        return Promise.resolve({
            status: 'test_success',
            message: 'Budget creation test passed - demo mode simulation',
            test_budget_id: Date.now()
        });
    }
    
    // Return null if endpoint not handled by mock
    return null;
}

// Enhanced API integration that preserves authentication
if (typeof window !== 'undefined') {
    // Wait for API to be ready
    const initEnhancedDemo = () => {
        if (!window.api || !window.api.request) {
            setTimeout(initEnhancedDemo, 50);
            return;
        }
        
        // Store original API request method
        const originalRequest = window.api.request;
        
        // Create enhanced wrapper that preserves all original functionality
        window.api.request = async function(endpoint, options = {}) {
            // Try enhanced mock API first for budget endpoints only
            if (endpoint.startsWith('/budgets') || endpoint.startsWith('/debug')) {
                const mockResult = enhancedBudgetMockApi(endpoint, options);
                if (mockResult !== null) {
                    console.log(`🎬 Enhanced Mock API served: ${options.method || 'GET'} ${endpoint}`);
                    return mockResult;
                }
            }
            
            // Fall back to original API for all other endpoints (including auth)
            return originalRequest.call(this, endpoint, options);
        };
        
        // Preserve all other API methods (login, setToken, etc.)
        // They remain unchanged and fully functional
        
        console.log('✅ Enhanced Budget Demo Mode loaded with auth preservation');
        console.log(`📋 Mock Data: ${EnhancedBudgetMockData.budgets.length} budgets, ${EnhancedBudgetMockData.categories.length} categories, ${EnhancedBudgetMockData.templates.length} templates`);
    };
    
    // Initialize after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEnhancedDemo);
    } else {
        initEnhancedDemo();
    }
    
    // Expose enhanced mock data for debugging
    window.EnhancedBudgetMockData = EnhancedBudgetMockData;
    window.enhancedBudgetMockApi = enhancedBudgetMockApi;
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedBudgetMockData, enhancedBudgetMockApi };
}
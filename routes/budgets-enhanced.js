const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Enhanced GET /api/budgets - List all budgets with comprehensive data
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { active, period } = req.query;
        
        let whereClause = 'WHERE b.user_id = ?';
        let params = [userId, userId]; // userId used twice for the subquery
        
        if (active !== undefined) {
            whereClause += ' AND b.is_active = ?';
            params.push(active === 'true' ? 1 : 0);
        }
        
        if (period) {
            whereClause += ' AND b.period = ?';
            params.push(period);
        }
        
        const query = `
            SELECT 
                b.*,
                c.name as category,
                c.color as category_color,
                c.icon as category_icon,
                COALESCE(spent.total_spent, 0) as spent,
                COALESCE(spent.transaction_count, 0) as transaction_count,
                (b.amount - COALESCE(spent.total_spent, 0)) as remaining,
                CASE 
                    WHEN b.amount = 0 THEN 0
                    ELSE ROUND((COALESCE(spent.total_spent, 0) / b.amount) * 100, 2)
                END as percentage_used,
                CASE 
                    WHEN b.end_date IS NULL THEN NULL
                    ELSE DATEDIFF(b.end_date, CURDATE())
                END as days_remaining,
                CASE 
                    WHEN COALESCE(spent.total_spent, 0) > b.amount THEN 'over_budget'
                    WHEN (COALESCE(spent.total_spent, 0) / b.amount) * 100 >= b.alert_threshold THEN 'warning'
                    ELSE 'on_track'
                END as status
            FROM budgets b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN (
                SELECT 
                    category_id,
                    SUM(amount) as total_spent,
                    COUNT(*) as transaction_count
                FROM transactions 
                WHERE user_id = ? 
                    AND type = 'expense'
                    AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
                GROUP BY category_id
            ) spent ON b.category_id = spent.category_id
            ${whereClause}
            ORDER BY b.created_at DESC
        `;
        
        const [budgets] = await pool.query(query, params);
        res.json(budgets);
    } catch (error) {
        console.error('Enhanced get budgets error:', error);
        res.status(500).json({ error: 'Failed to fetch budgets' });
    }
});

// GET /api/budgets/analysis - Budget analysis and metrics
router.get('/analysis', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Current period analysis
        const [currentAnalysis] = await pool.query(`
            SELECT 
                COUNT(*) as total_budgets,
                COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_budgets,
                SUM(CASE WHEN is_active = TRUE THEN amount ELSE 0 END) as total_budgeted,
                COALESCE(SUM(spent.total_spent), 0) as total_spent,
                (SUM(CASE WHEN is_active = TRUE THEN amount ELSE 0 END) - COALESCE(SUM(spent.total_spent), 0)) as total_remaining,
                CASE 
                    WHEN SUM(CASE WHEN is_active = TRUE THEN amount ELSE 0 END) = 0 THEN 0
                    ELSE ROUND((COALESCE(SUM(spent.total_spent), 0) / SUM(CASE WHEN is_active = TRUE THEN amount ELSE 0 END)) * 100, 2)
                END as percentage_spent,
                COUNT(CASE WHEN spent.total_spent > amount THEN 1 END) as over_budget_count,
                COUNT(CASE WHEN (spent.total_spent / amount) * 100 >= alert_threshold AND spent.total_spent <= amount THEN 1 END) as warning_count
            FROM budgets b
            LEFT JOIN (
                SELECT 
                    category_id,
                    SUM(amount) as total_spent
                FROM transactions 
                WHERE user_id = ? 
                    AND type = 'expense'
                    AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
                GROUP BY category_id
            ) spent ON b.category_id = spent.category_id
            WHERE b.user_id = ? AND b.is_active = TRUE
        `, [userId, userId]);
        
        const analysis = currentAnalysis[0];
        
        // Calculate health score
        const totalBudgets = analysis.active_budgets || 1;
        const overBudgetPenalty = (analysis.over_budget_count || 0) * 20;
        const warningPenalty = (analysis.warning_count || 0) * 10;
        const healthScore = Math.max(0, 100 - overBudgetPenalty - warningPenalty);
        
        // Monthly trend (last 6 months)
        const [monthlyTrend] = await pool.query(`
            SELECT 
                DATE_FORMAT(transaction_date, '%Y-%m') as month,
                SUM(amount) as spent,
                COUNT(*) as transactions
            FROM transactions
            WHERE user_id = ? 
                AND type = 'expense'
                AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
            ORDER BY month DESC
            LIMIT 6
        `, [userId]);
        
        res.json({
            current_period: {
                ...analysis,
                health_score: healthScore.toString(),
                avg_utilization: analysis.percentage_spent || '0'
            },
            monthly_trend: monthlyTrend.reverse()
        });
    } catch (error) {
        console.error('Budget analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze budgets' });
    }
});

// GET /api/budgets/recommendations - AI-powered budget recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get spending patterns for categories without budgets
        const [spendingPatterns] = await pool.query(`
            SELECT 
                c.id as category_id,
                c.name as category,
                c.color,
                AVG(monthly_totals.monthly_spent) as avg_monthly_spending,
                MAX(monthly_totals.monthly_spent) as max_monthly_spending,
                STDDEV(monthly_totals.monthly_spent) as spending_volatility,
                COUNT(monthly_totals.month) as months_with_data,
                COALESCE(b.amount, 0) as current_budget
            FROM categories c
            LEFT JOIN (
                SELECT 
                    category_id,
                    DATE_FORMAT(transaction_date, '%Y-%m') as month,
                    SUM(amount) as monthly_spent
                FROM transactions
                WHERE user_id = ? 
                    AND type = 'expense'
                    AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY category_id, DATE_FORMAT(transaction_date, '%Y-%m')
            ) monthly_totals ON c.id = monthly_totals.category_id
            LEFT JOIN budgets b ON c.id = b.category_id AND b.user_id = ? AND b.is_active = TRUE
            WHERE c.type IN ('expense', 'both')
            GROUP BY c.id, c.name, c.color, b.amount
            HAVING avg_monthly_spending > 0 OR current_budget > 0
            ORDER BY avg_monthly_spending DESC
        `, [userId, userId]);
        
        const recommendations = spendingPatterns.map(pattern => {
            const avgSpending = parseFloat(pattern.avg_monthly_spending || 0);
            const maxSpending = parseFloat(pattern.max_monthly_spending || 0);
            const volatility = parseFloat(pattern.spending_volatility || 0);
            const currentBudget = parseFloat(pattern.current_budget || 0);
            const monthsData = parseInt(pattern.months_with_data || 0);
            
            let recommendedAmount = 0;
            let recommendationType = 'maintain';
            let confidence = 'low';
            let reasoning = '';
            
            if (monthsData >= 3) {
                // High confidence for 3+ months of data
                confidence = 'high';
                
                if (currentBudget === 0) {
                    // No budget exists - recommend creating one
                    recommendationType = 'create';
                    recommendedAmount = Math.ceil(avgSpending * 1.15); // 15% buffer
                    reasoning = `Based on your average monthly spending of $${avgSpending.toFixed(2)}.${volatility > 30 ? ' Note: Your spending in this category varies significantly.' : ' This category has consistent spending patterns.'}`;
                } else if (avgSpending > currentBudget * 1.1) {
                    // Current budget is too low
                    recommendationType = 'increase';
                    recommendedAmount = Math.ceil(avgSpending * 1.1);
                    reasoning = `Your current budget ($${currentBudget.toFixed(2)}) is below your average spending.${volatility > 25 ? ' Healthcare costs can be unpredictable.' : ''}`;
                } else if (avgSpending < currentBudget * 0.7) {
                    // Current budget might be too high
                    recommendationType = 'decrease';
                    recommendedAmount = Math.ceil(avgSpending * 1.1);
                    reasoning = `Your current budget ($${currentBudget.toFixed(2)}) may be too high based on your spending patterns.`;
                    confidence = 'medium';
                } else {
                    // Budget is appropriate
                    recommendationType = 'maintain';
                    recommendedAmount = currentBudget;
                    reasoning = 'Your current budget aligns well with your spending patterns.';
                }
            } else if (monthsData > 0) {
                // Medium confidence for limited data
                confidence = 'medium';
                recommendationType = 'create';
                recommendedAmount = Math.ceil(avgSpending * 1.25); // Higher buffer for uncertainty
                reasoning = `Based on limited data (${monthsData} month${monthsData > 1 ? 's' : ''}). Consider monitoring for a few more months.`;
            }
            
            return {
                category_id: pattern.category_id,
                category: pattern.category,
                color: pattern.color,
                current_budget: currentBudget,
                recommended_amount: recommendedAmount,
                avg_monthly_spending: avgSpending.toFixed(2),
                max_monthly_spending: maxSpending.toFixed(2),
                spending_volatility: volatility.toFixed(2),
                recommendation_type: recommendationType,
                confidence,
                reasoning,
                potential_savings: recommendationType === 'decrease' ? (currentBudget - recommendedAmount).toFixed(2) : '0.00'
            };
        }).filter(rec => rec.recommendation_type !== 'maintain' || rec.current_budget === 0);
        
        const summary = {
            total_categories: recommendations.length,
            create_new: recommendations.filter(r => r.recommendation_type === 'create').length,
            increase_budget: recommendations.filter(r => r.recommendation_type === 'increase').length,
            decrease_budget: recommendations.filter(r => r.recommendation_type === 'decrease').length,
            maintain_budget: recommendations.filter(r => r.recommendation_type === 'maintain').length
        };
        
        res.json({
            recommendations: recommendations.slice(0, 10), // Limit to top 10
            summary
        });
    } catch (error) {
        console.error('Budget recommendations error:', error);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

// GET /api/budgets/templates - Budget templates
router.get('/templates', authenticateToken, async (req, res) => {
    try {
        const templates = [
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
                    { name: 'Savings', percentage: 12, color: '#00d2d3' }
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
                    { name: 'Savings', percentage: 15, color: '#00d2d3' },
                    { name: 'Debt Payment', percentage: 5, color: '#ff9f43' }
                ]
            },
            {
                id: 'zero-based-budget',
                name: 'Zero-Based Budget',
                description: 'Every dollar is allocated to a specific purpose',
                categories: [
                    { name: 'Housing', percentage: 28, color: '#ff6b6b' },
                    { name: 'Food & Dining', percentage: 14, color: '#4ecdc4' },
                    { name: 'Transportation', percentage: 10, color: '#45b7d1' },
                    { name: 'Bills & Utilities', percentage: 8, color: '#feca57' },
                    { name: 'Healthcare', percentage: 4, color: '#ff9ff3' },
                    { name: 'Entertainment', percentage: 8, color: '#96ceb4' },
                    { name: 'Shopping', percentage: 5, color: '#a29bfe' },
                    { name: 'Insurance', percentage: 3, color: '#fdcb6e' },
                    { name: 'Emergency Fund', percentage: 10, color: '#e17055' },
                    { name: 'Savings & Investments', percentage: 10, color: '#00d2d3' }
                ]
            },
            {
                id: 'student-budget',
                name: 'Student Budget',
                description: 'Budget tailored for students with limited income',
                categories: [
                    { name: 'Housing', percentage: 40, color: '#ff6b6b' },
                    { name: 'Food & Dining', percentage: 20, color: '#4ecdc4' },
                    { name: 'Transportation', percentage: 10, color: '#45b7d1' },
                    { name: 'Education', percentage: 15, color: '#2ecc71' },
                    { name: 'Entertainment', percentage: 8, color: '#96ceb4' },
                    { name: 'Healthcare', percentage: 4, color: '#ff9ff3' },
                    { name: 'Emergency Fund', percentage: 3, color: '#e17055' }
                ]
            }
        ];
        
        res.json(templates);
    } catch (error) {
        console.error('Budget templates error:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// GET /api/budgets/categories - Categories with spending data
router.get('/categories', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [categories] = await pool.query(`
            SELECT 
                c.*,
                COALESCE(AVG(monthly_spending.monthly_total), 0) as avg_monthly_spending,
                COALESCE(COUNT(DISTINCT monthly_spending.month), 0) as months_with_data,
                COALESCE(recent.transaction_count, 0) as recent_transactions,
                CASE WHEN b.id IS NOT NULL THEN TRUE ELSE FALSE END as has_budget,
                COALESCE(b.amount, 0) as current_budget
            FROM categories c
            LEFT JOIN (
                SELECT 
                    category_id,
                    DATE_FORMAT(transaction_date, '%Y-%m') as month,
                    SUM(amount) as monthly_total
                FROM transactions
                WHERE user_id = ? 
                    AND type = 'expense'
                    AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY category_id, month
            ) monthly_spending ON c.id = monthly_spending.category_id
            LEFT JOIN (
                SELECT 
                    category_id,
                    COUNT(*) as transaction_count
                FROM transactions
                WHERE user_id = ? 
                    AND type = 'expense'
                    AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
                GROUP BY category_id
            ) recent ON c.id = recent.category_id
            LEFT JOIN budgets b ON c.id = b.category_id AND b.user_id = ? AND b.is_active = TRUE
            WHERE c.type IN ('expense', 'both')
            GROUP BY c.id, c.name, c.type, c.color, c.icon, b.id, b.amount
            ORDER BY has_budget DESC, avg_monthly_spending DESC
        `, [userId, userId, userId]);
        
        res.json(categories);
    } catch (error) {
        console.error('Budget categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// POST /api/budgets/apply-template - Apply budget template
router.post('/apply-template', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { templateId, totalBudget } = req.body;
        
        if (!templateId || !totalBudget || totalBudget <= 0) {
            return res.status(400).json({ error: 'Template ID and total budget amount required' });
        }
        
        // Get template (this could be from a database in the future)
        const templates = [
            {
                id: 'basic-budget',
                categories: [
                    { name: 'Housing', percentage: 30 },
                    { name: 'Food & Dining', percentage: 15 },
                    { name: 'Transportation', percentage: 12 },
                    { name: 'Bills & Utilities', percentage: 8 },
                    { name: 'Healthcare', percentage: 5 },
                    { name: 'Entertainment', percentage: 10 },
                    { name: 'Shopping', percentage: 8 },
                    { name: 'Other Expenses', percentage: 12 }
                ]
            }
            // Add other templates here
        ];
        
        const template = templates.find(t => t.id === templateId);
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        const createdBudgets = [];
        const today = new Date().toISOString().split('T')[0];
        
        // Create budgets for each category in template
        for (const templateCategory of template.categories) {
            try {
                // Find matching category
                const [matchingCategory] = await pool.query(
                    'SELECT id FROM categories WHERE name = ? AND type IN ("expense", "both") LIMIT 1',
                    [templateCategory.name]
                );
                
                if (matchingCategory.length === 0) continue;
                
                const categoryId = matchingCategory[0].id;
                const budgetAmount = (totalBudget * templateCategory.percentage) / 100;
                
                // Check if budget already exists
                const [existingBudget] = await pool.query(
                    'SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND is_active = TRUE',
                    [userId, categoryId]
                );
                
                if (existingBudget.length > 0) continue; // Skip if budget exists
                
                // Create budget
                const [result] = await pool.query(
                    `INSERT INTO budgets (user_id, category_id, name, amount, period, start_date, is_active) 
                     VALUES (?, ?, ?, ?, 'monthly', ?, TRUE)`,
                    [userId, categoryId, `${templateCategory.name} Budget`, budgetAmount, today]
                );
                
                createdBudgets.push({
                    id: result.insertId,
                    category: templateCategory.name,
                    amount: budgetAmount.toFixed(2),
                    percentage: templateCategory.percentage
                });
                
            } catch (error) {
                console.error(`Error creating budget for ${templateCategory.name}:`, error);
            }
        }
        
        res.json({
            message: 'Template applied successfully',
            template: templateId,
            created_budgets: createdBudgets,
            total_budget: totalBudget
        });
        
    } catch (error) {
        console.error('Apply template error:', error);
        res.status(500).json({ error: 'Failed to apply template' });
    }
});

// GET /api/budgets/:id/performance - Detailed budget performance
router.get('/:id/performance', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const budgetId = parseInt(req.params.id);
        
        // Get budget info
        const [budgetInfo] = await pool.query(`
            SELECT b.*, c.name as category, c.color as category_color
            FROM budgets b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.id = ? AND b.user_id = ?
        `, [budgetId, userId]);
        
        if (budgetInfo.length === 0) {
            return res.status(404).json({ error: 'Budget not found' });
        }
        
        const budget = budgetInfo[0];
        
        // Get performance metrics
        const [performance] = await pool.query(`
            SELECT 
                COALESCE(SUM(amount), 0) as total_spent,
                COUNT(*) as transaction_count,
                COALESCE(AVG(amount), 0) as avg_transaction
            FROM transactions
            WHERE user_id = ? 
                AND category_id = ?
                AND type = 'expense'
                AND transaction_date >= ?
                AND (? IS NULL OR transaction_date <= ?)
        `, [userId, budget.category_id, budget.start_date, budget.end_date, budget.end_date]);
        
        const perf = performance[0];
        const totalSpent = parseFloat(perf.total_spent || 0);
        const remaining = budget.amount - totalSpent;
        const percentageUsed = budget.amount > 0 ? ((totalSpent / budget.amount) * 100).toFixed(2) : '0';
        
        let status = 'on_track';
        if (totalSpent > budget.amount) {
            status = 'over_budget';
        } else if ((totalSpent / budget.amount) * 100 >= budget.alert_threshold) {
            status = 'warning';
        }
        
        // Get daily breakdown
        const [dailyBreakdown] = await pool.query(`
            SELECT 
                transaction_date as date,
                SUM(amount) as spent,
                COUNT(*) as transactions
            FROM transactions
            WHERE user_id = ? 
                AND category_id = ?
                AND type = 'expense'
                AND transaction_date >= ?
                AND (? IS NULL OR transaction_date <= ?)
            GROUP BY transaction_date
            ORDER BY transaction_date DESC
            LIMIT 30
        `, [userId, budget.category_id, budget.start_date, budget.end_date, budget.end_date]);
        
        res.json({
            budget_info: budget,
            performance: {
                total_spent: totalSpent,
                remaining,
                percentage_used: percentageUsed,
                transaction_count: parseInt(perf.transaction_count || 0),
                avg_transaction: parseFloat(perf.avg_transaction || 0).toFixed(2),
                status,
                days_remaining: budget.end_date ? Math.max(0, Math.ceil((new Date(budget.end_date) - new Date()) / (1000 * 60 * 60 * 24))) : null
            },
            daily_breakdown: dailyBreakdown
        });
        
    } catch (error) {
        console.error('Budget performance error:', error);
        res.status(500).json({ error: 'Failed to get budget performance' });
    }
});

// Enhanced POST - Create budget with better validation
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            category_id, 
            name, 
            amount, 
            period = 'monthly', 
            start_date, 
            end_date = null,
            description = '', 
            is_active = true,
            alert_threshold = 80,
            notes = ''
        } = req.body;
        
        // Enhanced validation
        if (!category_id || !amount || !start_date) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['category_id', 'amount', 'start_date']
            });
        }
        
        if (!['weekly', 'monthly', 'yearly'].includes(period)) {
            return res.status(400).json({ error: 'Invalid period. Must be weekly, monthly, or yearly.' });
        }
        
        if (parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }
        
        // Verify category exists and get details
        const [categoryCheck] = await pool.query(
            'SELECT id, name, type FROM categories WHERE id = ?',
            [category_id]
        );
        
        if (categoryCheck.length === 0) {
            return res.status(400).json({ error: 'Category not found' });
        }
        
        const category = categoryCheck[0];
        
        // Check for existing active budget in same category and period
        const [existingBudget] = await pool.query(
            'SELECT id, name FROM budgets WHERE user_id = ? AND category_id = ? AND period = ? AND is_active = TRUE',
            [userId, category_id, period]
        );
        
        if (existingBudget.length > 0) {
            return res.status(400).json({ 
                error: `Active ${period} budget already exists for ${category.name}`,
                existing_budget: existingBudget[0]
            });
        }
        
        // Generate name if not provided
        const budgetName = name || `${category.name} ${period.charAt(0).toUpperCase() + period.slice(1)} Budget`;
        
        // Create the budget
        const [result] = await pool.query(
            `INSERT INTO budgets (user_id, category_id, name, amount, period, start_date, end_date, description, is_active, alert_threshold, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, category_id, budgetName, parseFloat(amount), period, start_date, end_date, description, is_active, parseFloat(alert_threshold), notes]
        );
        
        // Get the created budget with category info
        const [newBudget] = await pool.query(`
            SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon
            FROM budgets b 
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.id = ?
        `, [result.insertId]);
        
        res.status(201).json({
            message: 'Budget created successfully',
            budget: newBudget[0]
        });
        
    } catch (error) {
        console.error('Enhanced create budget error:', error);
        res.status(500).json({ 
            error: 'Failed to create budget',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Enhanced PUT - Update budget
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const budgetId = parseInt(req.params.id);
        const { 
            category_id, 
            name, 
            amount, 
            period, 
            start_date, 
            end_date,
            description, 
            is_active,
            alert_threshold,
            notes
        } = req.body;
        
        // Verify budget exists and belongs to user
        const [existingBudget] = await pool.query(
            'SELECT id, name FROM budgets WHERE id = ? AND user_id = ?',
            [budgetId, userId]
        );
        
        if (existingBudget.length === 0) {
            return res.status(404).json({ error: 'Budget not found' });
        }
        
        // Update with enhanced fields
        await pool.query(
            `UPDATE budgets SET 
                category_id = COALESCE(?, category_id),
                name = COALESCE(?, name),
                amount = COALESCE(?, amount),
                period = COALESCE(?, period),
                start_date = COALESCE(?, start_date),
                end_date = ?,
                description = COALESCE(?, description),
                is_active = COALESCE(?, is_active),
                alert_threshold = COALESCE(?, alert_threshold),
                notes = COALESCE(?, notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?`,
            [category_id, name, amount, period, start_date, end_date, description, is_active, alert_threshold, notes, budgetId, userId]
        );
        
        // Get updated budget
        const [updatedBudget] = await pool.query(`
            SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon
            FROM budgets b 
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.id = ?
        `, [budgetId]);
        
        res.json({
            message: 'Budget updated successfully',
            budget: updatedBudget[0]
        });
        
    } catch (error) {
        console.error('Enhanced update budget error:', error);
        res.status(500).json({ error: 'Failed to update budget' });
    }
});

// Enhanced DELETE - Soft delete with confirmation
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const budgetId = parseInt(req.params.id);
        
        // Get budget info for confirmation
        const [budgetInfo] = await pool.query(
            'SELECT id, name, amount FROM budgets WHERE id = ? AND user_id = ?',
            [budgetId, userId]
        );
        
        if (budgetInfo.length === 0) {
            return res.status(404).json({ error: 'Budget not found' });
        }
        
        // Soft delete by setting is_active = FALSE
        const [result] = await pool.query(
            'UPDATE budgets SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
            [budgetId, userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Budget not found' });
        }
        
        res.json({ 
            message: 'Budget deleted successfully',
            deleted_budget: budgetInfo[0]
        });
        
    } catch (error) {
        console.error('Enhanced delete budget error:', error);
        res.status(500).json({ error: 'Failed to delete budget' });
    }
});

module.exports = router;
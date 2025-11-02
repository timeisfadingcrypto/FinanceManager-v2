const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard overview
router.get('/overview', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get basic statistics
        const [stats] = await pool.execute(
            `SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
                AVG(amount) as avg_transaction
             FROM transactions 
             WHERE user_id = ?`,
            [userId]
        );
        
        // Get recent transactions
        const [recentTransactions] = await pool.execute(
            `SELECT t.*, c.name as category_name, c.color as category_color
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.user_id = ?
             ORDER BY t.transaction_date DESC, t.created_at DESC
             LIMIT 5`,
            [userId]
        );
        
        // Calculate net income
        const summary = stats[0];
        summary.net_income = (summary.total_income || 0) - (summary.total_expenses || 0);
        
        res.json({
            summary,
            recent_transactions: recentTransactions
        });
    } catch (error) {
        console.error('Dashboard overview error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

module.exports = router;
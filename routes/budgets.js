const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all budgets for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { active } = req.query;
        
        let whereClause = 'WHERE b.user_id = ?';
        let params = [userId];
        
        if (active !== undefined) {
            whereClause += ' AND b.is_active = ?';
            params.push(active === 'true' ? 1 : 0);
        }
        
        const query = `
            SELECT 
                b.*,
                c.name as category_name,
                c.color as category_color,
                c.icon as category_icon,
                COALESCE(spent.total_spent, 0) as spent
            FROM budgets b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN (
                SELECT 
                    category_id,
                    SUM(amount) as total_spent
                FROM transactions 
                WHERE user_id = ? 
                    AND type = 'expense'
                    AND transaction_date >= CURDATE() - INTERVAL 30 DAY
                GROUP BY category_id
            ) spent ON b.category_id = spent.category_id
            ${whereClause}
            ORDER BY b.created_at DESC
        `;
        
        const [budgets] = await pool.query(query, [userId, ...params]);
        
        res.json({ budgets });
    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ error: 'Failed to fetch budgets' });
    }
});

// Get specific budget by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const budgetId = parseInt(req.params.id);
        
        const query = `
            SELECT 
                b.*,
                c.name as category_name,
                c.color as category_color,
                c.icon as category_icon,
                COALESCE(spent.total_spent, 0) as spent
            FROM budgets b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN (
                SELECT 
                    category_id,
                    SUM(amount) as total_spent
                FROM transactions 
                WHERE user_id = ? 
                    AND type = 'expense'
                    AND transaction_date >= CURDATE() - INTERVAL 30 DAY
                GROUP BY category_id
            ) spent ON b.category_id = spent.category_id
            WHERE b.id = ? AND b.user_id = ?
        `;
        
        const [budgets] = await pool.query(query, [userId, budgetId, userId]);
        
        if (budgets.length === 0) {
            return res.status(404).json({ error: 'Budget not found' });
        }
        
        res.json({ budget: budgets[0] });
    } catch (error) {
        console.error('Get budget error:', error);
        res.status(500).json({ error: 'Failed to fetch budget' });
    }
});

// Create new budget
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { category_id, name, amount, period, start_date, description, is_active } = req.body;
        
        // Validation
        if (!category_id || !amount || !period || !start_date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (!['weekly', 'monthly', 'yearly'].includes(period)) {
            return res.status(400).json({ error: 'Invalid period' });
        }
        
        // Check if budget already exists for this category and period
        const [existing] = await pool.query(
            'SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND period = ? AND is_active = TRUE',
            [userId, category_id, period]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Active budget already exists for this category and period' });
        }
        
        // Generate name if not provided
        const budgetName = name || `${period.charAt(0).toUpperCase() + period.slice(1)} Budget`;
        
        const [result] = await pool.query(
            `INSERT INTO budgets (user_id, category_id, name, amount, period, start_date, description, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, category_id, budgetName, amount, period, start_date, description, is_active !== false]
        );
        
        const [newBudget] = await pool.query(
            `SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon
             FROM budgets b LEFT JOIN categories c ON b.category_id = c.id
             WHERE b.id = ?`,
            [result.insertId]
        );
        
        res.status(201).json({ budget: newBudget[0] });
    } catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({ error: 'Failed to create budget' });
    }
});

// Update budget
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const budgetId = parseInt(req.params.id);
        const { category_id, name, amount, period, start_date, description, is_active } = req.body;
        
        // Verify budget belongs to user
        const [existing] = await pool.query(
            'SELECT id FROM budgets WHERE id = ? AND user_id = ?',
            [budgetId, userId]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Budget not found' });
        }
        
        await pool.query(
            `UPDATE budgets SET category_id = ?, name = ?, amount = ?, period = ?, 
             start_date = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?`,
            [category_id, name, amount, period, start_date, description, is_active, budgetId, userId]
        );
        
        const [updated] = await pool.query(
            `SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon
             FROM budgets b LEFT JOIN categories c ON b.category_id = c.id
             WHERE b.id = ?`,
            [budgetId]
        );
        
        res.json({ budget: updated[0] });
    } catch (error) {
        console.error('Update budget error:', error);
        res.status(500).json({ error: 'Failed to update budget' });
    }
});

// Delete budget
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const budgetId = parseInt(req.params.id);
        
        const [result] = await pool.query(
            'DELETE FROM budgets WHERE id = ? AND user_id = ?',
            [budgetId, userId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Budget not found' });
        }
        
        res.json({ message: 'Budget deleted successfully' });
    } catch (error) {
        console.error('Delete budget error:', error);
        res.status(500).json({ error: 'Failed to delete budget' });
    }
});

module.exports = router;
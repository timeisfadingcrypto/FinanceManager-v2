const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Get all budgets for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [budgets] = await pool.execute(
            `SELECT b.*, c.name as category_name, c.color as category_color
             FROM budgets b
             LEFT JOIN categories c ON b.category_id = c.id
             WHERE b.user_id = ?
             ORDER BY b.created_at DESC`,
            [req.user.id]
        );
        
        res.json({ budgets });
    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ error: 'Failed to fetch budgets' });
    }
});

// Create new budget
router.post('/', authenticateToken, validate('budget'), async (req, res) => {
    try {
        const { category_id, amount, period, start_date, end_date, alert_threshold } = req.validatedData;
        
        const [result] = await pool.execute(
            `INSERT INTO budgets (user_id, category_id, amount, period, start_date, end_date, alert_threshold, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [req.user.id, category_id, amount, period, start_date, end_date, alert_threshold]
        );
        
        res.status(201).json({
            message: 'Budget created successfully',
            budget_id: result.insertId
        });
    } catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({ error: 'Failed to create budget' });
    }
});

module.exports = router;
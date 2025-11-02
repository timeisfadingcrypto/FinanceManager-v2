const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Get all bills for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [bills] = await pool.execute(
            `SELECT b.*, c.name as category_name, c.color as category_color
             FROM bills b
             LEFT JOIN categories c ON b.category_id = c.id
             WHERE b.user_id = ? AND b.active = 1
             ORDER BY b.due_date ASC`,
            [req.user.id]
        );
        
        res.json({ bills });
    } catch (error) {
        console.error('Get bills error:', error);
        res.status(500).json({ error: 'Failed to fetch bills' });
    }
});

// Create new bill
router.post('/', authenticateToken, validate('bill'), async (req, res) => {
    try {
        const { name, amount, due_date, frequency, category_id, auto_pay, notes } = req.validatedData;
        
        const [result] = await pool.execute(
            `INSERT INTO bills (user_id, name, amount, due_date, frequency, category_id, auto_pay, notes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [req.user.id, name, amount, due_date, frequency, category_id, auto_pay, notes]
        );
        
        res.status(201).json({
            message: 'Bill created successfully',
            bill_id: result.insertId
        });
    } catch (error) {
        console.error('Create bill error:', error);
        res.status(500).json({ error: 'Failed to create bill' });
    }
});

module.exports = router;
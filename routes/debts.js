const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Get all debts for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [debts] = await pool.execute(
            'SELECT * FROM debts WHERE user_id = ? AND active = 1 ORDER BY balance DESC',
            [req.user.id]
        );
        
        res.json({ debts });
    } catch (error) {
        console.error('Get debts error:', error);
        res.status(500).json({ error: 'Failed to fetch debts' });
    }
});

// Create new debt
router.post('/', authenticateToken, validate('debt'), async (req, res) => {
    try {
        const { name, type, balance, interest_rate, min_payment, due_date, notes } = req.validatedData;
        
        const [result] = await pool.execute(
            `INSERT INTO debts (user_id, name, type, balance, interest_rate, min_payment, due_date, notes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [req.user.id, name, type, balance, interest_rate, min_payment, due_date, notes]
        );
        
        res.status(201).json({
            message: 'Debt created successfully',
            debt_id: result.insertId
        });
    } catch (error) {
        console.error('Create debt error:', error);
        res.status(500).json({ error: 'Failed to create debt' });
    }
});

module.exports = router;
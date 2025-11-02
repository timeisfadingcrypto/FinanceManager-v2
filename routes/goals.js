const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Get all goals for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [goals] = await pool.execute(
            'SELECT * FROM goals WHERE user_id = ? ORDER BY priority DESC, target_date ASC',
            [req.user.id]
        );
        
        res.json({ goals });
    } catch (error) {
        console.error('Get goals error:', error);
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
});

// Create new goal
router.post('/', authenticateToken, validate('goal'), async (req, res) => {
    try {
        const { name, category, target_amount, current_amount, target_date, priority, description } = req.validatedData;
        
        const [result] = await pool.execute(
            `INSERT INTO goals (user_id, name, category, target_amount, current_amount, target_date, priority, description, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [req.user.id, name, category, target_amount, current_amount, target_date, priority, description]
        );
        
        res.status(201).json({
            message: 'Goal created successfully',
            goal_id: result.insertId
        });
    } catch (error) {
        console.error('Create goal error:', error);
        res.status(500).json({ error: 'Failed to create goal' });
    }
});

module.exports = router;
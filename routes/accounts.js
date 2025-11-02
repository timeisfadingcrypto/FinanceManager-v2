const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all accounts for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [accounts] = await pool.execute(
            'SELECT * FROM accounts WHERE user_id = ? AND active = 1 ORDER BY name',
            [req.user.id]
        );
        
        res.json({ accounts });
    } catch (error) {
        console.error('Get accounts error:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

module.exports = router;
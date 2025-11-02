const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all categories
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { type } = req.query;
        
        let whereClause = '';
        let params = [];
        
        if (type && ['income', 'expense'].includes(type)) {
            whereClause = 'WHERE type = ? OR type = "both"';
            params.push(type);
        }
        
        const [categories] = await pool.query(
            `SELECT id, name, type, color, icon FROM categories ${whereClause} ORDER BY name`,
            params
        );
        
        // Deduplicate by (name, type) combination - keep first occurrence
        const uniqueCategories = [];
        const seen = new Set();
        
        for (const category of categories) {
            const key = `${category.name}-${category.type}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueCategories.push(category);
            }
        }
        
        res.json({ categories: uniqueCategories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

module.exports = router;
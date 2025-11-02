const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Get all transactions for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 50, type, category_id, start_date, end_date } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE t.user_id = ?';
        let params = [req.user.id];

        if (type) {
            whereClause += ' AND t.type = ?';
            params.push(type);
        }
        if (category_id) {
            whereClause += ' AND t.category_id = ?';
            params.push(category_id);
        }
        if (start_date) {
            whereClause += ' AND t.transaction_date >= ?';
            params.push(start_date);
        }
        if (end_date) {
            whereClause += ' AND t.transaction_date <= ?';
            params.push(end_date);
        }

        const [transactions] = await pool.execute(
            `SELECT t.*, c.name as category_name, c.color as category_color,
                    a.name as account_name
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             LEFT JOIN accounts a ON t.account_id = a.id
             ${whereClause}
             ORDER BY t.transaction_date DESC, t.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        // Get total count
        const [countResult] = await pool.execute(
            `SELECT COUNT(*) as total FROM transactions t ${whereClause}`,
            params
        );

        res.json({
            transactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Get transaction by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [transactions] = await pool.execute(
            `SELECT t.*, c.name as category_name, c.color as category_color,
                    a.name as account_name
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             LEFT JOIN accounts a ON t.account_id = a.id
             WHERE t.id = ? AND t.user_id = ?`,
            [req.params.id, req.user.id]
        );

        if (transactions.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({ transaction: transactions[0] });
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({ error: 'Failed to fetch transaction' });
    }
});

// Create new transaction
router.post('/', authenticateToken, validate('transaction'), async (req, res) => {
    try {
        const { amount, description, type, category_id, account_id, transaction_date, tags } = req.validatedData;

        const [result] = await pool.execute(
            `INSERT INTO transactions (user_id, amount, description, type, category_id, account_id, transaction_date, tags, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [req.user.id, amount, description, type, category_id, account_id, transaction_date, tags]
        );

        // Get the created transaction with category info
        const [transactions] = await pool.execute(
            `SELECT t.*, c.name as category_name, c.color as category_color,
                    a.name as account_name
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             LEFT JOIN accounts a ON t.account_id = a.id
             WHERE t.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            message: 'Transaction created successfully',
            transaction: transactions[0]
        });
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

// Update transaction
router.put('/:id', authenticateToken, validate('transaction'), async (req, res) => {
    try {
        const { amount, description, type, category_id, account_id, transaction_date, tags } = req.validatedData;

        const [result] = await pool.execute(
            `UPDATE transactions 
             SET amount = ?, description = ?, type = ?, category_id = ?, account_id = ?, 
                 transaction_date = ?, tags = ?, updated_at = NOW()
             WHERE id = ? AND user_id = ?`,
            [amount, description, type, category_id, account_id, transaction_date, tags, req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Get the updated transaction
        const [transactions] = await pool.execute(
            `SELECT t.*, c.name as category_name, c.color as category_color,
                    a.name as account_name
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             LEFT JOIN accounts a ON t.account_id = a.id
             WHERE t.id = ?`,
            [req.params.id]
        );

        res.json({
            message: 'Transaction updated successfully',
            transaction: transactions[0]
        });
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

// Delete transaction
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM transactions WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

// Get transaction statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        let dateFilter = '';
        let params = [req.user.id];

        if (start_date && end_date) {
            dateFilter = 'AND transaction_date BETWEEN ? AND ?';
            params.push(start_date, end_date);
        }

        const [stats] = await pool.execute(
            `SELECT 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
                COUNT(*) as total_transactions,
                AVG(amount) as avg_transaction
             FROM transactions 
             WHERE user_id = ? ${dateFilter}`,
            params
        );

        const summary = stats[0];
        summary.net_income = (summary.total_income || 0) - (summary.total_expenses || 0);

        res.json({ stats: summary });
    } catch (error) {
        console.error('Get transaction stats error:', error);
        res.status(500).json({ error: 'Failed to fetch transaction statistics' });
    }
});

module.exports = router;
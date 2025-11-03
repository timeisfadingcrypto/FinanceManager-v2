const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { validate } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', validate('register'), async (req, res) => {
    try {
        const { email, password, firstName, lastName, role } = req.validatedData;

        // Check if user already exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const [result] = await pool.execute(
            `INSERT INTO users (email, password_hash, first_name, last_name, role, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [email, hashedPassword, firstName, lastName, role]
        );

        const userId = result.insertId;

        // Generate JWT token
        const token = jwt.sign(
            { userId, email, role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: userId,
                email,
                firstName,
                lastName,
                role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login user
router.post('/login', validate('login'), async (req, res) => {
    try {
        const { email, password } = req.validatedData;

        // Find user
        const [users] = await pool.execute(
            'SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = ? AND active = 1',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user.id,
                email: req.user.email,
                firstName: req.user.first_name,
                lastName: req.user.last_name,
                role: req.user.role
            }
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Verify token (POST remains for backward compatibility)
router.post('/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// New: Verify token via GET for frontend bootstrap
router.get('/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

module.exports = router;

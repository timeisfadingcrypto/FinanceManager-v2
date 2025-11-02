const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');
const budgetEnhancedRoutes = require('./routes/budgets-enhanced');
const categoryRoutes = require('./routes/categories');
const accountRoutes = require('./routes/accounts');
const billRoutes = require('./routes/bills');
const debtRoutes = require('./routes/debts');
const goalRoutes = require('./routes/goals');
const dashboardRoutes = require('./routes/dashboard');
const debugRoutes = require('./routes/debug');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy headers (needed on Railway for correct client IP)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes - Enhanced Budget System
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// Budget routes - Use enhanced version for comprehensive functionality
app.use('/api/budgets', budgetEnhancedRoutes);
// Keep original for backward compatibility if needed
// app.use('/api/budgets-legacy', budgetRoutes);

app.use('/api/categories', categoryRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Debug routes for development and troubleshooting
if (process.env.NODE_ENV !== 'production') {
    app.use('/api/debug', debugRoutes);
    console.log('🔍 Debug endpoints enabled (development mode)');
}

// Enhanced health check with budget system status
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '2.1.0-enhanced-budgets',
        features: {
            authentication: 'active',
            transactions: 'active',
            budgets: 'enhanced',
            budget_templates: 'active',
            ai_recommendations: 'active',
            budget_analytics: 'active',
            categories: 'active',
            accounts: 'active',
            bills: 'active',
            debts: 'active',
            goals: 'active',
            dashboard: 'active'
        },
        endpoints: {
            budgets: [
                'GET /api/budgets',
                'GET /api/budgets/analysis',
                'GET /api/budgets/recommendations', 
                'GET /api/budgets/templates',
                'GET /api/budgets/categories',
                'POST /api/budgets/apply-template',
                'GET /api/budgets/:id/performance',
                'POST /api/budgets',
                'PUT /api/budgets/:id',
                'DELETE /api/budgets/:id'
            ],
            debug: process.env.NODE_ENV !== 'production' ? [
                'GET /api/debug/budget-setup',
                'POST /api/debug/test-budget',
                'POST /api/debug/init-categories',
                'POST /api/debug/run-migrations',
                'GET /api/debug/system-info'
            ] : 'disabled_in_production'
        }
    });
});

// Catch-all handler: send back React's index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Global error handler with enhanced budget error handling
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    
    // Enhanced error response for budget-related errors
    const errorResponse = { 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    };
    
    // Add development details
    if (process.env.NODE_ENV === 'development') {
        errorResponse.details = err.message;
        errorResponse.stack = err.stack;
    }
    
    // Budget-specific error hints
    if (err.message && err.message.includes('budget')) {
        errorResponse.hint = 'Check /api/debug/budget-setup for budget system diagnostics';
    }
    
    res.status(500).json(errorResponse);
});

// Enhanced database initialization on startup
if (process.env.INIT_DB_ON_BUILD === 'true') {
    (async () => {
        try {
            console.log('🔧 INIT_DB_ON_BUILD enabled: initializing enhanced database at startup...');
            const initDb = require('./scripts/init-db-enhanced');
            await initDb();
            console.log('✅ Enhanced database initialization completed at startup');
        } catch (e) {
            console.error('❌ Enhanced database initialization failed at startup:', e);
        }
    })();
}

// Start server with enhanced budget features
app.listen(PORT, () => {
    console.log(`🚀 FinanceManager v2 Enhanced running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    
    // Enhanced features announcement
    console.log('\n🎆 ENHANCED BUDGET FEATURES ACTIVE:');
    console.log('   ✅ Comprehensive Budget CRUD');
    console.log('   🤖 AI-Powered Recommendations');
    console.log('   📋 Budget Templates (50/30/20, Zero-based, etc.)');
    console.log('   📊 Advanced Analytics & Performance Tracking');
    console.log('   🎨 Enhanced Category Management');
    console.log('   🔍 Debug Endpoints for Troubleshooting');
    
    if (process.env.NODE_ENV !== 'production') {
        console.log('\n🔧 DEBUG ENDPOINTS:');
        console.log('   GET  /api/debug/budget-setup');
        console.log('   POST /api/debug/test-budget');
        console.log('   POST /api/debug/init-categories');
        console.log('   POST /api/debug/run-migrations');
        console.log('   GET  /api/debug/system-info');
    }
    
    console.log('\n🚀 Ready for enhanced budget management!');
});

module.exports = app;
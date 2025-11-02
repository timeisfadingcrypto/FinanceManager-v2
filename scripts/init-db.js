const mysql = require('mysql2/promise');
require('dotenv').config();

const initDatabase = async () => {
    const dbName = process.env.DB_NAME || 'financemanager_v2';

    // First connection: server-level (no database selected)
    const serverConn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    let dbConn;

    try {
        // Create database if it doesn't exist (server-level)
        await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log('✅ Database created/ensured');

        // Second connection: connect directly to the target DB (avoid USE)
        dbConn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: dbName,
            multipleStatements: true
        });
        console.log('✅ Connected to database:', dbName);

        // Create tables (DDL via query, not execute)
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                role ENUM('primary', 'spouse') DEFAULT 'primary',
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_active (active)
            )`,

            `CREATE TABLE IF NOT EXISTS categories (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                type ENUM('income', 'expense', 'both') DEFAULT 'both',
                color VARCHAR(7) DEFAULT '#6c757d',
                icon VARCHAR(50) DEFAULT 'fas fa-circle',
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_type (type),
                INDEX idx_default (is_default)
            )`,

            `CREATE TABLE IF NOT EXISTS accounts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                type ENUM('checking', 'savings', 'credit', 'investment', 'cash') NOT NULL,
                balance DECIMAL(15,2) DEFAULT 0.00,
                currency VARCHAR(3) DEFAULT 'USD',
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_active (user_id, active)
            )`,

            `CREATE TABLE IF NOT EXISTS transactions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                account_id INT NULL,
                category_id INT NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                description VARCHAR(255) NOT NULL,
                type ENUM('income', 'expense') NOT NULL,
                transaction_date DATE NOT NULL,
                tags TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
                FOREIGN KEY (category_id) REFERENCES categories(id),
                INDEX idx_user_date (user_id, transaction_date),
                INDEX idx_type (type),
                INDEX idx_category (category_id)
            )`,

            `CREATE TABLE IF NOT EXISTS budgets (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                category_id INT,
                name VARCHAR(255) NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                period ENUM('weekly', 'monthly', 'yearly') DEFAULT 'monthly',
                start_date DATE NOT NULL,
                end_date DATE,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                alert_threshold DECIMAL(5,2) DEFAULT 80.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                INDEX idx_user_period (user_id, period),
                INDEX idx_dates (start_date, end_date),
                INDEX idx_active (is_active)
            )`,

            `CREATE TABLE IF NOT EXISTS bills (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                category_id INT NULL,
                name VARCHAR(255) NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                due_date DATE NOT NULL,
                frequency ENUM('weekly', 'monthly', 'yearly') DEFAULT 'monthly',
                auto_pay BOOLEAN DEFAULT FALSE,
                notes TEXT NULL,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
                INDEX idx_user_due (user_id, due_date),
                INDEX idx_active (active)
            )`,

            `CREATE TABLE IF NOT EXISTS debts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                type ENUM('credit_card', 'auto_loan', 'mortgage', 'student_loan', 'personal_loan', 'other') NOT NULL,
                balance DECIMAL(15,2) NOT NULL,
                interest_rate DECIMAL(5,2) NOT NULL,
                min_payment DECIMAL(15,2) NOT NULL,
                due_date DATE NULL,
                notes TEXT NULL,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_active (user_id, active),
                INDEX idx_type (type)
            )`,

            `CREATE TABLE IF NOT EXISTS goals (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                category ENUM('emergency_fund', 'vacation', 'home_purchase', 'retirement', 'education', 'other') NOT NULL,
                target_amount DECIMAL(15,2) NOT NULL,
                current_amount DECIMAL(15,2) DEFAULT 0.00,
                target_date DATE NULL,
                priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
                description TEXT NULL,
                achieved BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_achieved (user_id, achieved),
                INDEX idx_priority (priority)
            )`
        ];

        for (const table of tables) {
            await dbConn.query(table);
        }
        console.log('✅ All tables created successfully');

        const defaultCategories = [
            ['Food & Dining', 'expense', '#e74c3c', 'fas fa-utensils'],
            ['Transportation', 'expense', '#3498db', 'fas fa-car'],
            ['Shopping', 'expense', '#9b59b6', 'fas fa-shopping-bag'],
            ['Entertainment', 'expense', '#f39c12', 'fas fa-film'],
            ['Bills & Utilities', 'expense', '#34495e', 'fas fa-file-invoice'],
            ['Healthcare', 'expense', '#1abc9c', 'fas fa-heartbeat'],
            ['Education', 'expense', '#2ecc71', 'fas fa-graduation-cap'],
            ['Travel', 'expense', '#e67e22', 'fas fa-plane'],
            ['Salary', 'income', '#27ae60', 'fas fa-dollar-sign'],
            ['Freelance', 'income', '#16a085', 'fas fa-laptop'],
            ['Investment', 'income', '#8e44ad', 'fas fa-chart-line'],
            ['Other Income', 'income', '#95a5a6', 'fas fa-plus'],
            ['Other Expense', 'expense', '#7f8c8d', 'fas fa-minus']
        ];

        for (const [name, type, color, icon] of defaultCategories) {
            await dbConn.query(
                'INSERT IGNORE INTO categories (name, type, color, icon, is_default) VALUES (?, ?, ?, ?, TRUE)',
                [name, type, color, icon]
            );
        }
        console.log('✅ Default categories inserted');
        console.log('🎉 Database initialization complete!');

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    } finally {
        try { if (dbConn) await dbConn.end(); } catch (e) {}
        try { await serverConn.end(); } catch (e) {}
    }
};

if (require.main === module) {
    initDatabase().catch(console.error);
}

module.exports = initDatabase;
# FinanceManager v2

A modern, clean financial management application built with Node.js, Express, and MySQL.

## Features

- 🔐 **Secure Authentication** - JWT-based auth with bcrypt password hashing
- 💰 **Transaction Management** - Add, edit, delete, and categorize transactions
- 📊 **Dashboard** - Real-time financial overview and statistics
- 🎯 **Budget Tracking** - Set and monitor budgets by category
- 📋 **Bill Management** - Track recurring bills and payments
- 💳 **Debt Tracking** - Monitor debts and payment schedules
- 🎯 **Financial Goals** - Set and track savings goals
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🛡️ **Security** - Rate limiting, input validation, and SQL injection protection

## Tech Stack

- **Backend**: Node.js, Express.js, MySQL
- **Frontend**: Vanilla JavaScript, Bootstrap 5, Font Awesome
- **Authentication**: JWT tokens with bcrypt
- **Validation**: Joi schema validation
- **Security**: Helmet, CORS, Rate limiting

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/timeisfadingcrypto/FinanceManager-v2.git
   cd FinanceManager-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database credentials and JWT secret:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=financemanager_v2
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your-super-secret-jwt-key-here
   PORT=3000
   ```

4. **Initialize the database**
   ```bash
   npm run init-db
   ```

5. **Start the application**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Access the application**
   
   Open your browser and go to: `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/verify` - Verify JWT token

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get specific transaction
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/stats/summary` - Get transaction statistics

### Categories
- `GET /api/categories` - Get all categories

### Budgets
- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create new budget

### Bills
- `GET /api/bills` - Get all bills
- `POST /api/bills` - Create new bill

### Debts
- `GET /api/debts` - Get all debts
- `POST /api/debts` - Create new debt

### Goals
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create new goal

### Accounts
- `GET /api/accounts` - Get all accounts

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard data

## Database Schema

The application uses the following main tables:

- **users** - User accounts and authentication
- **categories** - Transaction categories
- **accounts** - User financial accounts
- **transactions** - Income and expense transactions
- **budgets** - Budget limits by category
- **bills** - Recurring bills and payments
- **debts** - Debt tracking
- **goals** - Financial goals and targets

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with salt rounds
- **Input Validation** - Joi schema validation
- **SQL Injection Protection** - Parameterized queries
- **Rate Limiting** - Prevents brute force attacks
- **CORS Protection** - Cross-origin request security
- **Helmet** - Security headers

## Development

### Project Structure
```
FinanceManager-v2/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── validation.js        # Input validation
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── transactions.js      # Transaction management
│   ├── budgets.js           # Budget management
│   ├── bills.js             # Bill management
│   ├── debts.js             # Debt management
│   ├── goals.js             # Goal management
│   ├── categories.js        # Category management
│   ├── accounts.js          # Account management
│   └── dashboard.js         # Dashboard data
├── scripts/
│   └── init-db.js           # Database initialization
├── public/
│   ├── css/
│   │   └── app.css          # Application styles
│   ├── js/
│   │   ├── api.js           # API client
│   │   ├── auth.js          # Authentication logic
│   │   ├── transactions.js  # Transaction management
│   │   └── app.js           # Main application
│   └── index.html           # Single page application
├── server.js                # Express server
├── package.json             # Dependencies
└── README.md               # This file
```

### Adding New Features

1. **Backend**: Add routes in the `routes/` directory
2. **Frontend**: Add JavaScript modules in `public/js/`
3. **Database**: Modify `scripts/init-db.js` for schema changes
4. **Validation**: Add schemas to `middleware/validation.js`

## Deployment

### Railway (Recommended)

1. **Connect to Railway**
   - Fork this repository
   - Connect your GitHub account to Railway
   - Deploy from your fork

2. **Set environment variables** in Railway dashboard:
   ```env
   DB_HOST=your_railway_db_host
   DB_PORT=3306
   DB_NAME=railway
   DB_USER=root
   DB_PASSWORD=your_railway_db_password
   JWT_SECRET=your-production-jwt-secret
   NODE_ENV=production
   ```

3. **Initialize database** via Railway console:
   ```bash
   npm run init-db
   ```

### Other Platforms

The application can be deployed to any Node.js hosting platform:
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Google Cloud Run
- Vercel

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support or questions:
- Open an issue on GitHub
- Check the documentation
- Review the API endpoints

---

**FinanceManager v2** - Modern financial management made simple! 💰✨
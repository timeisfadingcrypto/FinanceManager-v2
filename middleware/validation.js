const Joi = require('joi');

// Validation schemas
const schemas = {
    register: Joi.object({
        email: Joi.string().email().required().max(255),
        password: Joi.string().min(6).max(128).required(),
        firstName: Joi.string().min(1).max(100).required(),
        lastName: Joi.string().min(1).max(100).required(),
        role: Joi.string().valid('primary', 'spouse').default('primary')
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    transaction: Joi.object({
        amount: Joi.number().positive().precision(2).required(),
        description: Joi.string().min(1).max(255).required(),
        type: Joi.string().valid('income', 'expense').required(),
        category_id: Joi.number().integer().positive().required(),
        account_id: Joi.number().integer().positive().optional().allow(null),
        transaction_date: Joi.date().iso().required(),
        tags: Joi.string().max(500).optional().allow('', null)
    }),

    budget: Joi.object({
        category_id: Joi.number().integer().positive().required(),
        amount: Joi.number().positive().precision(2).required(),
        period: Joi.string().valid('weekly', 'monthly', 'yearly').default('monthly'),
        start_date: Joi.date().iso().required(),
        end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
        alert_threshold: Joi.number().min(0).max(100).default(80)
    }),

    bill: Joi.object({
        name: Joi.string().min(1).max(255).required(),
        amount: Joi.number().positive().precision(2).required(),
        due_date: Joi.date().iso().required(),
        frequency: Joi.string().valid('weekly', 'monthly', 'yearly').default('monthly'),
        category_id: Joi.number().integer().positive().optional().allow(null),
        auto_pay: Joi.boolean().default(false),
        notes: Joi.string().max(1000).optional().allow('', null)
    }),

    debt: Joi.object({
        name: Joi.string().min(1).max(255).required(),
        type: Joi.string().valid('credit_card', 'auto_loan', 'mortgage', 'student_loan', 'personal_loan', 'other').required(),
        balance: Joi.number().min(0).precision(2).required(),
        interest_rate: Joi.number().min(0).max(100).precision(2).required(),
        min_payment: Joi.number().min(0).precision(2).required(),
        due_date: Joi.date().iso().optional().allow(null),
        notes: Joi.string().max(1000).optional().allow('', null)
    }),

    goal: Joi.object({
        name: Joi.string().min(1).max(255).required(),
        category: Joi.string().valid('emergency_fund', 'vacation', 'home_purchase', 'retirement', 'education', 'other').required(),
        target_amount: Joi.number().positive().precision(2).required(),
        current_amount: Joi.number().min(0).precision(2).default(0),
        target_date: Joi.date().iso().optional().allow(null),
        priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
        description: Joi.string().max(1000).optional().allow('', null)
    })
};

const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schemas[schema].validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: errors 
            });
        }

        req.validatedData = value;
        next();
    };
};

module.exports = { validate };
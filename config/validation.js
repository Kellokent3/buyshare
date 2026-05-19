// config/validation.js
const { body, validationResult } = require('express-validator');

const validate = {
  // Registration validation
  register: [
    body('full_name')
      .trim()
      .notEmpty().withMessage('Full name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
      .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
    
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
    
    body('phone')
      .optional()
      .trim()
      .matches(/^\+?[0-9]{10,15}$/).withMessage('Invalid phone number format')
  ],
  
  // Login validation
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required'),
    
    body('role')
      .notEmpty().withMessage('Role is required')
      .isIn(['admin', 'bank_manager', 'investor']).withMessage('Invalid role')
  ],
  
  // Share validation
  share: [
    body('share_name')
      .trim()
      .notEmpty().withMessage('Share name is required')
      .isLength({ min: 3, max: 150 }).withMessage('Share name must be 3-150 characters'),
    
    body('total_shares')
      .notEmpty().withMessage('Total shares is required')
      .isInt({ min: 1 }).withMessage('Total shares must be at least 1'),
    
    body('available_shares')
      .notEmpty().withMessage('Available shares is required')
      .isInt({ min: 0 }).withMessage('Available shares must be 0 or more'),
    
    body('price_per_share')
      .notEmpty().withMessage('Price is required')
      .isFloat({ min: 0.01 }).withMessage('Price must be at least 0.01'),
    
    body('bank_id')
      .optional()
      .isInt().withMessage('Invalid bank ID')
  ],
  
  // Purchase request validation
  purchaseRequest: [
    body('share_id')
      .notEmpty().withMessage('Share ID is required')
      .isInt().withMessage('Invalid share ID'),
    
    body('quantity')
      .notEmpty().withMessage('Quantity is required')
      .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
  ],
  
  // Rejection validation
  rejection: [
    body('reason')
      .trim()
      .notEmpty().withMessage('Rejection reason is required')
      .isLength({ min: 5, max: 500 }).withMessage('Reason must be 5-500 characters')
  ]
};

// ✅ FIX: validationResult is defined here!
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array().map(e => ({
        field: e.path || e.param,
        message: e.msg
      }))
    });
  }
  next();
};

module.exports = { validate, handleValidation };
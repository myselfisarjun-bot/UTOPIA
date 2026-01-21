const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { catchAsync } = require('../middleware/errorHandler');
const { traceBusinessOperation } = require('../middleware/requestTracer');
const logger = require('../utils/logger');
const { trackUserAction, trackAnalyticsEvent } = require('../monitoring/prometheus');

const router = express.Router();

// Mock user database (in real app, this would be a proper database)
const users = new Map();

// Validation middleware
const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').notEmpty().withMessage('Name is required'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Register endpoint
router.post('/register', registerValidation, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email, password, name } = req.body;
  const trace = traceBusinessOperation('user_register', null);

  try {
    // Check if user already exists
    if (users.has(email)) {
      return res.status(409).json({
        status: 'error',
        message: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = {
      id: `user_${Date.now()}`,
      email,
      name,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true,
    };

    users.set(email, user);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Track user action
    trackUserAction('register', 'new_user');
    trackAnalyticsEvent('user_registered', 'auth');

    // Log the event
    logger.trackUserAction(user.id, 'register', {
      email,
      method: 'email',
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    trace.complete({ userId: user.id, email });

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        token
      }
    });
  } catch (error) {
    trace.error(error);
    throw error;
  }
}));

// Login endpoint
router.post('/login', loginValidation, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email, password } = req.body;
  const trace = traceBusinessOperation('user_login', null);

  try {
    // Find user
    const user = users.get(email);
    if (!user || !user.isActive) {
      trackUserAction('login_failed', 'unknown_user');
      trackAnalyticsEvent('login_failed', 'auth');
      
      logger.trackUserAction(null, 'login_failed', {
        email,
        reason: 'user_not_found',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      trackUserAction('login_failed', 'invalid_password');
      trackAnalyticsEvent('login_failed', 'auth');
      
      logger.trackUserAction(user.id, 'login_failed', {
        email,
        reason: 'invalid_password',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Track successful login
    trackUserAction('login_success', 'authenticated_user');
    trackAnalyticsEvent('user_login', 'auth');

    logger.trackUserAction(user.id, 'login', {
      email,
      method: 'email',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    trace.complete({ userId: user.id, email });

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          lastLogin: user.lastLogin,
        },
        token
      }
    });
  } catch (error) {
    trace.error(error);
    throw error;
  }
}));

// Logout endpoint
router.post('/logout', catchAsync(async (req, res) => {
  const trace = traceBusinessOperation('user_logout', req.user?.id);

  try {
    // In a real app, you might want to invalidate the JWT token
    // For this demo, we'll just track the logout event
    
    trackUserAction('logout', 'authenticated_user');
    trackAnalyticsEvent('user_logout', 'auth');

    logger.trackUserAction(req.user?.id, 'logout', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    trace.complete();

    res.json({
      status: 'success',
      message: 'Logout successful'
    });
  } catch (error) {
    trace.error(error);
    throw error;
  }
}));

// Refresh token endpoint
router.post('/refresh', catchAsync(async (req, res) => {
  const { token } = req.body;
  const trace = traceBusinessOperation('token_refresh');

  try {
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Token is required'
      });
    }

    // Verify the existing token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = Array.from(users.values()).find(u => u.id === decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    trackAnalyticsEvent('token_refreshed', 'auth');

    trace.complete({ userId: user.id });

    res.json({
      status: 'success',
      data: {
        token: newToken
      }
    });
  } catch (error) {
    trace.error(error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
}));

// Password reset request
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required'),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email } = req.body;
  const trace = traceBusinessOperation('password_reset_request');

  try {
    const user = users.get(email);
    
    // Always return success for security reasons
    // In a real app, you would send an email here
    
    if (user) {
      trackAnalyticsEvent('password_reset_requested', 'auth');
      logger.trackUserAction(user.id, 'password_reset_requested', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    trace.complete({ email });

    res.json({
      status: 'success',
      message: 'Password reset instructions sent to email'
    });
  } catch (error) {
    trace.error(error);
    throw error;
  }
}));

// Verify token endpoint (for client-side token validation)
router.get('/verify', catchAsync(async (req, res) => {
  const { token } = req.query;
  const trace = traceBusinessOperation('token_verify');

  try {
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = Array.from(users.values()).find(u => u.id === decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }

    trackAnalyticsEvent('token_verified', 'auth');

    trace.complete({ userId: user.id });

    res.json({
      status: 'success',
      data: {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          lastLogin: user.lastLogin,
        }
      }
    });
  } catch (error) {
    trace.error(error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
}));

module.exports = { authRouter: router };
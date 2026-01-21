const express = require('express');
const { body, validationResult } = require('express-validator');
const { catchAsync } = require('../middleware/errorHandler');
const { traceBusinessOperation } = require('../middleware/requestTracer');
const logger = require('../utils/logger');
const { trackUserAction, trackAnalyticsEvent } = require('../monitoring/prometheus');

const router = express.Router();

// Mock user database (shared with auth for demo)
let users = global.users || new Map();

// Get current user profile
router.get('/profile', catchAsync(async (req, res) => {
  const trace = traceBusinessOperation('get_user_profile', req.user?.id);

  try {
    if (!req.user?.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Find user (in real app, this would query the database)
    const user = Array.from(users.values()).find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Track analytics
    trackUserAction('profile_view', 'authenticated_user');
    trackAnalyticsEvent('user_profile_viewed', 'user');

    logger.trackUserAction(user.id, 'profile_viewed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    trace.complete();

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        }
      }
    });
  } catch (error) {
    trace.error(error);
    throw error;
  }
}));

// Update user profile
router.put('/profile', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, email } = req.body;
  const trace = traceBusinessOperation('update_user_profile', req.user?.id);

  try {
    if (!req.user?.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Find user
    const user = Array.from(users.values()).find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check email uniqueness if email is being updated
    if (email && email !== user.email) {
      const existingUser = users.get(email);
      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          message: 'Email already in use'
        });
      }
    }

    // Update user data
    const oldData = { ...user };
    if (name) user.name = name;
    if (email) {
      users.delete(user.email);
      user.email = email;
      users.set(email, user);
    }

    // Track analytics
    trackUserAction('profile_update', 'authenticated_user');
    trackAnalyticsEvent('user_profile_updated', 'user');

    logger.trackUserAction(user.id, 'profile_updated', {
      oldData,
      newData: { name: user.name, email: user.email },
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    trace.complete({ userId: user.id, changes: { name, email } });

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        }
      }
    });
  } catch (error) {
    trace.error(error);
    throw error;
  }
}));

// Change password
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { currentPassword, newPassword } = req.body;
  const trace = traceBusinessOperation('change_password', req.user?.id);

  try {
    if (!req.user?.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Find user
    const user = Array.from(users.values()).find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify current password
    const bcrypt = require('bcrypt');
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      trackUserAction('password_change_failed', 'invalid_current_password');
      trackAnalyticsEvent('password_change_failed', 'security');

      logger.trackUserAction(user.id, 'password_change_failed', {
        reason: 'invalid_current_password',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedNewPassword;

    // Track analytics
    trackUserAction('password_change_success', 'authenticated_user');
    trackAnalyticsEvent('password_changed', 'security');

    logger.trackUserAction(user.id, 'password_changed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    trace.complete({ userId: user.id });

    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    trace.error(error);
    throw error;
  }
}));

// Delete user account
router.delete('/account', catchAsync(async (req, res) => {
  const trace = traceBusinessOperation('delete_user_account', req.user?.id);

  try {
    if (!req.user?.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Find user
    const user = Array.from(users.values()).find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Delete user
    users.delete(user.email);

    // Track analytics
    trackUserAction('account_delete', 'authenticated_user');
    trackAnalyticsEvent('user_account_deleted', 'user');

    logger.trackUserAction(user.id, 'account_deleted', {
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    trace.complete({ userId: user.id, email: user.email });

    res.json({
      status: 'success',
      message: 'Account deleted successfully'
    });
  } catch (error) {
    trace.error(error);
    throw error;
  }
}));

// Get user activity/audit log
router.get('/activity', catchAsync(async (req, res) => {
  const trace = traceBusinessOperation('get_user_activity', req.user?.id);

  try {
    if (!req.user?.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Mock activity data (in real app, this would come from audit logs)
    const activities = [
      {
        id: 'act_001',
        action: 'login',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      {
        id: 'act_002',
        action: 'profile_update',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      {
        id: 'act_003',
        action: 'register',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    ];

    trackUserAction('activity_view', 'authenticated_user');

    trace.complete({ activitiesCount: activities.length });

    res.json({
      status: 'success',
      data: {
        activities,
        total: activities.length
      }
    });
  } catch (error) {
    trace.error(error);
    throw error;
  }
}));

// Export user data (GDPR compliance)
router.post('/export-data', catchAsync(async (req, res) => {
  const trace = traceBusinessOperation('export_user_data', req.user?.id);

  try {
    if (!req.user?.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Find user
    const user = Array.from(users.values()).find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Prepare user data export
    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      exportDate: new Date().toISOString(),
      exportId: `export_${Date.now()}`,
    };

    // Track analytics
    trackUserAction('data_export', 'authenticated_user');
    trackAnalyticsEvent('user_data_exported', 'compliance');

    logger.trackUserAction(user.id, 'data_exported', {
      exportId: exportData.exportId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    trace.complete({ exportId: exportData.exportId });

    res.json({
      status: 'success',
      message: 'Data export prepared',
      data: exportData
    });
  } catch (error) {
    trace.error(error);
    throw error;
  }
}));

module.exports = { userRouter: router };
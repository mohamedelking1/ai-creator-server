/**
 * Authentication Routes
 * Handles user registration, login, and OAuth
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, auth } = require('../config/firebase');
const logger = require('../utils/logger');

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, phone } = req.body;

    // Check if user exists
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    if (!userSnapshot.empty) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      name,
      phone: phone || '',
      credits: 0,
      language: 'ar',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
    });

    // Generate JWT token
    const token = jwt.sign(
      { uid: userRecord.uid, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    logger.info(`User registered: ${email}`);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        uid: userRecord.uid,
        email,
        name,
      },
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Get user from Firestore
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    if (userSnapshot.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userSnapshot.docs[0];
    const userData = user.data();

    // Verify password (in production, use Firebase Auth)
    // For now, we'll use Firebase custom token
    const customToken = await auth.createCustomToken(user.id);

    logger.info(`User logged in: ${email}`);
    res.json({
      message: 'Login successful',
      token: customToken,
      user: {
        uid: user.id,
        email: userData.email,
        name: userData.name,
        credits: userData.credits,
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/verify-token
 * Verify JWT token
 */
router.post('/verify-token', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', (req, res) => {
  // In a real app, you might invalidate the token here
  res.json({ message: 'Logout successful' });
});

module.exports = router;

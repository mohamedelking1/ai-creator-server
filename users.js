/**
 * Users Routes
 * Handles user profile and settings
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const logger = require('../utils/logger');

/**
 * GET /api/users/:uid
 * Get user profile
 */
router.get('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      uid: userDoc.id,
      ...userDoc.data(),
    });
  } catch (error) {
    logger.error(`Get user error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/users/:uid
 * Update user profile
 */
router.put('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, phone, language } = req.body;

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userRef.update({
      ...(name && { name }),
      ...(phone && { phone }),
      ...(language && { language }),
      updatedAt: new Date(),
    });

    logger.info(`User updated: ${uid}`);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    logger.error(`Update user error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:uid/credits
 * Get user credits
 */
router.get('/:uid/credits', async (req, res) => {
  try {
    const { uid } = req.params;

    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      credits: userDoc.data().credits || 0,
    });
  } catch (error) {
    logger.error(`Get credits error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:uid/generations
 * Get user's generated content
 */
router.get('/:uid/generations', async (req, res) => {
  try {
    const { uid } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const snapshot = await db.collection('generations')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    const generations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      total: snapshot.size,
      generations,
    });
  } catch (error) {
    logger.error(`Get generations error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

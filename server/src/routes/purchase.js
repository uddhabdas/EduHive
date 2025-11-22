const express = require('express');
const { auth } = require('../middleware/auth');
const Course = require('../models/Course');
const User = require('../models/User');
const CoursePurchase = require('../models/CoursePurchase');
const WalletTransaction = require('../models/WalletTransaction');

const router = express.Router();

// Purchase course with wallet
router.post('/courses/:courseId/purchase', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // For free courses, allow enrollment without payment
    if (!course.isPaid || course.price <= 0) {
      // Check if already enrolled
      const existingPurchase = await CoursePurchase.findOne({
        userId: user._id,
        courseId: course._id,
        status: 'completed',
      });

      if (existingPurchase) {
        return res.status(400).json({ error: 'Course already enrolled' });
      }

      // Create free enrollment record
      const purchase = await CoursePurchase.create({
        userId: user._id,
        courseId: course._id,
        amount: 0,
        status: 'completed',
        transactionId: `FREE-${Date.now()}`,
      });

      return res.json({
        message: 'Course enrolled successfully',
        purchase,
        newBalance: user.walletBalance,
      });
    }

    // Check if already purchased
    const existingPurchase = await CoursePurchase.findOne({
      userId: user._id,
      courseId: course._id,
      status: 'completed',
    });

    if (existingPurchase) {
      return res.status(400).json({ error: 'Course already purchased' });
    }

    // Check wallet balance
    const walletBalance = user.walletBalance || 0;
    if (walletBalance < course.price) {
      return res.status(400).json({ 
        error: 'Insufficient wallet balance',
        required: course.price,
        available: walletBalance,
      });
    }

    // Deduct from wallet
    user.walletBalance = walletBalance - course.price;
    await user.save();

    // Create purchase record
    const purchase = await CoursePurchase.create({
      userId: user._id,
      courseId: course._id,
      amount: course.price,
      status: 'completed',
      transactionId: `WALLET-${Date.now()}`,
    });

    // Create wallet transaction (debit)
    await WalletTransaction.create({
      userId: user._id,
      amount: course.price,
      type: 'debit',
      status: 'completed',
      description: `Course purchase: ${course.title}`,
    });

    res.json({
      message: 'Course purchased successfully',
      purchase,
      newBalance: user.walletBalance,
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if user has purchased a course
router.get('/courses/:courseId/purchased', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const purchase = await CoursePurchase.findOne({
      userId: req.user.id,
      courseId,
      status: 'completed',
    });

    res.json({ purchased: !!purchase });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's purchased courses
router.get('/purchases', auth, async (req, res) => {
  try {
    const purchases = await CoursePurchase.find({
      userId: req.user.id,
      status: 'completed',
    })
      .populate('courseId')
      .sort({ createdAt: -1 });

    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


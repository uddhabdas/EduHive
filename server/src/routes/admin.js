const express = require('express');
const multer = require('multer');
const { adminAuth } = require('../middleware/adminAuth');
const Course = require('../models/Course');
const Lecture = require('../models/Lecture');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const bcrypt = require('bcrypt');
const { uploadVideo, deleteVideo } = require('../services/s3Service');

const router = express.Router();

// Configure multer for memory storage (we'll upload directly to S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept video files
    const allowedMimes = [
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/x-matroska',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'), false);
    }
  },
});

// ========== COURSE MANAGEMENT ==========

// Get all courses (admin view - includes inactive)
router.get('/courses', adminAuth, async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single course
router.get('/courses/:id', adminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create course
router.post('/courses', adminAuth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      about,
      highlights,
      thumbnailUrl, 
      price,
      isPaid,
      notes,
      videoUrl,
    } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const course = await Course.create({
      title,
      description: description || '',
      about: about || '',
      highlights: Array.isArray(highlights) ? highlights : [],
      thumbnailUrl: thumbnailUrl || '',
      // All courses are now treated as locally managed (no external YouTube playlist).
      source: 'local',
      sourcePlaylistId: '',
      isActive: true,
      lectureCount: 0,
      price: price || 0,
      isPaid: isPaid || false,
      createdBy: req.user.id,
      notes: notes || '',
      videoUrl: videoUrl || '',
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update course
router.put('/courses/:id', adminAuth, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      about,
      highlights,
      thumbnailUrl, 
      isActive,
      price,
      isPaid,
      notes,
      videoUrl,
    } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    if (title) course.title = title;
    if (description !== undefined) course.description = description;
    if (about !== undefined) course.about = about;
    if (highlights !== undefined) course.highlights = Array.isArray(highlights) ? highlights : [];
    if (thumbnailUrl !== undefined) course.thumbnailUrl = thumbnailUrl;
    if (isActive !== undefined) course.isActive = isActive;
    if (price !== undefined) course.price = price;
    if (isPaid !== undefined) course.isPaid = isPaid;
    if (notes !== undefined) course.notes = notes;
    if (videoUrl !== undefined) course.videoUrl = videoUrl;

    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete course
router.delete('/courses/:id', adminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    // Delete all lectures
    await Lecture.deleteMany({ courseId: course._id });
    await Course.findByIdAndDelete(course._id);

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ========== LECTURE MANAGEMENT ==========

// Get all lectures for a course
router.get('/courses/:courseId/lectures', adminAuth, async (req, res) => {
  try {
    const lectures = await Lecture.find({ courseId: req.params.courseId }).sort({ orderIndex: 1 });
    res.json(lectures);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single lecture
router.get('/lectures/:id', adminAuth, async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) return res.status(404).json({ error: 'Lecture not found' });
    res.json(lecture);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create lecture
router.post('/courses/:courseId/lectures', adminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const { title, videoUrl, videoId, orderIndex, isLocked, duration, thumbnailUrl, notes, notesFileUrl } = req.body;
    if (!title || !videoUrl) {
      return res.status(400).json({ error: 'Title and videoUrl are required' });
    }

    const lecture = await Lecture.create({
      courseId: course._id,
      title,
      videoId: videoId || '',
      videoUrl: videoUrl,
      orderIndex: orderIndex || 1,
      isLocked: isLocked || false,
      duration: duration || 0,
      thumbnailUrl: thumbnailUrl || '',
      notes: notes || '',
      notesFileUrl: notesFileUrl || '',
    });

    // Update course lecture count
    const lectureCount = await Lecture.countDocuments({ courseId: course._id });
    await Course.findByIdAndUpdate(course._id, { lectureCount });

    res.status(201).json(lecture);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update lecture
router.put('/lectures/:id', adminAuth, async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) return res.status(404).json({ error: 'Lecture not found' });

    const { title, videoId, videoUrl, orderIndex, isLocked, duration, thumbnailUrl, notes, notesFileUrl } = req.body;

    if (title) lecture.title = title;
    if (videoId !== undefined) lecture.videoId = videoId;
    if (videoUrl !== undefined) lecture.videoUrl = videoUrl;
    if (orderIndex !== undefined) lecture.orderIndex = orderIndex;
    if (isLocked !== undefined) lecture.isLocked = isLocked;
    if (duration !== undefined) lecture.duration = duration;
    if (thumbnailUrl !== undefined) lecture.thumbnailUrl = thumbnailUrl;
    if (notes !== undefined) lecture.notes = notes;
    if (notesFileUrl !== undefined) lecture.notesFileUrl = notesFileUrl;

    await lecture.save();
    res.json(lecture);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete lecture
router.delete('/lectures/:id', adminAuth, async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) return res.status(404).json({ error: 'Lecture not found' });

    const courseId = lecture.courseId;
    await Lecture.findByIdAndDelete(lecture._id);

    // Update course lecture count
    const lectureCount = await Lecture.countDocuments({ courseId });
    await Course.findByIdAndUpdate(courseId, { lectureCount });

    res.json({ message: 'Lecture deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ========== USER MANAGEMENT ==========

// Get all users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single user
router.get('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create user (admin/teacher)
router.post('/users', adminAuth, async (req, res) => {
  try {
    const { email, password, role, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hash,
      role: role || 'user',
      name: name || '',
    });

    const userObj = user.toObject();
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user
router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { email, password, role, name } = req.body;

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ error: 'Email already exists' });
      user.email = email;
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    if (role) user.role = role;
    if (name !== undefined) user.name = name;

    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prevent deleting yourself
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(user._id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ========== VIDEO UPLOAD ==========

// Upload video to S3
router.post('/upload/video', adminAuth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const contentType = req.file.mimetype;

    // Upload to S3
    const videoUrl = await uploadVideo(fileBuffer, fileName, contentType);

    res.json({
      success: true,
      videoUrl,
      message: 'Video uploaded successfully',
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload video' });
  }
});

// Delete video from S3 (optional - for cleanup)
router.delete('/upload/video', adminAuth, async (req, res) => {
  try {
    const { videoUrl } = req.body;
    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    await deleteVideo(videoUrl);
    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Video delete error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete video' });
  }
});

// ========== STATS ==========

// Get dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments();
    const activeCourses = await Course.countDocuments({ isActive: true });
    const totalLectures = await Lecture.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalTeachers = await User.countDocuments({ role: { $in: ['teacher', 'admin'] } });
    const pendingWalletRequests = await WalletTransaction.countDocuments({ status: 'pending' });

    res.json({
      totalCourses,
      activeCourses,
      totalLectures,
      totalUsers,
      totalTeachers,
      pendingWalletRequests,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


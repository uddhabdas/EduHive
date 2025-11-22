const express = require('express');
const { auth } = require('../middleware/auth');
const Course = require('../models/Course');
const Lecture = require('../models/Lecture');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Optional local override thumbnails mapped by playlistId (explicit)
const OVERRIDE_THUMBS = {
  // Introduction to Cybersecurity
  'PLyqSpQzTE6M-jkJEzbS5oHJUp2GWPsq6e': 'introduction_to_cybersecurity.jpg',
  // Engineering Mathematics
  'PLbRMhDVUMngeVrxtbBz-n8HvP8KAWBpI5': 'engineering_mathematics.jpg',
  // Introduction to R
  'PLJ5C_6qdAvBFfF7qtFi8Pv_RK8x55jsUQ': 'introduction_to_r.jpg',
  // DSA using Python
  'PLyqSpQzTE6M_Fu6l8irVwXkUyC9Gwqr6_': 'dsa_using_python.jpg',
  // Programming in Java
  'PLbRMhDVUMngcx5xHChJ-f7ofxZI4JzuQR': 'programming_in_java.jpg',
};

// Build a dynamic map from filenames in public/course-images to support all courses
let FILE_STEM_MAP = null;
function loadFileStemMap() {
  if (FILE_STEM_MAP) return FILE_STEM_MAP;
  FILE_STEM_MAP = new Map();
  try {
    const dir = path.join(__dirname, '..', 'public', 'course-images');
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const stem = f.replace(/\.[^.]+$/, '').toLowerCase();
      FILE_STEM_MAP.set(stem, f);
    }
  } catch (_) {}
  return FILE_STEM_MAP;
}

function slugifyTitle(t) {
  return (t || '')
    .replace(/\bNPTEL\b\s*:*/gi, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getOverrideUrlForCourse(c, base) {
  const map = loadFileStemMap();
  // 1) explicit map by playlistId
  if (c.sourcePlaylistId && OVERRIDE_THUMBS[c.sourcePlaylistId]) {
    return `${base}/course-images/${OVERRIDE_THUMBS[c.sourcePlaylistId]}`;
  }
  if (!map || map.size === 0) return null;
  // 2) by slugified title
  const slug = slugifyTitle(c.title || '');
  if (map.has(slug)) return `${base}/course-images/${map.get(slug)}`;
  // 3) simple plural/singular fallback
  if (slug.endsWith('s') && map.has(slug.slice(0, -1))) {
    return `${base}/course-images/${map.get(slug.slice(0, -1))}`;
  }
  if (map.has(`${slug}s`)) {
    return `${base}/course-images/${map.get(`${slug}s`)}`;
  }
  // 4) partial contains match (first reasonable hit)
  for (const [stem, file] of map.entries()) {
    if (slug.includes(stem) || stem.includes(slug)) {
      return `${base}/course-images/${file}`;
    }
  }
  // 5) underscoreremoved contains (ml)
  const slugBare = slug.replace(/_/g, '');
  for (const [stem, file] of map.entries()) {
    const bareStem = stem.replace(/_/g, '');
    if (slugBare.includes(bareStem) || bareStem.includes(slugBare)) {
      return `${base}/course-images/${file}`;
    }
  }
  return null;
}

router.get('/courses', async (req, res) => {
  try {
    const PLACEHOLDER_THUMB = 'https://placehold.co/600x338/EEF2F7/475569?text=Course';
    const base = `${req.protocol}://${req.get('host')}`;
    const docs = await Course.find({ isActive: true }).sort({ createdAt: -1 });
    const courses = docs.map((c) => {
      const overrideUrl = getOverrideUrlForCourse(c, base);
      const cleanTitle = (c.title || '').replace(/^\s*NPTEL\s*:?\s*/i, '');
      const desc = (c.description && c.description.trim()) ? c.description : `About: ${cleanTitle}`;
      return ({
        _id: c._id,
        title: cleanTitle,
        description: desc,
        thumbnailUrl: overrideUrl || ((c.thumbnailUrl && c.thumbnailUrl.trim()) ? c.thumbnailUrl : PLACEHOLDER_THUMB),
        lectureCount: typeof c.lectureCount === 'number' ? c.lectureCount : 0,
        price: c.price || 0,
        isPaid: c.isPaid || false,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      });
    });
    res.json(courses);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/courses/:id - get single course details (public)
router.get('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || !course.isActive) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const base = `${req.protocol}://${req.get('host')}`;
    const overrideUrl = getOverrideUrlForCourse(course, base);
    const cleanTitle = (course.title || '').replace(/^\s*NPTEL\s*:?\s*/i, '');
    const desc = (course.description && course.description.trim()) ? course.description : `About: ${cleanTitle}`;
    
    res.json({
      _id: course._id,
      title: cleanTitle,
      description: desc,
      thumbnailUrl: overrideUrl || ((course.thumbnailUrl && course.thumbnailUrl.trim()) ? course.thumbnailUrl : 'https://placehold.co/600x338/EEF2F7/475569?text=Course'),
      lectureCount: typeof course.lectureCount === 'number' ? course.lectureCount : 0,
      price: course.price || 0,
      isPaid: course.isPaid || false,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/courses/:id/lectures (protected) - ordered lectures for a course
router.get('/courses/:id/lectures', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const CoursePurchase = require('../models/CoursePurchase');
    const Course = require('../models/Course');
    
    // Check if course exists and if it's paid
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // If course is paid, check if user has purchased it
    if (course.isPaid && course.price > 0) {
      const purchase = await CoursePurchase.findOne({
        userId: req.user.id,
        courseId: id,
        status: 'completed',
      });

      if (!purchase) {
        return res.status(403).json({ 
          error: 'Course not purchased',
          message: 'You need to purchase this course to access lectures',
          courseId: id,
          price: course.price,
        });
      }
    }

    const lectures = await Lecture.find({ courseId: id }).sort({ orderIndex: 1, _id: 1 });
    res.json(lectures);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/courses/:id/access', auth, async (_req, res) => {
  return res.json({ access: 'unlocked' });
});

router.post('/courses/:id/sync-from-player', auth, async (req, res) => {
  try {
    const axios = require('axios');
    const { id } = req.params;
    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array required' });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    // Previously restricted to YouTube-based courses; now generic sync endpoint is disabled.
    return res.status(400).json({ error: 'Playlist sync is no longer supported' });

    let upserts = 0;
    const incomingIds = new Set();

    const pickThumb = async (vid) => {
      const bases = ['maxresdefault','sddefault','hqdefault','mqdefault','default'];
      for (const b of bases) {
        const url = `https://i.ytimg.com/vi/${vid}/${b}.jpg`;
        try {
          const resp = await axios.head(url, { timeout: 1000, validateStatus: () => true });
          if (resp.status >= 200 && resp.status < 400) return url;
        } catch (_) {}
      }
      return '';
    };

    for (const item of items) {
      const { videoId, title, orderIndex, duration } = item || {};
      if (!videoId) continue;
      incomingIds.add(videoId);

      const update = {
        courseId: course._id,
        title: title || `Video ${orderIndex || 1}`,
        videoId,
        orderIndex: orderIndex || 1,
        isLocked: false,
      };
      if (duration && duration > 0) update.duration = duration;

      // thumbnail detection (best-effort, 1s timeout)
      const thumb = await pickThumb(videoId);
      if (thumb) update.thumbnailUrl = thumb;

      await Lecture.updateOne(
        { courseId: course._id, videoId },
        { $set: update },
        { upsert: true }
      );
      upserts++;
    }

    const toDeleteQuery = { courseId: course._id };
    if (incomingIds.size > 0) {
      toDeleteQuery.videoId = { $nin: Array.from(incomingIds) };
    }
    const delResult = await Lecture.deleteMany(toDeleteQuery);

    const lectureCount = await Lecture.countDocuments({ courseId: course._id });

    // set course thumbnail to first lecture thumbnail if missing
    const firstLecture = await Lecture.findOne({ courseId: course._id }).sort({ orderIndex: 1 });
    const courseThumb = (firstLecture && firstLecture.thumbnailUrl) ? firstLecture.thumbnailUrl : 'https://placehold.co/600x338/EEF2F7/475569?text=Course';
    await Course.updateOne({ _id: course._id }, { $set: { lectureCount, thumbnailUrl: courseThumb } });

    return res.json({ ok: true, upserts, deleted: delResult.deletedCount || 0, lectureCount, thumbnailUrl: courseThumb });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Fallback: import playlist by scraping public YouTube playlist HTML (no Data API)
router.post('/courses/:id/import-playlist', auth, async (req, res) => {
  try {
    const axios = require('axios');
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    if (!course.sourcePlaylistId) return res.status(400).json({ error: 'No sourcePlaylistId' });

    const desktopUrl = `https://www.youtube.com/playlist?list=${course.sourcePlaylistId}`;
    const mobileUrl = `https://m.youtube.com/playlist?list=${course.sourcePlaylistId}`;

    async function fetchHtml(url, ua) {
      const resp = await axios.get(url, {
        headers: {
          'User-Agent': ua,
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000,
        validateStatus: () => true,
      });
      if (resp.status < 200 || resp.status >= 400) return '';
      return resp.data || '';
    }

    let html = await fetchHtml(desktopUrl, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36');
    let ids = Array.from(new Set([...(html.matchAll(/\"videoId\":\"([a-zA-Z0-9_-]{11})\"/g))].map(m => m[1])));

    if (ids.length === 0) {
      // fallback to mobile HTML and watch hrefs
      html = await fetchHtml(mobileUrl, 'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36');
      const hrefIds = Array.from(new Set([...(html.matchAll(/href=\\"\/watch\?v=([a-zA-Z0-9_-]{11})/g))].map(m => m[1])));
      ids = hrefIds;
    }

    if (ids.length === 0) return res.status(404).json({ error: 'no_videos_found' });

    // build items (cap to 300)
    const items = ids.slice(0, 300).map((vid, idx) => ({ videoId: vid, title: `Video ${idx + 1}`, orderIndex: idx + 1 }));

    let upserts = 0;
    const pickThumb = async (vid) => {
      const bases = ['maxresdefault','sddefault','hqdefault','mqdefault','default'];
      for (const b of bases) {
        const u = `https://i.ytimg.com/vi/${vid}/${b}.jpg`;
        try { const r = await axios.head(u, { timeout: 1200, validateStatus: () => true }); if (r.status >= 200 && r.status < 400) return u; } catch(_) {}
      }
      return '';
    };

    for (const item of items) {
      const update = {
        courseId: course._id,
        title: item.title,
        videoId: item.videoId,
        orderIndex: item.orderIndex,
        isLocked: false,
      };
      const thumb = await pickThumb(item.videoId);
      if (thumb) update.thumbnailUrl = thumb;
      await Lecture.updateOne({ courseId: course._id, videoId: item.videoId }, { $set: update }, { upsert: true });
      upserts++;
    }

    const lectureCount = await Lecture.countDocuments({ courseId: course._id });
    const first = await Lecture.findOne({ courseId: course._id }).sort({ orderIndex: 1 });
    const courseThumb = (first && first.thumbnailUrl) ? first.thumbnailUrl : 'https://placehold.co/600x338/EEF2F7/475569?text=Course';
    await Course.updateOne({ _id: course._id }, { $set: { lectureCount, thumbnailUrl: courseThumb } });

    return res.json({ ok: true, upserts, deleted: 0, lectureCount, thumbnailUrl: courseThumb });
  } catch (e) {
    console.error('import-playlist failed:', e?.message || e);
    return res.status(500).json({ error: 'Server error' });
  }
});

const jwt = require('jsonwebtoken');
const UserProgress = require('../models/UserProgress');

router.get('/courses/recommended', async (req, res) => {
  try {
    const PLACEHOLDER_THUMB = 'https://placehold.co/600x338/EEF2F7/475569?text=Course';
    const base = `${req.protocol}://${req.get('host')}`;

    let userId = null;
    try {
      const authHeader = req.headers.authorization || '';
      const [, token] = authHeader.split(' ');
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded._id || decoded.id || null;
      }
    } catch {}

    const courses = await Course.find({ isActive: true }).sort({ createdAt: 1 });

    let result = [];
    if (userId) {
      const progress = await UserProgress.find({ userId });
      const inProg = new Set(progress.filter(p => (p.position || 0) > 0 && !p.completed).map(p => p.courseId.toString()));
      result = courses
        .map((c) => ({ c, inProgress: inProg.has(c._id.toString()) }))
        .sort((a, b) => {
          if (a.inProgress !== b.inProgress) return a.inProgress ? -1 : 1;
          return b.c.updatedAt - a.c.updatedAt;
        })
        .slice(0, 4)
        .map(({ c }) => {
          const overrideUrl = getOverrideUrlForCourse(c, base);
          const cleanTitle = (c.title || '').replace(/^\s*NPTEL\s*:?\s*/i, '');
          const desc = (c.description && c.description.trim()) ? c.description : `About: ${cleanTitle}`;
          return ({
            _id: c._id,
            title: cleanTitle,
            description: desc,
            thumbnailUrl: overrideUrl || ((c.thumbnailUrl && c.thumbnailUrl.trim()) ? c.thumbnailUrl : PLACEHOLDER_THUMB),
            lectureCount: typeof c.lectureCount === 'number' ? c.lectureCount : 0,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          });
        });
    } else {
      result = courses
        .slice(0, 4)
        .map((c) => {
          const overrideUrl = getOverrideUrlForCourse(c, base);
          const cleanTitle = (c.title || '').replace(/^\s*NPTEL\s*:?\s*/i, '');
          const desc = (c.description && c.description.trim()) ? c.description : `About: ${cleanTitle}`;
          return ({
            _id: c._id,
            title: cleanTitle,
            description: desc,
            thumbnailUrl: overrideUrl || ((c.thumbnailUrl && c.thumbnailUrl.trim()) ? c.thumbnailUrl : PLACEHOLDER_THUMB),
            lectureCount: typeof c.lectureCount === 'number' ? c.lectureCount : 0,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          });
        });
    }

    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

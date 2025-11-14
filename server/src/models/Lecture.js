const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true },
    videoId: { type: String, required: true, trim: true },
    videoUrl: { type: String, default: '' },
    orderIndex: { type: Number, default: 1 },
    isLocked: { type: Boolean, default: false },
    duration: { type: Number, default: 0 }, // video duration in seconds
    thumbnailUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    notesFileUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

lectureSchema.index({ courseId: 1, orderIndex: 1 });

module.exports = mongoose.model('Lecture', lectureSchema);

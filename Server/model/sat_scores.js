const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  questionId: mongoose.Schema.Types.ObjectId,
  userResponse: mongoose.Schema.Types.Mixed,
  isCorrect: Boolean,
  marksAwarded: Number,
}, { _id: false });

// One document per (email + subject).
// attempts[] keeps last 5 attempts — older ones are dropped to save space.
const attemptSchema = new mongoose.Schema({
  totalQuestions: Number,
  correctAnswers: Number,
  wrongAnswers: Number,
  unattempted: Number,
  score: Number,
  maxScore: Number,
  responses: [responseSchema],
  // 'FullTest' when this subject score came from a Full SAT Test session, 'Module' for standalone practice
  source: { type: String, enum: ['Module', 'FullTest'], default: 'Module' },
  dateAttempted: { type: Date, default: Date.now },
}, { _id: false });

const satScoreSchema = new mongoose.Schema({
  email:   { type: String, required: true },
  name:    String,
  subject: { type: String, enum: ['Reading & Writing', 'Reading and Writing', 'Mathematics'], required: true },
  attempts: [attemptSchema],  // latest first, capped at 5
}, { timestamps: true });

// Unique index — one doc per student per subject
satScoreSchema.index({ email: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('sat_score', satScoreSchema, 'sat_scores');

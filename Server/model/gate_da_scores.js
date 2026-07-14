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
  // 'FullTest' when this subject score came from a Full GATE DA Test session, 'Module' for standalone practice
  source: { type: String, enum: ['Module', 'FullTest'], default: 'Module' },
  dateAttempted: { type: Date, default: Date.now },
}, { _id: false });

const gateDaScoreSchema = new mongoose.Schema({
  email:   { type: String, required: true },
  name:    String,
  subject: { type: String, enum: ['General Aptitude', 'Engineering Mathematics', 'Programming & Data Structures', 'Database Management & Warehousing', 'Machine Learning', 'Artificial Intelligence'], required: true },
  attempts: [attemptSchema],  // latest first, capped at 5
}, { timestamps: true });

// Unique index — one doc per student per subject
gateDaScoreSchema.index({ email: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('gate_da_score', gateDaScoreSchema, 'gate_da_scores');

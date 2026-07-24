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
  // Approximate GMAT Focus Edition section scaled score (60-90).
  scaledScore: { type: Number, default: null },
  responses: [responseSchema],
  // 'FullTest' when this subject score came from a Full GMAT Test session, 'Module' for standalone practice
  source: { type: String, enum: ['Module', 'FullTest'], default: 'Module' },
  dateAttempted: { type: Date, default: Date.now },
}, { _id: false });

const gmatScoreSchema = new mongoose.Schema({
  email:   { type: String, required: true },
  name:    String,
  subject: { type: String, enum: ['Quantitative Reasoning', 'Verbal Reasoning', 'Data Insights'], required: true },
  attempts: [attemptSchema],  // latest first, capped at 5
}, { timestamps: true });

// Unique index — one doc per student per subject
gmatScoreSchema.index({ email: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('gmat_score', gmatScoreSchema, 'gmat_scores');

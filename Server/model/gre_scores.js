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
  // Approximate GRE scaled score (130-170) for Verbal/Quant; null for Analytical Writing attempts.
  scaledScore: { type: Number, default: null },
  // Analytical Writing essay response — populated only for 'Analytical Writing' attempts.
  essayResponse: { type: String, default: null },
  essayStatus: { type: String, enum: ['pending_review', null], default: null },
  responses: [responseSchema],
  dateAttempted: { type: Date, default: Date.now },
}, { _id: false });

const greScoreSchema = new mongoose.Schema({
  email:   { type: String, required: true },
  name:    String,
  subject: { type: String, enum: ['Verbal Reasoning', 'Quantitative Reasoning', 'Analytical Writing'], required: true },
  attempts: [attemptSchema],  // latest first, capped at 5
}, { timestamps: true });

// Unique index — one doc per student per subject
greScoreSchema.index({ email: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('gre_score', greScoreSchema, 'gre_scores');

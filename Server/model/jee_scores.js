const mongoose = require('mongoose');

// Lean response — no questionText/correctAnswer (already in jee_questions)
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
  dateAttempted: { type: Date, default: Date.now },
}, { _id: false });

const jeeScoreSchema = new mongoose.Schema({
  email:   { type: String, required: true },
  name:    String,
  subject: { type: String, enum: ['Physics', 'Chemistry', 'Mathematics'], required: true },
  attempts: [attemptSchema],  // latest first, capped at 5
}, { timestamps: true });

// Unique index — one doc per student per subject
jeeScoreSchema.index({ email: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('jee_score', jeeScoreSchema, 'jee_scores');

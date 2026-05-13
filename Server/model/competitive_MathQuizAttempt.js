const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({

  // ── Identity ────────────────────────────────────────────────────
  email: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },

  // ── What was attempted ──────────────────────────────────────────
  week: {
    type: Number,
    required: true,
    index: true
  },
  topic: {
    type: String,
    required: true
  },

  // ── Scores (summary only — no nested question data) ─────────────
  score: {
    type: Number,
    required: true   // actual points earned
  },
  max_possible_score: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  total_questions: {
    type: Number,
    required: true
  },
  correct_answers: {
    type: Number,
    required: true
  },

  // ── Difficulty breakdown (flat, not nested array) ───────────────
  easy_attempted:  { type: Number, default: 0 },
  easy_correct:    { type: Number, default: 0 },
  medium_attempted:{ type: Number, default: 0 },
  medium_correct:  { type: Number, default: 0 },
  hard_attempted:  { type: Number, default: 0 },
  hard_correct:    { type: Number, default: 0 },

  // ── Timing ──────────────────────────────────────────────────────
  total_time_seconds: {
    type: Number,
    required: true
  },
  started_at: {
    type: Date,
    required: true
  },
  submitted_at: {
    type: Date,
    required: true
  },

  // ── Flags ───────────────────────────────────────────────────────
  is_completed: {
    type: Boolean,
    default: true
  },
  cheat_count: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

// ── Indexes ──────────────────────────────────────────────────────
quizAttemptSchema.index({ email: 1, week: 1 });
quizAttemptSchema.index({ email: 1, submitted_at: -1 });  // latest attempts per user
quizAttemptSchema.index({ week: 1, percentage: -1 });     // leaderboard per week

// Replace with:
module.exports = mongoose.model(
  'competitive_MathQuizAttempt',
  quizAttemptSchema,
  'competitiveMath_scores'
);
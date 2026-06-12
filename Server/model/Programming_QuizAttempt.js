//model/Programming_QuizAttempt.js

const mongoose = require('mongoose');

const QuizAttemptSchema = new mongoose.Schema({
  // ── Identity ────────────────────────────────────────────────────
  email: { type: String, required: true },
  username: { type: String, required: true },
  
  // ── What was attempted ──────────────────────────────────────────
  course: { type: String, required: true, index: true }, // ADDED: for multiple courses
  week: { type: Number, required: true, index: true },
  topic: { type: String, required: true },
  
  
  // ── Scores (summary only) ───────────────────────────────────────
  score: { type: Number, required: true },
  max_possible_score: { type: Number, required: true },
  percentage: { type: Number, required: true },
  total_questions: { type: Number, required: true },
  correct_answers: { type: Number, required: true },
  
  // ── Difficulty breakdown ────────────────────────────────────────
  easy_attempted: { type: Number, default: 0 },
  easy_correct: { type: Number, default: 0 },
  medium_attempted: { type: Number, default: 0 },
  medium_correct: { type: Number, default: 0 },
  hard_attempted: { type: Number, default: 0 },
  hard_correct: { type: Number, default: 0 },
  
  // ── Timing ──────────────────────────────────────────────────────
  total_time_seconds: { type: Number, required: true },
  started_at: { type: Date, required: true },
  submitted_at: { type: Date, required: true },


  // Optional but helpful additions:
    question_types_breakdown: {
    mcq_attempted: { type: Number, default: 0 },
    mcq_correct: { type: Number, default: 0 },
    msq_attempted: { type: Number, default: 0 },
    msq_correct: { type: Number, default: 0 },
    truefalse_attempted: { type: Number, default: 0 },
    truefalse_correct: { type: Number, default: 0 }
    },
  
  // ── Flags ───────────────────────────────────────────────────────
  is_completed: { type: Boolean, default: true },
  cheat_count: { type: Number, default: 0 }
}, { timestamps: true });




// Indexes
QuizAttemptSchema.index({ email: 1, course: 1, week: 1 });
QuizAttemptSchema.index({ email: 1, submitted_at: -1 });
QuizAttemptSchema.index({ course: 1, week: 1, percentage: -1 });

module.exports = mongoose.model('ProgrammingQuizAttempt', QuizAttemptSchema, 'programming_quiz_attempts');


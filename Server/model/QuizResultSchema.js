
// model/QuizResultSchema.js

const mongoose = require('mongoose');

const QuestionResultSchema = new mongoose.Schema({
  // ── Links back to the attempt ───────────────────────────────────
  attempt_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizAttempt',
    required: true,
    index: true
  },
  email: { type: String, required: true, index: true },
  course: { type: String, required: true },
  week: { type: Number, required: true },
  
  // ── Links to the question ───────────────────────────────────────
  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'questions',  // Your existing questions collection
    required: true,
    index: true
  },
  
  // ── Programming-specific answer storage ─────────────────────────
  user_answer: {
    type: mongoose.Schema.Types.Mixed,
    // Can be:
    // - String (code submitted)
    // - Array (for multiple choice)
    // - Number (for numeric)
    // - Object (for complex answers)
  },
  
  // Add this field to track partial marking for MSQ questions
    partial_marking: {
    type: Boolean,
    default: false  // true if question allows partial marks
    },
  
  is_correct: { type: Boolean, required: true, index: true },
  marks_awarded: { type: Number, required: true },
  time_taken_seconds: { type: Number, default: 0 },
  
  
  // ── Question metadata (denormalized) ────────────────────────────
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  topic: { type: String, required: true },
  subtopic: { type: String, required: true },
  question_type: { type: String, required: true },
  concept_tags: { type: [String], default: [] },
  bloom_level: { type: String, default: 'apply' },
  
  
}, { timestamps: true });

// Indexes
QuestionResultSchema.index({ attempt_id: 1, question_id: 1 });
QuestionResultSchema.index({ email: 1, is_correct: 1 });
QuestionResultSchema.index({ email: 1, subtopic: 1 });
QuestionResultSchema.index({ question_id: 1, is_correct: 1 });
QuestionResultSchema.index({ email: 1, concept_tags: 1 });


module.exports = mongoose.model(
  'QuizResult',
  QuestionResultSchema,
  'quiz_result'
);
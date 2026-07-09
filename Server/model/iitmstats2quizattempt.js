const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({

  email:    { type: String, default: '' },
  username: { type: String, default: '' },
  week:     { type: Number, default: 0, index: true },
  topic:    { type: String, default: '' },

  score:              { type: Number, default: 0 },
  max_possible_score: { type: Number, default: 0 },
  percentage:         { type: Number, default: 0 },
  total_questions:    { type: Number, default: 0 },
  correct_answers:    { type: Number, default: 0 },

  easy_attempted:   { type: Number, default: 0 },
  easy_correct:     { type: Number, default: 0 },
  medium_attempted: { type: Number, default: 0 },
  medium_correct:   { type: Number, default: 0 },
  hard_attempted:   { type: Number, default: 0 },
  hard_correct:     { type: Number, default: 0 },

  total_time_seconds: { type: Number, default: 0 },
  started_at:         { type: Date,   default: Date.now },
  submitted_at:       { type: Date,   default: Date.now },

  is_completed: { type: Boolean, default: true },
  cheat_count:  { type: Number,  default: 0 }

}, { timestamps: true });

quizAttemptSchema.index({ email: 1, week: 1 });
quizAttemptSchema.index({ email: 1, submitted_at: -1 });
quizAttemptSchema.index({ week: 1, percentage: -1 });

module.exports = mongoose.model(
  'iitmstats2quizattempt',
  quizAttemptSchema,
  'iitm_stats2_quiz_attempt'
);

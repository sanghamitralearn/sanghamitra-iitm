const mongoose = require('mongoose');

const sectionScoreSchema = new mongoose.Schema({
  totalQuestions: Number,
  correctAnswers: Number,
  wrongAnswers:   Number,
  unattempted:    Number,
  score:          Number,
  maxScore:       Number,
  // Approximate GRE scaled score (130-170) — not applicable to Analytical Writing.
  scaledScore:    { type: Number, default: null },
}, { _id: false });

const responseSchema = new mongoose.Schema({
  questionId:   mongoose.Schema.Types.ObjectId,
  subject:      String,
  userResponse: mongoose.Schema.Types.Mixed,
  isCorrect:    Boolean,
  marksAwarded: Number,
  unattempted:  Boolean,
  timeTaken:    Number,
}, { _id: false });

const greFullScoreSchema = new mongoose.Schema({
  email:          { type: String, required: true },
  name:           String,
  paper:          { type: String, required: true },
  year:           mongoose.Schema.Types.Mixed,
  totalQuestions: Number,
  correctAnswers: Number,
  wrongAnswers:   Number,
  unattempted:    Number,
  score:          Number,
  maxScore:       Number,
  sectionScores: {
    'Verbal Reasoning':       { type: sectionScoreSchema },
    'Quantitative Reasoning': { type: sectionScoreSchema },
    'Analytical Writing':     { type: sectionScoreSchema },
  },
  // Analytical Writing "Analyze an Issue" essay response for this attempt.
  essayResponse: { type: String, default: null },
  essayStatus:   { type: String, enum: ['pending_review', null], default: null },
  responses:      [responseSchema],
  totalTimeTaken: Number,
  dateAttempted:  { type: Date, default: Date.now },
}, { timestamps: true });

greFullScoreSchema.index({ email: 1 });
greFullScoreSchema.index({ email: 1, paper: 1 });

module.exports = mongoose.model('gre_full_score', greFullScoreSchema, 'gre_full_scores');

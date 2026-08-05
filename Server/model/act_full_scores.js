const mongoose = require('mongoose');

const sectionScoreSchema = new mongoose.Schema({
  totalQuestions: Number,
  correctAnswers: Number,
  wrongAnswers:   Number,
  unattempted:    Number,
  score:          Number,
  maxScore:       Number,
  // Approximate ACT section scaled score (1-36).
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

const actFullScoreSchema = new mongoose.Schema({
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
  // Total ACT composite score, approximated on the official 1-36 scale.
  totalScaledScore: { type: Number, default: null },
  sectionScores: {
    'English':     { type: sectionScoreSchema },
    'Mathematics': { type: sectionScoreSchema },
    'Reading':     { type: sectionScoreSchema },
    'Science':     { type: sectionScoreSchema },
  },
  responses:      [responseSchema],
  totalTimeTaken: Number,
  dateAttempted:  { type: Date, default: Date.now },
}, { timestamps: true });

actFullScoreSchema.index({ email: 1 });
actFullScoreSchema.index({ email: 1, paper: 1 });

module.exports = mongoose.model('act_full_score', actFullScoreSchema, 'act_full_scores');

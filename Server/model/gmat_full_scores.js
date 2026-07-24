const mongoose = require('mongoose');

const sectionScoreSchema = new mongoose.Schema({
  totalQuestions: Number,
  correctAnswers: Number,
  wrongAnswers:   Number,
  unattempted:    Number,
  score:          Number,
  maxScore:       Number,
  // Approximate GMAT Focus Edition section scaled score (60-90).
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

const gmatFullScoreSchema = new mongoose.Schema({
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
  // Total GMAT Focus Edition score, approximated on the official 205-805 scale.
  totalScaledScore: { type: Number, default: null },
  sectionScores: {
    'Quantitative Reasoning': { type: sectionScoreSchema },
    'Verbal Reasoning':       { type: sectionScoreSchema },
    'Data Insights':          { type: sectionScoreSchema },
  },
  responses:      [responseSchema],
  totalTimeTaken: Number,
  dateAttempted:  { type: Date, default: Date.now },
}, { timestamps: true });

gmatFullScoreSchema.index({ email: 1 });
gmatFullScoreSchema.index({ email: 1, paper: 1 });

module.exports = mongoose.model('gmat_full_score', gmatFullScoreSchema, 'gmat_full_scores');

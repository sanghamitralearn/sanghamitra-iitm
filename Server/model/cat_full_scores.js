const mongoose = require('mongoose');


const sectionScoreSchema = new mongoose.Schema({
  totalQuestions: Number,
  correctAnswers: Number,
  wrongAnswers:   Number,
  unattempted:    Number,
  score:          Number,
  maxScore:       Number,
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

const catFullScoreSchema = new mongoose.Schema({
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
    'Verbal Ability & Reading Comprehension':  { type: sectionScoreSchema },
    'Data Interpretation & Logical Reasoning': { type: sectionScoreSchema },
    'Quantitative Ability':                    { type: sectionScoreSchema },
  },
  responses:      [responseSchema],
  totalTimeTaken: Number,
  dateAttempted:  { type: Date, default: Date.now },
}, { timestamps: true });

catFullScoreSchema.index({ email: 1 });
catFullScoreSchema.index({ email: 1, paper: 1 });

module.exports = mongoose.model('cat_full_score', catFullScoreSchema, 'cat_full_scores');


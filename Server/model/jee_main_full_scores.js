const mongoose = require('mongoose');

const subjectScoreSchema = new mongoose.Schema({
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

const jeeMainFullScoreSchema = new mongoose.Schema({
  email:          { type: String, required: true },
  name:           String,
  year:           mongoose.Schema.Types.Mixed,
  paper:          String,
  totalQuestions: Number,
  correctAnswers: Number,
  wrongAnswers:   Number,
  unattempted:    Number,
  score:          Number,
  maxScore:       Number,
  subjectScores: {
    Physics:     { type: subjectScoreSchema },
    Chemistry:   { type: subjectScoreSchema },
    Mathematics: { type: subjectScoreSchema },
  },
  responses:      [responseSchema],
  totalTimeTaken: Number,
  dateAttempted:  { type: Date, default: Date.now },
}, { timestamps: true });

jeeMainFullScoreSchema.index({ email: 1 });
jeeMainFullScoreSchema.index({ email: 1, year: 1, paper: 1 });

module.exports = mongoose.model(
  'jee_main_full_score',
  jeeMainFullScoreSchema,
  'jee_main_full_scores'
);

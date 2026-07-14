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

const gateDaFullScoreSchema = new mongoose.Schema({
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
    'General Aptitude':                       { type: sectionScoreSchema },
    'Engineering Mathematics':                 { type: sectionScoreSchema },
    'Programming & Data Structures':           { type: sectionScoreSchema },
    'Database Management & Warehousing':       { type: sectionScoreSchema },
    'Machine Learning':                        { type: sectionScoreSchema },
    'Artificial Intelligence':                 { type: sectionScoreSchema },
  },
  responses:      [responseSchema],
  totalTimeTaken: Number,
  dateAttempted:  { type: Date, default: Date.now },
}, { timestamps: true });

gateDaFullScoreSchema.index({ email: 1 });
gateDaFullScoreSchema.index({ email: 1, paper: 1 });

module.exports = mongoose.model('gate_da_full_score', gateDaFullScoreSchema, 'gate_da_full_scores');

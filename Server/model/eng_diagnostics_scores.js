const mongoose = require('mongoose');

// Answer Schema
const AnswerSchema = new mongoose.Schema({
  questionId: {
    type: Number,
    required: true
  },
  userAnswer: {
    type: Number,
    required: false
  },
  isCorrect: {
    type: Boolean,
    required: true
  }
});

// Quiz Attempt Schema
const QuizAttemptSchema = new mongoose.Schema({
  diagnosticType: {
    type: String,
    required: true,
    enum: ['pre', 'post'],
    index: true
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  subtopicScores: {
    grammar: Number,
    speaking: Number,
    reading: Number,
    spelling: Number
  },
  answers: [AnswerSchema]
});

// Score Schema
const ScoreSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  quizzes: [QuizAttemptSchema]
});

ScoreSchema.index({ 'quizzes.date': -1 });

// ✅ Direct export for clean import
module.exports = mongoose.model('EngDiagnosticScore', ScoreSchema);

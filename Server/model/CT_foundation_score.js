// schemas/CTFingerScoreSchema.js

const mongoose = require('mongoose');

// Schema for individual answer records
const AnswerSchema = new mongoose.Schema({
  questionId: {
    type: Number,
    required: true
  },
  userAnswer: {
    type: Number,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  }
});

// Schema for quiz attempts
const QuizAttemptSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true
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
  answers: [AnswerSchema]
});

// Main schema for user scores
const CTFingerScoreSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  quizzes: [QuizAttemptSchema]
});

// Create indexes for common queries
CTFingerScoreSchema.index({ 'quizzes.topic': 1 });
CTFingerScoreSchema.index({ 'quizzes.date': -1 });

module.exports = mongoose.model('CTFingerScore', CTFingerScoreSchema);
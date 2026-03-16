const mongoose = require('mongoose');

// Individual Question Result Schema
const questionResultSchema = new mongoose.Schema({
  questionId: { type: String, required: false }, // Changed to String like Math
  questionNumber: { type: Number, required: false },
  questionText: { type: String, required: false },
  userAnswer: { type: String, required: false }, // Changed to String like Math
  correctAnswer: { type: String, required: false }, // Changed to String like Math
  isCorrect: { type: Boolean, required: false },
  timeTaken: { type: Number, default: 0 } // in seconds
}, { _id: false });

// Topic Score Schema
const topicScoreSchema = new mongoose.Schema({
  topic: { type: String, required: true }, // Removed enum to match Math schema
  percentage: { type: Number, required: false },
  score: { type: Number, required: false },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: false },
  attemptNumber: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now },
  questionResults: [questionResultSchema] // Store per-question answers
}, { _id: false });

// Main User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: false }, // unique: false like Math
  email: { type: String, required: true, unique: true },
  completedQuestionIds: { type: [String], default: [] }, // Changed to [String] like Math
  quizScores: [topicScoreSchema]
}, { timestamps: true });

// Export using the specific collection name
module.exports = mongoose.model('Statistics_scores', userSchema, 'statistics_scores');
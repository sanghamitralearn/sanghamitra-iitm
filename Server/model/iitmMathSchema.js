const mongoose = require('mongoose');

// Individual Question Result Schema

const questionResultSchema = new mongoose.Schema({
  questionId: { type: String, required: false }, // ADD THIS LINE
  questionNumber: { type: Number, required: false },
  questionText: { type: String, required: false },
  userAnswer: { type: String, required: false },
  correctAnswer: { type: String, required: false },
  isCorrect: { type: Boolean, required: false },
  timeTaken: { type: Number, default: 0 } // in seconds
});

// Topic Score Schema
const topicScoreSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  percentage: { type: Number, required: false },
  score: { type: Number, required: false },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: false },
  attemptNumber: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now },
  questionResults: [questionResultSchema] // Store per-question answers
});

// Main User Schema

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: false },
  email: { type: String, required: true, unique: true },
  completedQuestionIds: { type: [String], default: [] }, // ADD THIS LINE
  quizScores: [topicScoreSchema]
}, { timestamps: true });

// Export using the same model name
module.exports = mongoose.model('iitm_math_scores', userSchema);;



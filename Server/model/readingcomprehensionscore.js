// models/ReadingComprehensionScore.js
const mongoose = require('mongoose');

// Question Schema
const questionSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'PassageQuestion' },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  userAnswer: String,
  correctAnswer: { type: String, required: true },
  isCorrect: Boolean,
  difficultyLevel: String,
});

// Solved Passage Schema
const solvedPassageSchema = new mongoose.Schema({
  passageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Passage' },
  passageName: { type: String, required: true }, // Name of the passage
  score: { type: Number, required: true }, // Score for the passage
  timestamp: { type: Date, default: Date.now }, // When it was solved
  quizData: { type: Object, required: true }, // Store the entire quiz data object
});

// Topic Schema
const topicSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  solvedPassages: [solvedPassageSchema], // Store solved passages with details
  currentPassage: { type: mongoose.Schema.Types.ObjectId, ref: 'Passage' },
  current_level: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mastered'],
      default: 'easy',
  },
  consecutivePerfectScores: { type: Number, default: 0 },
});

// Reading Comprehension Score Schema
const readingComprehensionScoreSchema = new mongoose.Schema({
  email: {
      type: String,
      required: true,
      unique: true,
  },
  topics: {
      type: Map,
      of: topicSchema,
      default: {},
  },
});


// Compile and export the model
module.exports = mongoose.model('ReadingComprehensionScore', readingComprehensionScoreSchema, 'readingcomprehensionscores');

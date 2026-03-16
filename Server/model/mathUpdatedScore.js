const mongoose = require('mongoose');

const mathScoreSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MathQuestion',
    required: true
  },
  userAnswer: {
    type: String,
    required: true,
    enum: ['a', 'b', 'c', 'd']
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  timeSpent: {
    type: Number, // in seconds
    required: true
  },
  metadata: {
    difficulty: String,
    gradeLevel: Number,
    topicArea: String,
    conceptsTested: [String],
    sessionId: String
  }
});

module.exports = mongoose.model('MathScore', mathScoreSchema);

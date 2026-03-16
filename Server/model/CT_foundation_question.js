// schemas/CTFoundationQuestionSchema.js

const mongoose = require('mongoose');

const CTFoundationQuestionSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  topic: {
    type: String,
    required: true
  },
  subtopic: {
    type: String,
    required: true
  },
  concept: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true,
    validate: [
      function(val) {
        return val.length >= 2; // Ensuring there are at least 2 options
      },
      'Questions must have at least 2 options'
    ]
  },
  correctAnswer: {
    type: Number,
    required: true,
    min: 0
  },
  explanation: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  isRealLife: {
    type: Boolean,
    default: false
  }
});

// Creating indexes to optimize common queries
CTFoundationQuestionSchema.index({ topic: 1 });
CTFoundationQuestionSchema.index({ subtopic: 1 });
CTFoundationQuestionSchema.index({ difficulty: 1 });
CTFoundationQuestionSchema.index({ concept: 1 });

module.exports = mongoose.model('CTFoundationQuestion', CTFoundationQuestionSchema);
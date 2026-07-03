// models/DBMS_Questions.js

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['mcq-single', 'mcq-multiple', 'numerical', 'interview'],
    required: true
  },
  topic: {
    type: String,
    required: true,
    index: true
  },
  subtopic: {
    type: String,
    required: true,
    index: true
  },
  week: {
    type: Number,
    required: true,
    index: true,
    min: 1,
    max: 12
  },
  options: [String],
  correctAnswer: mongoose.Schema.Types.Mixed,
  maxScore: {
    type: Number,
    default: 1
  },
  hasExplanations: {
    type: Boolean,
    default: false
  },
  explanation: String,
  description: String,
  code: String,
  images: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DBMSQuestions', questionSchema, 'DBMS_Questions');

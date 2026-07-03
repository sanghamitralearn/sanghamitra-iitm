// models/DBMS_Submission.js

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: Number,
  title: String,
  type: {
    type: String,
    enum: ['mcq-single', 'mcq-multiple', 'numerical', 'interview'],
  },
  userAnswer: mongoose.Schema.Types.Mixed,
  correctAnswer: mongoose.Schema.Types.Mixed,
  score: Number,
  maxScore: Number,
  explanation: String
});

const DBMSSubmissionSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  topic: { type: String, required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  percentage: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  questions: [questionSchema]
});

module.exports = mongoose.model('DBMSSubmission', DBMSSubmissionSchema, 'DBMS_Submission');
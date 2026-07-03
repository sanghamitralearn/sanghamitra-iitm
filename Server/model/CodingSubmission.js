// model/Coding_Submission.js

const mongoose = require('mongoose');

const CodingSubmissionSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
    index: true
  },

  username: String,

  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coding_Questions',
    required: true,
    index: true
  },

  course: {
    type: String,
    required: true
  },

  week: {
    type: Number,
    required: true,
    index: true
  },

  topic: String,

  language: {
    type: String,
    enum: [
      'python',
      'java',
      'sql'
    ],
    required: true
  },

  source_code: {
    type: String,
    required: true
  },

  verdict: {
    type: String,
    enum: [
      'Accepted',
      'Wrong Answer',
      'Compilation Error',
      'Runtime Error',
      'Time Limit Exceeded',
      'Memory Limit Exceeded',
      'Partially Accepted',
      'Pending Review'
    ],
    default: 'Wrong Answer'
  },

  passed_testcases: {
    type: Number,
    default: 0
  },

  total_testcases: {
    type: Number,
    default: 0
  },

  score: {
    type: Number,
    default: 0
  },

  percentage: {
    type: Number,
    default: 0
  },

  execution_time_ms: {
    type: Number,
    default: null
  },

  submission_number: {
    type: Number,
    default: 1
  }

}, {
  timestamps: true
});

CodingSubmissionSchema.index({
  email: 1,
  question_id: 1
});

CodingSubmissionSchema.index({
  email: 1,
  course: 1,
  week: 1
});

CodingSubmissionSchema.index({
  question_id: 1,
  verdict: 1
});

module.exports = mongoose.model(
  'Coding_Submissions',
  CodingSubmissionSchema
);
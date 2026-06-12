// model/Coding_TestCase.js

const mongoose = require('mongoose');

const CodingTestCaseSchema = new mongoose.Schema({

  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coding_Questions',
    required: true,
    index: true
  },

  testcase_number: {
    type: Number,
    required: true
  },

  // Not required for sql questions, which rely on setup_code + expected_output.
  input: {
    type: String,
    default: ''
  },

  expected_output: {
    type: String,
    required: true
  },

  explanation: {
    type: String,
    default: null
  },

  is_hidden: {
    type: Boolean,
    default: false
  },

  weightage: {
    type: Number,
    default: 1
  },

  is_sample: {
    type: Boolean,
    default: false
  },

  is_active: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

CodingTestCaseSchema.index({
  question_id: 1,
  is_hidden: 1
});

module.exports = mongoose.model(
  'Coding_TestCase',
  CodingTestCaseSchema
);
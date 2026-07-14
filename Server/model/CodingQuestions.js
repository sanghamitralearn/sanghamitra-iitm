const mongoose = require('mongoose');

// Schema for individual test cases (embedded)
const TestCaseSchema = new mongoose.Schema({
  testcase_number: {
    type: Number,
    required: true
  },
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
}, { _id: true }); // _id: true ensures each test case has its own ID

// Main Coding Question Schema
const CodingQuestionSchema = new mongoose.Schema({
  course: {
    type: String,
    required: true
  },
  week: {
    type: Number,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  subtopic: {
    type: String,
    default: null
  },
  question_text: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  points: {
    type: Number,
    default: 10
  },
  language: {
    type: String,
    enum: ['python', 'java', 'sql'],
    required: true
  },
  starter_code: {
    type: String,
    default: ''
  },
  // For python/java: name of the function the test cases will call
  expected_function_name: {
    type: String,
    default: null
  },
  // For sql: DDL/DML run before each test query to set up tables & seed data
  setup_code: {
    type: String,
    default: null
  },
  input_description: {
    type: String,
    default: null
  },
  output_description: {
    type: String,
    default: null
  },
  constraints: {
    type: [String],
    default: []
  },
  examples: [
    {
      input: String,
      output: String,
      explanation: String
    }
  ],
  // ✅ NEW: Embedded test cases
  test_cases: {
    type: [TestCaseSchema],
    default: []
  },
  solution: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  },
  concept_tags: {
    type: [String],
    default: []
  },
  bloom_level: {
    type: String,
    default: null
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for faster queries
CodingQuestionSchema.index({ course: 1, week: 1 });
CodingQuestionSchema.index({ course: 1, topic: 1 });
CodingQuestionSchema.index({ language: 1 });
CodingQuestionSchema.index({ is_active: 1 });

// Virtual to get test cases count (useful for displaying)
CodingQuestionSchema.virtual('test_cases_count').get(function() {
  return this.test_cases ? this.test_cases.length : 0;
});

// Virtual to get active test cases only
CodingQuestionSchema.virtual('active_test_cases').get(function() {
  return this.test_cases ? this.test_cases.filter(tc => tc.is_active !== false) : [];
});

// Ensure virtuals are included in JSON output
CodingQuestionSchema.set('toJSON', { virtuals: true });
CodingQuestionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Coding_Questions', CodingQuestionSchema);

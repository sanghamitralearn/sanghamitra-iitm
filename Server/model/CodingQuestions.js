//model/Coding_Questions.js

const mongoose = require('mongoose');
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

  subtopic: String,

  question_text: {
    type: String,
    required: true
  },

  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard']
  },

  points: {
    type: Number,
    default: 10
  },

  language: {
    type: String,
    enum: ['python', 'java', 'sql']
  },

  starter_code: String,

  // For python/java: name of the function the test cases will call.
  expected_function_name: String,

  // For sql: DDL/DML run before each test query to set up tables & seed data.
  setup_code: String,

  input_description: String,

  output_description: String,

  constraints: [String],

  examples: [
    {
      input: String,
      output: String,
      explanation: String
    }
  ],

  solution: String,

  tags: [String],

  concept_tags: [String],

  bloom_level: String,

  is_active: {
    type: Boolean,
    default: true
  }

});

CodingQuestionSchema.index({ course: 1, week: 1 });
CodingQuestionSchema.index({ course: 1, topic: 1 });

module.exports = mongoose.model('Coding_Questions', CodingQuestionSchema);

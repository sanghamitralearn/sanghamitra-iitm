// model/Programming_Questions.js
const mongoose = require('mongoose');


const QuestionSchema = new mongoose.Schema({
//Use ONE collection: questions
  course: {
    type: String,
    required: true
  },
  
  // Metadata
  topic: {
    type: String,
    required: true,
    index: true
  },
  subtopic: String,

  week: {
    type: Number,
    required: true,
    index: true,
    min: 1,
  },
  question_type: {
      type: String,
      required: true,
      enum: ['mcq', 'msq', 'numeric', 'true-false', 'interview']
    },
    
  // ── Question Content ───────────────────────────────────────────────────────
  question_text: {
    type: String,
    required: true
  },
  has_latex: {
    type: Boolean,
    default: false
  },
  image_url: {
    type: String,
    default: null
  },
  code_snippet: {
    type: String,
    default: null
  },
  options: [
    {
    id: String,
    text: String
    }
  ],

  tags: [{
    type: String,
    index: true
  }],
  
  solution: String,

  answers: {
    correct: mongoose.Schema.Types.Mixed,
    tolerance: Number
  },
  
  // ── Difficulty & Scoring ───────────────────────────────────────────────────
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  points: {
    type: Number,
    default: 1
  },
  average_time_seconds: {
    type: Number,
    default: null
  },

  // ── Analytics & Gap Analysis ───────────────────────────────────────────────
  concept_tags: {
    type: [String],
    default: []
  },
  bloom_level: {
    type: String,
    enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
    default: 'apply'
  },
  common_mistakes: {
    type: [String],
    default: []
  },
  prerequisite_concepts: {
    type: [String],
    default: []
  },
  is_active: {
    type: Boolean,
    default: true
  },
});

QuestionSchema.index({
  course: 1,
  week: 1
});

QuestionSchema.index({
  course: 1,
  topic: 1
});

QuestionSchema.index({
  course: 1,
  week: 1,
  difficulty: 1
});

QuestionSchema.index({
  course: 1,
  bloom_level: 1
});

module.exports = mongoose.model('ProgrammingQuestion', QuestionSchema, 'programming_questions');

const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  option_id: String,
  text: String,
}, { _id: false });

const markingSchemeSchema = new mongoose.Schema({
  full: Number,
  negative: Number,
  zero: Number,
  // partial credit for MSQ: marks awarded for selecting N correct options
  // (with no incorrect options selected), e.g. partial_1, partial_2, partial_3
  partial_1: Number,
  partial_2: Number,
  partial_3: Number,
}, { _id: false });

const jeeQuestionSchema = new mongoose.Schema({
  question_number: Number,
  year: Number,
  paper: String,
  subject: {
    type: String,
    enum: ['Physics', 'Chemistry', 'Mathematics'],
    required: true,
  },
  topic: String,
  subtopic: String,
  question_text: { type: String, required: true },
  type: {
    type: String,
    enum: ['multiple_choice', 'multiple_select', 'numeric'],
    required: true,
  },
  display_type: String,
  has_latex: { type: Boolean, default: false },
  // filename only (e.g. "2025_P2_CHE_Q13_diagram.png"), no "images/" prefix
  image_url: { type: String, default: null },
  // map of option_id -> filename, e.g. { "A": "2025_P1_CHE_Q4_optA.png" }
  option_images: { type: Map, of: String, default: {} },
  options: [optionSchema],
  // string ("A"), array (["A","B"]), number (100), or range ({ min, max })
  correct_answer: mongoose.Schema.Types.Mixed,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }, 
  points: { type: Number, default: 3 },
  marking_scheme: markingSchemeSchema,
  concept_tags: [String],
  problem_types: [String],
  common_mistakes: [String],
  prerequisite_concepts: [String],
  average_time_seconds: Number,
}, { timestamps: true });

jeeQuestionSchema.index({ subject: 1 });
jeeQuestionSchema.index({ subject: 1, difficulty: 1 });

module.exports = mongoose.model('jee_question', jeeQuestionSchema, 'jee_questions');

const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  option_id: String,
  text: String,
}, { _id: false });

const markingSchemeSchema = new mongoose.Schema({
  full: Number,
  negative: Number,
  zero: Number,
}, { _id: false });

const catQuestionSchema = new mongoose.Schema({
  question_number: Number,
  year: Number,
  paper: String,
  subject: {
    type: String,
    enum: ['Verbal Ability & Reading Comprehension', 'Data Interpretation & Logical Reasoning', 'Quantitative Ability'],
    required: true,
  },
  topic: String,
  subtopic: String,
  passage: { type: String, default: null },
  question_text: { type: String, required: true },
  type: {
    type: String,
    enum: ['multiple_choice', 'multiple_choice_single', 'numeric', 'multiple_select'],
    required: true,
  },
  display_type: String,
  has_latex: { type: Boolean, default: false },
  image_url: { type: String, default: null },
  option_images: { type: Map, of: String, default: {} },
  options: [optionSchema],
  correct_answer: mongoose.Schema.Types.Mixed,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  points: { type: Number, default: 3 },
  // Real CAT marking: MCQ +3/-1/0, TITA (numeric) +3/0/0 — no negative marking for TITA.
  marking_scheme: markingSchemeSchema,
  concept_tags: [String],
  problem_types: [String],
  common_mistakes: [String],
  prerequisite_concepts: [String],
  average_time_seconds: Number,
}, { timestamps: true });

catQuestionSchema.index({ subject: 1 });
catQuestionSchema.index({ subject: 1, difficulty: 1 });

module.exports = mongoose.model('cat_question', catQuestionSchema, 'cat_questions');


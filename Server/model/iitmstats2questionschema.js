const mongoose = require('mongoose');


// ─── Sub-schema for options (MCQ / MSQ) ───────────────────────────────────────
const optionSchema = new mongoose.Schema({
  option_id: {
    type: String,        // 'A', 'B', 'C', 'D'
    required: true
  },
  text: {
    type: String,
    required: true
  }
}, { _id: false });




// ─── Main Question Schema ─────────────────────────────────────────────────────
const iitmstats2questionschema = new mongoose.Schema({


  // ── Identity & Classification ──────────────────────────────────────────────
  question_number: {
    type: Number,
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
    max: 102      // BSMA1003 has exactly 11 weeks
  },


  // ── Question Content ───────────────────────────────────────────────────────
  question_text: {
    type: String,
    required: true
  },
  image_url: {
    type: String,
    default: null
  },


  // ── Question Type ──────────────────────────────────────────────────────────
  type: {
    type: String,
    required: true,
    enum: [
      'multiple_choice',   // Single correct option
      'multiple_select',   // Multiple correct options
      'numeric',           // Exact numeric answer
      'numeric_range',     // Answer within [min, max]
      'text_input'         // Short text/equation answer
    ]
  },


  // ── Options (MCQ / MSQ only) ───────────────────────────────────────────────
  options: {
    type: [optionSchema],
    default: undefined
  },


  // ── Correct Answer ─────────────────────────────────────────────────────────
  correct_answer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
    /*
      multiple_choice  → 'A'
      multiple_select  → ['A', 'C']
      numeric          → 42
      numeric_range    → { min: 1.5, max: 2.5 }
      text_input       → 'sin(x)'
    */
  },
  alternative_answers: [mongoose.Schema.Types.Mixed], // Alternative correct answers


  // ── Explanation ────────────────────────────────────────────────────────────
  explanation: {
    type: String,
    required: true
  },
  explanation_image_url: {
    type: String,
    default: null
  },
  solution_steps: {
    type: [String],
    default: undefined
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


  // ── Metadata ───────────────────────────────────────────────────────────────
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }


}, {
  timestamps: true
});




// ─── Indexes ──────────────────────────────────────────────────────────────────
iitmstats2questionschema.index({ week: 1, topic: 1 });
iitmstats2questionschema.index({ week: 1, difficulty: 1 });
iitmstats2questionschema.index({ concept_tags: 1 });
iitmstats2questionschema.index({ bloom_level: 1, subtopic: 1 });
iitmstats2questionschema.index({ week: 1, is_active: 1 });
iitmstats2questionschema.index({ week: 1, is_active: 1, difficulty: 1 });


// Update the updated_at field before saving
iitmstats2questionschema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});






module.exports = mongoose.model('iitm_stats2_questions_databases', iitmstats2questionschema);




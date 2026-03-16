const mongoose = require('mongoose');

// ===========================================
// PHYSICS QUESTION SCHEMAS - UPDATED
// ===========================================

// Main Physics Question Schema - Updated for context questions
const physicsQuestionSchema = new mongoose.Schema({
  question_id: {
    type: String,
    required: true,
    unique: true
  },
  
  question_number: {
    type: mongoose.Schema.Types.Mixed, // Changed to Mixed to support "1a", "1b" format
    required: true
  },
  
  // NEW: Support for parent-child relationships
  parent_question: {
    type: mongoose.Schema.Types.Mixed, // References parent question number
    required: false
  },
  
  // NEW: Context question support
  is_context: {
    type: Boolean,
    default: false
  },
  
  question_text: {
    type: String,
    required: true
  },
  
  question_type: {
    type: String,
    required: true,
    enum: [
      'single_part',         // Simple one-answer question
      'multi_part',          // Questions with sub-parts (a, b, c) - DEPRECATED
      'multiple_choice',     // MCQ
      'context',            // NEW: Context-only questions (no answers required)
      'assertion_reason',    // Assertion-Reason type
      'match_the_following', // Column matching
      'fill_in_blanks',     // Multiple blanks
      'diagram_based'        // Questions with diagrams
    ]
  },
  
  // For single-part questions
  correct_answer: {
    type: mongoose.Schema.Types.Mixed,
    required: function() { 
      return (this.question_type === 'single_part' || this.question_type === 'multiple_choice') && !this.is_context; 
    }
  },
  
  // NEW: Alternative answers support
  alternative_answers: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  
  answer_type: {
    type: String,
    enum: [
      'scalar_with_unit', 'vector', 'coordinate', 'pure_number', 
      'expression', 'multiple_values', 'option_letter'
    ],
    required: function() {
      return !this.is_context && this.question_type !== 'multiple_choice';
    }
  },
  
  units: String,
  tolerance: { type: Number, default: 0.01 },
  
  // Input format guidance for single-part questions
  format_hint: {
    type: String,
    required: function() {
      return !this.is_context && this.question_type === 'single_part';
    }
  },
  
  placeholder_text: {
    type: String
  },
  
  input_validation: {
    pattern: String,
    error_message: String
  },
  
  // For multiple choice questions
  options: [{
    option_id: String, // A, B, C, D
    option_text: String,
    is_correct: { type: Boolean, default: false }
  }],
  
  // DEPRECATED: For old multi-part questions (keeping for backward compatibility)
  sub_questions: [{
    part_id: String,
    sub_question_text: String,
    correct_answer: mongoose.Schema.Types.Mixed,
    alternative_answers: [mongoose.Schema.Types.Mixed],
    answer_type: String,
    units: String,
    format_hint: String,
    explanation: String
  }],
  
  // Physics-specific information
  physics_topic: {
    type: String,
    required: true,
    enum: [
      'kinematics', 'kinematics_1d', 'kinematics_2d', 'dynamics', 'circular_motion',
      'work_energy', 'momentum', 'gravitation', 'oscillations',
      'waves', 'thermodynamics', 'electrostatics', 'current_electricity',
      'magnetism', 'electromagnetic_induction', 'optics', 'modern_physics'
    ]
  },
  
  sub_topic: String, // More specific categorization
  
  physics_concepts: [String], // Key concepts tested
  
  // NEW: For context questions - given values and constants
  given_values: [{
    variable: String,      // v₀, a, m, etc.
    value: String,         // "10", "4î + 8ĵ"
    units: String,         // m/s, kg
    description: String    // "initial velocity"
  }],
  
  required_constants: [{
    constant: String,      // g, c, h, k
    value: String,         // "10", "3×10⁸"
    units: String,         // m/s², m/s
    description: String    // "acceleration due to gravity"
  }],
  
  assumptions: [String], // Air resistance neglected, etc.
  
  explanation: {
    type: String,
    required: function() {
      return !this.is_context; // Context questions don't need explanations
    }
  },
  
  solution_approach: String, // Brief description of solution method
  
  common_mistakes: [String], // Common student errors
  
  related_questions: [String], // IDs of related questions
  
  source: {
    book: String,
    chapter: String,
    page: Number,
    author: String
  },
  
  tags: [String], // For searching and filtering
  
  created_at: {
    type: Date,
    default: Date.now
  },
  
  updated_at: {
    type: Date,
    default: Date.now
  },
  
  created_by: String,
  last_modified_by: String
});

// Middleware to update timestamps
physicsQuestionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Export models
module.exports = {
  PhysicsQuestion: mongoose.model('physics_questions', physicsQuestionSchema)
};

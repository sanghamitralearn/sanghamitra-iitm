const mongoose = require('mongoose');

const statisticsQuestionSchema = new mongoose.Schema({
  question_number: {
    type: Number,
    required: true
  },
  question_text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['multiple_choice', 'multiple_select', 'numeric', 'text_input', 'text', 'numeric_input', 'mcq']
  },
  options: [String], // For multiple choice questions
  correct_answer: {
    type: mongoose.Schema.Types.Mixed, // Can be string, number, or array
    required: true
  },
  alternative_answers: [mongoose.Schema.Types.Mixed], // Alternative correct/wrong answers
  explanation: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  points: {
    type: Number,
    default: 1
  },
  topic: {
    type: String,
    required: true
  },
  format_hint: String, // Optional formatting hint for students
  img_file: String, // Path to image file for graph questions
  
  // Tolerance for numeric questions
  has_tolerance: {
    type: Boolean,
    default: false
  },
  tolerance_value: {
    type: Number,
    default: 0
  },
  
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
statisticsQuestionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Method to check if answer is correct
statisticsQuestionSchema.methods.isCorrectAnswer = function(studentAnswer) {
  // Multiple select - compare arrays
  if (this.type === 'multiple_select') {
    const correctArray = Array.isArray(this.correct_answer) 
      ? this.correct_answer 
      : String(this.correct_answer).split(',').map(s => s.trim());
    
    const studentArray = Array.isArray(studentAnswer)
      ? studentAnswer
      : String(studentAnswer).split(',').map(s => s.trim());
    
    return JSON.stringify(correctArray.sort()) === JSON.stringify(studentArray.sort());
  }
  
  // Numeric with tolerance
  if (this.type === 'numeric' && this.has_tolerance && this.tolerance_value > 0) {
    const numAnswer = parseFloat(studentAnswer);
    const correctNum = parseFloat(this.correct_answer);
    return Math.abs(numAnswer - correctNum) <= this.tolerance_value;
  }
  
  // Default exact match
  return studentAnswer == this.correct_answer;
};

// Create and export the model
const Statistics_questions = mongoose.model('Statistics_questions', statisticsQuestionSchema, 'iitm_stats_questions');

module.exports = Statistics_questions;
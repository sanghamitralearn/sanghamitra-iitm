const mongoose = require('mongoose');

const iitmCTQuestionSchema = new mongoose.Schema({
  question_number: {
    type: Number,
    required: true
  },
  
  topic: {
    type: String,
    required: true
  },
  
  question_text: {
    type: String,
    required: true
  },
  
  parent_statement: String, // For grouped questions (Q1-3, Q6-7)
  
  type: {
    type: String,
    required: true,
    enum: ['mcq', 'numeric', 'msq']
  },
  
  options: [String], // For MCQ and MSQ questions
  
  correct_answer: {
    type: mongoose.Schema.Types.Mixed, // String for MCQ, Number for numeric, Array for MSQ
    required: true
  },
  
  explanation: String,
  
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  
  points: {
    type: Number,
    required: true
  },
  
  dataset: {
    type: String,
    enum: ['Scores', 'Shopping Bills', 'Words', 'Olympics', 'Library', 'None']
  },
  
  question_group: String, 
  
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
iitmCTQuestionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Unique index by question number and topic
iitmCTQuestionSchema.index({ 
  question_number: 1, 
  topic: 1
}, { unique: true });

module.exports = mongoose.model('iitm_ct_questions', iitmCTQuestionSchema);

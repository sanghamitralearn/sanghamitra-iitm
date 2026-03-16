const mongoose = require('mongoose');

// Question Schema
const QuestionSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    enum: ['english_pre_diagnostic', 'english_post_diagnostic'],
    index: true
  },
  subtopic: {
    type: String,
    required: true,
    enum: ['grammar', 'spelling', 'speaking', 'reading']
  },
  questionId: {
    type: Number,
    required: true,
    unique: true
  },
  questionText: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true
  },
  correctAnswer: {
    type: Number,
    required: true
  },
  stanza: {
    type: String
  }
});

// ✅ Direct export — no need for destructuring later
module.exports = mongoose.model('EngDiagnosticQuestion', QuestionSchema);

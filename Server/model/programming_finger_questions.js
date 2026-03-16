const mongoose = require('mongoose');

// Test case subdocument
const testCaseSchema = new mongoose.Schema({
  input: { type: [mongoose.Schema.Types.Mixed], required: true },
  expected: { type: mongoose.Schema.Types.Mixed, required: true },
  description: { type: String }
});

// Main question schema
const fingerQuestionSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  topic: { type: String, required: true },
  title: { type: String, required: true },
  topic_id: { type: String, required: true },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  description: { type: String, required: true },
  starter_code: { type: String, required: true },
  hint: { type: String },
  test_cases: { type: [testCaseSchema], default: [] }
}, {
  timestamps: true
});

const FingerQuestion = mongoose.model('FingerQuestion', fingerQuestionSchema, 'finger_questions');
module.exports = FingerQuestion;

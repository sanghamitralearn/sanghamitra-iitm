const mongoose = require('mongoose');

const subjectAnalysisSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    enum: ['math', 'statistics', 'programming', 'english', 'algebra']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  analysis: {
    type: String,
    required: true
  },
  feedback: {
    type: String,
    required: true
  },
  gaps: [{
    area: String,
    description: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    }
  }],
  recommendations: [{
    topic: String,
    description: String,
    difficulty: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SubjectAnalysis', subjectAnalysisSchema);
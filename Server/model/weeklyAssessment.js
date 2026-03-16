// models/WeeklyAssessment.js
const mongoose = require('mongoose');

// Level 1: Submissions Schema (optional, flexible structure)
const submissionSchema = new mongoose.Schema({
  score: { type: Number },
  timeTaken: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

// Level 2: Topics Schema
const topicSchema = new mongoose.Schema({
  topicName: { type: String, required: true },
  score: { type: Number },
  timeTaken: { type: String },
  timestamp: { type: Date, default: Date.now },
  submissions: { type: [submissionSchema], default: [] }
}, { _id: false });

// Level 3: Main Weekly Assessments Schema
const WeeklyAssessmentSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  topics: { type: [topicSchema], default: [] }
});

module.exports = mongoose.model('Weekly_assessments', WeeklyAssessmentSchema);

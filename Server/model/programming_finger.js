const mongoose = require('mongoose');
// Sub-document schema for each question submission
const submissionSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  userAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  timestamp: { type: Date, default: () => new Date() }
});

// Sub-document schema for topics with their own submissions
const topicSchema = new mongoose.Schema({
  topicName: { type: String, required: true },
  submissions: { type: [submissionSchema], default: [] }
});

// Main schema for user-based finger exercise tracking
const programmingFingerSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  topics: { type: [topicSchema], default: [] }
}, {
  timestamps: true
});

const ProgrammingFinger = mongoose.model('ProgrammingFinger', programmingFingerSchema);
module.exports = ProgrammingFinger;

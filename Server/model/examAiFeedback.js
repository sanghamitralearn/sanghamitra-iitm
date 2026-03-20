const mongoose = require('mongoose');

// Cache for per-exam AI feedback so the same attempt never hits the API twice
const examAiFeedbackSchema = new mongoose.Schema({
  email:         { type: String, required: true },
  topic:         { type: String, required: true },
  attemptNumber: { type: Number, required: true },
  feedback:      { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt:     { type: Date, default: Date.now }
});

examAiFeedbackSchema.index({ email: 1, topic: 1, attemptNumber: 1 }, { unique: true });

module.exports = mongoose.model('ExamAiFeedback', examAiFeedbackSchema);

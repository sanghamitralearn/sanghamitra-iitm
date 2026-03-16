const mongoose = require('mongoose');

// Individual Question Result Schema for CT
const ctQuestionResultSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'iitm_ct_questions', required: false },
  questionNumber: { type: Number, required: false },
  questionText: { type: String, required: false },
  userAnswer: { type: mongoose.Schema.Types.Mixed, required: false },
  correctAnswer: { type: mongoose.Schema.Types.Mixed, required: false },
  isCorrect: { type: Boolean, required: false },
  timeTaken: { type: Number, default: 0 },
  pointsAwarded: { type: Number, required: false },
  maxPoints: { type: Number, required: false }
});

// Topic-level Score Schema
const topicScoreSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  percentage: { type: Number },
  score: { type: Number },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number },
  totalPoints: { type: Number },
  earnedPoints: { type: Number },
  attemptNumber: { type: Number, default: 1 },
  timestamp: { type: Date, default: Date.now },
  questionResults: [ctQuestionResultSchema]
});

// Main User Schema
const iitmCTScoreSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  completedQuestionIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  quizScores: [topicScoreSchema]
}, { timestamps: true });

iitmCTScoreSchema.index({ email: 1 });
iitmCTScoreSchema.index({ 'quizScores.topic': 1 });

module.exports = mongoose.model('iitm_ct_scores', iitmCTScoreSchema);

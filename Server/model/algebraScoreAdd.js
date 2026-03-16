const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AlgebraQuestion' },
  answer: String,
  correct: Boolean,
  difficultyLevel: String
});

const topicSchema = new mongoose.Schema({
  topic: String,
  answeredQuestions: [String],
  questions: [questionSchema],
  current_level: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mastered'],
    default: 'easy'
  }
});

const userScoreSchema = new mongoose.Schema({
  username: String,
  email: String,
  topics: [topicSchema]
});

const UserScore = mongoose.model('UserScore', userScoreSchema, 'algebra_scores');

module.exports = UserScore;

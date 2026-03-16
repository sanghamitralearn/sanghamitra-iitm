const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.Mixed, required: true },
  questionText: { type: String, required: true },
  userResponse: [{ type: mongoose.Schema.Types.Mixed, required: true }],
  correctAnswers: [{ type: mongoose.Schema.Types.Mixed, required: true }],
  isCorrect: { type: Boolean, required: true },
  marksAwarded: { type: Number, default: 0 },
});

const userScoreSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    name: { type: String, required: true },
    scores: [
      {
        week: { type: Number, required: true },
        subtopic: { type: String, required: true },
        totalQuestions: { type: Number, required: true },
        correctAnswers: { type: Number, required: true },
        score: { type: Number, required: true },
        dateAttempted: { type: Date, default: Date.now },
        responses: [responseSchema],
      },
    ],
  },
  { timestamps: true }
);

const IITM_Stats_2_Score = mongoose.model("iitm_stats_2_score", userScoreSchema);
module.exports = IITM_Stats_2_Score;

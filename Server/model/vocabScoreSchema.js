// model/vocabScoreSchema.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'VocabQuestion', required: true },
  question_text: { type: String, required: true },
  user_response: { type: String, required: true },
  correct_option: { type: String, required: true },
  is_correct: { type: Boolean, required: true },
  points_awarded: { type: Number, required: true },
  difficulty_level: { type: String, required: true },
  CEFR_level: { type: String, required: true },
  topic: { type: String, required: true }
});

const assessmentSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  total_score: { type: Number, required: true },
  assess_topic: { type: String, required: false },
  questions: { type: [questionSchema], required: true }
});

const vocabScoreSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  registered_date: { type: Date, default: Date.now },
  assessments: { type: [assessmentSchema], required: true }
});

const VocabScore = mongoose.model('VocabScore', vocabScoreSchema, 'vocab_scores');

// Function to add or update assessment for a user
async function addOrUpdateAssessment(username, email, newAssessment) {
  try {
    const user = await VocabScore.findOne({ username, email });
    if (user) {
      // Append new assessment to existing user
      user.assessments.push(newAssessment);
      await user.save();
    } else {
      // Create new user document with the assessment
      const newUser = new VocabScore({
        username,
        email,
        assessments: [newAssessment]
      });
      await newUser.save();
    }
    console.log('Assessment saved successfully.');
  } catch (err) {
    console.error('Error saving assessment:', err);
  }
}

module.exports = { VocabScore, addOrUpdateAssessment };

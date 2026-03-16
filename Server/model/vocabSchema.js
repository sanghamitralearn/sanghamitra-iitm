// model/vocabQuestionSchema.js
const mongoose = require('mongoose');

const vocabQuestionSchema = new mongoose.Schema({
  questionType: { type: String, required: true },
  question: { type: String, required: true },
  options: {
    a: { type: String, required: true },
    b: { type: String, required: true },
    c: { type: String, required: true },
    d: { type: String, required: true },
  },
  correctOption: { type: String, required: true },
  explanation: { type: String, required: true },
  synonyms: { type: [String], required: true },
  antonyms: { type: [String], required: true },
  phonetic: { type: String, required: true },
  difficultyLevel: { type: String, required: true },
  CEFRLevel: { type: String, required: true },
  topic: { type: String, required: true },
  points: { type: Number, required: true }
});

const VocabQuestion = mongoose.model('VocabQuestion', vocabQuestionSchema, 'vocab_questions');

module.exports = VocabQuestion;

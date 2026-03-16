const mongoose = require('mongoose');

const mathQuestionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true
    },
    questionOptions: { 
        optionA: { type: String, required: true },
        optionB: { type: String, required: true },
        optionC: { type: String, required: true },
        optionD: { type: String, required: true }
    },
    questionCorrectAnswer: {
        type: String,
        enum: ['a', 'b', 'c', 'd'],
        required: true
    },
    explanationText: {
        type: String,
        required: true
    },
    questionDifficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true
    },
    questionTopicArea: {
        type: String,
        enum: [
            'geometry', 'algebra', 'trigonometry', 'calculus', 'coordinate geometry',
            'arithmetic', 'statistics', 'data interpretation', 'number theory',
            'combinatorics', 'probability', 'logic', 'set theory', 'matrices',
            'linear algebra', 'differential equations', 'complex analysis'
        ],
        required: true
    },
    questionTopic: {
        type: String,
        enum: [
            'equations', 'inequalities', 'exponents', 'roots', 'fractions', 'decimals',
            'polynomials', 'rational expressions', 'functions',
            'logarithms', 'sequences', 'series', 'addition', 'subtraction', 'multiplication', 'division'
        ],
        required: true
    },
    testedConcepts: {
        type: [String],
        required: true
    },
    questionMisconceptions: {
        type: [String],
        required: true
    },
    averageTime: {
        type: Number,
        required: true
    },
    prerequisiteTopics: {
        type: [String],
        required: true
    },
    gradeLevel: {
        type: Number,
        required: true
    }
});

const MathQuestionUpdated = mongoose.model('MathQuestionUpdated', mathQuestionSchema, 'pre-test-questions');
module.exports = MathQuestionUpdated;

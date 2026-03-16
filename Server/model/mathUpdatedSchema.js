const mongoose = require('mongoose');

const mathSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: {
        a: { type: String, required: true },
        b: { type: String, required: true },
        c: { type: String, required: true },
        d: { type: String, required: true }
    },
    correctAnswer: {
        type: String,
        enum: ['a', 'b', 'c', 'd'],
        required: true
    },
    explanation: {
        type: String,
        required: true
    },
    difficultyLevel: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true
    },
    topicArea: {
        type: String,
        enum: [
            'geometry', 'algebra', 'trigonometry', 'calculus', 'coordinate geometry',
            'arithmetic', 'statistics', 'data interpretation', 'number theory',
            'combinatorics', 'probability', 'logic', 'set theory', 'matrices',
            'linear algebra', 'differential equations', 'complex analysis'
        ],
        required: true
    },
    topic: {
        type: String,
        enum: [
            'equations', 'inequalities', 'exponents', 'roots', 'fractions', 'decimals',
            'polynomials', 'rational expressions', 'functions', 
            'logarithms', 'sequences', 'series', 'basic_operations'
        ],
        required: true
    },
    conceptsTested: {
        type: [String],
        required: true
    },
    commonMisconceptions: {
        type: [String],
        required: true
    },
    timeSpent: {
        type: Number,
        required: true
    },
    prerequisiteConcepts: {
        type: [String],
        required: true
    },
    gradeLevel: {
        type: Number,
        required: true
    }
});

const MathQuestion = mongoose.model('MathQuestion', mathSchema, 'mathUpdatedSchema');
module.exports = MathQuestion;

const mongoose = require('mongoose');

const algebraQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: {
        a: {
            type: String,
            required: true
        },
        b: {
            type: String,
            required: true
        },
        c: {
            type: String,
            required: true
        },
        d: {
            type: String,
            required: true
        }
    },
    correctOption: {
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
    topic: {
        type: String,
        enum: [
            'equations', 'inequalities', 'exponents', 'roots', 'fractions', 'decimals',
            'polynomials', 'rational expressions', 'functions', 
            'logarithms', 'sequences', 'series'
        ],
        required: true
    }
});

const AlgebraQuestion = mongoose.model('AlgebraQuestion', algebraQuestionSchema, 'algebra_questions');
module.exports = AlgebraQuestion;

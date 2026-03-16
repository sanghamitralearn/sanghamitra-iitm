// models/MathTestQuestion.js
const mongoose = require('mongoose');

const fractionTestSchema = new mongoose.Schema({
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
            'equation', 'rate & work', 'exponents & roots', 'exponents', 'roots',
            'number line', 'polygon', 'quadratic equation', 'lines & angles',
            'inequalities & absolute values', 'percents', 'stats-mean-median',
            'nested figure', 'ratios', 'fractions', 'functions', 'logarithms',
            'sequences & series', 'probability', 'combinatorics', 'vectors',
            'matrices', 'differential equations', 'complex numbers'
        ],
        required: true
    },
    url: {
        type: String,
        required: false
    }
});

const FractionTestQuestion = mongoose.model('FractionTestQuestion', fractionTestSchema, 'fraction_questions');
module.exports = FractionTestQuestion;

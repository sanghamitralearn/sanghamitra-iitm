const mongoose = require('mongoose');

const arithmeticQuestionSchema = new mongoose.Schema({
    questionText: { 
        type: String,
        required: true
    },
    options: {
        A: { type: String, required: true },
        B: { type: String, required: true },
        C: { type: String, required: true },
        D: { type: String, required: true }
    },
    correctOption: {
        type: String,
        enum: ['A', 'B', 'C', 'D'],
        required: true
    },
    explanation: {
        type: String,
        required: true
    },
    difficultyLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        required: true
    },
    arithmeticCategory: {
        type: String,
        enum: [
            'basic-operations', 'fractions-decimals', 
            'number-sense', 'measurement', 
            'ratios-proportions', 'problem-solving'
        ],
        required: true
    },
    operationType: {
        type: String,
        enum: [
            'addition', 'subtraction', 
            'multiplication', 'division',
            'mixed-operations', 'word-problems', 'dealing-with-negative-sign'
        ],
        required: true
    },
    coreSkills: {
        type: [String],
        required: true
    },
    commonErrors: {
        type: [String],
        required: true
    },
    timeAllocation: {
        type: Number,
        min: 30,
        max: 300,
        required: true
    },
    foundationalRequirements: {
        type: [String],
        required: true
    },
    gradeLevel: {
        type: Number,
        enum: [1, 2, 3, 4, 5, 6, 7, 8],
        required: true
    },
    problemFormat: {
        type: String,
        enum: ['multiple-choice', 'fill-in-blank', 'word-problem'],
        default: 'multiple-choice'
    }
});

const ArithmeticQuestion = mongoose.model('ArithmeticQuestion', arithmeticQuestionSchema, 'arithmeticQuestionsDatabase');
module.exports = ArithmeticQuestion;

const mongoose = require('mongoose');

const arithmeticScoreSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true,
        index: true
    }, 
    username: {
        type: String,
        required: true
    },
    operationType: {
        type: String,
        enum: [
            'addition', 'subtraction', 
            'multiplication', 'division',
            'mixed-operations', 'word-problems'
        ],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    correctAnswers: {
        type: Number,
        required: true
    },
    timeTaken: { // in seconds
        type: Number,
        required: true
    },
    questionsAttempted: [{
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ArithmeticQuestion',
            required: true
        },
        userAnswer: String,
        isCorrect: Boolean,
        timeSpent: Number,
        difficultyLevel: String,
        coreSkills: [String],
        commonErrors: [String],
        foundationalRequirements: [String],
        arithmeticCategory: String,
        gradeLevel: Number,
        attemptedAt: {
            type: Date,
            default: Date.now
        }
    }],
    weaknesses: [{
        type: String,
        enum: [
            'carry-over', 'regrouping', 'decimal-alignment',
            'fraction-conversion', 'unit-conversion', 'other'
        ]
    }]
});

const ArithmeticScore = mongoose.model('ArithmeticScore', arithmeticScoreSchema, 'arithemeticScores');
module.exports = ArithmeticScore;



// model/coding_Questions.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionId: {
        type: Number,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['interview', 'coding'],
        required: true,
        default: 'coding'
    },
    topic: {
        type: String,
        required: true,
        index: true
    },
    description: String,
    prompt: String,
    starterCode: String,
    functionName: String,
    testCases: [{
        input: mongoose.Schema.Types.Mixed,
        expected: mongoose.Schema.Types.Mixed,
        description: String
    }],
    maxScore: {
        type: Number,
        default: 10
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    timeLimit: {
        type: Number,
        default: 600 // seconds
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('coding_Question', questionSchema);

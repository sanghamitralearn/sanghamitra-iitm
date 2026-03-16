const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
    //testCaseIndex: Number,
    input: mongoose.Schema.Types.Mixed,
    expected: mongoose.Schema.Types.Mixed,
    output: mongoose.Schema.Types.Mixed,
    passed: Boolean,
    error: String,
    //executionTime: Number
});

const codingQuestionSchema = new mongoose.Schema({
    questionId: { type: Number, required: true },
    title: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['coding', 'interview'],
        default: 'coding' },
    userCode: { type: String },
    functionName: String,
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    passedTests: Number,
    totalTests: Number,
    testResults: [testResultSchema],
    hasExplanations: Boolean,
    timeTaken: Number // in seconds
});

const codingSubmissionSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    topic: { type: String, required: true, default: 'Python basics' },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    percentage: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    //cheatingAttempts: { type: Number, default: 0 },
    //tabSwitches: { type: Number, default: 0 },
    questions: [codingQuestionSchema],
    //programmingLanguage: { type: String, default: 'python' }
});

module.exports = mongoose.model('CodingSubmission', codingSubmissionSchema, 'coding_submission');

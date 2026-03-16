const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
    passed: Boolean,
    output: mongoose.Schema.Types.Mixed,
    error: String,
    expectedAnswer: mongoose.Schema.Types.Mixed,
    userAnswer: mongoose.Schema.Types.Mixed
});

const questionSchema = new mongoose.Schema({
    questionId: Number,
    title: String,
    type: { 
        type: String, 
        enum: ['coding', 'mcq-single', 'mcq-multiple', 'numerical'], 
        
    },
    userAnswer: mongoose.Schema.Types.Mixed,
    correctAnswer: mongoose.Schema.Types.Mixed,
    options: [String], // For MCQ questions
    code: String,        // For coding questions only
    score: Number,
    maxScore: Number,
    testResults: [testResultSchema],
    hasExplanations: Boolean,
    explanation: String // Store explanation text
});

const algorithmSubmissionSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    topic: { type: String, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    percentage: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    questions: [questionSchema]
});


module.exports = mongoose.model('AlgorithmSubmission', algorithmSubmissionSchema, 'algorithm_submissions');

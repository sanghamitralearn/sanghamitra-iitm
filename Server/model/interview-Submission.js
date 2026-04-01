
const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema({
    questionId: { type: Number, required: true },
    title: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['coding', 'mcq-single', 'mcq-multiple', 'numerical', 'interview'],
        required: true 
    },
    // For coding questions
    code: String,
    //functionName: String,
    testResults: [{
        input: mongoose.Schema.Types.Mixed,
        expected: mongoose.Schema.Types.Mixed,
        output: mongoose.Schema.Types.Mixed,
        passed: Boolean
    }],
    // For MCQ/numerical questions
    userAnswer: mongoose.Schema.Types.Mixed,
    correctAnswer: mongoose.Schema.Types.Mixed,
    options: [String], // For MCQ questions
    
    // Common fields
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    explanation: String,
    timeTaken: Number
});

const interviewSubmissionSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    topic: { type: String, required: true },
    type: { type: String, required: true }, // e.g., 'interview', 'technical'
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    percentage: { type: Number, required: true },
    
    // Breakdown by question type
    codingScore: { type: Number, default: 0 },
    codingMaxScore: { type: Number, default: 0 },
    mcqScore: { type: Number, default: 0 },
    mcqMaxScore: { type: Number, default: 0 },
    
    timestamp: { type: Date, default: Date.now },
    questions: [interviewQuestionSchema],
    feedback: String, // Interviewer's feedback
    duration: Number // Total time taken in minutes
});

module.exports = mongoose.model('InterviewSubmission', interviewSubmissionSchema, 'interview_submissions');

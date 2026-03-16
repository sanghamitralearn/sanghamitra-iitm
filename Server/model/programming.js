const mongoose = require('mongoose');

// Define Submission Schema
const submissionSchema = new mongoose.Schema({
    question_id: { type: Number, required: true },
    user_code: { type: String, required: true },
    test_cases_passed: { type: Number, required: true, default: 0 }
});

// Define Quiz Schema
const quizSchema = new mongoose.Schema({
    score: { type: Number, required: true, default: 0 },
    datetime: { type: Date, default: Date.now }, // Fixed datetime issue
    submissions: [submissionSchema] // Array of submissions
});

// Define Main Programming Schema
const programmingSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    quizzes: [quizSchema] // Array of quizzes
});

// Create and export the model
const Programming = mongoose.model('Programming', programmingSchema);
module.exports = Programming;

const mongoose = require('mongoose');

// Updated Reading Passage Schema
const rcquizSchema = new mongoose.Schema({
    topic_category: {
        type: String,
        enum: ['Science', 'History', 'Politics', 'Cars', 'Art', 'Anime', 'Astronomy'],  // Add more categories as needed
        required: true
    },
    passage_level: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard', 'Mastered'],
        required: true
    },
    passage_name: {
        type: String,
        required: true
    },
    passage: {
        type: String,
        required: true
    },
    questions: [
        {
            question_text: { type: String, required: true },
            options: [{ type: String, required: true }], // List of answer options
            correct_answer: { type: String, required: true }, // Could store the index of the correct answer or value
            question_category: { type: String, required: false },
            explanation: { type: String, required: false }
        }
    ],
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date
    }
});

// Compile the model
const rcQuiz = mongoose.model('Reading_Passage', rcquizSchema, 'reading_passages');

module.exports = rcQuiz;

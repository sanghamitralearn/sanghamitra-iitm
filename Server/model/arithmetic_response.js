const mongoose = require('mongoose');

const testResponseSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true
    },
    userName: {
        type: String, 
        required: true
    },
    testDate: {
        type: Date,
        default: Date.now
    },
    responses: [{
        questionData: {
            questionText: String,
            questionOptions: {
                optionA: String,
                optionB: String,
                optionC: String,
                optionD: String
            },
            questionCorrectAnswer: String,
            explanationText: String,
            questionDifficulty: String,
            questionTopicArea: String,
            questionTopic: String,
            testedConcepts: [String],
            questionMisconceptions: [String],
            averageTime: Number,
            prerequisiteTopics: [String],
            gradeLevel: Number
        },
        userAnswer: {
            type: String,
            enum: ['a', 'b', 'c', 'd', 'unanswered'],
            required: true
        },
        timeSpent: {
            type: mongoose.Schema.Types.Mixed,
            validate: {
                validator: function(v) {
                    return typeof v === 'number' || v === 'unseen';
                },
                message: props => `${props.value} is not a valid time spent value!`
            },
            required: true
        }
    }]
});

const TestResponse = mongoose.model('TestResponse', testResponseSchema);
module.exports = TestResponse;

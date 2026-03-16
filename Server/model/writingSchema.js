const mongoose = require('mongoose');

// Schema for writing topics
const topicSchema = new mongoose.Schema({
  topic_text: { type: String, required: true },
  topic_category: { type: String, required: true },
  date_added: { type: Date, default: Date.now }
});

const Topic = mongoose.model('Topic', topicSchema, 'gre_writing_topics');

// Schema for individual essay response
const essaySchema = new mongoose.Schema({
  topic_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  topic_text: { type: String, required: true },
  response_text: { type: String, required: true },
  time: { type: Number, required: true },
  date_submitted: { type: Date, default: Date.now }
});

// Schema for user writing responses
const writingResponseSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  responses: { type: [essaySchema], default: [] }
});

const WritingResponse = mongoose.model('WritingResponse', writingResponseSchema, 'gre_writing_response');

module.exports = { Topic, WritingResponse };

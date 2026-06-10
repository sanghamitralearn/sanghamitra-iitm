const mongoose = require('mongoose');


const questionResultSchema = new mongoose.Schema({


  // ── Links back to the attempt ───────────────────────────────────
  attempt_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'iitmStats2QuizAttempt',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    index: true
    // Denormalized here intentionally — avoids a join when
    // querying "all wrong answers by this user across all attempts"
  },
  week: {
    type: Number,
    required: true
  },


  // ── Links to the question ───────────────────────────────────────
  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'iitm_stats2_questions',
    required: true,
    index: true
  },


  // ── What happened ───────────────────────────────────────────────
  user_answer: {
    type: mongoose.Schema.Types.Mixed  // 'A' | ['A','C'] | 42 | null
  },
  is_correct: {
    type: Boolean,
    required: true,
    index: true
  },
  marks_awarded: {
    type: Number,
    required: true
  },
  time_taken_seconds: {
    type: Number,
    default: 0
  },


  // ── Question metadata (denormalized for fast analytics) ─────────
  // Storing these here avoids joining with questions collection
  // every time you run analytics
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  topic: {
    type: String,
    default: ''
  },
  subtopic: {
    type: String,
    default: ''
  },
  question_type: {
    type: String,
    default: ''
  },
  concept_tags: {
    type: [String],
    default: []
  },
  bloom_level: {
    type: String,
    default: 'apply'
  }


}, { timestamps: true });


// ── Indexes ───────────────────────────────────────────────────────
questionResultSchema.index({ attempt_id: 1, question_id: 1 });
questionResultSchema.index({ email: 1, is_correct: 1 });          // gap analysis
questionResultSchema.index({ email: 1, subtopic: 1 });            // subtopic weakness
questionResultSchema.index({ question_id: 1, is_correct: 1 });    // question difficulty stats
questionResultSchema.index({ email: 1, concept_tags: 1 });        // concept gap analysis
questionResultSchema.index({ email: 1, week: 1 });                // user performance by week
questionResultSchema.index({ week: 1, topic: 1 });                // topic performance


module.exports = mongoose.model(
  'iitmstats2Questionresult',
  questionResultSchema,
  'iitm_stats2_question_results'
);




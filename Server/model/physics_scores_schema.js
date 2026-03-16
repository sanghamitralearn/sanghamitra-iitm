const mongoose = require('mongoose');

// Sub-question result schema
const physicsSubQuestionResultSchema = new mongoose.Schema({
  part_id: { type: String, required: true },
  sub_question_text: String,
  user_answer: mongoose.Schema.Types.Mixed,
  correct_answer: mongoose.Schema.Types.Mixed,
  is_correct: { type: Boolean, default: false },
  time_taken: { type: Number, default: 0 }, // seconds
  attempts: { type: Number, default: 1 },
  feedback: String
});

// Individual question result schema
const physicsQuestionResultSchema = new mongoose.Schema({
  question_id: { type: String, required: true },
  question_number: Number,
  question_text: String,
  question_type: String,
  physics_topic: String,
  
  // For single-part questions
  user_answer: mongoose.Schema.Types.Mixed,
  correct_answer: mongoose.Schema.Types.Mixed,
  is_correct: { type: Boolean, default: false },
  
  // For multi-part questions
  sub_question_results: [physicsSubQuestionResultSchema],
  
  // Simplified scoring - just correct/incorrect count
  parts_correct: { type: Number, default: 0 },
  total_parts: { type: Number, required: true },
  
  // Time and attempts
  time_taken: { type: Number, default: 0 }, // Total time in seconds
  attempts_made: { type: Number, default: 1 },
  
  // Analysis
  difficulty_perceived: { 
    type: String, 
    enum: ['very_easy', 'easy', 'medium', 'hard', 'very_hard'] 
  },
  confidence_level: { type: Number, min: 1, max: 5 }, // Student's confidence
  
  mistakes_made: [String], // Categorized mistakes
  concepts_applied: [String], // Concepts student used
  
  timestamp: { type: Date, default: Date.now }
});

// Topic-wise performance schema
const physicsTopicScoreSchema = new mongoose.Schema({
  physics_topic: { type: String, required: true },
  sub_topic: String,
  
  // Simplified statistics - just correct/incorrect counts
  total_questions: { type: Number, required: true },
  questions_attempted: { type: Number, default: 0 },
  questions_correct: { type: Number, default: 0 },
  
  // Calculate percentage based on correct answers
  percentage_score: { type: Number, default: 0 }, // (questions_correct / questions_attempted) * 100
  
  // Time analysis
  total_time_spent: { type: Number, default: 0 }, // seconds
  average_time_per_question: { type: Number, default: 0 },
  
  // Difficulty breakdown - just correct/total counts
  difficulty_performance: {
    easy: { attempted: Number, correct: Number, percentage: Number },
    medium: { attempted: Number, correct: Number, percentage: Number },
    hard: { attempted: Number, correct: Number, percentage: Number },
    very_hard: { attempted: Number, correct: Number, percentage: Number }
  },
  
  // Detailed question results
  question_results: [physicsQuestionResultSchema],
  
  // Performance trends
  attempt_number: { type: Number, default: 1 },
  improvement_from_last: Number, // Percentage improvement
  
  strengths: [String], // Identified strong areas
  weaknesses: [String], // Areas needing improvement
  
  recommendations: [String], // Suggested next steps
  
  session_id: String, // Group questions from same study session
  timestamp: { type: Date, default: Date.now }
});

// Main Physics User Performance Schema
const physicsUserScoreSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  
  // Simplified overall statistics
  total_questions_attempted: { type: Number, default: 0 },
  total_questions_correct: { type: Number, default: 0 },
  overall_percentage: { type: Number, default: 0 }, // (correct/attempted) * 100
  
  total_study_time: { type: Number, default: 0 }, // minutes
  
  // Question tracking
  completed_question_ids: [String],
  bookmarked_question_ids: [String],
  flagged_for_review: [String],
  
  // Topic-wise performance
  topic_scores: [physicsTopicScoreSchema],
  
  // Learning analytics (simplified)
  learning_velocity: Number, // Questions mastered per hour
  retention_rate: Number, // Percentage of mastered concepts retained
  consistency_score: Number, // How consistent is the performance
  
  // Preferences and settings
  preferred_difficulty: String,
  study_goals: {
    target_topics: [String],
    daily_question_goal: Number,
    target_completion_date: Date
  },
  
  // Progress tracking
  milestones_achieved: [{
    milestone: String,
    date_achieved: Date,
    description: String
  }],
  
  badges_earned: [String],
  
  last_active: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

// Middleware to update timestamps
physicsUserScoreSchema.pre('save', function(next) {
  this.last_active = Date.now();
  next();
});

// Export models - REMOVED the circular dependency
module.exports = {
  PhysicsUserScore: mongoose.model('physics_user_scores', physicsUserScoreSchema),
  PhysicsTopicScore: physicsTopicScoreSchema,
  PhysicsQuestionResult: physicsQuestionResultSchema,
  PhysicsSubQuestionResult: physicsSubQuestionResultSchema
};

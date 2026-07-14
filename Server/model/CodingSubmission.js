// model/Coding_Submission.js

const mongoose = require('mongoose');

const CodingSubmissionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    default: null
  },
  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coding_Questions',
    required: true,
    index: true
  },
  course: {
    type: String,
    required: true
  },
  week: {
    type: Number,
    required: true,
    index: true
  },
  topic: {
    type: String,
    default: null
  },
  language: {
    type: String,
    enum: ['python', 'java', 'sql'],
    required: true
  },
  source_code: {
    type: String,
    required: true
  },
  verdict: {
    type: String,
    enum: [
      'Accepted',
      'Wrong Answer',
      'Compilation Error',
      'Runtime Error',
      'Time Limit Exceeded',
      'Memory Limit Exceeded',
      'Partially Accepted',
      'Pending Review'
    ],
    default: 'Wrong Answer'
  },
  passed_testcases: {
    type: Number,
    default: 0
  },
  total_testcases: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  execution_time_ms: {
    type: Number,
    default: null
  },
  submission_number: {
    type: Number,
    default: 1
  },
  // ✅ NEW: Store individual test case results for audit
  test_case_results: [{
    testcase_number: Number,
    passed: Boolean,
    output: String,
    expected_output: String,
    error: String,
    is_hidden: Boolean
  }],
  // ✅ NEW: Track if this is the best attempt
  is_best_attempt: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster queries
CodingSubmissionSchema.index({ email: 1, question_id: 1 });
CodingSubmissionSchema.index({ email: 1, course: 1, week: 1 });
CodingSubmissionSchema.index({ question_id: 1, verdict: 1 });
CodingSubmissionSchema.index({ email: 1, is_best_attempt: 1 });

// ✅ NEW: Static method to get best submission for a question
CodingSubmissionSchema.statics.getBestSubmission = async function(email, questionId) {
  return this.findOne({ email, question_id: questionId })
    .sort({ percentage: -1, createdAt: -1 })
    .lean();
};

// ✅ NEW: Static method to get all best submissions per question
CodingSubmissionSchema.statics.getBestSubmissions = async function(email, course) {
  const filter = { email };
  if (course) filter.course = course;
  
  const submissions = await this.find(filter)
    .sort({ percentage: -1 })
    .lean();
  
  // Group by question_id and keep the best one
  const bestMap = {};
  submissions.forEach(s => {
    const key = s.question_id.toString();
    if (!bestMap[key] || s.percentage > bestMap[key].percentage) {
      bestMap[key] = s;
    }
  });
  
  return Object.values(bestMap);
};

module.exports = mongoose.model('Coding_Submissions', CodingSubmissionSchema);

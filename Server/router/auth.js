const jwt = require('jsonwebtoken'); 
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const router = express.Router();
const cookieParser = require('cookie-parser');  
const session = require('express-session'); 
router.use(cookieParser());
env = require('dotenv').config(); 
const authenticate = require('../middleware/authenticate');
const VocabQuestion = require('../model/vocabSchema');
const { VocabScore, addOrUpdateAssessment } = require('../model/vocabScoreSchema');
const { Topic, WritingResponse } = require('../model/writingSchema'); 
const FractionQuestion = require('../model/MathData');
const AlgebraQuestion = require('../model/algebraSchema');
const AlgebraScores = require('../model/algebraScoreAdd');
const RC_Guide = require('../model/readingcomprehensionguide');
const ReadingPassages = require('../model/readingPassages');
const ReadingComprehensionScore = require('../model/readingcomprehensionscore');
const Programming = require('../model/programming');
const ProgrammingFinger = require('../model/programming_finger');
const FingerQuestion = require('../model/programming_finger_questions');
const CTFoundationQuestion = require('../model/CT_foundation_question');
const CTFingerScore = require('../model/CT_foundation_score');
const MathQuestion = require('../model/mathUpdatedSchema');
const MathScore = require('../model/mathUpdatedScore');
const EngDiagnosticQuestion = require('../model/eng_diagnostic');
const EngDiagnosticScore = require('../model/eng_diagnostics_scores');
const ArithmeticQuestions = require('../model/arithmetic_question.schema');
const ArithmeticResponse = require('../model/arithmetic_response');
const ArithmeticQuestion = require('../model/arithmetic-questions.schema');
const ArithmeticScore = require('../model/arithmetic-scores.schema');
const WeeklyAssessment = require('../model/weeklyAssessment');
const Statistics_scores = require('../model/statisticsSchema');
const iitm_math_score = require('../model/iitmMathSchema');
const IITMathQuestion = require('../model/iitmMathQuestionSchema');
const { PhysicsQuestion } = require('../model/physics_questions_schema');
const { PhysicsUserScore } = require('../model/physics_scores_schema');
const AlgorithmSubmission = require('../model/AlgorithmSubmission');
const Statistics_questions = require('../model/statisticsQuestion'); // Add this import
const iitm_ct_questions = require('../model/iitm_ct_questions');
const iitm_ct_scores = require('../model/iitm_ct_scores');
const IITM_Maths_2_Question = require('../model/iitm_math2_questions')
const IITM_Maths_2_Score = require('../model/iitm_math2_scores')

const IITStats2Question = require('../model/iitmstats2questionschema')
const IITStats2Scores = require('../model/iitmstats2questionresult')
const QuizAttemptstats2 = require('../model/iitmstats2quizattempt');


const Question = require('../model/pdsa_Questions');
const pdsaSubmission = require('../model/pdsa_Submission');
const CodingQuestion = require('../model/coding_Questions'); 
const CodingSubmission = require('../model/coding_Submission'); 
const InterviewSubmission = require('../model/interview_Submission'); 

const QuizAttempt     = require('../model/iitmMaths2QuizAttempt');
const QuestionResult  = require('../model/iitmMaths2QuestionResult');
const IITMath2Question = require('../model/iitmMath2QuestionsSchema')

const competitive_MathQuizAttempt     = require('../model/competitive_MathQuizAttempt');
const competitive_MathResult  = require('../model/competitive_MathResult');
const competitive_MathQue = require('../model/competitive_MathQue');

const PhysicQuizAttempt = require('../model/competitive_PhysicQuizAttempt');
const PhysicResult = require('../model/competitive_PhysicResult');
const PhysicQue = require('../model/competitive_PhysicQue');

const JavaSubmission = require('../model/Java_Submission');
const JavaQuestions = require('../model/Java_Questions');

const JeeQuestion = require('../model/jee_questions')
const JeeScore = require('../model/jee_scores')

const SatQuestion = require('../model/sat_questions')
const SatScore = require('../model/sat_scores')


require('../db/conn');
const User = require('../model/userSchema');

router.get('/', (req, res) => {
    res.send('Hello World from router');
})

router.post('/register', async (req, res) => {
    const {name, email, password} = req.body; 

    if (!name || !email || !password) {
        return res.status(422).json({error: 'Please add all fields'});
    }

    try {
        const userExist = await User.findOne({email: email});
        if (userExist) {
            return res.status(422).json({error: 'User already exists'});
        }
        const user = new User({name, email, password});
        // need a middleware - presave method
        await user.save();
        res.status(201).json({message: 'User registered successfully'});
    } catch (err) {
        console.log(err);
    }

});

router.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide all fields' });
    }

    try {
        const user = await User.findOne({ email: email });
        console.log('User found:');

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // ✅ Ensure login history is updated
        await user.updateLoginHistory();

        const token = await user.generateAuthToken();
        req.session.userId = user._id;
        req.session.token = token;
        req.session.username = user.name;
        req.session.email = user.email;
        console.log(req.session.email, req.session.username);
        res.status(200).json({ 
          success: true,
          message: 'User signed in successfully',
          username: user.name,
          email: user.email
        });

    } catch (error) {
        console.error('Error signing in user:', error);
        res.status(500).json({ error: 'Server error, failed to sign in' });
    }
});

router.get('/students-count', async (req, res) => {
  try {
    // Fetch all users (excluding sensitive fields like password)
    const users = await User.find({}, { password: 0 });

    // Count the total number of users
    const totalUsers = await User.countDocuments();

    // Return both the count and the list of users
    res.status(200).json({ totalUsers, users });
  } catch (err) {
      console.error('Error fetching users and count:', err);
      res.status(500).json({ error: 'Server error, failed to fetch users' });
  }
});

// Endpoint to fetch login history for a specific user by email
router.get('/login-history', async (req, res) => {
  const { email } = req.query; // Expect email as a query parameter

  try {
    // Check if the email parameter is provided
    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required' });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Extract the login history
    const loginHistory = user.loginHistory || [];

    // Return the login history
    res.status(200).json({ email: user.email, loginHistory });
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({ message: 'Server error, failed to fetch login history'});
  }
});

// Endpoint to get session data
router.get('/session-info', (req, res) => {
    if (req.session.userId) {
        return res.status(200).json({
            email: req.session.email,
            username: req.session.username,
            userid: req.session.username
        });
    } else {
        return res.status(401).json({ error: 'Unauthorized access' });
    }
});

router.post('/reset-password/check-email', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'Email found, proceed to reset password' });
    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/reset-password/set-new-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});



// Mathematics - II 


router.get('/iitm_maths2_questions_databases', async (req, res) => {
  try {
    const { week, email, count = 10, difficulty, type, topic } = req.query;

    if (!week || !email) {
      return res.status(400).json({
        error: 'week and email are required',
        example: '/math2/questions?week=7&email=user@example.com&count=10'
      });
    }

    const weekNum = parseInt(week);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 12) {
      return res.status(400).json({ error: 'week must be between 1 and 12' });
    }

    const filter = {
      week:      weekNum,
      is_active: true
    };
    if (difficulty) filter.difficulty = difficulty;
    if (type)       filter.type       = type;
    if (topic)      filter.topic      = topic;

    let pool = await IITMath2Question.find(filter).lean();

    if (pool.length === 0) {
      return res.status(404).json({ error: 'No questions found for this week' });
    }

    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const requestedCount = Math.min(parseInt(count), pool.length);
    const selected = pool.slice(0, requestedCount);

    return res.status(200).json({
      questions: selected,
      metadata: {
        week:      weekNum,
        pool_size: pool.length,
        returned:  selected.length,
        requested: requestedCount
      }
    });

  } catch (error) {
    console.error('❌ Error fetching questions:', error);
    return res.status(500).json({ error: 'Failed to fetch questions', details: error.message });
  }
});


router.post('/iitm_maths2_scores_databases', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, username, quizData } = req.body;
    // ── Add this temporarily ───────────────────────────────
    console.log('📥 Received body:', JSON.stringify({ email, username }, null, 2));
    console.log('📥 quizData keys:', quizData ? Object.keys(quizData) : 'quizData is undefined');
    console.log('📥 week:', quizData?.week);
    console.log('📥 startTime:', quizData?.startTime);
    console.log('📥 endTime:', quizData?.endTime);
    // ── End temporary logs ─────────────────────────────────

    if (!email || !quizData) {
      return res.status(400).json({ error: 'email and quizData are required' });
    }

    const {
      week,
      topic,
      score,
      maxPossibleScore,
      percentage,
      totalQuestions,
      correctAnswers,
      difficultyBreakdown,
      questionResults,
      startTime,
      endTime,
      totalTimeTaken,
      cheatCount
    } = quizData;

    // ── 1. Save attempt summary ────────────────────────────────────
    const [attempt] = await QuizAttempt.create([{
      email,
      username:           username || email,
      week:               week     || 7,
      topic:              topic    || '',
      score,
      max_possible_score: maxPossibleScore,
      percentage:         Math.round(percentage),
      total_questions:    totalQuestions,
      correct_answers:    correctAnswers,

      easy_attempted:   difficultyBreakdown?.easy?.attempted   || 0,
      easy_correct:     difficultyBreakdown?.easy?.correct     || 0,
      medium_attempted: difficultyBreakdown?.medium?.attempted || 0,
      medium_correct:   difficultyBreakdown?.medium?.correct   || 0,
      hard_attempted:   difficultyBreakdown?.hard?.attempted   || 0,
      hard_correct:     difficultyBreakdown?.hard?.correct     || 0,

      total_time_seconds: totalTimeTaken || 0,
      started_at:         new Date(startTime),
      submitted_at:       new Date(endTime),
      is_completed:       true,
      cheat_count:        cheatCount || 0
    }], { session });

    // ── 2. Save individual question results ────────────────────────
    if (Array.isArray(questionResults) && questionResults.length > 0) {

      const resultDocs = questionResults.map(qr => ({
        attempt_id:         attempt._id,
        email,
        week:               week || 7,
        question_id:        qr.questionId,
        user_answer:        qr.userAnswer      ?? null,
        is_correct:         qr.isCorrect,
        marks_awarded:      qr.marksAwarded    || 0,
        time_taken_seconds: qr.timeTaken       || 0,
        difficulty:         qr.difficulty      || 'medium',
        topic:              topic              || '',
        subtopic:           qr.subtopic        || '',
        question_type:      qr.questionType    || '',
        concept_tags:       qr.conceptTags     || [],
        bloom_level:        qr.bloomLevel      || 'apply'
      }));

      await QuestionResult.insertMany(resultDocs, { session });
    }

    // ── 3. Commit both writes atomically ───────────────────────────
    await session.commitTransaction();

    return res.status(201).json({
      success:    true,
      attempt_id: attempt._id,
      message:    'Quiz attempt saved successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Error saving quiz attempt:', error);
    return res.status(500).json({
      error:   'Failed to save quiz attempt',
      details: error.message
    });
  } finally {
    session.endSession();
  }
});

// ── Fetch all attempts for a user ──────────────────────────────────
router.get('/iitm_maths2_scores_databases', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const attempts = await QuizAttempt.find({ email })
      .sort({ submitted_at: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        quizScores: attempts
      }
    });

  } catch (error) {
    console.error('❌ Error fetching scores:', error);
    return res.status(500).json({
      error:   'Failed to fetch scores',
      details: error.message
    });
  }
});

// ── Fetch single attempt with full question results (review page) ──
router.get('/iitm_maths2_scores_databases/:attemptId', async (req, res) => {
  try {
    const { attemptId } = req.params;

    // Get attempt summary
    const attempt = await QuizAttempt.findById(attemptId).lean();
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Get question results and populate full question data
    const questionResults = await QuestionResult.find({ attempt_id: attemptId })
      .populate({
        path:   'question_id',
        select: 'question_text options correct_answer explanation difficulty type points has_latex subtopic'
      })
      .lean();

    // Shape data for review page
    const reviewQuestions = questionResults.map(qr => ({
      // Full question content
      question_text:  qr.question_id?.question_text  || '',
      type:           qr.question_id?.type           || qr.question_type,
      difficulty:     qr.question_id?.difficulty     || qr.difficulty,
      points:         qr.question_id?.points         || 1,
      has_latex:      qr.question_id?.has_latex      || false,
      explanation:    qr.question_id?.explanation    || '',
      options:        qr.question_id?.options        || [],
      correct_answer: qr.question_id?.correct_answer,

      // What the user did
      user_answer:        qr.user_answer,
      is_correct:         qr.is_correct,
      marks_awarded:      qr.marks_awarded,
      time_taken_seconds: qr.time_taken_seconds,
      subtopic:           qr.subtopic,
      concept_tags:       qr.concept_tags,
      bloom_level:        qr.bloom_level
    }));

    return res.status(200).json({
      success: true,
      attempt: {
        _id:                attempt._id,
        week:               attempt.week,
        topic:              attempt.topic,
        score:              attempt.score,
        max_possible_score: attempt.max_possible_score,
        percentage:         attempt.percentage,
        total_questions:    attempt.total_questions,
        correct_answers:    attempt.correct_answers,
        total_time_seconds: attempt.total_time_seconds,
        submitted_at:       attempt.submitted_at,
        easy_attempted:     attempt.easy_attempted,
        easy_correct:       attempt.easy_correct,
        medium_attempted:   attempt.medium_attempted,
        medium_correct:     attempt.medium_correct,
        hard_attempted:     attempt.hard_attempted,
        hard_correct:       attempt.hard_correct
      },
      questions: reviewQuestions
    });

  } catch (error) {
    console.error('❌ Error fetching review:', error);
    return res.status(500).json({
      error:   'Failed to fetch review data',
      details: error.message
    });
  }
});


// Route to get all topics
router.get('/gre_writing_topics', async (req, res) => {
  try {
    const topics = await Topic.find({});
    res.status(200).json(topics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to save writing response
router.post('/gre_writing_response', async (req, res) => {
  const { username, email, topic_id, topic_text, time, response_text } = req.body;

  if (!username || !email || !topic_id || !topic_text || !time || !response_text) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Find existing entry for the user by email
    let userResponse = await WritingResponse.findOne({ email });

    if (userResponse) {
      // Add new response to the existing user's responses array
      userResponse.responses.push({
        topic_id,
        topic_text,
        response_text,
        time,
        date_submitted: new Date()
      });
    } else {
      // Create a new entry for the user
      userResponse = new WritingResponse({
        username,
        email,
        responses: [{
          topic_id,
          topic_text,
          response_text,
          time,
          date_submitted: new Date()
        }]
      });
    }

    // Save the document
    await userResponse.save();
    res.status(200).json({ message: 'Response saved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middleware to check for the JWT token
router.get('/check-auth', (req, res) => {
    if (req.session.userId) {
        res.status(200).json({ authenticated: true });
    } else {
        res.status(200).json({ authenticated: false });
    }
});

router.get('/dashboard', authenticate, async (req, res) => {
    try {
        console.log('Inside /dashboard route');
        console.log('User Data:', req.rootUser);

        // ✅ Update login history when the dashboard is accessed
        await req.rootUser.updateLoginHistory();

        res.json({
            name: req.rootUser.name,
            email: req.rootUser.email,
            token: req.token
        });

    } catch (error) {
        console.error('Error in dashboard route:', error);
        res.status(500).json({ error: 'Server error, failed to load dashboard' });
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('sessionId', {
            path: '/',
            httpOnly: true,
            sameSite: 'None',
            secure: true
        });
        res.status(200).json({ message: 'Logout successful' });
    });
});

// Route to get all algebra questions
router.get('/algebra_questions', async (req, res) => {
  const { topic, difficultyLevel } = req.query;

  try {
    let questions;

    if (topic) {
      if (difficultyLevel) {
        // Fetch questions for the specific topic and difficulty level
        questions = await AlgebraQuestion.find({ topic: topic, difficultyLevel: difficultyLevel });
      } else {
        // Fetch questions for the specific topic only
        questions = await AlgebraQuestion.find({ topic: topic });
      }
    } else {
      // Fetch all questions if no topic is provided
      questions = await AlgebraQuestion.find({});
    }

    return res.status(200).json(questions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'An error occurred while fetching algebra questions' });
  }
});

// Store algebra quiz attempt
router.post('/algebra_score_add', async (req, res) => {
  const { username, email, topic, questionId, answer, correct, difficultyLevel, current_level } = req.body;

  try {
    // Find user by username and email
    let userScore = await AlgebraScores.findOne({ username, email });

    if (!userScore) {
      // If user doesn't exist, create a new entry with default level
      userScore = new AlgebraScores({
        username,
        email,
        topics: [{
          topic,
          answeredQuestions: [questionId],
          current_level,  // Ensure current_level is saved here
          questions: [{ questionId, answer, correct, difficultyLevel }]
         
        }]
      });
    } else {
      // Find the topic index
      let topicIndex = userScore.topics.findIndex(t => t.topic === topic);

      if (topicIndex === -1) {
        // If topic doesn't exist, create a new topic entry with current_level
        userScore.topics.push({
          topic,
          answeredQuestions: [questionId],
          current_level,  // Ensure current_level is saved here
          questions: [{ questionId, answer, correct, difficultyLevel }]
          
        });
      } else {
        // Add the new question to the existing topic
        userScore.topics[topicIndex].questions.push({ questionId, answer, correct, difficultyLevel });

        // Add the question ID to the answeredQuestions array if not already present
        if (!userScore.topics[topicIndex].answeredQuestions.includes(questionId)) {
          userScore.topics[topicIndex].answeredQuestions.push(questionId);
        }

        // Update the current_level in the existing topic
        userScore.topics[topicIndex].current_level = current_level;
      }
    }

    // Save the updated userScore to the database
    await userScore.save();

    // Return the updated user score as a response
    return res.status(200).json(userScore);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'An error occurred while storing quiz attempt' });
  }
});


router.get('/algebra_scores', async (req, res) => {
  try {
    const { email, topic } = req.query;

    // Step 1: Fetch all data
    let userScores = await AlgebraScores.find().exec();

    // Step 2: Filter by email if provided
    if (email) {
      userScores = userScores.filter(userScore => userScore.email === email);
    }

    // Step 3: Filter by topic if provided
    if (topic) {
      userScores = userScores.map(userScore => {
        return {
          ...userScore.toObject(),
          topics: userScore.topics.filter(t => t.topic === topic)
        };
      }).filter(userScore => userScore.topics.length > 0);
    }

    // Step 4: Return response based on the presence of filtered data
    if (userScores.length === 0) {
      return res.json({});
    }

    // Step 5: Return the filtered data or all data if no filters applied
    res.json(userScores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/eng_diagnostic_questions', async (req, res) => {
  const { topic } = req.query;
  const filter = topic ? { topic } : {};

  try {
    const questions = await EngDiagnosticQuestion.find(filter);
    res.status(200).json(questions);
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Submit score
router.post('/eng_diagnostic_scores', async (req, res) => {
  try {
    const { email, diagnosticType } = req.body;

    // Check if quiz of same type already exists
    const existing = await EngDiagnosticScore.findOne({
      email,
      quizzes: {
        $elemMatch: { diagnosticType }
      }
    });

    if (existing) {
      return res.status(400).json({
        error: `${diagnosticType}-diagnostic already taken`
      });
    }

    // Either update or create new user
    let scoreRecord = await EngDiagnosticScore.findOne({ email });

    if (!scoreRecord) {
      scoreRecord = new EngDiagnosticScore({
        email: req.body.email,
        username: req.body.username,
        quizzes: [req.body.quizzes[0]]
      });
    } else {
      scoreRecord.quizzes.push(req.body.quizzes[0]);
    }

    await scoreRecord.save();
    res.status(201).json(scoreRecord);
  } catch (err) {
    console.error('Score POST error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get scores
router.get('/eng_diagnostic_scores/:email?/:type(pre|post)?', async (req, res) => {
  try {
    let query = {};
    const { email, type } = req.params;

    if (email) query.email = email;
    if (type) query['quizzes.diagnosticType'] = type;

    const scores = await EngDiagnosticScore.find(query)
      .select('-__v -_id')
      .sort({ 'quizzes.date': -1 });

    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});



// Endpoint to get all vocabulary questions or filtered by CEFR level and/or topic
router.get('/vocab-questions', async (req, res) => {
  try {
    const { cefrLevel, topic } = req.query;
    let filter = {};

    if (cefrLevel) {
      filter.CEFRLevel = cefrLevel;
    }

    if (topic) {
      filter.topic = topic;
    }

    const questions = await VocabQuestion.find(filter);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to get vocab scores
router.get('/vocabscores', async (req, res) => {
  const { email, date } = req.query;

  try {
    if (!email) {
      // Fetch all scores if no email is provided
      const scores = await VocabScore.find({});
      return res.status(200).json(scores);
    }

    // Fetch scores for the specific user
    const userScores = await VocabScore.findOne({ email: email });
    
    if (!userScores) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (date && date !== 'null') {
      // Find the specific assessment by date
      const assessment = userScores.assessments.find(assessment => assessment.date.toISOString() === date);
      if (!assessment) {
        return res.status(404).json({ message: 'Assessment not found for the provided date' });
      }
      return res.status(200).json({ email: userScores.email, assessments: [assessment] });
    }

    // Return all scores for the user if no date is provided or if date is 'null'
    res.status(200).json(userScores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


  
  // POST route to add a new score
router.post('/vocabscoreadd', async (req, res) => {
  const { username, email, assessments } = req.body;

  if (!username || !email || !assessments) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  try {
    // Assume assessments is an array of assessment objects
    const newAssessment = assessments[0];

    await addOrUpdateAssessment(username, email, newAssessment);

    res.status(201).json({ message: 'Score added successfully' });
  } catch (error) {
    console.error('Error adding score:', error);
    res.status(500).json({ error: 'Server error, failed to add score' });
  }
});

router.get('/fraction_questions', async (req, res) => {
    try {
        const questions = await FractionQuestion.find();
        res.json(questions);
    } catch (err) {
        res.status(500).send(err);
    }
});

//Reading Comprehension 

// Save or Update Progress
router.post('/save-rc-guide', async (req, res) => {
  const { email, categoryName, value } = req.body;

  if (!email || !categoryName || value === undefined) {
    return res.status(400).json({ message: 'Email, category name, and value are required' });
  }

  try {
    // Check if the categoryName is valid
    const validCategories = ['mainIdea', 'authorsPurpose', 'supportingDetails', 'inferences', 'vocabulary'];
    if (!validCategories.includes(categoryName)) {
      return res.status(400).json({ message: 'Invalid category name' });
    }

    // Find guide by email
    let guide = await RC_Guide.findOne({ email });

    if (!guide) {
      // If guide does not exist, create it with default values
      guide = new RC_Guide({
        email,
        categories: { [categoryName]: value },
      });
    } else {
      // Update only the specified category
      guide.categories[categoryName] = value;
      guide.updatedAt = Date.now(); // Update timestamp
    }

    await guide.save();
    res.status(200).json({ message: `Category '${categoryName}' updated successfully`, guide });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Fetch Progress by Email
router.get('/progress-rc-guide', async (req, res) => {
  const { email } = req.query; // Extract email from the query parameter

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Find guide by email
    const guide = await RC_Guide.findOne({ email });

    if (!guide) {
      return res.status(404).json({ message: 'Guide not found for the provided email' });
    }

    res.status(200).json({
      message: 'User progress fetched successfully',
      guide,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Endpoint to fetch passages by topic and level and by _id
router.get('/reading_passages', async (req, res) => {
  const { topic, level, _id } = req.query;

  try {
    //if nothing is provided, fetch all the data
    if (!topic && !level && !_id) {
      // Add new response to the existing user's responses array
      const allpassages = await ReadingPassages.find();

      return res.status(200).send({ allpassages
      });
    }
    
    // If passage_id is provided, fetch the passage by its ID
    if (_id) {
      // Validate passage_id
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).send({ message: 'Invalid passage ID.' });
      }

      const passage = await ReadingPassages.findById(_id);

      // Check if passage exists
      if (!passage) {
        return res.status(404).send({ message: 'No passage found with the specified ID.' });
      }

      // Respond with the specific passage
      return res.status(200).send({
        message: 'Passage retrieved successfully.',
        passage
      });
    }

    // Validate topic and level if passage_id is not provided
    if (!topic || !level) {
      return res.status(400).send({ message: 'Both topic and level are required unless passage_id is provided.' });
    }

    // Fetch passages matching the topic and level
    const passages = await ReadingPassages.find({
      topic_category: topic,
      passage_level: level
    });

    // Check if passages are found
    if (passages.length === 0) {
      return res.status(404).send({ message: 'No passages found for the specified topic and level.' });
    }

    // Respond with the retrieved passages
    res.status(200).send({
      message: 'Passages retrieved successfully.',
      passages
    });
  } catch (error) {
    console.error('Error fetching passages:', error);
    res.status(500).send({
      message: 'Failed to fetch passages.',
      error
    });
  }
});

// Save quiz data and score
router.post('/rc_score', async (req, res) => {
  const { email, topic, level, correctAnswers, totalQuestions, solvedPassages, passageName, quizData } = req.body;

  // Validation for required fields
  if (!email || !topic ) {
      return res.status(400).send({ message: 'Invalid data' });
  }

  const normalizedLevel = level.toLowerCase();
  const scorePercentage = (correctAnswers / totalQuestions) * 100;

  try {
      // Find or create user progress
      let userProgress = await ReadingComprehensionScore.findOne({ email });

      if (!userProgress) {
          userProgress = new ReadingComprehensionScore({ email });
      }

      // Check if the topic exists, if not, initialize it
      if (!userProgress.topics.has(topic)) {
          userProgress.topics.set(topic, {
              topic,
              solvedPassages: [],
              currentPassage: null,
              current_level: 'easy',
              consecutivePerfectScores: 0,
          });
      }

      const topicData = userProgress.topics.get(topic);

      // Prevent re-solving the same passage
      if (topicData.solvedPassages.some((passage) => passage.passageId.toString() === solvedPassages)) {
          return res.status(400).send({ message: 'Passage already solved' });
      }

      // Add the solved passage data
      topicData.solvedPassages.push({
          passageId: solvedPassages,
          passageName: passageName,
          score: scorePercentage,
          timestamp: new Date(),
          quizData, // Include full quiz data
      });

      // Handle consecutive perfect scores for level upgrade
      if (scorePercentage === 100) {
          topicData.consecutivePerfectScores += 1;

          if (topicData.consecutivePerfectScores >= 3) {
              topicData.current_level = getNextLevel(normalizedLevel);
              topicData.consecutivePerfectScores = 0;

              userProgress.topics.set(topic, topicData);
              await userProgress.save();

              return res.status(200).send({
                  message: 'Score saved successfully.',
                  upgraded: true,
                  newLevel: topicData.current_level,
              });
          }
      } else {
          topicData.consecutivePerfectScores = 0;
      }

      // Update current level
      topicData.current_level = normalizedLevel;
      userProgress.topics.set(topic, topicData);

      // Save the progress
      await userProgress.save();

      res.status(201).send({ message: 'Score saved successfully.', upgraded: false });
  } catch (error) {
      console.error('Error saving score:', error);
      res.status(500).send({ message: 'Failed to save score', error });
  }
});

// Helper function to determine the next level
function getNextLevel(currentLevel) {
  const levels = ['easy', 'medium', 'hard', 'mastered'];
  const currentIndex = levels.indexOf(currentLevel);
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : currentLevel;
}

router.get('/readingcomprehensionscore', async (req, res) => {
  const { topic, email } = req.query;

  try {
      if (!email && !topic) {
          const allData = await ReadingComprehensionScore.find();
          return res.status(200).send(allData);
      }

      if (!email && topic) {
          const topicData = await ReadingComprehensionScore.find({ [`topics.${topic}`]: { $exists: true } });
          if (topicData.length === 0) {
              return res.status(404).send({ message: `No data found for topic: ${topic}` });
          }
          return res.status(200).send(topicData);
      }

      if (email && !topic) {
          const userData = await ReadingComprehensionScore.findOne({ email });
          if (!userData) {
              return res.status(404).send({ message: `No data found for email: ${email}` });
          }
          return res.status(200).send(userData);
      }

      if (email && topic) {
          const userData = await ReadingComprehensionScore.findOne({ email });
          if (!userData) {
              return res.status(404).send({ message: `No data found for email: ${email}` });
          }
          const topicData = userData.topics.get(topic);
          if (!topicData) {
              return res.status(404).send({ message: `No data found for topic: ${topic}` });
          }
          return res.status(200).send(topicData);
      }

      return res.status(400).send({ message: 'Invalid query parameters' });
  } catch (error) {
      console.error('Error fetching scores:', error);
      res.status(500).send({ message: 'Failed to fetch scores', error });
  }
});

  router.post('/weekly-assessments', async (req, res) => {
    try {
      const { username, email, topics } = req.body;
  
      if (!username || !email || !topics || !Array.isArray(topics)) {
        return res.status(400).json({ error: 'username, email, and topics[] are required.' });
      }
  
      const updated = await WeeklyAssessment.findOneAndUpdate(
        { username },
        {
          $set: { email }, // update email if changed
          $push: { topics: { $each: topics } } // push multiple topics
        },
        { new: true, upsert: true }
      );
  
      res.status(200).json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/weekly-assessments', async (req, res) => {
    try {
      const { username, email, topic } = req.query;
      let query = {};
  
      if (username) query.username = username;
      if (email) query.email = email;
      if (topic) query['topics.topicName'] = topic;
  
      const results = await WeeklyAssessment.find(query);
      res.status(200).json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/algorithm-submissions', async (req, res) => {
  try {    
    const {
      username,
      email,
      topic,
      score,
      maxScore,
      percentage,
      questions,
      timestamp
    } = req.body;

    // Basic validation
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        error: 'Username and email are required'
      });
    }

    // Create submission object with defaults
    const submissionData = {
      username: username,
      email: email,
      topic: topic || 'Algorithms & Programming',
      score: score || 0,
      maxScore: maxScore || 100,
      percentage: percentage || 0,
      questions: questions || [],
      timestamp: timestamp ? new Date(timestamp) : new Date()
    };

    console.log('💾 Saving submission for:', email);

    // Validate if model is properly connected
    if (!AlgorithmSubmission) {
      throw new Error('AlgorithmSubmission model not found');
    }

    // Create and save submission
    const newSubmission = new AlgorithmSubmission(submissionData);
    const savedSubmission = await newSubmission.save();

    console.log('✅ Submission saved successfully with ID:', savedSubmission._id);

    res.status(201).json({
      success: true,
      message: 'Algorithm quiz submitted successfully!',
      submissionId: savedSubmission._id,
      data: {
        username: savedSubmission.username,
        email: savedSubmission.email,
        score: savedSubmission.score,
        percentage: savedSubmission.percentage
      }
    });

  } catch (error) {
    console.error('❌ Error saving algorithm submission:', error);
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.get('/algorithm-submissions', async (req, res) => {
      try {
        const { username, email } = req.query;
    
        // Build dynamic filter object
        const filter = {};
        if (username) filter.username = username;
        if (email) filter.email = email;
    
        // Fetch based on filter (empty filter = all data)
        const submissions = await AlgorithmSubmission.find(filter);
    
        // Handle empty results
        if (!submissions.length) {
          return res.status(404).json({
            message: 'No submissions found for provided parameters.',
            filterUsed: filter
          });
        }
    
        res.status(200).json(submissions);
      } catch (error) {
        console.error('Error fetching algorithm submissions:', error);
        res.status(500).json({ message: 'Server Error', error });
      }
  });



//This are PDSA routes:


// GET coding submissions
router.get('/coding-submissions', async (req, res) => {
  try {
    const { username, email, topic, date } = req.query;

    // Build dynamic filter object
    const filter = {};
    if (username) filter.username = username;
    if (email) filter.email = email;
    if (topic) filter.topic = topic;
    
    // Date filtering
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      filter.timestamp = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // Fetch based on filter
    const submissions = await CodingSubmission.find(filter)
      .sort({ timestamp: -1 });

    // Handle empty results
    if (!submissions.length) {
      return res.status(404).json({
        message: 'No coding submissions found for provided parameters.',
        filterUsed: filter
      });
    }

    res.status(200).json({
      success: true,
      count: submissions.length,
      submissions
    });
  } catch (error) {
    console.error('Error fetching coding submissions:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
});

// GET all PDSA submissions (admin) — merges test, coding, and interview quiz submissions
router.get('/pdsa-submissions', async (req, res) => {
  try {
    const { email } = req.query;
    const filter = email ? { email } : {};

    const [testSubs, codingSubs, interviewSubs] = await Promise.all([
      pdsaSubmission.find(filter).sort({ timestamp: -1 }).select('-__v -questions').lean(),
      CodingSubmission.find(filter).sort({ timestamp: -1 }).select('-__v -questions').lean(),
      InterviewSubmission.find(filter).sort({ timestamp: -1 }).select('-__v -questions').lean(),
    ]);

    const normalize = (sub, quizType) => ({
      _id: sub._id,
      email: sub.email,
      username: sub.username,
      topic: sub.topic,
      score: sub.score,
      maxScore: sub.maxScore,
      percentage: sub.percentage,
      timestamp: sub.timestamp,
      quizType,
    });

    const merged = [
      ...testSubs.map(s => normalize(s, 'test')),
      ...codingSubs.map(s => normalize(s, 'coding')),
      ...interviewSubs.map(s => normalize(s, 'interview')),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ success: true, data: merged });

  } catch (error) {
    console.error('Error fetching PDSA submissions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// GET interview submissions - ADDED date filter
router.get('/interview-submissions', async (req, res) => { // Changed to plural
    try {
        const { username, email, topic, type, date } = req.query; // Added date
        
        const filter = {};
        if (username) filter.username = username;
        if (email) filter.email = email;
        if (topic) filter.topic = topic;
        if (type) filter.type = type;
        
        // Date filtering (same as other routes)
        if (date) {
          const startDate = new Date(date);
          const endDate = new Date(date);
          endDate.setDate(endDate.getDate() + 1);
          
          filter.timestamp = {
            $gte: startDate,
            $lt: endDate
          };
        }
        
        const submissions = await InterviewSubmission.find(filter)
            .sort({ timestamp: -1 })
            .limit(10)
            .select('-__v -questions.testResults');
        
        if (!submissions.length) {
          return res.status(404).json({
            success: false,
            message: 'No interview submissions found for provided parameters.',
            filterUsed: filter
          });
        }
        
        res.json({
            success: true,
            count: submissions.length,
            submissions
        });
    } catch (error) {
        console.error('Error fetching interview submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch interview submissions',
            error: error.message
        });
    }
});

// routes/interview.js
router.post('/interview-submission', async (req, res) => {
    try {
        const submissionData = req.body;
        
        console.log('📝 Received interview submission:', {
            username: submissionData.username,
            topic: submissionData.topic,
            type: submissionData.type,
            score: submissionData.score
        });

        // Validate required fields
        if (!submissionData.username || !submissionData.email || !submissionData.topic) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Calculate breakdown scores
        if (submissionData.questions) {
            const codingQuestions = submissionData.questions.filter(q => q.type === 'coding');
            const mcqQuestions = submissionData.questions.filter(q => q.type !== 'coding');
            
            submissionData.codingScore = codingQuestions.reduce((sum, q) => sum + (q.score || 0), 0);
            submissionData.codingMaxScore = codingQuestions.reduce((sum, q) => sum + (q.maxScore || 0), 0);
            submissionData.mcqScore = mcqQuestions.reduce((sum, q) => sum + (q.score || 0), 0);
            submissionData.mcqMaxScore = mcqQuestions.reduce((sum, q) => sum + (q.maxScore || 0), 0);
        }

        const submission = new InterviewSubmission(submissionData);
        await submission.save();
        
        console.log('✅ Interview submission saved:', submission._id);
        
        res.status(201).json({
            success: true,
            message: 'Interview results saved',
            submissionId: submission._id,
            breakdown: {
                coding: `${submission.codingScore}/${submission.codingMaxScore}`,
                mcq: `${submission.mcqScore}/${submission.mcqMaxScore}`,
                overall: `${submission.percentage}%`
            }
        });
        
    } catch (error) {
        console.error('❌ Error saving interview submission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save interview results',
            error: error.message
        });
    }
});


//fetching questions with type interview from collection. 
router.get('/interview', async (req, res) => {
    try {
        const { topic, type, codingCount = 3, pdsaCount = 2 } = req.query;

        // Validate required parameters
        if (!topic || !type) {
            return res.status(400).json({
                success: false,
                message: 'Topic and type are required parameters'
            });
        }

        // Fetch questions from both collections in parallel
        const [codingQuestions, pdsaQuestions] = await Promise.all([
            // Fetch from coding_Question collection
            CodingQuestion.aggregate([
                { $match: { topic: topic, type: type } },
                { $sample: { size: parseInt(codingCount) } }
            ]),
            
            // Fetch from pdsa_questions collection
            Question.aggregate([
                { $match: { topic: topic, type: type } },
                { $sample: { size: parseInt(pdsaCount) } }
            ])
        ]);

        res.json({
            success: true,
            topic,
            type,
            codingQuestions: {
                count: codingQuestions.length,
                questions: codingQuestions
            },
            pdsaQuestions: {
                count: pdsaQuestions.length,
                questions: pdsaQuestions
            },
            totalQuestions: codingQuestions.length + pdsaQuestions.length
        });

    } catch (error) {
        console.error('Error fetching interview questions:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching questions',
            error: error.message
        });
    }
});

// POST submit coding quiz results
router.post('/coding-submission', async (req, res) => {
    try {
        const submissionData = req.body;
        
        console.log('📝 Received coding quiz submission:', {
            username: submissionData.username,
            topic: submissionData.topic,
            level: submissionData.level || 'N/A',
            score: submissionData.score,
            maxScore: submissionData.maxScore,
            percentage: submissionData.percentage
        });

        // Validate required fields
        if (!submissionData.username || !submissionData.email || !submissionData.topic) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: username, email, topic'
            });
        }

        if (!submissionData.questions || !Array.isArray(submissionData.questions)) {
            return res.status(400).json({
                success: false,
                message: 'Questions array is required'
            });
        }

        // Calculate percentage if not provided
        if (!submissionData.percentage && submissionData.score !== undefined && submissionData.maxScore !== undefined) {
            submissionData.percentage = Math.round((submissionData.score / submissionData.maxScore) * 100);
        }

        // Add timestamp if not provided
        if (!submissionData.timestamp) {
            submissionData.timestamp = new Date();
        }

        // Create submission document
        const submission = new CodingSubmission(submissionData);
        
        // Save to database
        await submission.save();
        
        console.log('✅ Coding quiz submission saved successfully:', {
            submissionId: submission._id,
            percentage: submissionData.percentage + '%'
        });
        
        res.status(201).json({
            success: true,
            message: 'Coding quiz results saved successfully',
            submissionId: submission._id,
            data: {
                score: submission.score,
                maxScore: submission.maxScore,
                percentage: submission.percentage,
                timestamp: submission.timestamp
            }
        });
        
    } catch (error) {
        console.error('❌ Error saving coding submission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save coding quiz results',
            error: error.message
        });
    }
});



// GET random coding questions by difficulty and topic
router.get('/coding-questions', async (req, res) => {
    try {
        const { difficulty, topic, limit = 5 } = req.query;
        
        console.log(`📊 Fetching ${limit} ${difficulty} coding questions for topic: ${topic}`);
        
        // Build match query
        const matchQuery = { type: 'coding' };
        
        if (difficulty && difficulty !== 'all') {
            matchQuery.difficulty = difficulty;
        }
        
        if (topic && topic !== 'all') {
            matchQuery.topic = decodeURIComponent(topic);
        }
        
        // Fetch random questions
        const questions = await CodingQuestion.aggregate([
            { $match: matchQuery },
            { $sample: { size: parseInt(limit) } },
            { $project: { 
                questionId: 1,
                title: 1,
                type: 1,
                topic: 1,
                description: 1,
                prompt: 1,
                starterCode: 1,
                functionName: 1,
                testCases: 1,
                maxScore: 1,
                difficulty: 1,
                timeLimit: 1
            }}
        ]);
        
        console.log(`✅ Found ${questions.length} coding questions`);
        
        if (questions.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No coding questions found for difficulty: ${difficulty}, topic: ${topic}`
            });
        }
        
        res.json({
            success: true,
            difficulty,
            topic,
            count: questions.length,
            requested: parseInt(limit),
            questions
        });
        
    } catch (error) {
        console.error('❌ Error fetching coding questions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coding questions',
            error: error.message
        });
    }
});

// Submit quiz results route
router.post('/pdsa-submission', async (req, res) => {
    try {
        const submissionData = req.body;
        
        console.log('📝 Received PDSA submission:', {
            username: submissionData.username,
            topic: submissionData.topic,
            score: submissionData.score,
            maxScore: submissionData.maxScore
        });

        // Create submission document
        const submission = new pdsaSubmission(submissionData);
        
        // Save to database
        await submission.save();
        
        console.log('✅ PDSA submission saved successfully');
        
        res.status(201).json({
            success: true,
            message: 'Quiz results saved successfully',
            submissionId: submission._id
        });
        
    } catch (error) {
        console.error('❌ Error saving PDSA submission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save quiz results',
            error: error.message
        });
    }
});
//pdsa questions fetching route

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

router.get('/questions/:topic', async (req, res) => {
    try {
        const { topic } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        
        console.log(`📊 Fetching ${limit} random questions for topic: ${topic}`);
        
        // Define the distribution
        const distribution = [
            { maxScore: 1, count: 10 },  // 10 questions with maxScore 1
            { maxScore: 3, count: 10 },  // 10 questions with maxScore 3
            { maxScore: 2, count: 30 }   // 30 questions with maxScore 2
        ];

        let allQuestions = [];
        
        // Fetch questions for each maxScore category
        for (const category of distribution) {
            try {
                const questions = await Question.aggregate([
                    { 
                        $match: { 
                            topic: topic,
                            maxScore: category.maxScore
                        } 
                    },
                    { $sample: { size: category.count } }
                ]);

                console.log(`✅ Found ${questions.length} questions with maxScore ${category.maxScore}`);
                
                if (questions.length < category.count) {
                    console.warn(`⚠️ Only found ${questions.length} questions with maxScore ${category.maxScore}, requested ${category.count}`);
                }
                
                allQuestions = [...allQuestions, ...questions];
            } catch (error) {
                console.error(`Error fetching questions with maxScore ${category.maxScore}:`, error);
            }
        }

        // If we don't have enough questions, fill with whatever is available
        if (allQuestions.length < limit) {
            console.log(`⚠️ Only found ${allQuestions.length} questions, fetching more to reach ${limit}`);
            
            const remainingCount = limit - allQuestions.length;
            const existingIds = allQuestions.map(q => q._id);
            
            const additionalQuestions = await Question.aggregate([
                { 
                    $match: { 
                        topic: topic,
                        _id: { $nin: existingIds }
                    } 
                },
                { $sample: { size: remainingCount } }
            ]);
            
            allQuestions = [...allQuestions, ...additionalQuestions];
        }
        
        // Shuffle the combined questions
        const shuffledQuestions = shuffleArray(allQuestions).slice(0, limit);
        
        // Calculate distribution for logging
        const scoreDistribution = shuffledQuestions.reduce((acc, q) => {
            acc[q.maxScore] = (acc[q.maxScore] || 0) + 1;
            return acc;
        }, {});

        console.log('📈 Final question distribution:', scoreDistribution);
        
        if (shuffledQuestions.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No questions found for topic: ${topic}`
            });
        }
        
        res.json({
            success: true,
            topic: topic,
            count: shuffledQuestions.length,
            distribution: scoreDistribution,
            questions: shuffledQuestions
        });

           
    } catch (error) {
        console.error('❌ Error fetching random questions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch questions',
            error: error.message
        });
    }
})
  router.post('/programming/submit', async (req, res) => {
    try {
      console.log("Received submission request:", req.body);
      const { email, username, submissions } = req.body;
      
      if (!email || !username || !submissions) {
        console.log("Missing required fields");
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Calculate quiz score based on test cases passed
      const totalScore = submissions.reduce((sum, sub) => sum + sub.test_cases_passed, 0);
      console.log("Calculated score:", totalScore);
      
      let user = await Programming.findOne({ email });
      console.log("Existing user found:", !!user);
      
      if (!user) {
        // Create a new user if not found
        console.log("Creating new user");
        user = new Programming({
          email,
          username,
          quizzes: [{
            score: totalScore,
            submissions,
          }]
        });
      } else {
        // Update existing user by adding a new quiz
        console.log("Updating existing user");
        user.quizzes.push({
          score: totalScore,
          submissions,
        });
      }
      
      const savedUser = await user.save();
      console.log("User saved successfully:", savedUser._id);
      res.status(201).json({ message: "Quiz submitted successfully!", user: savedUser });
    } catch (error) {
      console.error("Error in /programming/submit:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  router.get('/programming', async (req, res) => {
    try {
        const { email } = req.query;

        if (email) {
            // Fetch a single user by email
            const user = await Programming.findOne({ email }, { _id: 0 });

            if (!user) {
                return res.status(404).json({ message: "User not found!" });
            }

            return res.json({ email: user.email, username: user.username, quizzes: user.quizzes });
        } else {
            // Fetch all users
            const users = await Programming.find({}, { _id: 0 });
            return res.json(users);
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // 📥 POST: Submit a coding answer for a topic
  router.post('/finger-exercise/submit', async (req, res) => {
    try {
      const { username, email, topic, questionId, userAnswer, isCorrect } = req.body;

      let user = await ProgrammingFinger.findOne({ email });

      if (!user) {
        // Create new user entry
        user = new ProgrammingFinger({
          username,
          email,
          topics: [{
            topicName: topic,
            submissions: [{
              questionId,
              userAnswer,
              isCorrect,
              timestamp: new Date()
            }]
          }]
        });
      } else {
        // Check if topic exists
        const topicObj = user.topics.find(t => t.topicName === topic);

        if (topicObj) {
          // Append submission to topic
          topicObj.submissions.push({
            questionId,
            userAnswer,
            isCorrect,
            timestamp: new Date()
          });
        } else {
          // Add new topic
          user.topics.push({
            topicName: topic,
            submissions: [{
              questionId,
              userAnswer,
              isCorrect,
              timestamp: new Date()
            }]
          });
        }
      }

      await user.save();
      res.status(200).json({ message: 'Submission saved successfully' });

    } catch (error) {
      console.error('Submission error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // 📤 GET: Get all submissions of a user for a specific topic
  router.get('/finger-exercise', async (req, res) => {
    const { email, topic } = req.query;
  
    try {
      // 1. No email = Return everything
      if (!email) {
        const allUsers = await ProgrammingFinger.find();
        return res.status(200).json(allUsers);
      }
  
      // 2. Email only = Return all topics for that user
      const user = await ProgrammingFinger.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      if (!topic) {
        return res.status(200).json(user); // full user data
      }
  
      // 3. Email + Topic = Return specific topic submissions
      const topicData = user.topics.find(t => t.topicName === topic);
      if (!topicData) {
        return res.status(404).json({ message: 'Topic not found for this user' });
      }
  
      return res.status(200).json(topicData);
  
    } catch (error) {
      console.error('Error fetching finger exercise data:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.get('/finger-questions', async (req, res) => {
    const { topic } = req.query;
  
    try {
      let questions;
      if (topic) {
        questions = await FingerQuestion.find({ topic });
      } else {
        questions = await FingerQuestion.find();
      }
      res.json(questions);
    } catch (err) {
      console.error('❌ Error fetching questions:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Add this route to your Express server
  router.get('/finger-questions/:id', async (req, res) => {
    try {
      const question = await FingerQuestion.findOne({ id: req.params.id });
      res.json(question);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // Add this route to your Express server
  router.put('/programming-finger-questions/:id', async (req, res) => {
    try {
      const updated = await FingerQuestion.findOneAndUpdate(
        { id: req.params.id },
        req.body,
        { new: true, upsert: true } // upsert to create if not exists
      );
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/CT_finger', async (req, res) => {
    try {
      const { topic } = req.query;
      
      // If topic is provided, filter by it, otherwise get all questions
      const filter = topic ? { topic } : {};
      
      const questions = await CTFoundationQuestion.find(filter);
      
      res.json({
        success: true,
        count: questions.length,
        data: questions
      });
    } catch (error) {
      console.error('Error fetching CT foundation questions:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching questions',
        error: error.message
      });
    }
  });

  // POST endpoint to save quiz scores
  router.post('/CT_finger_scores', async (req, res) => {
    try {
      const { email, topic, username, score, totalQuestions, answers } = req.body;
      
      // Validate required fields
      if (!email || !username || !topic || score === undefined || !totalQuestions || !answers) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Find user by email or create new record if doesn't exist
      let userScore = await CTFingerScore.findOne({ email });
      
      if (!userScore) {
        userScore = new CTFingerScore({
          email,
          username,
          quizzes: []
        });
      }
      
      // Add new quiz attempt
      userScore.quizzes.push({
        topic,
        score,
        totalQuestions,
        date: new Date(),
        answers
      });
      
      // Save to database
      await userScore.save();
      
      return res.status(201).json({
        message: 'Quiz score saved successfully',
        data: {
          email,
          username, 
          topic,
          score,
          totalQuestions
        }
      });
      
    } catch (error) {
      console.error('Error saving quiz score:', error);
      return res.status(500).json({ error: 'An error occurred while saving the quiz score' });
    }
  });

  // GET endpoint to retrieve user scores
  router.get('/CT_finger_scores/:email?', async (req, res) => {
    try {
      const { email } = req.params;
  
      if (email) {
        const userScore = await CTFingerScore.findOne({ email });
  
        if (!userScore) {
          return res.status(404).json({ error: 'No scores found for this user' });
        }
  
        return res.status(200).json(userScore);
      } else {
        const allScores = await CTFingerScore.find({});
        return res.status(200).json(allScores);
      }
  
    } catch (error) {
      console.error('Error retrieving quiz scores:', error);
      return res.status(500).json({ error: 'An error occurred while retrieving quiz scores' });
    }
  });

  // GET endpoint to retrieve scores for a specific topic
  router.get('/CT_finger_scores/:email/:topic', async (req, res) => {
    try {
      const { email, topic } = req.params;
      
      const userScore = await CTFingerScore.findOne({ email });
      
      if (!userScore) {
        return res.status(404).json({ error: 'No scores found for this user' });
      }
      
      // Filter quizzes by topic
      const topicQuizzes = userScore.quizzes.filter(quiz => quiz.topic === topic);
      
      if (topicQuizzes.length === 0) {
        return res.status(404).json({ error: `No scores found for topic: ${topic}` });
      }
      
      return res.status(200).json({
        email,
        topic,
        quizzes: topicQuizzes
      });
      
    } catch (error) {
      console.error('Error retrieving topic scores:', error);
      return res.status(500).json({ error: 'An error occurred while retrieving topic scores' });
    }
  });

// Get questions route
router.get('/arithmetic-pre-test-questions', async (req, res) => {
  try {
      // Explicitly select only necessary fields if needed
      const questions = await ArithmeticQuestions.find()
          .select({
              questionText: 1,
              questionOptions: 1,
              questionCorrectAnswer: 1,
              explanationText: 1,
              questionDifficulty: 1,
              questionTopicArea: 1,
              questionTopic: 1,
              testedConcepts: 1,
              questionMisconceptions: 1,
              averageTime: 1,
              prerequisiteTopics: 1,
              gradeLevel: 1,
              _id: 1
          })
          .limit(20)
          .lean();  // Add .lean() for better performance

      if (!questions.length) {
          return res.status(404).json({ message: "No questions found" });
      }

      // Transform options to ensure proper casing
      const transformedQuestions = questions.map(q => ({
          ...q,
          questionOptions: {
              optionA: q.questionOptions.optionA,
              optionB: q.questionOptions.optionB,
              optionC: q.questionOptions.optionC,
              optionD: q.questionOptions.optionD
          }
      }));

      res.json(transformedQuestions);
  } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ 
          message: "Server error",
          error: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
  }
});



// Save test responses route
router.post('/save-arithmetic-response', async (req, res) => {
  try {
      const { userEmail, userName, responses } = req.body;
      
      const newResponse = new ArithmeticResponse({
          userEmail,
          userName,
          responses: responses.map(response => ({
              questionData: {
                  questionText: response.questionData.questionText,
                  questionOptions: response.questionData.questionOptions,
                  questionCorrectAnswer: response.questionData.questionCorrectAnswer,
                  explanationText: response.questionData.explanationText,
                  questionDifficulty: response.questionData.questionDifficulty,
                  questionTopicArea: response.questionData.questionTopicArea,
                  questionTopic: response.questionData.questionTopic,
                  testedConcepts: response.questionData.testedConcepts,
                  questionMisconceptions: response.questionData.questionMisconceptions,
                  averageTime: response.questionData.averageTime,
                  prerequisiteTopics: response.questionData.prerequisiteTopics,
                  gradeLevel: response.questionData.gradeLevel
              },
              userAnswer: response.userAnswer,
              timeSpent: response.timeSpent
          }))
      });

      const savedResponse = await newResponse.save();
      res.status(201).json(savedResponse);
  } catch (error) {
      res.status(400).json({ 
          message: error.message,
          details: error.errors // This will show validation errors
      });
  }
});


// ===========================================
// STATISTICS ROUTES (Following Math Pattern)
// ===========================================



router.get('/iitm-ct-questions', async (req, res) => {
  try {
    const { topic } = req.query;

    
    // Find all questions matching the given topic
    const questions = await iitm_ct_questions.find({ topic });

    if (!questions || questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No questions found for topic: ${topic}`
      });
    }

    res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });
  } catch (error) {
    console.error('❌ Error fetching questions by topic:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching questions',
      error: error.message
    });
  }
});

// POST CT Quiz Scores
router.post('/iitm_ct_scores', async (req, res) => {
  try {
    const { email, username, quizData } = req.body;
    if (!email || !username || !quizData) {
      return res.status(400).json({ error: 'Email, username, and quizData are required' });
    }

    const completedQuestionIds = quizData.questionResults?.map(r => r.questionId).filter(Boolean) || [];

    let user = await iitm_ct_scores.findOne({ email });

    if (!user) {
      user = new iitm_ct_scores({
        username,
        email,
        completedQuestionIds,
        quizScores: [quizData]
      });
    } else {
      user.username = username;
      user.quizScores.push(quizData);

      const newCompleted = completedQuestionIds.filter(
        id => !user.completedQuestionIds.includes(id)
      );
      user.completedQuestionIds.push(...newCompleted);
    }

    await user.save();

    res.status(201).json({
      message: 'CT quiz result saved successfully',
      completedQuestionsCount: user.completedQuestionIds.length,
      user
    });

  } catch (error) {
    console.error('❌ Error saving CT quiz result:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});



// GET: /api/iitm_ct_scores/:email
router.get('/iitm_ct_scores/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await iitm_ct_scores.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User quiz history fetched successfully',
      totalAttempts: user.quizScores.length,
      user
    });
  } catch (error) {
    console.error('Error fetching user CT scores:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});


// GET CT Scores
router.get('/iitm_ct_scores', async (req, res) => {
  try {
    const { email, topic } = req.query;

    if (email) {
      const user = await iitm_ct_scores.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (topic) {
        const filteredScores = {
          ...user.toObject(),
          quizScores: user.quizScores.filter(score => score.topic === topic)
        };
        return res.json({ success: true, data: filteredScores });
      }

      res.json({ success: true, data: user });
    } else {
      const users = await iitm_ct_scores.find({});
      res.json({ success: true, data: users });
    }
  } catch (error) {
    console.error('Error fetching CT scores:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET CT Topics
router.get('/ct-topics', async (req, res) => {
  try {
    const topics = await iitm_ct_questions.distinct('topic');
    res.status(200).json(topics);
  } catch (error) {
    console.error('Error fetching CT topics:', error);
    res.status(500).json({ error: 'Failed to fetch CT topics' });
  }
});

// GET User CT Progress
router.get('/user-ct-progress/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { topic } = req.query;
    
    const user = await iitm_ct_scores.findOne({ email });
    const filter = topic ? { topic } : {};
    const totalQuestions = await iitm_ct_questions.countDocuments(filter);
    
    const completedCount = user?.completedQuestionIds?.length || 0;
    const remainingCount = totalQuestions - completedCount;
    
    res.json({
      email,
      totalQuestions,
      completedCount,
      remainingCount,
      completionPercentage: Math.round((completedCount / totalQuestions) * 100),
      canTakeQuiz: remainingCount > 0
    });
    
  } catch (error) {
    console.error('Error fetching user CT progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST Reset CT Progress
router.post('/reset-ct-progress', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const user = await iitm_ct_scores.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.completedQuestionIds = [];
    await user.save();
    
    res.status(200).json({ 
      message: 'CT progress reset successfully',
      email: email
    });
    
  } catch (error) {
    console.error('Error resetting CT progress:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});



router.get('/iitm-stats-questions/:topic', async (req, res) => {
  try {
    const { topic } = req.params;
    const { email, count = 50 } = req.query;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    if (!topic) {
      return res.status(400).json({
        error: 'Topic is required'
      });
    }

    // Get all questions for the topic (NO FILTERING by completed questions)
    let allQuestions = await Statistics_questions.find({
      topic: topic
    }).lean();

    console.log(`📊 Found ${allQuestions.length} total questions for topic: ${topic}`);
    
    // Check if we have enough questions in the pool
    const totalQuestionsInPool = allQuestions.length;
    
    if (totalQuestionsInPool < 50) {
      console.warn(`⚠️ WARNING: Only ${totalQuestionsInPool} questions in pool for ${topic}, requested ${count}`);
    }

    // Enhanced shuffle for better randomness
    const shuffle = arr => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

    const withPoints = (qs, pts) => qs.map(q => ({ ...q, points: pts }))

    const easy   = shuffle(allQuestions.filter(q => q.difficulty?.toLowerCase() === 'easy'))
    const medium = shuffle(allQuestions.filter(q => q.difficulty?.toLowerCase() === 'medium'))
    const hard   = shuffle(allQuestions.filter(q => q.difficulty?.toLowerCase() === 'hard'))

    const selectedQuestions = shuffle([
    ...withPoints(easy.slice(0, 10), 1),
    ...withPoints(medium.slice(0, 10), 2),
    ...withPoints(hard.slice(0, 5), 4),
  ])
// 10 easy(×1) + 10 medium(×2) + 5 hard(×4) = 25 questions, 50 points
    
    // Optional: Sort by question_number for consistent display
   

    console.log(`✅ Returning ${selectedQuestions.length} random questions for ${topic} to ${email}`);

    res.json({
      questions: selectedQuestions,
      metadata: {
        totalQuestionsInPool: totalQuestionsInPool,
        selectedCount: selectedQuestions.length,
        requestedCount: parseInt(count),
        topic: topic,
        isRandom: true, // Indicate this is pure random selection
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ Error fetching ${req.params.topic} questions:`, error);
    res.status(500).json({ 
      error: `Failed to fetch ${req.params.topic} questions`,
      details: error.message 
    });
  }
});


// POST Statistics Quiz Scores
router.post('/statistics_scores', async (req, res) => {
  try {
    const { email, username, quizData } = req.body;
    
    console.log('Received statistics score request:', { email, username, topic: quizData?.topic });
    
    if (!email || !username || !quizData) {
      return res.status(400).json({ error: 'Email, username and quizData are required' });
    }
    
    // Extract question IDs from the quiz results
    const completedQuestionIds = quizData.questionResults
      ? quizData.questionResults.map(result => result.questionId).filter(Boolean)
      : [];
    
    console.log(`Statistics quiz completed with ${completedQuestionIds.length} question IDs`);
    
    // Find existing user or create new one
    let user = await Statistics_scores.findOne({ email });
    
    if (!user) {
      // Create new user with completed questions and score
      user = new Statistics_scores({ 
        username, 
        email, 
        completedQuestionIds: completedQuestionIds,
        quizScores: [quizData]
      });
    } else {
      // Update existing user
      user.username = username;
      user.quizScores.push(quizData);
      
      // Add new completed questions to the array (avoid duplicates)
      const newCompletedIds = completedQuestionIds.filter(
        id => !user.completedQuestionIds.includes(id)
      );
      user.completedQuestionIds.push(...newCompletedIds);
      
      console.log(`Added ${newCompletedIds.length} new completed questions. Total: ${user.completedQuestionIds.length}`);
    }
    
    await user.save();
    
    res.status(201).json({ 
      message: 'Statistics quiz result saved successfully', 
      completedQuestionsCount: user.completedQuestionIds.length,
      user 
    });
    
  } catch (error) {
    console.error('Error saving statistics quiz result:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// GET Statistics Scores
router.get('/statistics_scores', async (req, res) => {
  try {
    const { email, topic } = req.query;

    if (email) {
      // Get specific user
      const user = await Statistics_scores.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // If topic is specified, filter scores by topic
      if (topic) {
        const filteredScores = {
          ...user.toObject(),
          quizScores: user.quizScores.filter(score => score.topic === topic)
        };
        return res.json({ success: true, data: filteredScores });
      }

      res.json({ success: true, data: user });
    } else {
      // Get all users
      const users = await Statistics_scores.find({});
      res.json({ success: true, data: users });
    }
  } catch (error) {
    console.error('Error fetching statistics scores:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET Statistics Topics (Helper route)
router.get('/statistics-topics', async (req, res) => {
  try {
    const topics = await Statistics_questions.distinct('topic');
    res.status(200).json(topics);
  } catch (error) {
    console.error('Error fetching statistics topics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics topics' });
  }
});

// NEW: Missing cheating log endpoint
router.post('/log-cheating', async (req, res) => {
  try {
    const { username, email, cheatingType, timestamp, currentQuestion } = req.body;
    
    console.warn(`CHEATING ATTEMPT DETECTED:`, {
      username,
      email,
      type: cheatingType,
      timestamp,
      currentQuestion,
      ip: req.ip || req.connection.remoteAddress
    });
    
    res.status(200).json({ message: 'Cheating attempt logged' });
  } catch (error) {
    console.error('Error logging cheating attempt:', error);
    res.status(500).json({ error: 'Failed to log cheating attempt' });
  }
});



router.get('/iitmmath_scores', async (req, res) => {
  try {
    console.log('Fetching math scores...');
    const { email } = req.query;

    if (email) {
      const user = await iitm_math_score.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, data: user });
    } else {
      // Compute totalTime from questionResults but don't return the heavy array
      const users = await iitm_math_score.aggregate([
        { $addFields: {
          quizScores: {
            $map: {
              input: '$quizScores',
              as: 'quiz',
              in: {
                topic:          '$$quiz.topic',
                percentage:     '$$quiz.percentage',
                score:          '$$quiz.score',
                totalQuestions: '$$quiz.totalQuestions',
                correctAnswers: '$$quiz.correctAnswers',
                attemptNumber:  '$$quiz.attemptNumber',
                timestamp:      '$$quiz.timestamp',
                totalTime: {
                  $cond: [
                    { $gt: [{ $ifNull: ['$$quiz.totalTime', 0] }, 0] },
                    '$$quiz.totalTime',
                    { $sum: '$$quiz.questionResults.timeTaken' }
                  ]
                }
              }
            }
          }
        }}
      ]);
      res.json({ success: true, data: users });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deep exam analysis: single quiz attempt enriched with question metadata
router.get('/iitmmath_exam_detail', async (req, res) => {
  try {
    const { email, topic, attemptNumber } = req.query;
    if (!email || !topic || !attemptNumber) {
      return res.status(400).json({ success: false, message: 'email, topic, and attemptNumber are required' });
    }

    const user = await iitm_math_score.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Find the exact attempt
    const attempt = user.quizScores.find(
      q => q.topic === topic && String(q.attemptNumber) === String(attemptNumber)
    );
    if (!attempt) return res.status(404).json({ success: false, message: 'Exam attempt not found' });

    // Collect questionIds from this attempt
    const questionIds = (attempt.questionResults || [])
      .map(r => r.questionId)
      .filter(Boolean);

    // Fetch metadata for all those questions in one query
    const questionMeta = await IITMathQuestion.find({ _id: { $in: questionIds } }).lean();
    const metaMap = {};
    questionMeta.forEach(q => { metaMap[String(q._id)] = q; });

    // Enrich each question result
    const enrichedResults = (attempt.questionResults || []).map(r => {
      const meta = metaMap[String(r.questionId)] || {};
      return {
        questionId:     r.questionId,
        questionNumber: r.questionNumber,
        questionText:   r.questionText || meta.question_text || '',
        userAnswer:     r.userAnswer,
        correctAnswer:  r.correctAnswer || meta.correct_answer,
        isCorrect:      r.isCorrect,
        timeTaken:      r.timeTaken || 0,
        // from question metadata
        difficulty:     meta.difficulty || null,
        type:           meta.type || null,
        options:        meta.options || [],
        explanation:    meta.explanation || null,
        points:         meta.points || 1,
        format_hint:    meta.format_hint || null,
      };
    });

    // Compute difficulty breakdown
    const difficultyStats = { easy: { total: 0, correct: 0 }, medium: { total: 0, correct: 0 }, hard: { total: 0, correct: 0 }, unknown: { total: 0, correct: 0 } };
    enrichedResults.forEach(r => {
      const d = r.difficulty || 'unknown';
      difficultyStats[d].total++;
      if (r.isCorrect) difficultyStats[d].correct++;
    });

    // Compute type breakdown
    const typeStats = {};
    enrichedResults.forEach(r => {
      const t = r.type || 'unknown';
      if (!typeStats[t]) typeStats[t] = { total: 0, correct: 0 };
      typeStats[t].total++;
      if (r.isCorrect) typeStats[t].correct++;
    });

    // Time stats
    const times = enrichedResults.map(r => r.timeTaken).filter(t => t > 0);
    const avgTime = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    const maxTime = times.length ? Math.max(...times) : 0;
    const totalTime = times.reduce((a, b) => a + b, 0);

    res.json({
      success: true,
      data: {
        student: { username: user.username, email: user.email },
        attempt: {
          topic:          attempt.topic,
          attemptNumber:  attempt.attemptNumber,
          timestamp:      attempt.timestamp,
          score:          attempt.score,
          totalQuestions: attempt.totalQuestions,
          correctAnswers: attempt.correctAnswers,
          percentage:     attempt.percentage,
        },
        enrichedResults,
        insights: {
          difficultyStats,
          typeStats,
          avgTimeSec: avgTime,
          maxTimeSec: maxTime,
          totalTimeSec: totalTime,
          hardestQuestions: enrichedResults
            .filter(r => !r.isCorrect && r.difficulty === 'hard')
            .map(r => ({ questionNumber: r.questionNumber, questionText: r.questionText, explanation: r.explanation })),
          slowestQuestions: [...enrichedResults]
            .sort((a, b) => b.timeTaken - a.timeTaken)
            .slice(0, 3)
            .map(r => ({ questionNumber: r.questionNumber, questionText: r.questionText, timeTaken: r.timeTaken, isCorrect: r.isCorrect })),
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test route to check what's in your database
router.get('/api/test-iitm-questions', async (req, res) => {
  try {
    const count = await IITMathQuestion.countDocuments();
    const topics = await IITMathQuestion.distinct('topic');
    const sampleQuestions = await IITMathQuestion.find().limit(3);
    
    res.json({ 
      totalQuestions: count,
      availableTopics: topics,
      sampleQuestions: sampleQuestions
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: error.message });
  }
});


router.get('/iitm-math-questions/:topic', async (req, res) => {
  try {
    const { topic } = req.params;
    const { email, count = 50 } = req.query;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    if (!topic) {
      return res.status(400).json({
        error: 'Topic is required'
      });
    }

    // Get all questions for the topic (NO FILTERING by completed questions)
    let allQuestions = await IITMathQuestion.find({
      topic: topic
    }).lean();


    console.log(`📊 Found ${allQuestions.length} total questions for topic: ${topic}`);
    
    // Check if we have enough questions in the pool
    const totalQuestionsInPool = allQuestions.length;
    
    if (totalQuestionsInPool < 50) {
      console.warn(`⚠️ WARNING: Only ${totalQuestionsInPool} questions in pool for ${topic}, requested ${count}`);
      // You might want to alert the admin about this
    }

    // Enhanced shuffle for better randomness
      const shuffle = arr => {
      const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };

      const easy   = shuffle(allQuestions.filter(q => q.difficulty?.toLowerCase() === 'easy'));
      const medium = shuffle(allQuestions.filter(q => q.difficulty?.toLowerCase() === 'medium'));
      const hard   = shuffle(allQuestions.filter(q => q.difficulty?.toLowerCase() === 'hard'));

    const withPoints = (qs, pts) => qs.map(q => ({ ...q, points: pts }))

    const selectedQuestions = shuffle([
      ...withPoints(easy.slice(0, 10), 1),   // 10 × 1 = 10 pts
      ...withPoints(medium.slice(0, 10), 2), // 10 × 2 = 20 pts
      ...withPoints(hard.slice(0, 5), 4),    //  5 × 4 = 20 pts
    ]);
// Total: 25 questions, 50 points ✓
    
    // Optional: Sort by question_number for consistent display
    

    console.log(`✅ Returning ${selectedQuestions.length} random questions for ${topic} to ${email}`);

    res.json({
      questions: selectedQuestions,
      metadata: {
        totalQuestionsInPool: totalQuestionsInPool,
        selectedCount: selectedQuestions.length,
        requestedCount: parseInt(count),
        topic: topic,
        isRandom: true, // Indicate this is pure random selection
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ Error fetching ${req.params.topic} questions:`, error);
    res.status(500).json({ 
      error: `Failed to fetch ${req.params.topic} questions`,
      details: error.message 
    });
  }
});


router.post('/iitmmath_scores', async (req, res) => {
  try {
    const { email, username, quizData } = req.body;
    
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    
    if (!email || !username || !quizData) {
      return res.status(400).json({ error: 'Email, username and quizData are required' });
    }

    // Compute totalTime from questionResults if not already set
    if (!quizData.totalTime && quizData.questionResults) {
      quizData.totalTime = quizData.questionResults.reduce((sum, r) => sum + (r.timeTaken || 0), 0)
    }

    // Extract question IDs from the quiz results
    const completedQuestionIds = quizData.questionResults
      ? quizData.questionResults.map(result => result.questionId).filter(Boolean)
      : [];

    console.log(`Quiz completed with ${completedQuestionIds.length} question IDs:`, completedQuestionIds);
    
    // FIXED: Use iitm_math_score instead of Statistics_score
    let user = await iitm_math_score.findOne({ email });
    
    if (!user) {
      // Create new user with completed questions and score
      user = new iitm_math_score({ 
        username, 
        email, 
        completedQuestionIds: completedQuestionIds,
        quizScores: [quizData] // Use quizScores to match your iitm schema
      });
    } else {
      user.username = username;
      user.quizScores.push(quizData); // Use quizScores to match your iitm schema
      
      // Add new completed questions to the array (avoid duplicates)
      const newCompletedIds = completedQuestionIds.filter(
        id => !user.completedQuestionIds.includes(id)
      );
      user.completedQuestionIds.push(...newCompletedIds);
      
      console.log(`Added ${newCompletedIds.length} new completed questions. Total: ${user.completedQuestionIds.length}`);
    }
    
    await user.save();
    
    res.status(201).json({ 
      message: 'Quiz result saved successfully', 
      completedQuestionsCount: user.completedQuestionIds.length,
      user 
    });
    
  } catch (error) {
    console.error('Error saving quiz result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/get-question-explanations', async (req, res) => {
  try {
    const { questionIds } = req.body

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.json({ success: false, message: 'Question IDs array is required' })
    }

    const objectIds = questionIds.filter(id => /^[a-f0-9]{24}$/i.test(id))
    const numbers   = questionIds.map(Number).filter(n => !isNaN(n))

    const questions = await IITMathQuestion.find({  // ← replace with your model name
      $or: [
        ...(objectIds.length ? [{ _id: { $in: objectIds } }] : []),
        ...(numbers.length   ? [{ question_number: { $in: numbers } }] : []),
      ]
    }).lean()

    const explanationMap = {}
    questions.forEach(q => {
      const entry = {
        explanation:   q.explanation    || '',
        difficulty:    q.difficulty     || '',
        points:        q.points         || 1,
        questionType:  q.type           || '',
        options:       q.options        || [],
        topic:         q.topic          || '',
        correctAnswer: q.correct_answer || '',
        questionText:  q.question_text  || '',
      }
      if (q._id)             explanationMap[q._id.toString()]          = entry
      if (q.question_number) explanationMap[String(q.question_number)] = entry
    })

    res.json({ success: true, explanationMap })

  } catch (error) {
    console.error('Error fetching explanations:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch explanations' })
  }
})

// fetching users' predaignostic data

router.get('/arithmetic_responses', async (req, res) => {
  try {
    const userEmail = req.query.email;
    const returnAll = req.query.all === 'true';

    if (!userEmail) {
      return res.status(400).json({ message: "Email parameter is required" });
    }

    const results = await ArithmeticResponse.find({ userEmail })
      .sort({ testDate: -1 })
      .lean();

    if (!results.length) {
      return res.status(404).json({ message: "No test results found for this user" });
    }

    if (returnAll) {
      // Process all attempts
      const allAttempts = results.map(result => ({
        _id: result._id,
        testDate: result.testDate,
        totalQuestions: result.responses.length,
        correctAnswers: result.responses.filter(r => 
          r.userAnswer === r.questionData.questionCorrectAnswer
        ).length,
        timeSpent: result.responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0)
      }));
      return res.json(allAttempts);
    }

    // Process single (latest) attempt
    const latestResult = results[0];
    const processedResult = {
      testDate: latestResult.testDate,
      totalQuestions: latestResult.responses.length,
      correctAnswers: latestResult.responses.filter(r => 
        r.userAnswer === r.questionData.questionCorrectAnswer
      ).length,
      timeSpent: latestResult.responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0),
      details: latestResult.responses.map(r => ({
        questionOptions: r.questionData.questionOptions,
        question: r.questionData.questionText,
        userAnswer: r.userAnswer,
        correctAnswer: r.questionData.questionCorrectAnswer,
        timeSpent: r.timeSpent,
        explanation: r.questionData.explanationText,
        difficulty: r.questionData.questionDifficulty,
        topic: r.questionData.questionTopic,
        testedConcepts: r.questionData.testedConcepts,
        prerequisiteTopics: r.questionData.prerequisiteTopics
      }))
    };

    res.json(processedResult);
  } catch (error) {
    res.status(500).json({ 
      message: "Server error",
      error: error.message
    });
  }
});

// Get questions by operation type (GET)
router.get('/arithmeticQuestionsDatabase', async (req, res) => {
  try {
    const questions = await ArithmeticQuestion.find({
        operationType: req.query.operationType
    }).select('questionText options correctOption explanation difficultyLevel arithmeticCategory coreSkills commonErrors foundationalRequirements gradeLevel');
    
    res.json({ questions });
} catch (error) {
    res.status(500).json({ error: error.message });
}
});


// Store arithmetic score
router.post('/arithmetic-scores', async (req, res) => {
  try {
    const scoreData = {
        userEmail: req.body.userEmail,
        username: req.body.username,
        operationType: req.body.operationType,
        $inc: {
            totalQuestions: req.body.totalQuestions,
            correctAnswers: req.body.correctAnswers
        },
        $push: {
            questionsAttempted: {
                $each: req.body.questionsAttempted
            }
        },
        timeTaken: req.body.timeTaken,
        $setOnInsert: {
            weaknesses: [],
            createdAt: new Date()
        }
    };

    const updatedScore = await ArithmeticScore.findOneAndUpdate(
        { 
            userEmail: req.body.userEmail,
            operationType: req.body.operationType 
        },
        scoreData,
        { 
            upsert: true,
            new: true,
            setDefaultsOnInsert: true 
        }
    );

    res.status(200).json(updatedScore);
} catch (error) {
    res.status(500).json({ error: error.message });
}
});

// Get scores for user and operation type
router.get('/arithmetic-scores', async (req, res) => {
  try {
    const scores = await ArithmeticScore.findOne({
        userEmail: req.query.userEmail,
        operationType: req.query.operationType
    }).populate({
        path: 'questionsAttempted.questionId',
        select: 'questionText options correctOption explanation'
    });

    res.json(scores || {
        questionsAttempted: [],
        totalQuestions: 0,
        correctAnswers: 0,
        timeTaken: 0
    });
} catch (error) {
    res.status(500).json({ error: error.message });
}
});

// fetching users' predaignostic data

router.get('/testresponses', async (req, res) => {
  try {
    const userEmail = req.query.email;
    const returnAll = req.query.all === 'true';

    if (!userEmail) {
      return res.status(400).json({ message: "Email parameter is required" });
    }

    const results = await ArithmeticResponse.find({ userEmail })
      .sort({ testDate: -1 })
      .lean();

    if (!results.length) {
      return res.status(404).json({ message: "No test results found for this user" });
    }

    if (returnAll) {
      // Process all attempts
      const allAttempts = results.map(result => ({
        _id: result._id,
        testDate: result.testDate,
        totalQuestions: result.responses.length,
        correctAnswers: result.responses.filter(r => 
          r.userAnswer === r.questionData.questionCorrectAnswer
        ).length,
        timeSpent: result.responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0)
      }));
      return res.json(allAttempts);
    }

    // Process single (latest) attempt
    const latestResult = results[0];
    const processedResult = {
      testDate: latestResult.testDate,
      totalQuestions: latestResult.responses.length,
      correctAnswers: latestResult.responses.filter(r => 
        r.userAnswer === r.questionData.questionCorrectAnswer
      ).length,
      timeSpent: latestResult.responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0),
      details: latestResult.responses.map(r => ({
        questionOptions: r.questionData.questionOptions,
        question: r.questionData.questionText,
        userAnswer: r.userAnswer,
        correctAnswer: r.questionData.questionCorrectAnswer,
        timeSpent: r.timeSpent,
        explanation: r.questionData.explanationText,
        difficulty: r.questionData.questionDifficulty,
        topic: r.questionData.questionTopic,
        testedConcepts: r.questionData.testedConcepts,
        prerequisiteTopics: r.questionData.prerequisiteTopics
      }))
    };

    res.json(processedResult);
  } catch (error) {
    res.status(500).json({ 
      message: "Server error",
      error: error.message
    });
  }
});

// Add endpoint to reset user's completed questions (optional)
router.post('/reset-user-progress', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // FIXED: Use iitm_math_score instead of Statistics_score
    const user = await iitm_math_score.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.completedQuestionIds = [];
    await user.save();
    
    res.status(200).json({ 
      message: 'User progress reset successfully',
      email: email
    });
    
  } catch (error) {
    console.error('Error resetting user progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add endpoint to get user's question progress
router.get('/user-question-progress/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // FIXED: Use iitm_math_score instead of Statistics_score
    const user = await iitm_math_score.findOne({ email });
    const totalQuestions = await IITMathQuestion.countDocuments({ topic: "quadratic_functions" });
    
    const completedCount = user?.completedQuestionIds?.length || 0;
    const remainingCount = totalQuestions - completedCount;
    
    res.json({
      email,
      totalQuestions,
      completedCount,
      remainingCount,
      completionPercentage: Math.round((completedCount / totalQuestions) * 100),
      canTakeQuiz: remainingCount > 0
    });
    
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===========================================
// PHYSICS ROUTES
// ===========================================

// GET Physics Questions
router.get('/physics_questions', async (req, res) => {
  try {
    const { topic, question_type, question_number } = req.query;
    let filter = {};

    if (topic) filter.physics_topic = topic;
    if (question_type) filter.question_type = question_type;
    if (question_number) filter.question_number = parseInt(question_number);

    const questions = await PhysicsQuestion.find(filter);
    res.status(200).json(questions);
  } catch (error) {
    console.error('Error fetching physics questions:', error);
    res.status(500).json({ error: 'Failed to fetch physics questions' });
  }
});

// POST Physics Quiz Scores

router.post('/physics_scores', async (req, res) => {
  try {
    const { 
      username, 
      email, 
      score, 
      totalQuestions, 
      percentage, 
      topic, 
      answers, 
      questionResults,
      correctAnswers,
      totalTimeTaken,
      isCompleted
    } = req.body;

    // Validation
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    if (!totalQuestions || totalQuestions <= 0) {
      return res.status(400).json({ error: 'Invalid total questions count' });
    }

    // Since all questions now have physics_topic: "kinematics"
    const mainPhysicsTopic = 'kinematics';

    // Find existing user or create new one
    let userScore = await PhysicsUserScore.findOne({ email });

    const topicScoreData = {
      physics_topic: mainPhysicsTopic, // Now consistently "kinematics"
      sub_topic: topic || 'mixed_problems',
      total_questions: totalQuestions,
      questions_attempted: totalQuestions,
      questions_correct: correctAnswers || score || 0,
      percentage_score: percentage || 0,
      total_time_spent: totalTimeTaken || 0,
      average_time_per_question: totalQuestions > 0 ? (totalTimeTaken || 0) / totalQuestions : 0,
      difficulty_performance: {
        easy: { attempted: 0, correct: 0, percentage: 0 },
        medium: { attempted: totalQuestions, correct: correctAnswers || score || 0, percentage: percentage || 0 },
        hard: { attempted: 0, correct: 0, percentage: 0 },
        very_hard: { attempted: 0, correct: 0, percentage: 0 }
      },
      question_results: (questionResults || []).map(result => ({
        question_id: `physics_q_${result.questionNumber}`,
        question_number: result.questionNumber,
        question_text: result.questionText || '',
        question_type: result.questionType || 'mixed',
        physics_topic: 'kinematics', // All questions are kinematics now
        user_answer: result.userAnswer || '',
        correct_answer: result.correctAnswer || '',
        is_correct: result.isCorrect || false,
        sub_question_results: [],
        parts_correct: result.isCorrect ? 1 : 0,
        total_parts: 1,
        time_taken: result.timeTaken || 0,
        attempts_made: 1,
        timestamp: new Date()
      })),
      attempt_number: 1,
      session_id: `session_${Date.now()}`,
      timestamp: new Date()
    };

    if (!userScore) {
      // Create new user
      userScore = new PhysicsUserScore({
        user_id: email,
        username,
        email,
        total_questions_attempted: totalQuestions,
        total_questions_correct: correctAnswers || score || 0,
        overall_percentage: percentage || 0,
        total_study_time: Math.round((totalTimeTaken || 0) / 60),
        completed_question_ids: [],
        bookmarked_question_ids: [],
        flagged_for_review: [],
        topic_scores: [topicScoreData]
      });
    } else {
      // Update existing user
      userScore.username = username;
      userScore.total_questions_attempted += totalQuestions;
      userScore.total_questions_correct += correctAnswers || score || 0;
      userScore.overall_percentage = userScore.total_questions_attempted > 0 
        ? Math.round((userScore.total_questions_correct / userScore.total_questions_attempted) * 100)
        : 0;
      userScore.total_study_time += Math.round((totalTimeTaken || 0) / 60);
      
      // Update attempt number for kinematics topic
      const existingAttempts = userScore.topic_scores.filter(t => t.physics_topic === 'kinematics').length;
      topicScoreData.attempt_number = existingAttempts + 1;
      
      userScore.topic_scores.push(topicScoreData);
    }

    await userScore.save();
    
    res.status(201).json({ 
      message: 'Physics quiz score saved successfully',
      success: true,
      data: userScore
    });

  } catch (error) {
    console.error('Error saving physics score:', error);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      res.status(400).json({ 
        error: 'Validation failed',
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message
      });
    }
  }
});

// GET Physics Scores

router.get('/physics_scores', async (req, res) => {
  try {
    const { email, topic } = req.query;

    if (email) {
      // Get specific user
      const userScore = await PhysicsUserScore.findOne({ email });
      if (!userScore) {
        return res.status(200).json({ 
          message: 'No data found for user',
          success: false 
        });
      }

      if (topic) {
        // Filter by topic - since all questions are kinematics
        const topicScores = userScore.topic_scores.filter(t => 
          t.physics_topic === 'kinematics'
        );
        
        return res.status(200).json({
          success: true,
          ...userScore.toObject(),
          topic_scores: topicScores
        });
      }

      res.status(200).json({
        success: true,
        ...userScore.toObject()
      });
    } else {
      // Get all users
      const allScores = await PhysicsUserScore.find({});
      res.status(200).json({
        success: true,
        data: allScores
      });
    }
  } catch (error) {
    console.error('Error fetching physics scores:', error);
    res.status(500).json({ 
      error: 'Failed to fetch physics scores',
      success: false 
    });
  }
});

// GET Physics Topics (for filtering)

router.get('/physics_topics', async (req, res) => {
  try {
    // Since all questions are kinematics now
    const topics = ['kinematics'];
    res.status(200).json(topics);
  } catch (error) {
    console.error('Error fetching physics topics:', error);
    res.status(500).json({ error: 'Failed to fetch physics topics' });
  }
});

router.get("/iitm_math2_questions", async (req, res) => {
  try {
    const { week, subtopic } = req.query;
    const filter = {};

    if (week) filter.week = Number(week);
    if (subtopic) filter.subtopic = subtopic;

    const questions = await IITM_Maths_2_Question.find(filter);

    if (questions.length === 0) {
      return res.status(404).json({ message: "No questions found for the given criteria" });
    }

    res.status(200).json(questions);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

router.post("/iitm_math2_scores", async (req, res) => {
  try {
    const { email, name, week, subtopic, totalQuestions, correctAnswers, score, responses } = req.body;
    if (!email || !name || !week || !subtopic || !responses)
      return res.status(400).json({ message: "Missing required fields" });
    
    let user = await IITM_Maths_2_Score.findOne({ email });
    const newEntry = { week, subtopic, totalQuestions, correctAnswers, score, responses };
    if (user) {
      user.scores.push(newEntry);
      await user.save();
    } else {
      user = new IITM_Maths_2_Score({ email, name, scores: [newEntry] });
      await user.save();
    }
    res.status(201).json({ message: "Score and responses saved successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/iitm_math2_scores", async (req, res) => {
  try {
    const { email, week } = req.query;

    // Case 1: No filters — return all user scores
    if (!email && !week) {
      const allScores = await IITM_Maths_2_Score.find().lean();
      if (!allScores.length)
        return res.status(404).json({ message: "No scores found" });
      return res.status(200).json(allScores);
    }

    // Case 2: Filter by email only
    if (email && !week) {
      const user = await IITM_Maths_2_Score.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.status(200).json(user);
    }

    // Case 3: Filter by week only (across all users)
    if (week && !email) {
      const all = await IITM_Maths_2_Score.find({ "scores.week": Number(week) });
      if (!all.length)
        return res
          .status(404)
          .json({ message: "No scores found for the given week" });

      // Flatten week-specific entries
      const weekData = all.map((u) => ({
        email: u.email,
        name: u.name,
        scores: u.scores.filter((s) => s.week === Number(week)),
      }));

      return res.status(200).json(weekData);
    }

    // Case 4: Filter by both email & week
    if (email && week) {
      const user = await IITM_Maths_2_Score.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      const weekScores = user.scores.filter((s) => s.week === Number(week));
      if (!weekScores.length)
        return res
          .status(404)
          .json({ message: "No scores found for this week for the user" });

      return res.status(200).json({ email: user.email, name: user.name, scores: weekScores });
    }
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});



// statistics - II 



router.get('/iitm_stats2_questions_databases', async (req, res) => {
  try {
    const { week, email, count = 25, difficulty, type, topic } = req.query;


    if (!week || !email) {
      return res.status(400).json({
        error: 'week and email are required',
        example: '/math2/questions?week=7&email=user@example.com&count=10'
      });
    }


    const weekNum = parseInt(week);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 12) {
      return res.status(400).json({ error: 'week must be between 1 and 12' });
    }


    const filter = {
      week:      weekNum,
      is_active: true
    };
    if (difficulty) filter.difficulty = difficulty;
    if (type)       filter.type       = type;
    if (topic)      filter.topic      = topic;


    let pool = await IITStats2Question.find(filter).lean();


    if (pool.length === 0) {
      return res.status(404).json({ error: 'No questions found for this week' });
    }


    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }


    const requestedCount = Math.min(parseInt(count), pool.length);
    const selected = pool.slice(0, requestedCount);


    return res.status(200).json({
      questions: selected,
      metadata: {
        week:      weekNum,
        pool_size: pool.length,
        returned:  selected.length,
        requested: requestedCount
      }
    });


  } catch (error) {
    console.error('❌ Error fetching questions:', error);
    return res.status(500).json({ error: 'Failed to fetch questions', details: error.message });
  }
});









router.post('/iitm_stats2_quiz_attempt', async (req, res) => {
  try {
    const { email, username, quizData } = req.body;


    if (!email || !quizData) {
      return res.status(400).json({ error: 'email and quizData are required' });
    }


    const {
      week,
      topic,
      score,
      maxPossibleScore,
      percentage,
      totalQuestions,
      correctAnswers,
      difficultyBreakdown,
      questionResults,
      startTime,
      endTime,
      totalTimeTaken,
      cheatCount
    } = quizData;


    // ── 1. Save attempt summary ────────────────────────────────────
    const attempt = await QuizAttemptstats2.create({
      email,
      username:           username || email,
      week:               Number(week) || 1,
      topic:              topic    || '',
      score:              score    ?? 0,
      max_possible_score: maxPossibleScore ?? 0,
      percentage:         Math.round(percentage ?? 0),
      total_questions:    totalQuestions ?? 0,
      correct_answers:    correctAnswers ?? 0,


      easy_attempted:   difficultyBreakdown?.easy?.attempted   || 0,
      easy_correct:     difficultyBreakdown?.easy?.correct     || 0,
      medium_attempted: difficultyBreakdown?.medium?.attempted || 0,
      medium_correct:   difficultyBreakdown?.medium?.correct   || 0,
      hard_attempted:   difficultyBreakdown?.hard?.attempted   || 0,
      hard_correct:     difficultyBreakdown?.hard?.correct     || 0,


      total_time_seconds: totalTimeTaken || 0,
      started_at:         startTime ? new Date(startTime) : new Date(),
      submitted_at:       endTime   ? new Date(endTime)   : new Date(),
      is_completed:       true,
      cheat_count:        cheatCount || 0
    });


    // ── 2. Save individual question results ────────────────────────
    if (Array.isArray(questionResults) && questionResults.length > 0) {
      const resultDocs = questionResults.map(qr => ({
        attempt_id:         attempt._id,
        email,
        week:               Number(week) || 1,
        question_id:        qr.questionId,
        user_answer:        qr.userAnswer      ?? null,
        is_correct:         qr.isCorrect,
        marks_awarded:      qr.marksAwarded    ?? qr.partialScore ?? 0,
        time_taken_seconds: qr.timeTaken       || 0,
        difficulty:         qr.difficulty      || 'medium',
        topic:              topic              || '',
        subtopic:           qr.subtopic        || '',
        question_type:      qr.questionType    || '',
        concept_tags:       qr.conceptTags     || [],
        bloom_level:        qr.bloomLevel      || 'apply'
      }));


      await IITStats2Scores.insertMany(resultDocs);
    }


    return res.status(201).json({
      success:    true,
      attempt_id: attempt._id,
      message:    'Quiz attempt saved successfully'
    });


  } catch (error) {
    console.error('❌ Error saving quiz attempt:', JSON.stringify(error.message));
    if (error.errors) console.error('❌ Validation errors:', JSON.stringify(error.errors, null, 2));
    return res.status(500).json({
      error:   'Failed to save quiz attempt',
      details: error.message
    });
  }
});






router.get('/iitm_stats2_scores_databases', async (req, res) => {
  try {
    const { email } = req.query;


    if (!email) {
      // Admin: group all attempts by email
      const attempts = await QuizAttemptstats2.find().lean();
      const byEmail = {}
      attempts.forEach(a => {
        if (!byEmail[a.email]) byEmail[a.email] = { email: a.email, name: a.username || a.email, scores: [] }
        byEmail[a.email].scores.push({
          week:           a.week,
          topic:          a.topic,
          subtopic:       a.topic,
          score:          a.score,
          correctAnswers: a.correct_answers,
          totalQuestions: a.total_questions,
          percentage:     a.percentage,
          dateAttempted:  a.submitted_at,
          timestamp:      a.submitted_at,
        })
      })
      return res.status(200).json(Object.values(byEmail));
    }


    // Student: return all attempts for this email formatted for Statistics2.jsx
    const attempts = await QuizAttemptstats2.find({ email }).lean();
    const quizScores = attempts.map(a => ({
      _id:            a._id,
      topic:          a.topic,
      week:           a.week,
      percentage:     a.percentage,
      score:          a.score,
      correctAnswers: a.correct_answers,
      totalQuestions: a.total_questions,
      timestamp:      a.submitted_at,
      dateAttempted:  a.submitted_at,
    }))
    return res.status(200).json({ success: true, data: { quizScores } });


  } catch (error) {
    console.error('❌ Error fetching scores:', error);
    return res.status(500).json({ error: 'Failed to fetch scores', details: error.message });
  }
});


// ── Fetch single attempt with full question results (review page) ──
router.get('/iitm_stats2_scores_databases/:attemptId', async (req, res) => {
  try {
    const { attemptId } = req.params;


    // Get attempt summary
    const attempt = await QuizAttemptstats2.findById(attemptId).lean();
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }


    // Get question results and populate full question data
    const questionResults = await IITStats2Scores.find({ attempt_id: attemptId })
      .populate({
        path:   'question_id',
        select: 'question_text options correct_answer explanation difficulty type points has_latex subtopic'
      })
      .lean();


    // Shape data for review page
    const reviewQuestions = questionResults.map(qr => ({
      // Full question content
      question_text:  qr.question_id?.question_text  || '',
      type:           qr.question_id?.type           || qr.question_type,
      difficulty:     qr.question_id?.difficulty     || qr.difficulty,
      points:         qr.question_id?.points         || 1,
      has_latex:      qr.question_id?.has_latex      || false,
      explanation:    qr.question_id?.explanation    || '',
      options:        qr.question_id?.options        || [],
      correct_answer: qr.question_id?.correct_answer,


      // What the user did
      user_answer:        qr.user_answer,
      is_correct:         qr.is_correct,
      marks_awarded:      qr.marks_awarded,
      time_taken_seconds: qr.time_taken_seconds,
      subtopic:           qr.subtopic,
      concept_tags:       qr.concept_tags,
      bloom_level:        qr.bloom_level
    }));


    return res.status(200).json({
      success: true,
      attempt: {
        _id:                attempt._id,
        week:               attempt.week,
        topic:              attempt.topic,
        score:              attempt.score,
        max_possible_score: attempt.max_possible_score,
        percentage:         attempt.percentage,
        total_questions:    attempt.total_questions,
        correct_answers:    attempt.correct_answers,
        total_time_seconds: attempt.total_time_seconds,
        submitted_at:       attempt.submitted_at,
        easy_attempted:     attempt.easy_attempted,
        easy_correct:       attempt.easy_correct,
        medium_attempted:   attempt.medium_attempted,
        medium_correct:     attempt.medium_correct,
        hard_attempted:     attempt.hard_attempted,
        hard_correct:       attempt.hard_correct
      },
      questions: reviewQuestions
    });


  } catch (error) {
    console.error('❌ Error fetching review:', error);
    return res.status(500).json({
      error:   'Failed to fetch review data',
      details: error.message
    });
  }
});






// competitive Mathematics routes 

// CHANGED: Route path updated
router.get('/competitive_math_questions', async (req, res) => {
  try {
    const { week, email, count = 10, difficulty, type, topic } = req.query;

    if (!week || !email) {
      return res.status(400).json({
        error: 'week and email are required',
        example: '/competitive_math_questions?week=7&email=user@example.com&count=10'
      });
    }

    const weekNum = parseInt(week);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 12) {
      return res.status(400).json({ error: 'week must be between 1 and 12' });
    }

    const filter = {
      week:      weekNum,
      is_active: true
    };
    if (difficulty) filter.difficulty = difficulty;
    if (type)       filter.type       = type;
    if (topic)      filter.topic      = topic;

    let pool = await competitive_MathQue.find(filter).lean();

    if (pool.length === 0) {
      return res.status(404).json({ error: 'No questions found for this week' });
    }

    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const requestedCount = Math.min(parseInt(count), pool.length);
    const selected = pool.slice(0, requestedCount);

    return res.status(200).json({
      questions: selected,
      metadata: {
        week:      weekNum,
        pool_size: pool.length,
        returned:  selected.length,
        requested: requestedCount
      }
    });

  } catch (error) {
    console.error('❌ Error fetching questions:', error);
    return res.status(500).json({ error: 'Failed to fetch questions', details: error.message });
  }
});


// CHANGED: Route path updated
router.post('/competitive_math_quiz_attempts', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, username, quizData } = req.body;
    
    console.log('📥 Received body:', JSON.stringify({ email, username }, null, 2));
    console.log('📥 quizData keys:', quizData ? Object.keys(quizData) : 'quizData is undefined');
    console.log('📥 week:', quizData?.week);
    console.log('📥 startTime:', quizData?.startTime);
    console.log('📥 endTime:', quizData?.endTime);

    if (!email || !quizData) {
      return res.status(400).json({ error: 'email and quizData are required' });
    }

    const {
      week,
      topic,
      score,
      maxPossibleScore,
      percentage,
      totalQuestions,
      correctAnswers,
      difficultyBreakdown,
      questionResults,
      startTime,
      endTime,
      totalTimeTaken,
      cheatCount
    } = quizData;

    // ── 1. Save attempt summary ────────────────────────────────────
    const [attempt] = await competitive_MathQuizAttempt.create([{
      email,
      username:           username || email,
      week:               week     || 7,
      topic:              topic    || '',
      score,
      max_possible_score: maxPossibleScore,
      percentage:         Math.round(percentage),
      total_questions:    totalQuestions,
      correct_answers:    correctAnswers,

      easy_attempted:   difficultyBreakdown?.easy?.attempted   || 0,
      easy_correct:     difficultyBreakdown?.easy?.correct     || 0,
      medium_attempted: difficultyBreakdown?.medium?.attempted || 0,
      medium_correct:   difficultyBreakdown?.medium?.correct   || 0,
      hard_attempted:   difficultyBreakdown?.hard?.attempted   || 0,
      hard_correct:     difficultyBreakdown?.hard?.correct     || 0,

      total_time_seconds: totalTimeTaken || 0,
      started_at:         new Date(startTime),
      submitted_at:       new Date(endTime),
      is_completed:       true,
      cheat_count:        cheatCount || 0
    }], { session });

    // ── 2. Save individual question results ────────────────────────
    if (Array.isArray(questionResults) && questionResults.length > 0) {

      const resultDocs = questionResults.map(qr => ({
        attempt_id:         attempt._id,
        email,
        week:               week || 7,
        question_id:        qr.questionId,
        user_answer:        qr.userAnswer      ?? null,
        is_correct:         qr.isCorrect,
        marks_awarded:      qr.marksAwarded    || 0,
        time_taken_seconds: qr.timeTaken       || 0,
        difficulty:         qr.difficulty      || 'medium',
        topic:              topic              || '',
        subtopic:           qr.subtopic        || '',
        question_type:      qr.questionType    || '',
        concept_tags:       qr.conceptTags     || [],
        bloom_level:        qr.bloomLevel      || 'apply'
      }));

      await competitive_MathResult.insertMany(resultDocs, { session });
    }

    // ── 3. Commit both writes atomically ───────────────────────────
    await session.commitTransaction();

    return res.status(201).json({
      success:    true,
      attempt_id: attempt._id,
      message:    'Quiz attempt saved successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Error saving quiz attempt:', error);
    return res.status(500).json({
      error:   'Failed to save quiz attempt',
      details: error.message
    });
  } finally {
    session.endSession();
  }
});

// CHANGED: Route path updated
router.get('/competitive_math_quiz_attempts', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const attempts = await competitive_MathQuizAttempt.find({ email })
      .sort({ submitted_at: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        quizScores: attempts
      }
    });

  } catch (error) {
    console.error('❌ Error fetching scores:', error);
    return res.status(500).json({
      error:   'Failed to fetch scores',
      details: error.message
    });
  }
});

// CHANGED: Route path updated
router.get('/competitive_math_quiz_attempts/:attemptId', async (req, res) => {
  try {
    const { attemptId } = req.params;

    // Get attempt summary
    const attempt = await competitive_MathQuizAttempt.findById(attemptId).lean();
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Get question results and populate full question data
    const questionResults = await competitive_MathResult.find({ attempt_id: attemptId })
      .populate({
        path:   'question_id',
        select: 'question_text options correct_answer explanation difficulty type points has_latex subtopic'
      })
      .lean();

    // Shape data for review page
    const reviewQuestions = questionResults.map(qr => ({
      // Full question content
      question_text:  qr.question_id?.question_text  || '',
      type:           qr.question_id?.type           || qr.question_type,
      difficulty:     qr.question_id?.difficulty     || qr.difficulty,
      points:         qr.question_id?.points         || 1,
      has_latex:      qr.question_id?.has_latex      || false,
      explanation:    qr.question_id?.explanation    || '',
      options:        qr.question_id?.options        || [],
      correct_answer: qr.question_id?.correct_answer,

      // What the user did
      user_answer:        qr.user_answer,
      is_correct:         qr.is_correct,
      marks_awarded:      qr.marks_awarded,
      time_taken_seconds: qr.time_taken_seconds,
      subtopic:           qr.subtopic,
      concept_tags:       qr.concept_tags,
      bloom_level:        qr.bloom_level
    }));

    return res.status(200).json({
      success: true,
      attempt: {
        _id:                attempt._id,
        week:               attempt.week,
        topic:              attempt.topic,
        score:              attempt.score,
        max_possible_score: attempt.max_possible_score,
        percentage:         attempt.percentage,
        total_questions:    attempt.total_questions,
        correct_answers:    attempt.correct_answers,
        total_time_seconds: attempt.total_time_seconds,
        submitted_at:       attempt.submitted_at,
        easy_attempted:     attempt.easy_attempted,
        easy_correct:       attempt.easy_correct,
        medium_attempted:   attempt.medium_attempted,
        medium_correct:     attempt.medium_correct,
        hard_attempted:     attempt.hard_attempted,
        hard_correct:       attempt.hard_correct
      },
      questions: reviewQuestions
    });

  } catch (error) {
    console.error('❌ Error fetching review:', error);
    return res.status(500).json({
      error:   'Failed to fetch review data',
      details: error.message
    });
  }
});


// GET /physics/questions - Fetch random questions for a week

router.get('/physics_questions_databases', async (req, res) => {
  try {
    const { week, email, count = 10, difficulty, type, topic } = req.query;

    if (!week || !email) {
      return res.status(400).json({
        error: 'week and email are required',
        example: '/physics/questions?week=7&email=user@example.com&count=10'
      });
    }

    const weekNum = parseInt(week);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 11) {
      return res.status(400).json({ error: 'week must be between 1 and 11' });
    }

    const filter = {
      week: weekNum,
      is_active: true
    };
    if (difficulty) filter.difficulty = difficulty;
    if (type) filter.type = type;
    if (topic) filter.topic = topic;

    let pool = await PhysicQue.find(filter).lean();

    if (pool.length === 0) {
      return res.status(404).json({ error: 'No questions found for this week' });
    }

    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const requestedCount = Math.min(parseInt(count), pool.length);
    const selected = pool.slice(0, requestedCount);

    return res.status(200).json({
      questions: selected,
      metadata: {
        week: weekNum,
        pool_size: pool.length,
        returned: selected.length,
        requested: requestedCount
      }
    });

  } catch (error) {
    console.error('❌ Error fetching questions:', error);
    return res.status(500).json({ error: 'Failed to fetch questions', details: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /physics/scores - Save quiz attempt and results
// ──────────────────────────────────────────────────────────────────────────────
router.post('/physics_scores_databases', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, username, quizData } = req.body;
    
    // ── Temporary logging ───────────────────────────────
    console.log('📥 Received body:', JSON.stringify({ email, username }, null, 2));
    console.log('📥 quizData keys:', quizData ? Object.keys(quizData) : 'quizData is undefined');
    console.log('📥 week:', quizData?.week);
    console.log('📥 startTime:', quizData?.startTime);
    console.log('📥 endTime:', quizData?.endTime);
    // ── End temporary logs ─────────────────────────────────

    if (!email || !quizData) {
      return res.status(400).json({ error: 'email and quizData are required' });
    }

    const {
      week,
      topic,
      score,
      maxPossibleScore,
      percentage,
      totalQuestions,
      correctAnswers,
      difficultyBreakdown,
      questionResults,
      startTime,
      endTime,
      totalTimeTaken,
      cheatCount
    } = quizData;

    // ── 1. Save attempt summary ────────────────────────────────────
    const [attempt] = await PhysicQuizAttempt.create([{
      email,
      username: username || email,
      week: week || 7,
      topic: topic || '',
      score,
      max_possible_score: maxPossibleScore,
      percentage: Math.round(percentage),
      total_questions: totalQuestions,
      correct_answers: correctAnswers,

      easy_attempted: difficultyBreakdown?.easy?.attempted || 0,
      easy_correct: difficultyBreakdown?.easy?.correct || 0,
      medium_attempted: difficultyBreakdown?.medium?.attempted || 0,
      medium_correct: difficultyBreakdown?.medium?.correct || 0,
      hard_attempted: difficultyBreakdown?.hard?.attempted || 0,
      hard_correct: difficultyBreakdown?.hard?.correct || 0,

      total_time_seconds: totalTimeTaken || 0,
      started_at: new Date(startTime),
      submitted_at: new Date(endTime),
      is_completed: true,
      cheat_count: cheatCount || 0
    }], { session });

    // ── 2. Save individual question results ────────────────────────
    if (Array.isArray(questionResults) && questionResults.length > 0) {

      const resultDocs = questionResults.map(qr => ({
        attempt_id: attempt._id,
        email,
        week: week || 7,
        question_id: qr.questionId,
        user_answer: qr.userAnswer ?? null,
        is_correct: qr.isCorrect,
        marks_awarded: qr.marksAwarded || 0,
        time_taken_seconds: qr.timeTaken || 0,
        difficulty: qr.difficulty || 'medium',
        topic: topic || '',
        subtopic: qr.subtopic || '',
        question_type: qr.questionType || '',
        concept_tags: qr.conceptTags || [],
        bloom_level: qr.bloomLevel || 'apply'
      }));

      await PhysicResult.insertMany(resultDocs, { session });
    }

    // ── 3. Commit both writes atomically ───────────────────────────
    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      attempt_id: attempt._id,
      message: 'Quiz attempt saved successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Error saving quiz attempt:', error);
    return res.status(500).json({
      error: 'Failed to save quiz attempt',
      details: error.message
    });
  } finally {
    session.endSession();
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /physics/scores - Fetch all attempts for a user
// ──────────────────────────────────────────────────────────────────────────────
router.get('/physics_scores_databases', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const attempts = await PhysicQuizAttempt.find({ email })
      .sort({ submitted_at: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        quizScores: attempts
      }
    });

  } catch (error) {
    console.error('❌ Error fetching scores:', error);
    return res.status(500).json({
      error: 'Failed to fetch scores',
      details: error.message
    });
  }
});


// GET /physics/scores/:attemptId - Fetch single attempt with full results

router.get('/physics_scores_databases/:attemptId', async (req, res) => {
  try {
    const { attemptId } = req.params;

    // Get attempt summary
    const attempt = await PhysicQuizAttempt.findById(attemptId).lean();
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Get question results and populate full question data
    const questionResults = await PhysicResult.find({ attempt_id: attemptId })
      .populate({
        path: 'question_id',
        select: 'question_text options correct_answer explanation difficulty type points has_latex subtopic'
      })
      .lean();

    // Shape data for review page
    const reviewQuestions = questionResults.map(qr => ({
      // Full question content
      question_text: qr.question_id?.question_text || '',
      type: qr.question_id?.type || qr.question_type,
      difficulty: qr.question_id?.difficulty || qr.difficulty,
      points: qr.question_id?.points || 1,
      has_latex: qr.question_id?.has_latex || false,
      explanation: qr.question_id?.explanation || '',
      options: qr.question_id?.options || [],
      correct_answer: qr.question_id?.correct_answer,

      // What the user did
      user_answer: qr.user_answer,
      is_correct: qr.is_correct,
      marks_awarded: qr.marks_awarded,
      time_taken_seconds: qr.time_taken_seconds,
      subtopic: qr.subtopic,
      concept_tags: qr.concept_tags,
      bloom_level: qr.bloom_level
    }));

    return res.status(200).json({
      success: true,
      attempt: {
        _id: attempt._id,
        week: attempt.week,
        topic: attempt.topic,
        score: attempt.score,
        max_possible_score: attempt.max_possible_score,
        percentage: attempt.percentage,
        total_questions: attempt.total_questions,
        correct_answers: attempt.correct_answers,
        total_time_seconds: attempt.total_time_seconds,
        submitted_at: attempt.submitted_at,
        easy_attempted: attempt.easy_attempted,
        easy_correct: attempt.easy_correct,
        medium_attempted: attempt.medium_attempted,
        medium_correct: attempt.medium_correct,
        hard_attempted: attempt.hard_attempted,
        hard_correct: attempt.hard_correct
      },
      questions: reviewQuestions
    });

  } catch (error) {
    console.error('❌ Error fetching review:', error);
    return res.status(500).json({
      error: 'Failed to fetch review data',
      details: error.message
    });
  }
});

// GET all Java submissions (admin) — merges test, coding, and interview quiz submissions
router.get('/java-submission', async (req, res) => {
  try {
    const { email } = req.query;
    const filter = email ? { email } : {};

    const [testSubs, codingSubs, interviewSubs] = await Promise.all([
      JavaSubmission.find(filter).sort({ timestamp: -1 }).select('-__v -questions').lean(),
      // Note: If you have separate CodingSubmission and InterviewSubmission models for Java, 
      // replace these with your actual model names
      CodingSubmission.find(filter).sort({ timestamp: -1 }).select('-__v -questions').lean(),
      InterviewSubmission.find(filter).sort({ timestamp: -1 }).select('-__v -questions').lean(),
    ]);

    const normalize = (sub, quizType) => ({
      _id: sub._id,
      email: sub.email,
      username: sub.username,
      topic: sub.topic,
      score: sub.score,
      maxScore: sub.maxScore,
      percentage: sub.percentage,
      timestamp: sub.timestamp,
      quizType,
    });

    const merged = [
      ...testSubs.map(s => normalize(s, 'test')),
      ...codingSubs.map(s => normalize(s, 'coding')),
      ...interviewSubs.map(s => normalize(s, 'interview')),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ success: true, data: merged });

  } catch (error) {
    console.error('Error fetching Java submissions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit quiz results route
router.post('/java-submission', async (req, res) => {
    try {
        const submissionData = req.body;
        
        console.log('📝 Received Java submission:', {
            username: submissionData.username,
            topic: submissionData.topic,
            score: submissionData.score,
            maxScore: submissionData.maxScore
        });

        // Create submission document using JavaSubmission model
        const submission = new JavaSubmission(submissionData);
        
        // Save to database
        await submission.save();
        
        console.log('✅ Java submission saved successfully');
        
        res.status(201).json({
            success: true,
            message: 'Quiz results saved successfully',
            submissionId: submission._id
        });
        
    } catch (error) {
        console.error('❌ Error saving Java submission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save quiz results',
            error: error.message
        });
    }
});

//Alternative: Get questions by specific week (most common use case)
router.get('/java/questions/week/:week', async (req, res) => {
    try {
        const { week } = req.params;
        const { topic, subtopic, type, difficulty, limit } = req.query;
        
        // Validate week range
        if (week < 1 || week > 11) {
            return res.status(400).json({
                success: false,
                message: 'Week must be between 1 and 11'
            });
        }
        
        // Build filter
        let filter = { week: parseInt(week) };
        if (topic) filter.topic = topic;
        if (subtopic) filter.subtopic = subtopic;
        if (type) filter.type = type;
        if (difficulty) filter.difficulty = difficulty;
        
        // Execute query with optional limit
        let query = JavaQuestions.find(filter).sort({ questionId: 1 });
        if (limit) {
            query = query.limit(parseInt(limit));
        }
        
        const questions = await query.lean();
        
        if (questions.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No questions found for week ${week}`,
                filters: filter
            });
        }
        
        // Get statistics for the response
        const stats = {
            totalQuestions: questions.length,
            byType: {},
            byDifficulty: {},
            byTopic: {},
            totalMaxScore: questions.reduce((sum, q) => sum + (q.maxScore || 0), 0)
        };
        
        // Calculate statistics
        questions.forEach(q => {
            // By type
            stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;
            // By difficulty
            stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
            // By topic
            stats.byTopic[q.topic] = (stats.byTopic[q.topic] || 0) + 1;
        });
        
        res.json({
            success: true,
            week: parseInt(week),
            count: questions.length,
            statistics: stats,
            questions: questions
        });
        
    } catch (error) {
        console.error('❌ Error fetching questions by week:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch questions',
            error: error.message
        });
    }
});



// ─── Aggregated Admin Notifications ────────────────────────────────────────
// Single endpoint that replaces 8 separate frontend calls.
// Only returns notification-sized fields — no questionResults, no options arrays.
router.get('/admin-notifications', async (req, res) => {
  try {
    const [
      math1Users, stats1Users, ctUsers,
      math2Users, stats2Users,
      codingUsers, pdsaUsers, satDocs
    ] = await Promise.all([
      iitm_math_score.find({}, { email:1, username:1, name:1,
        'quizScores.topic':1, 'quizScores.score':1, 'quizScores.percentage':1,
        'quizScores.correctAnswers':1, 'quizScores.totalQuestions':1, 'quizScores.timestamp':1
      }).lean(),
      Statistics_scores.find({}, { email:1, username:1, name:1,
        'quizScores.topic':1, 'quizScores.percentage':1,
        'quizScores.correctAnswers':1, 'quizScores.totalQuestions':1, 'quizScores.timestamp':1
      }).lean(),
      iitm_ct_scores.find({}, { email:1, username:1, name:1,
        'quizScores.topic':1, 'quizScores.score':1, 'quizScores.percentage':1,
        'quizScores.totalQuestions':1, 'quizScores.timestamp':1
      }).lean(),
      IITM_Maths_2_Score.find({}, { email:1, name:1,
        'scores.week':1, 'scores.subtopic':1, 'scores.score':1,
        'scores.correctAnswers':1, 'scores.totalQuestions':1, 'scores.dateAttempted':1
      }).lean(),
      IITM_Stats_2_Score.find({}, { email:1, name:1,
        'scores.week':1, 'scores.subtopic':1, 'scores.score':1,
        'scores.correctAnswers':1, 'scores.totalQuestions':1, 'scores.dateAttempted':1
      }).lean(),
      CodingSubmission.find({}, { email:1, username:1, name:1, topic:1, percentage:1, score:1, maxScore:1, timestamp:1 }).lean(),
      pdsaSubmission.find({}, { email:1, username:1, name:1, topic:1, percentage:1, score:1, maxScore:1, timestamp:1 }).lean(),
      SatScore.find({}, { email:1, name:1, subject:1,
        'attempts.score':1, 'attempts.maxScore':1, 'attempts.correctAnswers':1,
        'attempts.totalQuestions':1, 'attempts.dateAttempted':1
      }).lean(),
    ])

    const all = []

    const push = (arr, subject, subjectKey, icon, iconClass, mapFn) =>
      arr.forEach(s => mapFn(s).forEach(n => all.push({ ...n, subject, subjectKey, icon, iconClass })))

    // Math 1
    push(math1Users, 'Mathematics-1', 'math1', 'bi-calculator', 'math', s =>
      (s.quizScores || []).map(q => ({
        userName: s.username || s.name || s.email,
        topic: q.topic || 'Quiz',
        score: q.percentage || (q.correctAnswers != null && q.totalQuestions ? Math.round((q.correctAnswers/q.totalQuestions)*100) : 0),
        timestamp: q.timestamp
      }))
    )

    // Stats 1
    push(stats1Users, 'Statistics-1', 'stats1', 'bi-bar-chart', 'stats', s =>
      (s.quizScores || []).map(q => ({
        userName: s.username || s.name || s.email,
        topic: q.topic || 'Statistics Quiz',
        score: q.percentage || (q.correctAnswers != null && q.totalQuestions ? Math.round((q.correctAnswers/q.totalQuestions)*100) : 0),
        timestamp: q.timestamp
      }))
    )

    // CT
    push(ctUsers, 'Computational Thinking', 'ct', 'bi-cpu', 'ct', s =>
      (s.quizScores || []).map(q => ({
        userName: s.username || s.name || s.email,
        topic: q.topic || 'CT Exercise',
        score: q.percentage || (q.score != null && q.totalQuestions ? Math.round((q.score/q.totalQuestions)*100) : 0),
        timestamp: q.timestamp
      }))
    )

    // Math 2
    push(math2Users, 'Mathematics-2', 'math2', 'bi-calculator', 'math2', s =>
      (s.scores || []).map(q => ({
        userName: s.name || s.email,
        topic: q.subtopic || `Week ${q.week}`,
        score: q.totalQuestions ? Math.round((q.correctAnswers/q.totalQuestions)*100) : 0,
        timestamp: q.dateAttempted
      }))
    )

    // Stats 2
    push(stats2Users, 'Statistics-2', 'stats2', 'bi-bar-chart', 'stats2', s =>
      (s.scores || []).map(q => ({
        userName: s.name || s.email,
        topic: q.subtopic || `Week ${q.week}`,
        score: q.totalQuestions ? Math.round((q.correctAnswers/q.totalQuestions)*100) : 0,
        timestamp: q.dateAttempted
      }))
    )

    // Coding
    codingUsers
      .filter(s => s.email && s.email.toLowerCase() !== 'test@example.com')
      .forEach(s => all.push({
        userName: s.username || s.name || s.email,
        subject: 'Programming', subjectKey: 'coding', icon: 'bi-code-slash', iconClass: 'programming',
        topic: s.topic || 'Coding Assignment',
        score: s.percentage || (s.score != null && s.maxScore ? Math.round((s.score/s.maxScore)*100) : 0),
        timestamp: s.timestamp
      }))

    // PDSA
    pdsaUsers
      .filter(s => s.email && s.email.toLowerCase() !== 'test@example.com')
      .forEach(s => all.push({
        userName: s.username || s.name || s.email,
        subject: 'Quiz Test (PDSA)', subjectKey: 'pdsa', icon: 'bi-pencil-square', iconClass: 'dsa',
        topic: s.topic || 'Quiz Test',
        score: s.percentage || (s.score != null && s.maxScore ? Math.round((s.score/s.maxScore)*100) : 0),
        timestamp: s.timestamp
      }))

    // SAT
    satDocs.forEach(doc => {
      ;(doc.attempts || []).forEach(attempt => {
        const pct = attempt.totalQuestions > 0
          ? Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)
          : (attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0)
        all.push({
          userName: doc.name || doc.email,
          subject: 'SAT', subjectKey: 'sat', icon: 'bi-pencil-fill', iconClass: 'sat',
          topic: doc.subject || 'SAT Section',
          score: pct,
          timestamp: attempt.dateAttempted
        })
      })
    })

    all.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    res.json({ success: true, data: all.slice(0, 50) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/sat_admin_scores — all attempts per student, grouped by email (for admin dashboard)
router.get('/sat_admin_scores', async (req, res) => {
  try {
    const docs = await SatScore.find({}).lean()
    const byEmail = {}
    docs.forEach(doc => {
      if (!byEmail[doc.email]) {
        byEmail[doc.email] = { email: doc.email, name: doc.name, quizScores: [] }
      }
      ;(doc.attempts || []).forEach((attempt, i) => {
        const pct = attempt.totalQuestions > 0
          ? Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)
          : (attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0)
        byEmail[doc.email].quizScores.push({
          topic: doc.subject,
          score: attempt.score,
          maxScore: attempt.maxScore,
          correctAnswers: attempt.correctAnswers,
          totalQuestions: attempt.totalQuestions,
          percentage: pct,
          timestamp: attempt.dateAttempted,
          attemptNumber: i + 1,
        })
      })
    })
    res.json({ success: true, data: Object.values(byEmail) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/sat_exam_detail?email=...&subject=...&attemptNumber=... — question-by-question breakdown for one attempt
router.get('/sat_exam_detail', async (req, res) => {
  try {
    const { email, subject, attemptNumber } = req.query
    if (!email || !subject || !attemptNumber) {
      return res.status(400).json({ success: false, message: 'email, subject, and attemptNumber are required' })
    }

    const doc = await SatScore.findOne({ email, subject }).lean()
    if (!doc) return res.status(404).json({ success: false, message: 'Score record not found' })

    const idx = parseInt(attemptNumber) - 1
    const attempt = (doc.attempts || [])[idx]
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' })

    const questionIds = (attempt.responses || []).map(r => r.questionId).filter(Boolean)
    const questionMeta = await SatQuestion.find({ _id: { $in: questionIds } }).lean()
    const metaMap = {}
    questionMeta.forEach(q => { metaMap[String(q._id)] = q })

    const enrichedResults = (attempt.responses || []).map((r, i) => {
      const meta = metaMap[String(r.questionId)] || {}
      return {
        questionId:     r.questionId,
        questionNumber: meta.question_number || i + 1,
        questionText:   meta.question_text || '',
        userAnswer:     r.userResponse,
        correctAnswer:  meta.correct_answer,
        isCorrect:      r.isCorrect,
        marksAwarded:   r.marksAwarded,
        difficulty:     meta.difficulty || null,
        type:           meta.type || null,
        options:        meta.options || [],
        explanation:    meta.explanation || null,
        points:         meta.points || 1,
      }
    })

    const totalQuestions = attempt.totalQuestions || enrichedResults.length
    const correctAnswers = attempt.correctAnswers || 0

    // Compute difficulty breakdown
    const difficultyStats = { easy: { total: 0, correct: 0 }, medium: { total: 0, correct: 0 }, hard: { total: 0, correct: 0 }, unknown: { total: 0, correct: 0 } }
    enrichedResults.forEach(r => {
      const d = r.difficulty || 'unknown'
      difficultyStats[d].total++
      if (r.isCorrect) difficultyStats[d].correct++
    })

    // Compute type breakdown
    const typeStats = {}
    enrichedResults.forEach(r => {
      const t = r.type || 'unknown'
      if (!typeStats[t]) typeStats[t] = { total: 0, correct: 0 }
      typeStats[t].total++
      if (r.isCorrect) typeStats[t].correct++
    })

    res.json({
      success: true,
      data: {
        student: { email: doc.email, name: doc.name },
        attempt: {
          subject:        doc.subject,
          attemptNumber:  parseInt(attemptNumber),
          dateAttempted:  attempt.dateAttempted,
          score:          attempt.score,
          maxScore:       attempt.maxScore,
          totalQuestions,
          correctAnswers,
          wrongAnswers:   attempt.wrongAnswers,
          unattempted:    attempt.unattempted,
          percentage:     totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
        },
        enrichedResults,
        insights: {
          difficultyStats,
          typeStats,
          hardestQuestions: enrichedResults
            .filter(r => !r.isCorrect && r.difficulty === 'hard')
            .map(r => ({ questionNumber: r.questionNumber, questionText: r.questionText, explanation: r.explanation })),
        },
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─── JEE Questions ────────────────────────────────────────────────────────────
// GET /api/jee_questions?subject=Physics&difficulty=easy&limit=30
router.get('/jee_questions', async (req, res) => {
  try {
    const { subject, difficulty, limit } = req.query
    const filter = {}
    if (subject) filter.subject = subject
    if (difficulty) filter.difficulty = difficulty
    const qs = await JeeQuestion.find(filter)
      .limit(limit ? parseInt(limit) : 0)
      .lean()
    res.json(qs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/jee_scores — upsert: one doc per (email+subject), keep last 5 attempts
router.post('/jee_scores', async (req, res) => {
  try {
    const { email, name, subject, totalQuestions, correctAnswers, wrongAnswers,
            unattempted, score, maxScore, responses } = req.body
    if (!email || !subject) return res.status(400).json({ error: 'email and subject are required' })

    const newAttempt = {
      totalQuestions, correctAnswers, wrongAnswers, unattempted,
      score, maxScore,
      // Only store questionId + userResponse + isCorrect + marksAwarded (no text/answer duplication)
      responses: (responses || []).map(r => ({
        questionId:   r.questionId,
        userResponse: r.userResponse,
        isCorrect:    r.isCorrect,
        marksAwarded: r.marksAwarded,
      })),
      dateAttempted: new Date(),
    }

    // Upsert: find existing doc, prepend new attempt, slice to last 5
    const doc = await JeeScore.findOneAndUpdate(
      { email, subject },
      {
        $set:  { name },
        $push: { attempts: { $each: [newAttempt], $position: 0, $slice: 5 } },
      },
      { upsert: true, new: true }
    )
    res.json({ success: true, data: { email: doc.email, subject: doc.subject, attemptCount: doc.attempts.length } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/jee_scores?email=x@y.com  — returns latest attempt summary per subject
router.get('/jee_scores', async (req, res) => {
  try {
    const { email } = req.query
    const filter = email ? { email } : {}
    const docs = await JeeScore.find(filter).lean()
    // Return flattened: latest attempt per (email, subject)
    const result = docs.map(doc => ({
      email:          doc.email,
      name:           doc.name,
      subject:        doc.subject,
      attemptCount:   doc.attempts?.length || 0,
      // Latest attempt stats (index 0 = most recent)
      ...(doc.attempts?.[0] || {}),
    }))
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── SAT Debug — returns total count + distinct subjects in the collection ────
router.get('/sat_debug', async (req, res) => {
  try {
    const totalQuestions = await SatQuestion.countDocuments()
    const distinctSubjects = await SatQuestion.distinct('subject')
    res.json({ totalQuestions, distinctSubjects })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── SAT Questions ────────────────────────────────────────────────────────────
// GET /api/sat_questions?subject=Reading %26 Writing&paper=Module 1&difficulty=easy&limit=30
router.get('/sat_questions', async (req, res) => {
  try {
    const { subject, difficulty, paper, limit } = req.query
    const filter = {}
    if (subject) {
      // Normalise: treat "Reading & Writing" and "Reading and Writing" as the same.
      // Build both forms and match either one, case-insensitively.
      const withAmpersand = subject.replace(/\s+and\s+/gi, ' & ')
      const withAnd       = subject.replace(/\s*&\s*/g, ' and ')
      const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { subject: { $regex: new RegExp('^' + esc(withAmpersand) + '$', 'i') } },
        { subject: { $regex: new RegExp('^' + esc(withAnd)       + '$', 'i') } },
      ]
    }
    if (difficulty) filter.difficulty = difficulty
    if (paper) {
      const escapedPaper = paper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.paper = { $regex: new RegExp('^' + escapedPaper + '$', 'i') }
    }
    const qs = await SatQuestion.find(filter)
      .limit(limit ? parseInt(limit) : 0)
      .lean()
    res.json(qs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/sat_scores — upsert: one doc per (email+subject), keep last 5 attempts
router.post('/sat_scores', async (req, res) => {
  try {
    const { email, name, subject, totalQuestions, correctAnswers, wrongAnswers,
            unattempted, score, maxScore, responses } = req.body
    if (!email || !subject) return res.status(400).json({ error: 'email and subject are required' })

    const newAttempt = {
      totalQuestions, correctAnswers, wrongAnswers, unattempted,
      score, maxScore,
      responses: (responses || []).map(r => ({
        questionId:   r.questionId,
        userResponse: r.userResponse,
        isCorrect:    r.isCorrect,
        marksAwarded: r.marksAwarded,
      })),
      dateAttempted: new Date(),
    }

    const doc = await SatScore.findOneAndUpdate(
      { email, subject },
      {
        $set:  { name },
        $push: { attempts: { $each: [newAttempt], $position: 0, $slice: 5 } },
      },
      { upsert: true, new: true }
    )
    res.json({ success: true, data: { email: doc.email, subject: doc.subject, attemptCount: doc.attempts.length } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/sat_scores?email=x@y.com  — returns latest attempt summary per subject
router.get('/sat_scores', async (req, res) => {
  try {
    const { email } = req.query
    const filter = email ? { email } : {}
    const docs = await SatScore.find(filter).lean()
    const result = docs.map(doc => ({
      email:          doc.email,
      name:           doc.name,
      subject:        doc.subject,
      attemptCount:   doc.attempts?.length || 0,
      ...(doc.attempts?.[0] || {}),
    }))
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router






























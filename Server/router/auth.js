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




const pdsaQuestion = require('../model/pdsa_Questions');
const pdsaSubmission = require('../model/pdsa_Submission');
const pdsaCodingQuestion = require('../model/pdsa_Coding_Questions'); 
const pdsaCodingSubmission = require('../model/pdsa_Coding_Submission'); 
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

const JeeMainQuestion  = require('../model/jee_main_questions')
const JeeMainScore     = require('../model/jee_main_scores')
const JeeMainFullScore = require('../model/jee_main_full_scores')

const SatQuestion = require('../model/sat_questions')
const SatScore = require('../model/sat_scores')
const SatFullScore   = require('../model/sat_full_scores')

const GreQuestion    = require('../model/gre_questions')
const GreScore       = require('../model/gre_scores')
const GreFullScore   = require('../model/gre_full_scores')

const GateDaQuestion  = require('../model/gate_da_questions')
const GateDaScore     = require('../model/gate_da_scores')
const GateDaFullScore = require('../model/gate_da_full_scores')

const GmatQuestion   = require('../model/gmat_questions')
const GmatScore      = require('../model/gmat_scores')
const GmatFullScore  = require('../model/gmat_full_scores')

const CatQuestion    = require('../model/cat_questions')
const CatScore       = require('../model/cat_scores')
const CatFullScore   = require('../model/cat_full_scores')

const DBMSSubmission = require('../model/DBMS_Submission');
const DBMSQuestions = require('../model/DBMS_Questions');


// NEW programming course models
const ProgrammingQuizQuestion = require('../model/Programming_Questions');  
const ProgrammingQuizAttempt = require('../model/Programming_QuizAttempt');
const ProgrammingQuizResult = require('../model/Programming_QuizResult');

const CodingQuestion = require('../model/CodingQuestions'); 
const CodingSubmission = require('../model/CodingSubmission'); 
//const CodingTestCase = require('../model/CodingTestCase'); 


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
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ error: 'Session error' });
          }
          res.status(200).json({
            success: true,
            message: 'User signed in successfully',
            username: user.name,
            email: user.email
          });
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
    if (isNaN(weekNum) || ((weekNum < 1 || weekNum > 12) && weekNum !== 100)) {
      return res.status(400).json({ error: 'week must be between 1 and 12, or 100 for the Midterm Assessment' });
    }


    const filter = {
      week:      weekNum,
      is_active: true
    };
    if (difficulty) filter.difficulty = difficulty;
    if (type)       filter.type       = type;
    if (topic)      filter.topic      = topic;


    let pool = await IITStats2Question .find(filter).lean();


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
      console.log("========== STATS2 DEBUG ==========");
      console.log("Number of attempts:", attempts.length);
      console.log(attempts);
      console.log("==================================");
    
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

// GET coding submissions - FIXED: using pdsaCodingSubmission
router.get('/pdsa/coding-submissions', async (req, res) => {
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

    // Fetch based on filter - USING pdsaCodingSubmission
    const submissions = await pdsaCodingSubmission.find(filter)
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
      pdsaCodingSubmission.find(filter).sort({ timestamp: -1 }).select('-__v -questions').lean(), // FIXED: using pdsaCodingSubmission
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

// GET interview submissions
router.get('/pdsa/interview-submissions', async (req, res) => {
    try {
        const { username, email, topic, type, date } = req.query;
        
        const filter = {};
        if (username) filter.username = username;
        if (email) filter.email = email;
        if (topic) filter.topic = topic;
        if (type) filter.type = type;
        
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

// POST interview submission
router.post('/pdsa/interview-submission', async (req, res) => {
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

// Fetching questions with type interview from collection
router.get('/pdsa/interview', async (req, res) => {
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
            // Fetch from pdsaCodingQuestion collection - FIXED
            pdsaCodingQuestion.aggregate([
                { $match: { topic: topic, type: type } },
                { $sample: { size: parseInt(codingCount) } }
            ]),
            
            // Fetch from pdsaQuestion collection - FIXED
            pdsaQuestion.aggregate([
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

// POST submit coding quiz results - FIXED: using pdsaCodingSubmission
router.post('/pdsa/coding-submission', async (req, res) => {
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

        // Create submission document - USING pdsaCodingSubmission
        const submission = new pdsaCodingSubmission(submissionData);
        
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

// GET random coding questions by difficulty and topic - FIXED: using pdsaCodingQuestion
router.get('/pdsa/coding-questions', async (req, res) => {
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
        
        // Fetch random questions - USING pdsaCodingQuestion
        const questions = await pdsaCodingQuestion.aggregate([
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

// Submit quiz results route - using pdsaSubmission (this one is correct)
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

// PDSA questions fetching route - FIXED: using pdsaQuestion
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

router.get('/pdsa/questions/:topic', async (req, res) => {
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
        
        // Fetch questions for each maxScore category - USING pdsaQuestion
        for (const category of distribution) {
            try {
                const questions = await pdsaQuestion.aggregate([
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
            
            const additionalQuestions = await pdsaQuestion.aggregate([
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
});


// programming course route 
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


// GET all DBMS submissions — merges test, coding, and interview quiz submissions
router.get('/dbms-submission', async (req, res) => {
  try {
    const { email } = req.query;
    const filter = email ? { email } : {};

    const [testSubs, codingSubs, interviewSubs] = await Promise.all([
      DBMSSubmission.find(filter).sort({ timestamp: -1 }).select('-__v -questions').lean(),
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
    console.error('Error fetching DBMS submissions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST — save DBMS quiz submission
router.post('/dbms-submission', async (req, res) => {
  try {
    const submissionData = req.body;
    const submission = new DBMSSubmission(submissionData);
    await submission.save();
    res.status(201).json({
      success: true,
      message: 'Quiz results saved successfully',
      submissionId: submission._id
    });
  } catch (error) {
    console.error('❌ Error saving DBMS submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save quiz results',
      error: error.message
    });
  }
});

// GET — fetch DBMS questions by week number
router.get('/dbms/questions/week/:week', async (req, res) => {
  try {
    const { week } = req.params;
    const { topic, subtopic, type, difficulty, limit } = req.query;

    if (week < 1 || week > 11) {
      return res.status(400).json({ success: false, message: 'Week must be between 1 and 11' });
    }

    let filter = { week: parseInt(week) };
    if (topic) filter.topic = topic;
    if (subtopic) filter.subtopic = subtopic;
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;

    let query = DBMSQuestions.find(filter).sort({ questionId: 1 });
    if (limit) query = query.limit(parseInt(limit));

    const questions = await query.lean();

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No questions found for week ${week}`,
        filters: filter
      });
    }

    const stats = {
      totalQuestions: questions.length,
      byType: {}, byDifficulty: {}, byTopic: {},
      totalMaxScore: questions.reduce((sum, q) => sum + (q.maxScore || 0), 0)
    };
    questions.forEach(q => {
      stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;
      stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
      stats.byTopic[q.topic] = (stats.byTopic[q.topic] || 0) + 1;
    });

    res.json({ success: true, week: parseInt(week), count: questions.length, statistics: stats, questions });

  } catch (error) {
    console.error('❌ Error fetching questions by week:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch questions', error: error.message });
  }
});


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
            unattempted, score, maxScore, responses, source } = req.body
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
      source: source === 'FullTest' ? 'FullTest' : 'Module',
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

// GET /api/sat_scores?email=x@y.com  — returns all attempts as flat records (newest first per subject)
router.get('/sat_scores', async (req, res) => {
  try {
    const { email } = req.query
    const filter = email ? { email } : {}
    const docs = await SatScore.find(filter).lean()
    const result = docs.flatMap(doc =>
      (doc.attempts || []).map(attempt => ({
        email:   doc.email,
        name:    doc.name,
        subject: doc.subject,
        ...attempt,
      }))
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── SAT Papers aggregation ───────────────────────────────────────────────────
// GET /api/sat_papers  — groups sat_questions by (paper, year) and returns per-paper totals
router.get('/sat_papers', async (req, res) => {
  try {
    const grouped = await SatQuestion.aggregate([
      {
        // Normalise subject so both "Reading & Writing" and "Reading and Writing" collapse into one key
        $addFields: {
          _normSubject: {
            $cond: {
              if: { $regexMatch: { input: { $ifNull: ['$subject', ''] }, regex: /reading/i } },
              then: 'Reading & Writing',
              else: '$subject',
            },
          },
        },
      },
      {
        $group: {
          _id:   { paper: '$paper', year: '$year', subject: '$_normSubject' },
          count: { $sum: 1 },
          marks: { $sum: { $ifNull: ['$points', 1] } },
        },
      },
      {
        $group: {
          _id:            { paper: '$_id.paper', year: '$_id.year' },
          totalQuestions: { $sum: '$count' },
          totalMarks:     { $sum: '$marks' },
          subjects:       { $push: { subject: '$_id.subject', count: '$count', totalMarks: '$marks' } },
        },
      },
    ])

    const result = grouped.map(p => {
      const subjects = {}
      p.subjects.forEach(s => { subjects[s.subject] = { count: s.count, totalMarks: s.totalMarks } })
      return {
        paper:          p._id.paper,
        year:           p._id.year,
        totalQuestions: p.totalQuestions,
        totalMarks:     p.totalMarks,
        subjects,
      }
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/sat_full_scores — save one full-paper attempt
router.post('/sat_full_scores', async (req, res) => {
  try {
    const {
      email, name, paper, year,
      totalQuestions, correctAnswers, wrongAnswers, unattempted,
      score, maxScore, sectionScores, responses, totalTimeTaken,
    } = req.body
    if (!email || !paper) return res.status(400).json({ error: 'email and paper are required' })

    const doc = new SatFullScore({
      email, name, paper, year,
      totalQuestions, correctAnswers, wrongAnswers, unattempted,
      score, maxScore, sectionScores,
      responses: (responses || []).map(r => ({
        questionId:   r.questionId,
        subject:      r.subject,
        userResponse: r.userResponse,
        isCorrect:    r.isCorrect,
        marksAwarded: r.marksAwarded,
        unattempted:  r.unattempted,
        timeTaken:    r.timeTaken,
      })),
      totalTimeTaken,
      dateAttempted: new Date(),
    })
    await doc.save()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/sat_full_scores?email=x@y.com — all full-paper attempts newest first
router.get('/sat_full_scores', async (req, res) => {
  try {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'email is required' })
    const docs = await SatFullScore.find({ email }).sort({ dateAttempted: -1 }).lean()
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// ─── GATE DA Debug — returns total count + distinct subjects in the collection ────
router.get('/gate_da_debug', async (req, res) => {
  try {
    const totalQuestions = await GateDaQuestion.countDocuments()
    const distinctSubjects = await GateDaQuestion.distinct('subject')
    res.json({ totalQuestions, distinctSubjects })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GATE DA Questions ────────────────────────────────────────────────────────────
// The full test / dashboard / quiz pages only know about these 6 broad exam
// subjects, but questions in the DB are tagged with finer-grained subjects
// (e.g. "Verbal Ability" instead of "General Aptitude"). Map each broad
// subject to every granular subject value that belongs under it, so a request
// for the broad name still finds all matching questions.
const GATE_DA_SUBJECT_BUCKETS = {
  'general aptitude': ['General Aptitude', 'Verbal Ability', 'Quantitative Aptitude', 'Analytical Aptitude'],
  'engineering mathematics': ['Engineering Mathematics', 'Linear Algebra', 'Calculus', 'Calculus & Optimization', 'Discrete Mathematics', 'Probability & Statistics'],
  'programming & data structures': ['Programming & Data Structures', 'Programming', 'Algorithms & Data Structures'],
  'database management & warehousing': ['Database Management & Warehousing', 'Databases'],
  'machine learning': ['Machine Learning', 'Deep Learning', 'Data Science Fundamentals'],
  'artificial intelligence': ['Artificial Intelligence'],
}


// Top-level exam split: Aptitude vs everything else ("Main Subject")
const GATE_DA_APTITUDE_TAGS = new Set(GATE_DA_SUBJECT_BUCKETS['general aptitude'].map(s => s.toLowerCase()))

const GATE_DA_UNNAMED_PAPER = 'GATE DA Practice Test'

// GET /api/gate_da_questions?subject=Machine Learning&paper=GATE DA Practice Set 1&difficulty=easy&limit=30
router.get('/gate_da_questions', async (req, res) => {
  try {
    const { subject, difficulty, paper, limit } = req.query
    const filter = {}
    if (subject) {
      const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const bucket = GATE_DA_SUBJECT_BUCKETS[subject.trim().toLowerCase()]
      if (bucket) {
        filter.subject = { $in: bucket.map(s => new RegExp('^' + esc(s) + '$', 'i')) }
      } else {
        filter.subject = { $regex: new RegExp('^' + esc(subject) + '$', 'i') }
      }
    }
    if (paper && paper !== GATE_DA_UNNAMED_PAPER) {
      const anyPaperTagged = await GateDaQuestion.exists({ paper: { $exists: true, $ne: null } })
       if (anyPaperTagged) {
        const escapedPaper = paper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        filter.paper = { $regex: new RegExp('^' + escapedPaper + '$', 'i') }
      }
    }

    const qs = await GateDaQuestion.find(filter)
      .limit(limit ? parseInt(limit) : 0)
      .lean()
    res.json(qs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/gate_da_scores — upsert: one doc per (email+subject), keep last 5 attempts
router.post('/gate_da_scores', async (req, res) => {
  try {
    const { email, name, subject, totalQuestions, correctAnswers, wrongAnswers,
            unattempted, score, maxScore, responses, source } = req.body
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
      source: source === 'FullTest' ? 'FullTest' : 'Module',
      dateAttempted: new Date(),
    }

    const doc = await GateDaScore.findOneAndUpdate(
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

// GET /api/gate_da_scores?email=x@y.com  — returns all attempts as flat records (newest first per subject)
router.get('/gate_da_scores', async (req, res) => {
  try {
    const { email } = req.query
    const filter = email ? { email } : {}
    const docs = await GateDaScore.find(filter).lean()
    const result = docs.flatMap(doc =>
      (doc.attempts || []).map(attempt => ({
        email:   doc.email,
        name:    doc.name,
        subject: doc.subject,
        ...attempt,
      }))
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GATE DA Papers aggregation ───────────────────────────────────────────────────
// GET /api/gate_da_papers  — groups gate_da_questions by (paper, year) and returns per-paper totals
router.get('/gate_da_papers', async (req, res) => {
  try {
    const grouped = await GateDaQuestion.aggregate([
      {
        $group: {
          _id:   { paper: '$paper', year: '$year', subject: '$subject' },
          count: { $sum: 1 },
          marks: { $sum: { $ifNull: ['$points', 1] } },
        },
      },
      {
        $group: {
          _id:            { paper: '$_id.paper', year: '$_id.year' },
          totalQuestions: { $sum: '$count' },
          totalMarks:     { $sum: '$marks' },
          subjects:       { $push: { subject: '$_id.subject', count: '$count', totalMarks: '$marks' } },
        },
      },
    ])

    const result = grouped.map(p => {
      const subjects = {}
      const sections = { Aptitude: { count: 0, totalMarks: 0 }, 'Main Subject': { count: 0, totalMarks: 0 } }
      p.subjects.forEach(s => {
        subjects[s.subject] = { count: s.count, totalMarks: s.totalMarks }
        const bucket = GATE_DA_APTITUDE_TAGS.has(String(s.subject).trim().toLowerCase()) ? 'Aptitude' : 'Main Subject'
        sections[bucket].count += s.count
        sections[bucket].totalMarks += s.totalMarks
      })
     return {
        paper:          p._id.paper || 'GATE DA Practice Test',
        year:           p._id.year ?? null,
        totalQuestions: p.totalQuestions,
        totalMarks:     p.totalMarks,
        subjects,
        sections,
      }
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// POST /api/gate_da_full_scores — save one full-paper attempt
router.post('/gate_da_full_scores', async (req, res) => {
  try {
    const {
      email, name, paper, year,
      totalQuestions, correctAnswers, wrongAnswers, unattempted,
      score, maxScore, sectionScores, responses, totalTimeTaken,
    } = req.body
    if (!email || !paper) return res.status(400).json({ error: 'email and paper are required' })

    const doc = new GateDaFullScore({
      email, name, paper, year,
      totalQuestions, correctAnswers, wrongAnswers, unattempted,
      score, maxScore, sectionScores,
      responses: (responses || []).map(r => ({
        questionId:   r.questionId,
        subject:      r.subject,
        userResponse: r.userResponse,
        isCorrect:    r.isCorrect,
        marksAwarded: r.marksAwarded,
        unattempted:  r.unattempted,
        timeTaken:    r.timeTaken,
      })),
      totalTimeTaken,
      dateAttempted: new Date(),
    })
    await doc.save()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/gate_da_full_scores?email=x@y.com — all full-paper attempts newest first
router.get('/gate_da_full_scores', async (req, res) => {
  try {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'email is required' })
    const docs = await GateDaFullScore.find({ email }).sort({ dateAttempted: -1 }).lean()
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/gate_da_admin_scores — all attempts per student, grouped by email (for admin dashboard)
// Merges standalone module practice (GateDaScore) with Full GATE DA Test sessions (GateDaFullScore)
router.get('/gate_da_admin_scores', async (req, res) => {
  try {
    const [moduleDocs, fullDocs] = await Promise.all([
      GateDaScore.find({}).lean(),
      GateDaFullScore.find({}).sort({ dateAttempted: 1 }).lean(),
    ])
    const byEmail = {}
    const ensure = (email, name) => {
      if (!byEmail[email]) byEmail[email] = { email, name, quizScores: [] }
      return byEmail[email]
    }

    moduleDocs.forEach(doc => {
      const bucket = ensure(doc.email, doc.name)
      ;(doc.attempts || []).forEach((attempt, i) => {
        const attempted = (attempt.correctAnswers || 0) + (attempt.wrongAnswers || 0)
        const accuracy  = attempted > 0 ? Math.round((attempt.correctAnswers / attempted) * 100) : 0
        const pct = attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0
        bucket.quizScores.push({
          type: 'Module',
          topic: doc.subject,
          subject: doc.subject,
          source: attempt.source || 'Module',
          score: attempt.score,
          maxScore: attempt.maxScore,
          correctAnswers: attempt.correctAnswers,
          wrongAnswers: attempt.wrongAnswers,
          unattempted: attempt.unattempted,
          totalQuestions: attempt.totalQuestions,
          percentage: pct,
          accuracy,
          responses: attempt.responses || [],
          timestamp: attempt.dateAttempted,
          attemptNumber: i + 1,
        })
      })
    })

    fullDocs.forEach((doc, i) => {
      const bucket = ensure(doc.email, doc.name)
      const pct = doc.maxScore > 0 ? Math.round((doc.score / doc.maxScore) * 100) : 0
      bucket.quizScores.push({
        type: 'FullTest',
        attemptId: doc._id,
        topic: [doc.year, doc.paper].filter(Boolean).join(' · ') || 'Full GATE DA Test',
        paper: doc.paper,
        year: doc.year,
        score: doc.score,
        maxScore: doc.maxScore,
        correctAnswers: doc.correctAnswers,
        wrongAnswers: doc.wrongAnswers,
        unattempted: doc.unattempted,
        totalQuestions: doc.totalQuestions,
        percentage: pct,
        sectionScores: doc.sectionScores,
        totalTimeTaken: doc.totalTimeTaken,
        timestamp: doc.dateAttempted,
        attemptNumber: i + 1,
      })
    })

    res.json({ success: true, data: Object.values(byEmail) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/gate_da_full_score_detail?email=...&attemptId=... — full detail for one Full GATE DA Test session (admin drill-down)
router.get('/gate_da_full_score_detail', async (req, res) => {
  try {
    const { email, attemptId } = req.query
    if (!email || !attemptId) {
      return res.status(400).json({ success: false, message: 'email and attemptId are required' })
    }
    const doc = await GateDaFullScore.findOne({ _id: attemptId, email }).lean()
    if (!doc) return res.status(404).json({ success: false, message: 'Attempt not found' })

    res.json({
      success: true,
      data: {
        _id: doc._id,
        testType: 'full',
        paper: doc.paper,
        year: doc.year,
        score: doc.score,
        maxScore: doc.maxScore,
        totalQuestions: doc.totalQuestions,
        correctAnswers: doc.correctAnswers,
        wrongAnswers: doc.wrongAnswers,
        unattempted: doc.unattempted,
        sectionScores: doc.sectionScores,
        responses: doc.responses || [],
        totalTimeTaken: doc.totalTimeTaken,
        dateAttempted: doc.dateAttempted,
        studentName: doc.name,
        studentEmail: doc.email,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/gate_da_exam_detail?email=...&subject=...&attemptNumber=... — question-by-question breakdown for one attempt
router.get('/gate_da_exam_detail', async (req, res) => {
  try {
    const { email, subject, attemptNumber } = req.query
    if (!email || !subject || !attemptNumber) {
      return res.status(400).json({ success: false, message: 'email, subject, and attemptNumber are required' })
    }

    const doc = await GateDaScore.findOne({ email, subject }).lean()
    if (!doc) return res.status(404).json({ success: false, message: 'Score record not found' })

    const idx = parseInt(attemptNumber) - 1
    const attempt = (doc.attempts || [])[idx]
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' })

    const questionIds = (attempt.responses || []).map(r => r.questionId).filter(Boolean)
    const questionMeta = await GateDaQuestion.find({ _id: { $in: questionIds } }).lean()
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

    const difficultyStats = { easy: { total: 0, correct: 0 }, medium: { total: 0, correct: 0 }, hard: { total: 0, correct: 0 }, unknown: { total: 0, correct: 0 } }
    enrichedResults.forEach(r => {
      const d = r.difficulty || 'unknown'
      difficultyStats[d].total++
      if (r.isCorrect) difficultyStats[d].correct++
    })

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
          percentage: attempt.maxScore > 0 ? Math.round(Math.max(0, attempt.score / attempt.maxScore) * 100) : 0,

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

// GET /api/jee_admin_scores — all JEE Advanced attempts per student, grouped by email (for admin dashboard)
router.get('/jee_admin_scores', async (req, res) => {
  try {
    const docs = await JeeScore.find({}).lean()
    const byEmail = {}
    docs.forEach(doc => {
      if (!byEmail[doc.email]) {
        byEmail[doc.email] = { email: doc.email, name: doc.name, quizScores: [] }
      }
      ;(doc.attempts || []).forEach((attempt, i) => {
        const attempted = (attempt.correctAnswers || 0) + (attempt.wrongAnswers || 0)
        const accuracy  = attempted > 0 ? Math.round((attempt.correctAnswers / attempted) * 100) : 0
        const scorePct  = attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0
        byEmail[doc.email].quizScores.push({
          topic:          doc.subject,
          subject:        doc.subject,
          paper:          attempt.paper || 'Single',
          score:          attempt.score,
          maxScore:       attempt.maxScore,
          correctAnswers: attempt.correctAnswers,
          wrongAnswers:   attempt.wrongAnswers,
          unattempted:    attempt.unattempted,
          totalQuestions: attempt.totalQuestions,
          percentage:     scorePct,
          accuracy,
          timestamp:      attempt.dateAttempted,
          attemptNumber:  i + 1,
          responses:      attempt.responses || [],
        })
      })
    })
    res.json({ success: true, data: Object.values(byEmail) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})


// ═══ JEE Main (full-length papers + subject-wise practice) ════════════════════

// GET /api/jee_main_papers
// Groups jee_main_questions by (year, paper) and returns per-paper totals +
// per-subject question counts / marks (shape expected by the JEE Main page).
router.get('/jee_main_papers', async (req, res) => {
  try {
    const grouped = await JeeMainQuestion.aggregate([
      {
        $group: {
          _id:   { year: '$year', paper: '$paper', subject: '$subject' },
          count: { $sum: 1 },
          marks: { $sum: { $ifNull: ['$points', 4] } },
        },
      },
      {
        $group: {
          _id:            { year: '$_id.year', paper: '$_id.paper' },
          totalQuestions: { $sum: '$count' },
          totalMarks:     { $sum: '$marks' },
          subjects:       { $push: { subject: '$_id.subject', count: '$count', totalMarks: '$marks' } },
        },
      },
    ])

    const result = grouped.map(p => {
      const subjects = {}
      p.subjects.forEach(s => { subjects[s.subject] = { count: s.count, totalMarks: s.totalMarks } })
      return {
        year:           p._id.year,
        paper:          p._id.paper,
        totalQuestions: p.totalQuestions,
        totalMarks:     p.totalMarks,
        subjects,
      }
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/jee_main_questions_by_paper?year=...&paper=...  — all questions in one paper
router.get('/jee_main_questions_by_paper', async (req, res) => {
  try {
    const { year, paper } = req.query
    const filter = {}
    if (paper) filter.paper = paper
    if (year !== undefined && year !== '') {
      const yearNum = Number(year)
      // year is stored as Mixed (string or number) — match either representation
      filter.year = (!isNaN(yearNum) && String(yearNum) === String(year)) ? { $in: [year, yearNum] } : year
    }
    const qs = await JeeMainQuestion.find(filter).lean()
    res.json(qs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/jee_main_questions?subject=Physics&difficulty=easy&limit=30  — subject-wise pool
router.get('/jee_main_questions', async (req, res) => {
  try {
    const { subject, difficulty, limit } = req.query
    const filter = {}
    if (subject) filter.subject = subject
    if (difficulty) filter.difficulty = difficulty
    const qs = await JeeMainQuestion.find(filter)
      .limit(limit ? parseInt(limit) : 0)
      .lean()
    res.json(qs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/jee_main_scores — subject-wise quiz: upsert one doc per (email+subject), keep last 5
router.post('/jee_main_scores', async (req, res) => {
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

    const doc = await JeeMainScore.findOneAndUpdate(
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

// POST /api/jee_main_full_scores — full-length paper attempt (one doc per attempt)
router.post('/jee_main_full_scores', async (req, res) => {
  try {
    const { email, name, year, paper, totalQuestions, correctAnswers, wrongAnswers,
            unattempted, score, maxScore, subjectScores, responses, totalTimeTaken } = req.body
    if (!email) return res.status(400).json({ error: 'email is required' })

    const doc = await JeeMainFullScore.create({
      email, name, year, paper, totalQuestions, correctAnswers, wrongAnswers,
      unattempted, score, maxScore, subjectScores, responses, totalTimeTaken,
      dateAttempted: new Date(),
    })
    res.json({ success: true, data: { _id: doc._id } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/jee_main_full_scores?email=x@y.com — all full-paper attempts, newest first
router.get('/jee_main_full_scores', async (req, res) => {
  try {
    const { email } = req.query
    const filter = email ? { email } : {}
    const docs = await JeeMainFullScore.find(filter).sort({ dateAttempted: -1 }).lean()
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/jee_main_admin_scores — all attempts grouped per student (admin dashboard)
// Merges subject-wise practice (JeeMainScore) with full-length paper attempts (JeeMainFullScore)
router.get('/jee_main_admin_scores', async (req, res) => {
  try {
    const [practiceDocs, fullDocs] = await Promise.all([
      JeeMainScore.find({}).lean(),
      JeeMainFullScore.find({}).sort({ dateAttempted: 1 }).lean(),
    ])
    const byEmail = {}
    const ensure = (email, name) => {
      if (!byEmail[email]) byEmail[email] = { email, name, quizScores: [] }
      return byEmail[email]
    }

    practiceDocs.forEach(doc => {
      const bucket = ensure(doc.email, doc.name)
      ;(doc.attempts || []).forEach((attempt, i) => {
        const attempted = (attempt.correctAnswers || 0) + (attempt.wrongAnswers || 0)
        const accuracy  = attempted > 0 ? Math.round((attempt.correctAnswers / attempted) * 100) : 0
        const pct = attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0
        bucket.quizScores.push({
          type: 'Practice',
          topic: doc.subject,
          subject: doc.subject,
          score: attempt.score,
          maxScore: attempt.maxScore,
          correctAnswers: attempt.correctAnswers,
          wrongAnswers: attempt.wrongAnswers,
          unattempted: attempt.unattempted,
          totalQuestions: attempt.totalQuestions,
          percentage: pct,
          accuracy,
          responses: attempt.responses || [],
          timestamp: attempt.dateAttempted,
          attemptNumber: i + 1,
        })
      })
    })

    fullDocs.forEach((doc, i) => {
      const bucket = ensure(doc.email, doc.name)
      const pct   = doc.maxScore > 0 ? Math.round((doc.score / doc.maxScore) * 100) : 0
      const label = [doc.year, doc.paper].filter(Boolean).join(' · ') || 'JEE Main Paper'
      bucket.quizScores.push({
        type: 'FullPaper',
        attemptId:      doc._id,
        topic:          label,
        year:           doc.year,
        paper:          doc.paper,
        score:          doc.score,
        maxScore:       doc.maxScore,
        correctAnswers: doc.correctAnswers,
        wrongAnswers:   doc.wrongAnswers,
        unattempted:    doc.unattempted,
        totalQuestions: doc.totalQuestions,
        percentage:     pct,
        subjectScores:  doc.subjectScores,
        responses:      doc.responses,
        totalTimeTaken: doc.totalTimeTaken,
        timestamp:      doc.dateAttempted,
        attemptNumber:  i + 1,
      })
    })

    res.json({ success: true, data: Object.values(byEmail) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
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

// GET /api/sat_scores?email=x@y.com  — returns all attempts as flat records (newest first per subject)
router.get('/sat_scores', async (req, res) => {
  try {
    const { email } = req.query
    const filter = email ? { email } : {}
    const docs = await SatScore.find(filter).lean()
    const result = docs.flatMap(doc =>
      (doc.attempts || []).map(attempt => ({
        email:   doc.email,
        name:    doc.name,
        subject: doc.subject,
        ...attempt,
      }))
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})





// ─── SAT Papers aggregation ───────────────────────────────────────────────────
// GET /api/sat_papers  — groups sat_questions by (paper, year) and returns per-paper totals
router.get('/sat_papers', async (req, res) => {
  try {
    const grouped = await SatQuestion.aggregate([
      {
        // Normalise subject so both "Reading & Writing" and "Reading and Writing" collapse into one key
        $addFields: {
          _normSubject: {
            $cond: {
              if: { $regexMatch: { input: { $ifNull: ['$subject', ''] }, regex: /reading/i } },
              then: 'Reading & Writing',
              else: '$subject',
            },
          },
        },
      },
      {
        $group: {
          _id:   { paper: '$paper', year: '$year', subject: '$_normSubject' },
          count: { $sum: 1 },
          marks: { $sum: { $ifNull: ['$points', 1] } },
        },
      },
      {
        $group: {
          _id:            { paper: '$_id.paper', year: '$_id.year' },
          totalQuestions: { $sum: '$count' },
          totalMarks:     { $sum: '$marks' },
          subjects:       { $push: { subject: '$_id.subject', count: '$count', totalMarks: '$marks' } },
        },
      },
    ])

    const result = grouped.map(p => {
      const subjects = {}
      p.subjects.forEach(s => { subjects[s.subject] = { count: s.count, totalMarks: s.totalMarks } })
      return {
        paper:          p._id.paper,
        year:           p._id.year,
        totalQuestions: p.totalQuestions,
        totalMarks:     p.totalMarks,
        subjects,
      }
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/sat_full_scores — save one full-paper attempt
router.post('/sat_full_scores', async (req, res) => {
  try {
    const {
      email, name, paper, year,
      totalQuestions, correctAnswers, wrongAnswers, unattempted,
      score, maxScore, sectionScores, responses, totalTimeTaken,
    } = req.body
    if (!email || !paper) return res.status(400).json({ error: 'email and paper are required' })

    const doc = new SatFullScore({
      email, name, paper, year,
      totalQuestions, correctAnswers, wrongAnswers, unattempted,
      score, maxScore, sectionScores,
      responses: (responses || []).map(r => ({
        questionId:   r.questionId,
        subject:      r.subject,
        userResponse: r.userResponse,
        isCorrect:    r.isCorrect,
        marksAwarded: r.marksAwarded,
        unattempted:  r.unattempted,
        timeTaken:    r.timeTaken,
      })),
      totalTimeTaken,
      dateAttempted: new Date(),
    })
    await doc.save()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/sat_full_scores?email=x@y.com — all full-paper attempts newest first
router.get('/sat_full_scores', async (req, res) => {
  try {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'email is required' })
    const docs = await SatFullScore.find({ email }).sort({ dateAttempted: -1 }).lean()
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/sat_admin_scores — all attempts per student, grouped by email (for admin dashboard)
// Merges standalone module practice (SatScore) with Full SAT Test sessions (SatFullScore)
router.get('/sat_admin_scores', async (req, res) => {
  try {
    const [moduleDocs, fullDocs] = await Promise.all([
      SatScore.find({}).lean(),
      SatFullScore.find({}).sort({ dateAttempted: 1 }).lean(),
    ])
    const byEmail = {}
    const ensure = (email, name) => {
      if (!byEmail[email]) byEmail[email] = { email, name, quizScores: [] }
      return byEmail[email]
    }

    moduleDocs.forEach(doc => {
      const bucket = ensure(doc.email, doc.name)
      ;(doc.attempts || []).forEach((attempt, i) => {
        const attempted = (attempt.correctAnswers || 0) + (attempt.wrongAnswers || 0)
        const accuracy  = attempted > 0 ? Math.round((attempt.correctAnswers / attempted) * 100) : 0
        const pct = attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0
        bucket.quizScores.push({
          type: 'Module',
          topic: doc.subject,
          subject: doc.subject,
          source: attempt.source || 'Module',
          score: attempt.score,
          maxScore: attempt.maxScore,
          correctAnswers: attempt.correctAnswers,
          wrongAnswers: attempt.wrongAnswers,
          unattempted: attempt.unattempted,
          totalQuestions: attempt.totalQuestions,
          percentage: pct,
          accuracy,
          responses: attempt.responses || [],
          timestamp: attempt.dateAttempted,
          attemptNumber: i + 1,
        })
      })
    })

    fullDocs.forEach((doc, i) => {
      const bucket = ensure(doc.email, doc.name)
      const pct = doc.maxScore > 0 ? Math.round((doc.score / doc.maxScore) * 100) : 0
      bucket.quizScores.push({
        type: 'FullTest',
        attemptId: doc._id,
        topic: [doc.year, doc.paper].filter(Boolean).join(' · ') || 'Full SAT Test',
        paper: doc.paper,
        year: doc.year,
        score: doc.score,
        maxScore: doc.maxScore,
        correctAnswers: doc.correctAnswers,
        wrongAnswers: doc.wrongAnswers,
        unattempted: doc.unattempted,
        totalQuestions: doc.totalQuestions,
        percentage: pct,
        sectionScores: doc.sectionScores,
        totalTimeTaken: doc.totalTimeTaken,
        timestamp: doc.dateAttempted,
        attemptNumber: i + 1,
      })
    })

    res.json({ success: true, data: Object.values(byEmail) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/sat_full_score_detail?email=...&attemptId=... — full detail for one Full SAT Test session (admin drill-down)
router.get('/sat_full_score_detail', async (req, res) => {
  try {
    const { email, attemptId } = req.query
    if (!email || !attemptId) {
      return res.status(400).json({ success: false, message: 'email and attemptId are required' })
    }
    const doc = await SatFullScore.findOne({ _id: attemptId, email }).lean()
    if (!doc) return res.status(404).json({ success: false, message: 'Attempt not found' })

    res.json({
      success: true,
      data: {
        _id: doc._id,
        testType: 'full',
        paper: doc.paper,
        year: doc.year,
        score: doc.score,
        maxScore: doc.maxScore,
        totalQuestions: doc.totalQuestions,
        correctAnswers: doc.correctAnswers,
        wrongAnswers: doc.wrongAnswers,
        unattempted: doc.unattempted,
        sectionScores: doc.sectionScores,
        responses: doc.responses || [],
        totalTimeTaken: doc.totalTimeTaken,
        dateAttempted: doc.dateAttempted,
        studentName: doc.name,
        studentEmail: doc.email,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})


// ============================================





// NEW PROGRAMMING SINGLE COLLECTION/SCHEMA DESIGN ROUTES----->>>>>>
//GET QUESTIONS for quiz ( java , python, pdsa, dbms
// GET QUESTIONS for quiz (with week range support)
// ============================================
router.get('/mcq-questions', async (req, res) => {
  try {
    const { 
      course,      // Required: 'java', 'python', 'sql', etc.
      week,        // Optional: single week number OR range like '1-4'
      week_start,  // Optional: start week for range
      week_end,    // Optional: end week for range
      email,       // Optional: for logging/analytics
      count = 10,  // Number of questions to return
      difficulty,  // Optional: 'easy', 'medium', 'hard'
      question_type, // Optional: 'mcq', 'msq', 'true-false', 'match-pairs'
      topic,       // Optional: filter by topic
      subtopic     // Optional: filter by subtopic
    } = req.query;

    // Validation
    if (!course) {
      return res.status(400).json({
        error: 'course is required',
        example: '/api/questions?course=java&week=1-4&count=10'
      });
    }

    // ─── Build week filter ─────────────────────────────────────────
    let weekFilter = {};
    
    if (week) {
      // Check if week is a range (e.g., '1-4')
      if (week.includes('-')) {
        const [start, end] = week.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          weekFilter = { $gte: start, $lte: end };
        }
      } else {
        // Single week
        const weekNum = parseInt(week);
        if (!isNaN(weekNum) && weekNum > 0) {
          weekFilter = { $eq: weekNum };
        }
      }
    } else if (week_start && week_end) {
      // Using separate start/end parameters
      const start = parseInt(week_start);
      const end = parseInt(week_end);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        weekFilter = { $gte: start, $lte: end };
      }
    }

    // Build filter
    const filter = {
      course: course,
      is_active: true
    };
    
    if (Object.keys(weekFilter).length > 0) {
      filter.week = weekFilter;
    }
    
    if (difficulty) filter.difficulty = difficulty;
    if (question_type) filter.question_type = question_type;
    if (topic) filter.topic = topic;
    if (subtopic) filter.subtopic = subtopic;

    // Get questions pool
    let pool = await ProgrammingQuizQuestion.find(filter).lean();

    if (pool.length === 0) {
      return res.status(404).json({ 
        error: `No active questions found for ${course}`,
        filter_used: filter
      });
    }

    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Select requested number of questions
    const requestedCount = Math.min(parseInt(count), pool.length);
    const selected = pool.slice(0, requestedCount);

    // Remove answer data before sending to client
    const questionsForClient = selected.map(q => {
      const questionData = {
        _id: q._id,
        question_text: q.question_text,
        question_type: q.question_type,
        has_latex: q.has_latex,
        image_url: q.image_url,
        code_snippet: q.code_snippet,
        points: q.points,
        difficulty: q.difficulty,
        topic: q.topic,
        subtopic: q.subtopic,
        concept_tags: q.concept_tags,
        bloom_level: q.bloom_level,
        week: q.week, // Include week for reference
        solution: q.solution
      };

      if (q.question_type === 'mcq' || q.question_type === 'msq') {
        questionData.options = q.options;
      } else if (q.question_type === 'match-pairs') {
        questionData.match_pairs = {
          left_column: q.match_pairs?.left_column || [],
          right_column: q.match_pairs?.right_column || []
        };
      }

      return questionData;
    });

    return res.status(200).json({
      success: true,
      questions: questionsForClient,
      metadata: {
        course: course,
        week_range: Object.keys(weekFilter).length > 0 ? weekFilter : 'all',
        pool_size: pool.length,
        returned: questionsForClient.length,
        requested: requestedCount,
        filters_applied: {
          difficulty: difficulty || 'all',
          question_type: question_type || 'all',
          topic: topic || 'all',
          subtopic: subtopic || 'all'
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching questions:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch questions', 
      details: error.message 
    });
  }
});

// ============================================
// SUBMIT QUIZ ANSWERS (server-side grading)
// ============================================
router.post('/mcq-quiz/submit', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email, username, quizData } = req.body;

    if (!email || !quizData) {
      return res.status(400).json({ error: 'email and quizData are required' });
    }

    const {
      course,
      week,
      topic,
      questionResults: clientResults,
      startTime,
      endTime,
      totalTimeTaken,
      cheatCount
    } = quizData;

    if (!course || !week) {
      return res.status(400).json({ error: 'course and week are required in quizData' });
    }

    if (!Array.isArray(clientResults) || clientResults.length === 0) {
      return res.status(400).json({ error: 'questionResults array is required' });
    }

    // ── 1. Fetch correct answers from DB ───────────────────────────
    const questionIds = clientResults.map(qr => qr.questionId).filter(Boolean);
    const questions = await ProgrammingQuizQuestion.find({ _id: { $in: questionIds } }).lean();
    const questionMap = {};
    questions.forEach(q => { questionMap[String(q._id)] = q; });

    // ── 2. Grade each question server-side ─────────────────────────
    let totalScore = 0;
    let correctCount = 0;
    const difficultyBreakdown = {
      easy:   { attempted: 0, correct: 0 },
      medium: { attempted: 0, correct: 0 },
      hard:   { attempted: 0, correct: 0 }
    };

    const gradedResults = clientResults.map(cr => {
      const q = questionMap[String(cr.questionId)];
      if (!q) return {
        questionId: cr.questionId, isCorrect: false, marksAwarded: 0,
        userAnswer: cr.userAnswer, timeTaken: cr.timeTaken || 0,
        difficulty: 'medium', topic: topic || '', subtopic: '',
        question_type: 'mcq', concept_tags: [], bloom_level: 'apply'
      };

      const userAns = cr.userAnswer;
      const correct = q.answers?.correct;
      let isCorrect = false;

      // ─── Grade based on question type ─────────────────────────────
      if (q.question_type === 'mcq') {
        const correctOpt = q.options?.find(o => o.id === correct || o.text === correct);
        const userOpt = q.options?.find(o => o.id === userAns || o.text === userAns);
        isCorrect = !!(correctOpt && userOpt && correctOpt.id === userOpt.id);
        
      } else if (q.question_type === 'msq') {
        const correctArr = (Array.isArray(correct) ? correct : [correct]).map(String).sort();
        const userArr = (Array.isArray(userAns) ? userAns : (userAns ? [userAns] : [])).map(String).sort();
        isCorrect = JSON.stringify(correctArr) === JSON.stringify(userArr);
        
      } else if (q.question_type === 'match-pairs') {
        // For match-pairs: userAnswer should be an object mapping left_id to right_id
        // Example: { "left_1": "right_3", "left_2": "right_1" }
        const correctMatches = q.match_pairs?.correct_matches || new Map();
        const userMatches = userAns || {};
        
        // Count how many matches are correct
        let correctMatchesCount = 0;
        let totalMatches = Object.keys(userMatches).length;
        
        // Convert Map to object for comparison
        const correctMatchesObj = {};
        if (correctMatches instanceof Map) {
          correctMatches.forEach((value, key) => {
            correctMatchesObj[key] = value;
          });
        } else {
          Object.assign(correctMatchesObj, correctMatches);
        }
        
        // Check each user match
        Object.keys(userMatches).forEach(leftId => {
          if (correctMatchesObj[leftId] === userMatches[leftId]) {
            correctMatchesCount++;
          }
        });
        
        // All matches must be correct for full credit
        // You could also award partial credit if needed
        isCorrect = correctMatchesCount === totalMatches && totalMatches > 0;
        
      } else if (q.question_type === 'numeric') {
        const tolerance = q.answers?.tolerance || 0;
        const userNum = parseFloat(userAns);
        const correctNum = parseFloat(correct);
        isCorrect = !isNaN(userNum) && Math.abs(userNum - correctNum) <= tolerance;
        
      } else if (q.question_type === 'true-false') {
        isCorrect = String(userAns).toLowerCase() === String(correct).toLowerCase();
        
      } else if (q.question_type === 'interview') {
        // Interview questions are manually graded, so mark as pending
        // For now, we'll mark them as correct (they'll be reviewed later)
        isCorrect = true; // Or you could set a flag for manual review
      }

      const marksAwarded = isCorrect ? (q.points || 1) : 0;
      if (isCorrect) { correctCount++; totalScore += marksAwarded; }

      const diff = q.difficulty || 'medium';
      if (difficultyBreakdown[diff]) {
        difficultyBreakdown[diff].attempted++;
        if (isCorrect) difficultyBreakdown[diff].correct++;
      }

      // ─── Build result object ────────────────────────────────────────
      const result = {
        questionId: cr.questionId,
        isCorrect,
        marksAwarded,
        userAnswer: userAns ?? null,
        timeTaken: cr.timeTaken || 0,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || [],
        correct_answer: q.answers?.correct,
        code_snippet: q.code_snippet || null,
        image_url: q.image_url || null,
        solution: q.solution || null,
        points: q.points || 1,
        difficulty: q.difficulty || 'medium',
        topic: q.topic || topic || '',
        subtopic: q.subtopic || '',
        concept_tags: q.concept_tags || [],
        bloom_level: q.bloom_level || 'apply'
      };

      // Add match_pairs data if applicable
      if (q.question_type === 'match-pairs') {
        result.match_pairs = {
          left_column: q.match_pairs?.left_column || [],
          right_column: q.match_pairs?.right_column || [],
          correct_matches: q.match_pairs?.correct_matches || {}
        };
      }

      return result;
    });

    const maxPossibleScore = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const finalPercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

    // ── 3. Save attempt summary ────────────────────────────────────
    const [attempt] = await ProgrammingQuizAttempt.create([{
      email,
      username: username || email.split('@')[0],
      course,
      week: parseInt(week),
      topic: topic || '',
      score: totalScore,
      max_possible_score: maxPossibleScore,
      percentage: finalPercentage,
      total_questions: clientResults.length,
      correct_answers: correctCount,
      easy_attempted:   difficultyBreakdown.easy.attempted,
      easy_correct:     difficultyBreakdown.easy.correct,
      medium_attempted: difficultyBreakdown.medium.attempted,
      medium_correct:   difficultyBreakdown.medium.correct,
      hard_attempted:   difficultyBreakdown.hard.attempted,
      hard_correct:     difficultyBreakdown.hard.correct,
      total_time_seconds: totalTimeTaken || 0,
      started_at: new Date(startTime),
      submitted_at: new Date(endTime),
      is_completed: true,
      cheat_count: cheatCount || 0
    }], { session });

    // ── 4. Save per-question results ───────────────────────────────
    const resultDocs = gradedResults.map(gr => ({
      attempt_id: attempt._id,
      email,
      course,
      week: parseInt(week),
      question_id: gr.questionId,
      user_answer: gr.userAnswer,
      is_correct: gr.isCorrect,
      marks_awarded: gr.marksAwarded,
      time_taken_seconds: gr.timeTaken,
      difficulty: gr.difficulty,
      topic: gr.topic,
      subtopic: gr.subtopic,
      question_type: gr.question_type,
      concept_tags: gr.concept_tags,
      bloom_level: gr.bloom_level
    }));

    await ProgrammingQuizResult.insertMany(resultDocs, { session });
    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      attempt_id: attempt._id,
      message: 'Quiz saved successfully',
      stats: {
        score: totalScore,
        maxPossibleScore,
        percentage: finalPercentage,
        correct: correctCount,
        total: clientResults.length
      },
      question_results: gradedResults  // Full review data returned to client
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('❌ Error saving quiz attempt:', error);
    return res.status(500).json({ error: 'Failed to save quiz attempt', details: error.message });
  } finally {
    session.endSession();
  }
});

// ============================================
// GET ALL ATTEMPTS for a user (with filters)
// ============================================
router.get('/mcq-quiz/attempts', async (req, res) => {
  try {
    const { email, course } = req.query;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const filter = { email };
    if (course) filter.course = course;

    const attempts = await ProgrammingQuizAttempt.find(filter)
      .sort({ submitted_at: -1 })
      .lean();

    return res.status(200).json({ success: true, attempts });
  } catch (error) {
    console.error('❌ Error fetching attempts:', error);
    return res.status(500).json({ error: 'Failed to fetch attempts', details: error.message });
  }
});

// ============================================
// ADMIN: GET ALL ATTEMPTS ACROSS ALL STUDENTS
// ============================================
router.get('/mcq-quiz/admin/attempts', async (req, res) => {
  try {
    const { course } = req.query;

    const filter = {};
    if (course) filter.course = course;

    const attempts = await ProgrammingQuizAttempt.find(filter)
      .sort({ submitted_at: -1 })
      .lean();

    return res.status(200).json({ success: true, attempts });
  } catch (error) {
    console.error('❌ Error fetching admin attempts:', error);
    return res.status(500).json({ error: 'Failed to fetch attempts', details: error.message });
  }
});

// ============================================
// GET question results for a specific attempt
// ============================================
router.get('/mcq-quiz/attempt/:attemptId/results', async (req, res) => {
  try {
    const { attemptId } = req.params;
    
    const results = await ProgrammingQuizResult.find({ attempt_id: attemptId })
      .sort({ _id: 1 })
      .lean();
    
    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error('❌ Error fetching question results:', error);
    return res.status(500).json({ error: 'Failed to fetch question results', details: error.message });
  }
});

// ============================================
// GET questions by multiple IDs (for review page)
// ============================================
router.get('/mcq-questions/by-ids', async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ error: 'ids parameter is required' });
    }

    const idArray = ids.split(',').filter(Boolean);
    if (idArray.length === 0) {
      return res.status(400).json({ error: 'No valid question IDs provided' });
    }

    const questions = await ProgrammingQuizQuestion.find({
      _id: { $in: idArray }
    }).lean();

    // Remove sensitive data before sending
    const sanitizedQuestions = questions.map(q => {
      const questionData = {
        _id: q._id,
        question_text: q.question_text,
        question_type: q.question_type,
        has_latex: q.has_latex,
        image_url: q.image_url,
        code_snippet: q.code_snippet,
        points: q.points,
        difficulty: q.difficulty,
        topic: q.topic,
        subtopic: q.subtopic,
        concept_tags: q.concept_tags,
        bloom_level: q.bloom_level,
        solution: q.solution
      };

      if (q.question_type === 'mcq' || q.question_type === 'msq') {
        questionData.options = q.options;
      } else if (q.question_type === 'match-pairs') {
        // Include match_pairs data for review (including correct_matches)
        questionData.match_pairs = {
          left_column: q.match_pairs?.left_column || [],
          right_column: q.match_pairs?.right_column || [],
          correct_matches: q.match_pairs?.correct_matches || {}
        };
      }

      return questionData;
    });

    return res.status(200).json({
      success: true,
      questions: sanitizedQuestions
    });
  } catch (error) {
    console.error('❌ Error fetching questions by IDs:', error);
    return res.status(500).json({ error: 'Failed to fetch questions', details: error.message });
  }
});



// ============================================
// NEW CODING/PROGRAMMING QUIZ ROUTES (CodingQuestions / CodingSubmission / CodingTestCase)
// ============================================

// GET /api/coding-questions?course=&week=&topic=&difficulty=&language=
router.get('/coding-questions', async (req, res) => {
  try {
    const { 
      course, 
      week, 
      topic, 
      difficulty, 
      language,
      limitPerDifficulty // ✅ NEW: limit per difficulty level
    } = req.query;
    
    if (!course || !week) {
      return res.status(400).json({ error: 'course and week are required' });
    }

    // ✅ Build base filter
    const filter = { 
      course, 
      week: Number(week), 
      is_active: true 
    };
    
    if (topic) filter.topic = topic;
    if (language) filter.language = language;

    let questions = [];

    // ✅ NEW: Handle difficulty-based random selection
    if (limitPerDifficulty) {
      const limit = parseInt(limitPerDifficulty, 10);
      
      // Define difficulties to fetch
      const difficulties = ['easy', 'medium', 'hard'];
      
      // Fetch questions for each difficulty
      for (const diff of difficulties) {
        const diffFilter = { ...filter, difficulty: diff };
        
        // Get all questions for this difficulty
        const diffQuestions = await CodingQuestion.find(diffFilter)
          .lean();
        
        // Shuffle and pick 'limit' number of questions
        const shuffled = shuffleArray(diffQuestions);
        const selected = shuffled.slice(0, limit);
        
        questions = [...questions, ...selected];
        
        console.log(`📊 ${diff}: found ${diffQuestions.length}, selected ${selected.length}`);
      }
      
      // ✅ Shuffle the combined questions to mix difficulties
      questions = shuffleArray(questions);
      
    } else {
      // ✅ Original behavior: fetch all questions
      questions = await CodingQuestion.find(filter)
        .sort({ difficulty: 1 })
        .lean();
    }

    if (questions.length === 0) {
      return res.status(200).json({ success: true, questions: [] });
    }

    // Remove solution and format test_cases
    const result = questions.map(({ solution, ...rest }) => ({
      ...rest,
      test_cases: rest.test_cases || [],
      testCases: rest.test_cases || []
    }));

    console.log(`📋 Returning ${result.length} questions with embedded test cases`);

    return res.status(200).json({ 
      success: true, 
      questions: result,
      meta: {
        total: result.length,
        difficulties: {
          easy: result.filter(q => q.difficulty === 'easy').length,
          medium: result.filter(q => q.difficulty === 'medium').length,
          hard: result.filter(q => q.difficulty === 'hard').length
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching coding questions:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch coding questions', 
      details: error.message 
    });
  }
});

// ✅ Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// POST /api/coding-submit
router.post('/coding-submit', async (req, res) => {
  try {
    const { 
      email, 
      username, 
      course, 
      week, 
      topic, 
      results 
    } = req.body;
    
    if (!email || !course || !week || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ 
        error: 'email, course, week and results are required' 
      });
    }

    const docs = [];
    const bulkOps = [];

    for (const r of results) {
      const { 
        questionId, 
        language, 
        sourceCode, 
        verdict, 
        passed_testcases, 
        total_testcases, 
        score, 
        percentage, 
        execution_time_ms,
        test_case_results = [] // ✅ NEW: Store individual test results
      } = r;
      
      if (!questionId || !language || sourceCode === undefined) continue;

      // Get submission count for this question
      const submissionCount = await CodingSubmission.countDocuments({ 
        email, 
        question_id: questionId 
      });

      const submission = {
        email,
        username: username || email.split('@')[0],
        question_id: questionId,
        course,
        week: Number(week),
        topic: r.topic || topic,
        language,
        source_code: sourceCode,
        verdict: verdict || 'Wrong Answer',
        passed_testcases: passed_testcases || 0,
        total_testcases: total_testcases || 0,
        score: score || 0,
        percentage: percentage || 0,
        execution_time_ms: execution_time_ms ?? null,
        submission_number: submissionCount + 1,
        test_case_results: test_case_results || [], // ✅ NEW
        is_best_attempt: false // Will be updated later
      };

      docs.push(submission);
      
      // ✅ Track for best attempt update
      bulkOps.push({
        updateOne: {
          filter: { 
            email, 
            question_id: questionId,
            is_best_attempt: true 
          },
          update: { 
            $set: { 
              is_best_attempt: false 
            } 
          }
        }
      });
    }

    if (docs.length === 0) {
      return res.status(400).json({ error: 'No valid submission results provided' });
    }

    // ✅ Save submissions
    const saved = await CodingSubmission.insertMany(docs);
    
    // ✅ Mark the best submission per question (highest percentage)
    for (const doc of saved) {
      // Find the best submission for this question
      const best = await CodingSubmission.findOne({
        email,
        question_id: doc.question_id
      }).sort({ 
        percentage: -1,  // Higher percentage is better
        passed_testcases: -1, // If same percentage, more passed is better
        createdAt: -1 // If same, latest is better
      });
      
      if (best) {
        await CodingSubmission.updateMany(
          { 
            email, 
            question_id: doc.question_id,
            _id: { $ne: best._id }
          },
          { $set: { is_best_attempt: false } }
        );
        
        await CodingSubmission.updateOne(
          { _id: best._id },
          { $set: { is_best_attempt: true } }
        );
      }
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Submissions saved', 
      count: saved.length, 
      submissions: saved 
    });

  } catch (error) {
    console.error('❌ Error saving coding submission:', error);
    return res.status(500).json({ 
      error: 'Failed to save submission', 
      details: error.message 
    });
  }
});

// GET /api/coding-submissions?email=&course=&week=&questionId=
router.get('/coding-submissions', async (req, res) => {
  try {
    const { email, course, week, questionId } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const filter = { email };
    if (course) filter.course = course;
    if (week) filter.week = Number(week);
    if (questionId) filter.question_id = questionId;

    // ✅ Get submissions with populated question details
    const submissions = await CodingSubmission.find(filter)
      .populate('question_id', 'title question_text difficulty language') // Populate question fields
      .sort({ createdAt: -1 })
      .lean();

    // ✅ Format response
    const formatted = submissions.map(s => ({
      ...s,
      question_title: s.question_id?.title || 'Unknown Question',
      question_difficulty: s.question_id?.difficulty || 'unknown'
    }));

    return res.status(200).json({ 
      success: true, 
      submissions: formatted,
      count: formatted.length 
    });

  } catch (error) {
    console.error('❌ Error fetching coding submissions:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch coding submissions', 
      details: error.message 
    });
  }
});

// Returns per-week best-attempt progress, used by CoursePage to show coding progress
// GET /api/coding-progress?email=&course=
router.get('/coding-progress', async (req, res) => {
  try {
    const { email, course } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const filter = { email };
    if (course) filter.course = course;

    // ✅ Get all submissions with best attempts flagged
    const submissions = await CodingSubmission.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // ✅ Group by question and get best attempt
    const bestByQuestion = {};
    submissions.forEach(s => {
      const qid = s.question_id.toString();
      if (!bestByQuestion[qid] || s.percentage > bestByQuestion[qid].percentage) {
        bestByQuestion[qid] = s;
      }
    });

    // ✅ Aggregate per week
    const weekMap = {};
    Object.values(bestByQuestion).forEach(s => {
      const key = `${s.course}_${s.week}`;
      if (!weekMap[key]) {
        weekMap[key] = {
          course: s.course,
          week: s.week,
          topic: s.topic,
          totalQuestions: 0,
          solvedQuestions: 0,
          totalPercentage: 0,
          submissions: []
        };
      }
      
      weekMap[key].totalQuestions += 1;
      weekMap[key].totalPercentage += s.percentage;
      weekMap[key].submissions.push(s);
      
      // ✅ Check if solved (100% or 'Accepted' verdict)
      if (s.verdict === 'Accepted' || s.percentage === 100) {
        weekMap[key].solvedQuestions += 1;
      }
    });

    const progress = Object.values(weekMap).map(w => ({
      ...w,
      averagePercentage: w.totalQuestions > 0 ? Math.round(w.totalPercentage / w.totalQuestions) : 0,
      // ✅ Add progress bar data
      progressData: w.submissions.map(s => ({
        questionId: s.question_id,
        title: s.title || 'Question',
        percentage: s.percentage,
        verdict: s.verdict
      }))
    }));

    // ✅ Sort by week
    progress.sort((a, b) => a.week - b.week);

    return res.status(200).json({ 
      success: true, 
      progress,
      totalQuestions: Object.keys(bestByQuestion).length,
      totalSolved: Object.values(bestByQuestion).filter(s => 
        s.verdict === 'Accepted' || s.percentage === 100
      ).length
    });

  } catch (error) {
    console.error('❌ Error fetching coding progress:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch coding progress', 
      details: error.message 
    });
  }
});


// POST /api/run-code — JDoodle API proxy
router.post('/run-code', async (req, res) => {
  try {
    const { language = 'java', source, stdin = '' } = req.body;

    // Map your frontend language names to JDoodle's expected format
    const languageMap = {
      java: { language: 'java', versionIndex: '4' },      // Java 17
      python: { language: 'python3', versionIndex: '4' },  // Python 3
      sql: { language: 'sql', versionIndex: '1' },         // SQLite
      // add more languages as needed
    };

    // Check if source is provided
    if (!source) {
      return res.status(400).json({ error: 'source is required' });
    }

    // Get the language configuration
    const langConfig = languageMap[language];
    if (!langConfig) {
      return res.status(400).json({ 
        error: `Unsupported language: ${language}. Supported languages: ${Object.keys(languageMap).join(', ')}` 
      });
    }

    // Check credentials
    const clientId = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ 
        error: 'JDoodle credentials missing. Please set JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET in .env' 
      });
    }

    // Make JDoodle API call
    const response = await fetch('https://api.jdoodle.com/v1/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        script: source,
        stdin: stdin || '',
        language: langConfig.language,      // ✅ Use the mapped language
        versionIndex: langConfig.versionIndex, // ✅ Use the mapped version
        clientId: clientId,
        clientSecret: clientSecret
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ 
        error: 'JDoodle API error', 
        details: text 
      });
    }

    const data = await response.json();
    
    // Check if there's an error from JDoodle
    if (data.error) {
      console.error('❌ JDoodle execution error:', data.error);
      return res.status(200).json({
        success: false,
        stdout: '',
        stderr: data.error,
        compile_output: data.error,
        exit_code: -1
      });
    }
    
    return res.status(200).json({
      success: true,
      stdout: data.output || '',
      stderr: data.error || '',
      compile_output: '',
      exit_code: data.statusCode || 0
    });

  } catch (error) {
    console.error('❌ JDoodle error:', error);
    return res.status(500).json({ 
      error: 'Code execution failed', 
      details: error.message 
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
      codingUsers, pdsaUsers,
      progAttempts,  // This is ProgrammingQuizAttempt for Java, Python, SQL, DSA
      satDocs, jeeAdvDocs, jeeMainDocs, jeeMainFullDocs, greDocs,
      gateDaDocs, gateDaFullDocs, gmatDocs, catDocs, catFullDocs,
      // Add these for additional course data
      javaSubmissions, pythonSubmissions, sqlSubmissions, dsaSubmissions,
      dbmsSubmissions
    ] = await Promise.all([
      // Existing queries
      iitm_math_score.find({}, { email:1, username:1, name:1,
        'quizScores.topic':1, 'quizScores.score':1, 'quizScores.percentage':1,
        'quizScores.correctAnswers':1, 'quizScores.totalQuestions':1, 'quizScores.timestamp':1
      }).lean().catch(() => []),
      Statistics_scores.find({}, { email:1, username:1, name:1,
        'quizScores.topic':1, 'quizScores.percentage':1,
        'quizScores.correctAnswers':1, 'quizScores.totalQuestions':1, 'quizScores.timestamp':1
      }).lean().catch(() => []),
      iitm_ct_scores.find({}, { email:1, username:1, name:1,
        'quizScores.topic':1, 'quizScores.score':1, 'quizScores.percentage':1,
        'quizScores.totalQuestions':1, 'quizScores.timestamp':1
      }).lean().catch(() => []),
      IITM_Maths_2_Score.find({}, { email:1, name:1,
        'scores.week':1, 'scores.subtopic':1, 'scores.score':1,
        'scores.correctAnswers':1, 'scores.totalQuestions':1, 'scores.dateAttempted':1
      }).lean().catch(() => []),
      // FIX: Stats 2 - using QuizAttemptstats2
      QuizAttemptstats2.find({}, { email:1, username:1, week:1, topic:1, 
        score:1, correct_answers:1, total_questions:1, percentage:1, submitted_at:1
      }).lean().catch(() => []),
      pdsaCodingSubmission.find({}, { email:1, username:1, name:1, topic:1, 
        percentage:1, score:1, maxScore:1, timestamp:1
      }).lean().catch(() => []),
      pdsaSubmission.find({}, { email:1, username:1, name:1, topic:1, 
        percentage:1, score:1, maxScore:1, timestamp:1
      }).lean().catch(() => []),
      // Programming Quiz Attempts (Java, Python, SQL, DSA)
      ProgrammingQuizAttempt.find({}, { email:1, username:1, course:1, week:1, 
        topic:1, percentage:1, score:1, submitted_at:1
      }).lean().catch(() => []),
      // Exam scores
      SatScore.find({}, { email:1, name:1, subject:1,
        'attempts.score':1, 'attempts.maxScore':1, 'attempts.correctAnswers':1,
        'attempts.totalQuestions':1, 'attempts.dateAttempted':1
      }).lean().catch(() => []),
      JeeScore.find({}, { email:1, name:1, subject:1,
        'attempts.score':1, 'attempts.maxScore':1, 'attempts.correctAnswers':1,
        'attempts.totalQuestions':1, 'attempts.paper':1, 'attempts.dateAttempted':1
      }).lean().catch(() => []),
      JeeMainScore.find({}, { email:1, name:1, subject:1,
        'attempts.score':1, 'attempts.maxScore':1, 'attempts.correctAnswers':1,
        'attempts.totalQuestions':1, 'attempts.dateAttempted':1
      }).lean().catch(() => []),
      JeeMainFullScore.find({}, { email:1, name:1, paper:1, year:1,
        score:1, maxScore:1, correctAnswers:1, totalQuestions:1, dateAttempted:1
      }).lean().catch(() => []),
      GreScore.find({}, { email:1, name:1, subject:1,
        'attempts.score':1, 'attempts.maxScore':1, 'attempts.correctAnswers':1,
        'attempts.totalQuestions':1, 'attempts.dateAttempted':1
      }).lean().catch(() => []),
      GateDaScore.find({}, { email:1, name:1, subject:1,
        'attempts.score':1, 'attempts.maxScore':1, 'attempts.correctAnswers':1,
        'attempts.totalQuestions':1, 'attempts.dateAttempted':1
      }).lean().catch(() => []),
      GateDaFullScore.find({}, { email:1, name:1, paper:1, year:1,
        score:1, maxScore:1, correctAnswers:1, totalQuestions:1, dateAttempted:1
      }).lean().catch(() => []),
      GmatScore.find({}, { email:1, name:1, subject:1,
        'attempts.score':1, 'attempts.maxScore':1, 'attempts.correctAnswers':1,
        'attempts.totalQuestions':1, 'attempts.dateAttempted':1
      }).lean().catch(() => []),  
      CatScore.find({}, { email:1, name:1, subject:1,
        'attempts.score':1, 'attempts.maxScore':1, 'attempts.correctAnswers':1,
        'attempts.totalQuestions':1, 'attempts.dateAttempted':1
      }).lean().catch(() => []),
      CatFullScore.find({}, { email:1, name:1, paper:1, year:1,
        score:1, maxScore:1, correctAnswers:1, totalQuestions:1, dateAttempted:1
      }).lean().catch(() => []),
  
        
      // ADD: Java submissions from JavaSubmission model
      JavaSubmission.find({}, { email:1, username:1, topic:1, score:1, 
        maxScore:1, percentage:1, timestamp:1
      }).lean().catch(() => []),
      // ADD: Python submissions (if you have a PythonSubmission model)
      // If not, you might need to create one or use the same ProgrammingQuizAttempt
      // For now, using ProgrammingQuizAttempt filtered for python
      ProgrammingQuizAttempt.find({ course: 'python' }, { email:1, username:1, 
        topic:1, score:1, maxScore:1, percentage:1, submitted_at:1
      }).lean().catch(() => []),
      // ADD: SQL submissions (if you have a SQLSubmission model)
      ProgrammingQuizAttempt.find({ course: 'sql' }, { email:1, username:1, 
        topic:1, score:1, maxScore:1, percentage:1, submitted_at:1
      }).lean().catch(() => []),
      // ADD: DSA submissions (if you have a DSASubmission model)
      ProgrammingQuizAttempt.find({ course: 'dsa' }, { email:1, username:1, 
        topic:1, score:1, maxScore:1, percentage:1, submitted_at:1
      }).lean().catch(() => []),
      // ADD: DBMS submissions
      DBMSSubmission.find({}, { email:1, username:1, topic:1, score:1, 
        maxScore:1, percentage:1, timestamp:1
      }).lean().catch(() => [])
    ])

    const all = []

    const push = (arr, subject, subjectKey, icon, iconClass, mapFn) =>
      arr.forEach(s => mapFn(s).forEach(n => all.push({ ...n, subject, subjectKey, icon, iconClass })))

    // (each section is posted via its own request a few seconds/minutes apart).
    const SESSION_GAP_MS = 15 * 60 * 1000
    const groupSectionAttempts = (docs) => {
      const byUser = {}
      docs.forEach(doc => {
        ;(doc.attempts || []).forEach(attempt => {
          if (!attempt.dateAttempted) return
          const key = doc.email || doc.name
          if (!byUser[key]) byUser[key] = []
          byUser[key].push({
            userName: doc.name || doc.email,
            section: doc.subject,
            score: attempt.score || 0,
            maxScore: attempt.maxScore || 0,
            timestamp: attempt.dateAttempted,
          })
        })
      })

      const sessions = []
      Object.values(byUser).forEach(attempts => {
        attempts.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        let current = null
        attempts.forEach(a => {
          const t = new Date(a.timestamp).getTime()
          if (current && t - current.lastTs <= SESSION_GAP_MS) {
            current.items.push(a)
            current.lastTs = t
          } else {
            current = { items: [a], lastTs: t }
            sessions.push(current)
          }
        })
      })

      return sessions.map(({ items }) => {
        const totalScore = items.reduce((sum, a) => sum + a.score, 0)
        const totalMax = items.reduce((sum, a) => sum + a.maxScore, 0)
        const pct = totalMax > 0 ? Math.round(Math.max(0, totalScore / totalMax) * 100) : 0
        const latest = items[items.length - 1]
        return {
          userName: latest.userName,
          score: pct,
          marks: totalScore,
          maxMarks: totalMax,
          sections: items.map(a => a.section),
          timestamp: latest.timestamp,
        }
      })
    }

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

    // Stats 2 - FIXED: using QuizAttemptstats2
    stats2Users.forEach(s => {
      if (s.email) {
        all.push({
          userName: s.username || s.name || s.email,
          subject: 'Statistics-2',
          subjectKey: 'stats2',
          icon: 'bi-bar-chart',
          iconClass: 'stats2',
          topic: s.topic || `Week ${s.week || '?'}`,
          score: s.percentage || (s.total_questions ? Math.round((s.correct_answers / s.total_questions) * 100) : 0),
          timestamp: s.submitted_at
        })
      }
    })

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

    // Programming courses (Java, Python, SQL, DSA)
    const progCourseMap = {
      java:   { label: 'Java Programming',            icon: 'bi-cup-hot-fill',    iconClass: 'java'   },
      python: { label: 'Python Programming',          icon: 'bi-filetype-py',     iconClass: 'python' },
      sql:    { label: 'SQL & Databases',             icon: 'bi-database-fill',   iconClass: 'sql'    },
      dsa:    { label: 'Data Structures & Algorithms',icon: 'bi-diagram-3-fill',  iconClass: 'dsa'    },
    }
    
    // Process Programming Quiz Attempts
    progAttempts
      .filter(a => a.email && a.email.toLowerCase() !== 'test@example.com')
      .forEach(a => {
        const cm = progCourseMap[a.course] || { label: a.course || 'Programming', icon: 'bi-code-slash', iconClass: 'programming' }
        all.push({
          userName: a.username || a.email,
          subject: cm.label,
          subjectKey: a.course || 'programming',
          icon: cm.icon,
          iconClass: cm.iconClass,
          topic: a.topic ? `Week ${a.week} — ${a.topic}` : `Week ${a.week || '?'}`,
          score: a.percentage || 0,
          timestamp: a.submitted_at
        })
      })

    // Java Submissions
    javaSubmissions
      .filter(s => s.email && s.email.toLowerCase() !== 'test@example.com')
      .forEach(s => all.push({
        userName: s.username || s.email,
        subject: 'Java Programming',
        subjectKey: 'java',
        icon: 'bi-cup-hot-fill',
        iconClass: 'java',
        topic: s.topic || 'Java Quiz',
        score: s.percentage || (s.score != null && s.maxScore ? Math.round((s.score/s.maxScore)*100) : 0),
        timestamp: s.timestamp
      }))

    // SQL Submissions
    sqlSubmissions
      .filter(s => s.email && s.email.toLowerCase() !== 'test@example.com')
      .forEach(s => all.push({
        userName: s.username || s.email,
        subject: 'SQL & Databases',
        subjectKey: 'sql',
        icon: 'bi-database-fill',
        iconClass: 'sql',
        topic: s.topic || 'SQL Quiz',
        score: s.percentage || (s.score != null && s.maxScore ? Math.round((s.score/s.maxScore)*100) : 0),
        timestamp: s.submitted_at
      }))

    // DSA Submissions
    dsaSubmissions
      .filter(s => s.email && s.email.toLowerCase() !== 'test@example.com')
      .forEach(s => all.push({
        userName: s.username || s.email,
        subject: 'Data Structures & Algorithms',
        subjectKey: 'dsa',
        icon: 'bi-diagram-3-fill',
        iconClass: 'dsa',
        topic: s.topic || 'DSA Quiz',
        score: s.percentage || (s.score != null && s.maxScore ? Math.round((s.score/s.maxScore)*100) : 0),
        timestamp: s.submitted_at
      }))

    // DBMS Submissions
    dbmsSubmissions
      .filter(s => s.email && s.email.toLowerCase() !== 'test@example.com')
      .forEach(s => all.push({
        userName: s.username || s.email,
        subject: 'DBMS',
        subjectKey: 'dbms',
        icon: 'bi-database-fill',
        iconClass: 'dbms',
        topic: s.topic || 'DBMS Quiz',
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
          subject: 'SAT',
          subjectKey: 'sat',
          icon: 'bi-pencil-fill',
          iconClass: 'sat',
          topic: doc.subject || 'SAT Section',
          score: pct,
          timestamp: attempt.dateAttempted
        })
      })
    })

      
    // JEE Advanced
    jeeAdvDocs.forEach(doc => {
      ;(doc.attempts || []).forEach(attempt => {
        const pct = attempt.totalQuestions > 0
          ? Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)
          : (attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0)
        all.push({
          userName: doc.name || doc.email,
          subject: 'JEE Advanced',
          subjectKey: 'jee_adv',
          icon: 'bi-trophy-fill',
          iconClass: 'jee',
          topic: `${doc.subject}${attempt.paper ? ' — ' + attempt.paper : ''}`,
          score: pct,
          timestamp: attempt.dateAttempted
        })
      })
    })

    // JEE Main (subject-wise)
    jeeMainDocs.forEach(doc => {
      ;(doc.attempts || []).forEach(attempt => {
        const pct = attempt.totalQuestions > 0
          ? Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)
          : (attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0)
        all.push({
          userName: doc.name || doc.email,
          subject: 'JEE Main',
          subjectKey: 'jee_main',
          icon: 'bi-journal-text',
          iconClass: 'jee',
          topic: doc.subject || 'JEE Main',
          score: pct,
          timestamp: attempt.dateAttempted
        })
      })
    })

    // JEE Main (full paper)
    jeeMainFullDocs.forEach(doc => {
      const pct = doc.totalQuestions > 0
        ? Math.round((doc.correctAnswers / doc.totalQuestions) * 100)
        : (doc.maxScore > 0 ? Math.round((doc.score / doc.maxScore) * 100) : 0)
      all.push({
        userName: doc.name || doc.email,
        subject: 'JEE Main',
        subjectKey: 'jee_main',
        icon: 'bi-journal-text',
        iconClass: 'jee',
        topic: doc.paper ? `${doc.paper}${doc.year ? ' ' + doc.year : ''}` : 'Full Paper',
        score: pct,
        timestamp: doc.dateAttempted
      })
    })

    // GRE
    greDocs.forEach(doc => {
      ;(doc.attempts || []).forEach(attempt => {
        const pct = attempt.totalQuestions > 0
          ? Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)
          : (attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0)
        all.push({
          userName: doc.name || doc.email,
          subject: 'GRE',
          subjectKey: 'gre',
          icon: 'bi-mortarboard-fill',
          iconClass: 'gre',
          topic: doc.subject || 'GRE Section',
          score: pct,
          timestamp: attempt.dateAttempted
        })
      })
    })

     // GATE DA (module-wise practice only — attempts made as part of a Full Test
       // are reported once as a single combined notification below, not per-section)
    gateDaDocs.forEach(doc => {
      ;(doc.attempts || []).forEach(attempt => {
        if (attempt.source === 'FullTest') return
        const pct = attempt.maxScore > 0
          ? Math.round(Math.max(0, attempt.score / attempt.maxScore) * 100)
          : 0
        all.push({
          userName: doc.name || doc.email,
          subject: 'GATE DA',
          subjectKey: 'gate_da',
          icon: 'bi-graph-up',
          iconClass: 'gate-da',
          topic: doc.subject || 'GATE DA Module',
          score: pct,
          timestamp: attempt.dateAttempted
        })
      })
    })

    // GATE DA (full test) — one combined notification per full-test attempt,
    // covering both exam sections: General Aptitude and the Main Subject (Data Science & AI)
    gateDaFullDocs.forEach(doc => {
      const pct = doc.maxScore > 0
        ? Math.round(Math.max(0, doc.score / doc.maxScore) * 100)
        : 0
      all.push({
        userName: doc.name || doc.email,
        subject: 'GATE DA',
        subjectKey: 'gate_da',
        icon: 'bi-graph-up',
        iconClass: 'gate-da',
        topic: 'Aptitude and Main Subject (Data Science & Artificial Intelligence)',
        score: pct,
        marks: doc.score,
        maxMarks: doc.maxScore,
        timestamp: doc.dateAttempted
      })
    })

    // GMAT
    gmatDocs.forEach(doc => {
      ;(doc.attempts || []).forEach(attempt => {
        const pct = attempt.totalQuestions > 0
          ? Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)
          : (attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0)
        all.push({
          userName: doc.name || doc.email,
          subject: 'GMAT',
          subjectKey: 'gmat',
          icon: 'bi-mortarboard-fill',
          iconClass: 'gmat',
          topic: doc.subject || 'GMAT Section',
          score: pct,
          timestamp: attempt.dateAttempted
        })
      })
    })


    // CAT
    catDocs.forEach(doc => {
      ;(doc.attempts || []).forEach(attempt => {
        const pct = attempt.totalQuestions > 0
          ? Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)
          : (attempt.maxScore > 0 ? Math.round(Math.max(0, attempt.score / attempt.maxScore) * 100) : 0)
        all.push({
          userName: doc.name || doc.email,
          subject: 'CAT',
          subjectKey: 'cat',
          icon: 'bi-journal-check',
          iconClass: 'cat',
          topic: doc.subject || 'CAT Section',
          score: pct,
          timestamp: attempt.dateAttempted
        })
      })
    })


    // Sort and return top 50 most recent
    all.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    res.json({ success: true, data: all.slice(0, 50) })
  } catch (err) {
    console.error('Error in admin-notifications:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})


// ─── GRE Debug — returns total count + distinct subjects in the collection ────
router.get('/gre_debug', async (req, res) => {
  try {
    const totalQuestions = await GreQuestion.countDocuments()
    const distinctSubjects = await GreQuestion.distinct('subject')
    res.json({ totalQuestions, distinctSubjects })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Maps 0-100% raw accuracy onto the official GRE 130-170 scaled-score range.
// No public GRE concordance table is available, so this is a linear approximation —
// not applicable to Analytical Writing (essay), which is never auto-scored.
function greScaledScore(correctAnswers, totalQuestions) {
  if (!totalQuestions) return null
  const pct = Math.max(0, Math.min(1, correctAnswers / totalQuestions))
  return 130 + Math.round(pct * 40)
}

// ─── GRE Questions ────────────────────────────────────────────────────────────
// GET /api/gre_questions?subject=Verbal Reasoning&paper=Module 1&difficulty=easy&limit=30
router.get('/gre_questions', async (req, res) => {
  try {
    const { subject, difficulty, paper, limit } = req.query
    const filter = {}
    if (subject) {
      const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.subject = { $regex: new RegExp('^' + esc(subject) + '$', 'i') }
    }
    if (difficulty) filter.difficulty = difficulty
    if (paper) {
      const escapedPaper = paper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.paper = { $regex: new RegExp('^' + escapedPaper + '$', 'i') }
    }
    const qs = await GreQuestion.find(filter)
      .limit(limit ? parseInt(limit) : 0)
      .lean()
    res.json(qs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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


// POST /api/gre_scores — upsert: one doc per (email+subject), keep last 5 attempts
router.post('/gre_scores', async (req, res) => {
  try {
    const { email, name, subject, totalQuestions, correctAnswers, wrongAnswers,
            unattempted, score, maxScore, responses, essayResponse } = req.body
    if (!email || !subject) return res.status(400).json({ error: 'email and subject are required' })

    const isEssay = subject === 'Analytical Writing'

    const newAttempt = {
      totalQuestions, correctAnswers, wrongAnswers, unattempted,
      score, maxScore,
      scaledScore:   isEssay ? null : greScaledScore(correctAnswers, totalQuestions),
      essayResponse: isEssay ? (essayResponse || '') : null,
      essayStatus:   isEssay ? 'pending_review' : null,
      responses: (responses || []).map(r => ({
        questionId:   r.questionId,
        userResponse: r.userResponse,
        isCorrect:    r.isCorrect,
        marksAwarded: r.marksAwarded,
      })),
      dateAttempted: new Date(),
    }

    const doc = await GreScore.findOneAndUpdate(
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

// GET /api/gre_scores?email=x@y.com  — returns all attempts as flat records (newest first per subject)
router.get('/gre_scores', async (req, res) => {
  try {
    const { email } = req.query
    const filter = email ? { email } : {}
    const docs = await GreScore.find(filter).lean()
    const result = docs.flatMap(doc =>
      (doc.attempts || []).map(attempt => ({
        email:   doc.email,
        name:    doc.name,
        subject: doc.subject,
        ...attempt,
      }))
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})



// ══════════════════════════════════════════════════════════════════════════
// ─── CAT (Common Admission Test) ───────────────────────────────────────────
// Real CAT format: 3 fixed sections (VARC, DILR, QA), each a single timed
// section — no adaptive modules, no essay. Marking is real CAT marking
// (+3 correct MCQ / -1 wrong MCQ / 0 TITA wrong), stored per-question via
// marking_scheme, so no server-side scaled-score helper is needed here
// (unlike GRE's greScaledScore) — raw score/percentage is reported directly.
// ══════════════════════════════════════════════════════════════════════════

router.get('/cat_debug', async (req, res) => {
  try {
    const totalQuestions = await CatQuestion.countDocuments()
    const distinctSubjects = await CatQuestion.distinct('subject')
    res.json({ totalQuestions, distinctSubjects })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── CAT Questions ────────────────────────────────────────────────────────────
// GET /api/cat_questions?subject=Quantitative Ability&paper=CAT Practice Test 1&difficulty=easy&limit=30
router.get('/cat_questions', async (req, res) => {
  try {
    const { subject, difficulty, paper, limit } = req.query
    // Exclude docs with no question_text (e.g. imported from answer-key-only
    // sources where the original question wording was never available).
    const filter = { question_text: { $exists: true, $ne: null, $ne: '' } }
    if (subject) {
      const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.subject = { $regex: new RegExp('^' + esc(subject) + '$', 'i') }
    }
    if (difficulty) filter.difficulty = difficulty
    if (paper) {
      const escapedPaper = paper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.paper = { $regex: new RegExp('^' + escapedPaper + '$', 'i') }
    }
    const qs = await CatQuestion.find(filter)
      .limit(limit ? parseInt(limit) : 0)
      .lean()
    res.json(qs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/cat_scores — upsert: one doc per (email+subject), keep last 5 attempts
router.post('/cat_scores', async (req, res) => {
  try {
    const { email, name, subject, totalQuestions, correctAnswers, wrongAnswers,
            unattempted, score, maxScore, responses, source } = req.body
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
      source: source === 'FullTest' ? 'FullTest' : 'Module',
      dateAttempted: new Date(),
    }

    const doc = await CatScore.findOneAndUpdate(
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

// GET /api/cat_scores?email=x@y.com  — returns all attempts as flat records (newest first per subject)
router.get('/cat_scores', async (req, res) => {
  try {
    const { email } = req.query
    const filter = email ? { email } : {}
    const docs = await CatScore.find(filter).lean()
    const result = docs.flatMap(doc =>
      (doc.attempts || []).map(attempt => ({
        email:   doc.email,
        name:    doc.name,
        subject: doc.subject,
        ...attempt,
      }))
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── CAT Papers aggregation ───────────────────────────────────────────────────
// GET /api/cat_papers — groups cat_questions by (paper, year) and returns per-paper totals
router.get('/cat_papers', async (req, res) => {
  try {
    const grouped = await CatQuestion.aggregate([
      {
        $group: {
          _id:   { paper: '$paper', year: '$year', subject: '$subject' },
          count: { $sum: 1 },
          marks: { $sum: { $ifNull: ['$points', 3] } },
        },
      },
      {
        $group: {
          _id:            { paper: '$_id.paper', year: '$_id.year' },
          totalQuestions: { $sum: '$count' },
          totalMarks:     { $sum: '$marks' },
          subjects:       { $push: { subject: '$_id.subject', count: '$count', totalMarks: '$marks' } },
        },
      },
    ])

    const result = grouped.map(p => {
      const subjects = {}
      p.subjects.forEach(s => { subjects[s.subject] = { count: s.count, totalMarks: s.totalMarks } })
      return {
        paper:          p._id.paper,
        year:           p._id.year,
        totalQuestions: p.totalQuestions,
        totalMarks:     p.totalMarks,
        subjects,
      }
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/cat_full_scores — save one full-paper attempt
router.post('/cat_full_scores', async (req, res) => {
  try {
    const {
      email, name, paper, year,
      totalQuestions, correctAnswers, wrongAnswers, unattempted,
      score, maxScore, sectionScores, responses, totalTimeTaken,
    } = req.body
    if (!email || !paper) return res.status(400).json({ error: 'email and paper are required' })

    const doc = new CatFullScore({
      email, name, paper, year,
      totalQuestions, correctAnswers, wrongAnswers, unattempted,
      score, maxScore, sectionScores: sectionScores || {},
      responses: (responses || []).map(r => ({
        questionId:   r.questionId,
        subject:      r.subject,
        userResponse: r.userResponse,
        isCorrect:    r.isCorrect,
        marksAwarded: r.marksAwarded,
        unattempted:  r.unattempted,
        timeTaken:    r.timeTaken,
      })),
      totalTimeTaken,
      dateAttempted: new Date(),
    })
    await doc.save()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/cat_full_scores?email=x@y.com — all full-paper attempts newest first
router.get('/cat_full_scores', async (req, res) => {
  try {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'email is required' })
    const docs = await CatFullScore.find({ email }).sort({ dateAttempted: -1 }).lean()
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/cat_admin_scores — all attempts per student, grouped by email (for admin dashboard)
router.get('/cat_admin_scores', async (req, res) => {
  try {
    const docs = await CatScore.find({}).lean()
    const byEmail = {}
    docs.forEach(doc => {
      if (!byEmail[doc.email]) {
        byEmail[doc.email] = { email: doc.email, name: doc.name, quizScores: [] }
      }
      ;(doc.attempts || []).forEach((attempt, i) => {
        const pct = attempt.totalQuestions > 0
          ? Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)
          : (attempt.maxScore > 0 ? Math.round(Math.max(0, attempt.score / attempt.maxScore) * 100) : 0)
        byEmail[doc.email].quizScores.push({
          topic:          doc.subject,
          score:          attempt.score,
          maxScore:       attempt.maxScore,
          correctAnswers: attempt.correctAnswers,
          totalQuestions: attempt.totalQuestions,
          percentage:     pct,
          timestamp:      attempt.dateAttempted,
          attemptNumber:  i + 1,
        })
      })
    })
    res.json({ success: true, data: Object.values(byEmail) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/cat_exam_detail?email=...&subject=...&attemptNumber=... — question-by-question breakdown for one attempt
router.get('/cat_exam_detail', async (req, res) => {
  try {
    const { email, subject, attemptNumber } = req.query
    if (!email || !subject || !attemptNumber) {
      return res.status(400).json({ success: false, message: 'email, subject, and attemptNumber are required' })
    }

    const doc = await CatScore.findOne({ email, subject }).lean()
    if (!doc) return res.status(404).json({ success: false, message: 'Score record not found' })

    const idx = parseInt(attemptNumber) - 1
    const attempt = (doc.attempts || [])[idx]
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' })

    const questionIds = (attempt.responses || []).map(r => r.questionId).filter(Boolean)
    const questionMeta = await CatQuestion.find({ _id: { $in: questionIds } }).lean()
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
        points:         meta.points || 3,
      }
    })

    const totalQuestions = attempt.totalQuestions || enrichedResults.length
    const correctAnswers = attempt.correctAnswers || 0

    const difficultyStats = { easy: { total: 0, correct: 0 }, medium: { total: 0, correct: 0 }, hard: { total: 0, correct: 0 }, unknown: { total: 0, correct: 0 } }
    enrichedResults.forEach(r => {
      const d = r.difficulty || 'unknown'
      difficultyStats[d].total++
      if (r.isCorrect) difficultyStats[d].correct++
    })

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
    res.status(500).json({ error: err.message })
  }
})


// ─── GMAT Debug — returns total count + distinct subjects in the collection ───
router.get('/gmat_debug', async (req, res) => {
  try {
    const totalQuestions = await GmatQuestion.countDocuments()
    const distinctSubjects = await GmatQuestion.distinct('subject')
    res.json({ totalQuestions, distinctSubjects })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Maps 0-100% raw accuracy onto the official GMAT Focus Edition 60-90 section
// scaled-score range. No public GMAT concordance table is available, so this
// is a linear approximation, same convention as greScaledScore() above.
function gmatScaledScore(correctAnswers, totalQuestions) {
  if (!totalQuestions) return null
  const pct = Math.max(0, Math.min(1, correctAnswers / totalQuestions))
  return 60 + Math.round(pct * 30)
}

// Combines the three GMAT Focus Edition section scaled scores (60-90 each) into
// the official 205-805 total scale — also a linear approximation.
function gmatTotalScaledScore(quantScaled, verbalScaled, diScaled) {
  if (quantScaled == null || verbalScaled == null || diScaled == null) return null
  const sumAbove60 = (quantScaled - 60) + (verbalScaled - 60) + (diScaled - 60) // 0-90
  return 205 + Math.round((sumAbove60 / 90) * 600)
}

// ─── GMAT Questions ────────────────────────────────────────────────────────────
// GET /api/gmat_questions?subject=Verbal Reasoning&paper=Module 1&difficulty=easy&limit=30
router.get('/gmat_questions', async (req, res) => {
  try {
    const { subject, difficulty, paper, limit } = req.query
    const filter = {}
    if (subject) {
      const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.subject = { $regex: new RegExp('^' + esc(subject) + '$', 'i') }
    }
    if (difficulty) filter.difficulty = difficulty
    if (paper) {
      const escapedPaper = paper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.paper = { $regex: new RegExp('^' + escapedPaper + '$', 'i') }
    }
    const qs = await GmatQuestion.find(filter)
      .limit(limit ? parseInt(limit) : 0)
      .lean()
    res.json(qs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/gmat_scores — upsert: one doc per (email+subject), keep last 5 attempts
router.post('/gmat_scores', async (req, res) => {
  try {
    const { email, name, subject, totalQuestions, correctAnswers, wrongAnswers,
            unattempted, score, maxScore, responses, source } = req.body
    if (!email || !subject) return res.status(400).json({ error: 'email and subject are required' })

    const newAttempt = {
      totalQuestions, correctAnswers, wrongAnswers, unattempted,
      score, maxScore,
      scaledScore: gmatScaledScore(correctAnswers, totalQuestions),
      responses: (responses || []).map(r => ({
        questionId:   r.questionId,
        userResponse: r.userResponse,
        isCorrect:    r.isCorrect,
        marksAwarded: r.marksAwarded,
      })),
      source: source === 'FullTest' ? 'FullTest' : 'Module',
      dateAttempted: new Date(),
    }

    const doc = await GmatScore.findOneAndUpdate(
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

// GET /api/gmat_scores?email=x@y.com  — returns all attempts as flat records (newest first per subject)
router.get('/gmat_scores', async (req, res) => {
  try {
    const { email } = req.query
    const filter = email ? { email } : {}
    const docs = await GmatScore.find(filter).lean()
    const result = docs.flatMap(doc =>
      (doc.attempts || []).map(attempt => ({
        email:   doc.email,
        name:    doc.name,
        subject: doc.subject,
        ...attempt,
      }))
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GMAT Papers aggregation ───────────────────────────────────────────────────
// GET /api/gmat_papers  — groups gmat_questions by (paper, year) and returns per-paper totals
router.get('/gmat_papers', async (req, res) => {
  try {
    const grouped = await GmatQuestion.aggregate([
      {
        $group: {
          _id:   { paper: '$paper', year: '$year', subject: '$subject' },
          count: { $sum: 1 },
          marks: { $sum: { $ifNull: ['$points', 1] } },
        },
      },
      {
        $group: {
          _id:            { paper: '$_id.paper', year: '$_id.year' },
          totalQuestions: { $sum: '$count' },
          totalMarks:     { $sum: '$marks' },
          subjects:       { $push: { subject: '$_id.subject', count: '$count', totalMarks: '$marks' } },
        },
      },
    ])

    const result = grouped.map(p => {
      const subjects = {}
      p.subjects.forEach(s => { subjects[s.subject] = { count: s.count, totalMarks: s.totalMarks } })
      return {
        paper:          p._id.paper,
        year:           p._id.year,
        totalQuestions: p.totalQuestions,
        totalMarks:     p.totalMarks,
        subjects,
      }
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/gmat_full_scores — save one full-paper attempt
router.post('/gmat_full_scores', async (req, res) => {
  try {
    const {
      email, name, paper, year,
      totalQuestions, correctAnswers, wrongAnswers, unattempted,
      score, maxScore, sectionScores, responses, totalTimeTaken,
    } = req.body
    if (!email || !paper) return res.status(400).json({ error: 'email and paper are required' })

    // Fill in approximate scaled scores per section if the client didn't supply them.
    const finalSectionScores = { ...(sectionScores || {}) }
    ;['Quantitative Reasoning', 'Verbal Reasoning', 'Data Insights'].forEach(sec => {
      if (finalSectionScores[sec] && finalSectionScores[sec].scaledScore == null) {
        finalSectionScores[sec].scaledScore = gmatScaledScore(
          finalSectionScores[sec].correctAnswers, finalSectionScores[sec].totalQuestions
        )
      }
    })

    const totalScaledScore = gmatTotalScaledScore(
      finalSectionScores['Quantitative Reasoning']?.scaledScore,
      finalSectionScores['Verbal Reasoning']?.scaledScore,
      finalSectionScores['Data Insights']?.scaledScore,
    )

    const doc = new GmatFullScore({
      email, name, paper, year,
      totalQuestions, correctAnswers, wrongAnswers, unattempted,
      score, maxScore, sectionScores: finalSectionScores, totalScaledScore,
      responses: (responses || []).map(r => ({
        questionId:   r.questionId,
        subject:      r.subject,
        userResponse: r.userResponse,
        isCorrect:    r.isCorrect,
        marksAwarded: r.marksAwarded,
        unattempted:  r.unattempted,
        timeTaken:    r.timeTaken,
      })),
      totalTimeTaken,
      dateAttempted: new Date(),
    })
    await doc.save()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/gmat_full_scores?email=x@y.com — all full-paper attempts newest first
router.get('/gmat_full_scores', async (req, res) => {
  try {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'email is required' })
    const docs = await GmatFullScore.find({ email }).sort({ dateAttempted: -1 }).lean()
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/gmat_admin_scores — all attempts per student, grouped by email (for admin dashboard)
router.get('/gmat_admin_scores', async (req, res) => {
  try {
    const docs = await GmatScore.find({}).lean()
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
          topic:          doc.subject,
          score:          attempt.score,
          maxScore:       attempt.maxScore,
          correctAnswers: attempt.correctAnswers,
          totalQuestions: attempt.totalQuestions,
          percentage:     pct,
          scaledScore:    attempt.scaledScore ?? null,
          timestamp:      attempt.dateAttempted,
          attemptNumber:  i + 1,
        })
      })
    })
    res.json({ success: true, data: Object.values(byEmail) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/gmat_exam_detail?email=...&subject=...&attemptNumber=... — question-by-question breakdown for one attempt
router.get('/gmat_exam_detail', async (req, res) => {
  try {
    const { email, subject, attemptNumber } = req.query
    if (!email || !subject || !attemptNumber) {
      return res.status(400).json({ success: false, message: 'email, subject, and attemptNumber are required' })
    }

    const doc = await GmatScore.findOne({ email, subject }).lean()
    if (!doc) return res.status(404).json({ success: false, message: 'Score record not found' })

    const idx = parseInt(attemptNumber) - 1
    const attempt = (doc.attempts || [])[idx]
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' })

    const questionIds = (attempt.responses || []).map(r => r.questionId).filter(Boolean)
    const questionMeta = await GmatQuestion.find({ _id: { $in: questionIds } }).lean()
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
          scaledScore:    attempt.scaledScore ?? null,
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
    res.status(500).json({ error: err.message })
  }
})






// ══ JEE Advanced Admin Routes ════════════════════════════════════════════════

// GET /api/jee_admin — overview table: one row per student with latest score per subject
router.get('/jee_admin', async (req, res) => {
  try {
    const docs = await JeeScore.find({}).lean()
    const byEmail = {}
    docs.forEach(doc => {
      if (!byEmail[doc.email]) {
        byEmail[doc.email] = { email: doc.email, name: doc.name, subjects: [] }
      }
      const latest = doc.attempts?.[0] || {}
      byEmail[doc.email].subjects.push({
        subject:       doc.subject,
        score:         latest.score         ?? 0,
        maxScore:      latest.maxScore      ?? 0,
        attemptCount:  doc.attempts?.length ?? 0,
        dateAttempted: latest.dateAttempted ?? null,
      })
    })
    res.json({ success: true, data: Object.values(byEmail) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /api/jee_admin/topic_analysis?email=&subject=
router.get('/jee_admin/topic_analysis', async (req, res) => {
  try {
    const { email, subject } = req.query
    if (!email || !subject) return res.status(400).json({ error: 'email and subject required' })

    const doc = await JeeScore.findOne({ email, subject }).lean()
    if (!doc || !doc.attempts?.length) return res.json({ data: [], dateAttempted: null })

    const latest    = doc.attempts[0]
    const responses = latest.responses || []
    const qIds      = responses.map(r => r.questionId).filter(Boolean)
    const questions = await JeeQuestion.find({ _id: { $in: qIds } }).lean()
    const qMap = {}
    questions.forEach(q => { qMap[String(q._id)] = q })

    const topicMap = {}
    responses.forEach(r => {
      const q        = qMap[String(r.questionId)] || {}
      const topic    = q.topic    || 'Unknown'
      const subtopic = q.subtopic || ''
      const key      = topic + '||' + subtopic
      if (!topicMap[key]) topicMap[key] = { topic, subtopic, correct: 0, total: 0, timeSum: 0 }
      topicMap[key].total++
      if (r.isCorrect) topicMap[key].correct++
      topicMap[key].timeSum += q.average_time_seconds || 60
    })

    const data = Object.values(topicMap)
      .map(t => ({
        topic:    t.topic,
        subtopic: t.subtopic,
        accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
        correct:  t.correct,
        total:    t.total,
        avgTime:  t.total > 0 ? Math.round(t.timeSum / t.total) : 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)

    res.json({ data, dateAttempted: latest.dateAttempted })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// ─── GRE Papers aggregation ───────────────────────────────────────────────────
// GET /api/gre_papers  — groups gre_questions by (paper, year) and returns per-paper totals
router.get('/gre_papers', async (req, res) => {
  try {
    const grouped = await GreQuestion.aggregate([
      {
        $group: {
          _id:   { paper: '$paper', year: '$year', subject: '$subject' },
          count: { $sum: 1 },
          marks: { $sum: { $ifNull: ['$points', 1] } },
        },
      },
      {
        $group: {
          _id:            { paper: '$_id.paper', year: '$_id.year' },
          totalQuestions: { $sum: '$count' },
          totalMarks:     { $sum: '$marks' },
          subjects:       { $push: { subject: '$_id.subject', count: '$count', totalMarks: '$marks' } },
        },
      },
    ])

    const result = grouped.map(p => {
      const subjects = {}
      p.subjects.forEach(s => { subjects[s.subject] = { count: s.count, totalMarks: s.totalMarks } })
      return {
        paper:          p._id.paper,
        year:           p._id.year,
        totalQuestions: p.totalQuestions,
        totalMarks:     p.totalMarks,
        subjects,
      }
    })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/gre_full_scores — save one full-paper attempt
router.post('/gre_full_scores', async (req, res) => {
  try {
    const {
      email, name, paper, year,
      totalQuestions, correctAnswers, wrongAnswers, unattempted,
      score, maxScore, sectionScores, responses, totalTimeTaken, essayResponse,
    } = req.body
    if (!email || !paper) return res.status(400).json({ error: 'email and paper are required' })

    // Fill in approximate scaled scores per section (Verbal/Quant only) if the client didn't supply them.
    const finalSectionScores = { ...(sectionScores || {}) }
    ;['Verbal Reasoning', 'Quantitative Reasoning'].forEach(sec => {
      if (finalSectionScores[sec] && finalSectionScores[sec].scaledScore == null) {
        finalSectionScores[sec].scaledScore = greScaledScore(
          finalSectionScores[sec].correctAnswers, finalSectionScores[sec].totalQuestions
        )
      }
    })

    const doc = new GreFullScore({
      email, name, paper, year,
      totalQuestions, correctAnswers, wrongAnswers, unattempted,
      score, maxScore, sectionScores: finalSectionScores,
      essayResponse: essayResponse || null,
      essayStatus:   essayResponse ? 'pending_review' : null,
      responses: (responses || []).map(r => ({
        questionId:   r.questionId,
        subject:      r.subject,
        userResponse: r.userResponse,
        isCorrect:    r.isCorrect,
        marksAwarded: r.marksAwarded,
        unattempted:  r.unattempted,
        timeTaken:    r.timeTaken,
      })),
      totalTimeTaken,
      dateAttempted: new Date(),
    })
    await doc.save()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/jee_admin/question_stats?subject= — per-question accuracy across all students
router.get('/jee_admin/question_stats', async (req, res) => {
  try {
    const { subject } = req.query
    if (!subject) return res.status(400).json({ error: 'subject required' })

    const docs = await JeeScore.find({ subject }).lean()
    const qStats = {}
    docs.forEach(doc => {
      const latest = doc.attempts?.[0]
      if (!latest) return
      ;(latest.responses || []).forEach(r => {
        const qId = String(r.questionId)
        if (!qStats[qId]) qStats[qId] = { questionId: qId, total: 0, correct: 0 }
        qStats[qId].total++
        if (r.isCorrect) qStats[qId].correct++
      })
    })

    const qIds      = Object.keys(qStats)
    const questions = await JeeQuestion.find({ _id: { $in: qIds } }).lean()
    const qMeta     = {}
    questions.forEach(q => { qMeta[String(q._id)] = q })

    const data = Object.entries(qStats)
      .map(([qId, stat]) => {
        const q = qMeta[qId] || {}
        return {
          questionId:      qId,
          topic:           q.topic    || '—',
          subtopic:        q.subtopic || '—',
          questionPreview: q.question_text ? q.question_text.substring(0, 100) + '…' : '—',
          total:           stat.total,
          correct:         stat.correct,
          accuracy:        stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0,
          avgTime:         q.average_time_seconds || 0,
        }
      })
      .sort((a, b) => a.accuracy - b.accuracy)

    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// GET /api/gre_full_scores?email=x@y.com — all full-paper attempts newest first
router.get('/gre_full_scores', async (req, res) => {
  try {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'email is required' })
    const docs = await GreFullScore.find({ email }).sort({ dateAttempted: -1 }).lean()
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/gre_admin_scores — all attempts per student, grouped by email (for admin dashboard)
router.get('/gre_admin_scores', async (req, res) => {
  try {
    const docs = await GreScore.find({}).lean()
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
          topic:          doc.subject,
          score:          attempt.score,
          maxScore:       attempt.maxScore,
          correctAnswers: attempt.correctAnswers,
          totalQuestions: attempt.totalQuestions,
          percentage:     pct,
          scaledScore:    attempt.scaledScore ?? null,
          essayStatus:    attempt.essayStatus ?? null,
          timestamp:      attempt.dateAttempted,
          attemptNumber:  i + 1,
        })
      })
    })
    res.json({ success: true, data: Object.values(byEmail) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})


// GET /api/gre_exam_detail?email=...&subject=...&attemptNumber=... — question-by-question breakdown for one attempt
router.get('/gre_exam_detail', async (req, res) => {
  try {
    const { email, subject, attemptNumber } = req.query
    if (!email || !subject || !attemptNumber) {
      return res.status(400).json({ success: false, message: 'email, subject, and attemptNumber are required' })
    }

    const doc = await GreScore.findOne({ email, subject }).lean()
    if (!doc) return res.status(404).json({ success: false, message: 'Score record not found' })

    const idx = parseInt(attemptNumber) - 1
    const attempt = (doc.attempts || [])[idx]
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' })

    const questionIds = (attempt.responses || []).map(r => r.questionId).filter(Boolean)
    const questionMeta = await GreQuestion.find({ _id: { $in: questionIds } }).lean()
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
          scaledScore:    attempt.scaledScore ?? null,
          essayResponse:  attempt.essayResponse ?? null,
          essayStatus:    attempt.essayStatus ?? null,
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
    res.status(500).json({ error: err.message })
  }
})

// POST /api/fix-jee-papers — one-time migration: relabel 'Single' attempts that
// were Paper1/Paper2 quizzes (all 3 subjects saved within 10 min = paper session).
router.post('/fix-jee-papers', async (req, res) => {
  try {
    const docs = await JeeScore.find({}).lean()
    const GAP  = 10 * 60 * 1000

    const allAttempts = []
    docs.forEach(doc => {
      ;(doc.attempts || []).forEach((attempt, idx) => {
        if (!attempt.paper || attempt.paper === 'Single') {
          allAttempts.push({ email: doc.email, subject: doc.subject, docId: doc._id, idx, ts: new Date(attempt.dateAttempted).getTime() })
        }
      })
    })

    const byEmail = {}
    allAttempts.forEach(a => { if (!byEmail[a.email]) byEmail[a.email] = []; byEmail[a.email].push(a) })

    const patches = []
    Object.values(byEmail).forEach(attempts => {
      attempts.sort((a, b) => a.ts - b.ts)
      const sessions = []
      let cur = [attempts[0]]
      for (let i = 1; i < attempts.length; i++) {
        if (attempts[i].ts - attempts[i - 1].ts > GAP) { sessions.push(cur); cur = [attempts[i]] }
        else cur.push(attempts[i])
      }
      sessions.push(cur)

      let paperCount = 0
      const labels = ['Paper1', 'Paper2', 'Paper3', 'Paper4']
      sessions.forEach(session => {
        const subs = new Set(session.map(a => a.subject))
        if (subs.has('Physics') && subs.has('Chemistry') && subs.has('Mathematics')) {
          const label = labels[paperCount] || `Paper${paperCount + 1}`
          paperCount++
          session.forEach(a => patches.push({ docId: a.docId, idx: a.idx, newPaper: label }))
        }
      })
    })

    const byDoc = {}
    patches.forEach(p => { if (!byDoc[p.docId]) byDoc[p.docId] = []; byDoc[p.docId].push(p) })

    let updated = 0
    for (const [docId, ps] of Object.entries(byDoc)) {
      const doc = await JeeScore.findById(docId)
      if (!doc) continue
      ps.forEach(p => { if (doc.attempts[p.idx]) doc.attempts[p.idx].paper = p.newPaper })
      await doc.save()
      updated += ps.length
    }

    res.json({ success: true, message: `Fixed ${updated} attempts across ${Object.keys(byDoc).length} documents` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})


// ── Stub routes for AdminDashboard counts (models not in this deployment) ─────

router.get('/iitm_stats2_scores_databases', async (req, res) => {
  res.json([])
})

router.get('/jee_main_admin_scores', async (req, res) => {
  res.json({ success: true, data: [] })
})

router.get('/sat_scores', async (req, res) => {
  res.json([])
})

router.get('/mcq-quiz/admin/attempts', async (req, res) => {
  res.json({ attempts: [] })
})

module.exports = router

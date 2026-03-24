const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const SubjectAnalysis = require('../model/subjectAnalysis');
const User = require('../model/userSchema');
const MathData = require('../model/MathData');
const StatisticsSchema = require('../model/statisticsSchema');
const CodingSubmission = require('../model/coding_Submission');
const PDSA_Submission = require('../model/pdsa_Submission');
const AlgebraScoreAdd = require('../model/algebraScoreAdd');

// Initialize Gemini AI
const groq = new Groq({ apiKey: process.env.GEMINI_API_KEY });

// Helper function to get user scores by subject
async function getUserScores(userId, subject) {
  try {
    console.log('getUserScores called with userId:', userId, 'subject:', subject);
    
    // Try to find user by ID first
    let user = await User.findById(userId);
    console.log('User found by ID:', !!user);
    
    // If user not found by ID, try to find by email (in case userId is actually an email)
    if (!user) {
      user = await User.findOne({ email: userId });
      console.log('User found by email:', !!user);
    }
    
    // If still not found, try to find any user (for testing purposes)
    if (!user) {
      user = await User.findOne();
      console.log('User found by fallback:', !!user);
    }
    
    if (!user) {
      console.error('No user found at all');
      throw new Error('User not found');
    }

    console.log('Using user:', user.username, user.email);

    let scores = [];
    let totalScore = 0;
    let maxScore = 0;

    switch (subject) {
      case 'math':
        console.log('Fetching math data for email:', user.email);
        
        // Try multiple math data sources
        const mathData = await MathData.find({ email: user.email });
        const iitmMathData = await require('../model/iitmMathSchema').find({ email: user.email });
        
        console.log('MathData found:', mathData.length);
        console.log('IITM Math data found:', iitmMathData.length);
        
        // Combine all math data sources
        const allMathData = [...mathData, ...iitmMathData];
        
        // Transform to match expected format
        scores = allMathData.map(item => ({
          topic: item.topic || item.quizType || 'Unknown Topic',
          score: item.score || item.totalQuestions || 0,
          maxScore: item.maxScore || item.totalQuestions || 100,
          percentage: item.percentage || 0
        }));
        
        // If no data found, try to get from quizScores array
        if (scores.length === 0 && iitmMathData.length > 0) {
          const userRecord = iitmMathData[0];
          if (userRecord.quizScores && userRecord.quizScores.length > 0) {
            scores = userRecord.quizScores.map(quiz => ({
              topic: quiz.topic || quiz.quizType || 'Unknown Topic',
              score: quiz.score || quiz.correctAnswers || 0,
              maxScore: quiz.maxScore || quiz.totalQuestions || 100,
              percentage: quiz.percentage || 0
            }));
          }
        }
        
        // If still no data, try to get from quizScores array in MathData
        if (scores.length === 0 && mathData.length > 0) {
          const userRecord = mathData[0];
          if (userRecord.quizScores && userRecord.quizScores.length > 0) {
            scores = userRecord.quizScores.map(quiz => ({
              topic: quiz.topic || quiz.quizType || 'Unknown Topic',
              score: quiz.score || quiz.correctAnswers || 0,
              maxScore: quiz.maxScore || quiz.totalQuestions || 100,
              percentage: quiz.percentage || 0
            }));
          }
        }
        
        // If still no data, try to get from any math-related collections
        if (scores.length === 0) {
          console.log('No data found in standard collections, trying alternative collections...');
          
          // Try mathUpdatedSchema
          const mathUpdatedData = await require('../model/mathUpdatedSchema').find({ email: user.email });
          console.log('mathUpdatedSchema found:', mathUpdatedData.length);
          
          if (mathUpdatedData.length > 0) {
            scores = mathUpdatedData.map(item => ({
              topic: item.topic || 'Unknown Topic',
              score: item.score || 0,
              maxScore: item.maxScore || 100,
              percentage: item.percentage || 0
            }));
          }
        }
        break;

      case 'statistics':
        console.log('Fetching statistics data for email:', user.email);
        const statsData = await StatisticsSchema.find({ email: user.email });
        console.log('Statistics data found:', statsData.length);
        scores = statsData.map(item => ({
          topic: item.topic || 'Unknown Topic',
          score: item.score || 0,
          maxScore: item.maxScore || 100,
          percentage: item.percentage || 0
        }));
        break;

      case 'programming':
        console.log('Fetching programming data for email:', user.email);
        const codingData = await CodingSubmission.find({ email: user.email });
        console.log('Programming data found:', codingData.length);
        scores = codingData.map(item => ({
          topic: item.topic || 'Unknown Topic',
          score: item.score || 0,
          maxScore: item.maxScore || 100,
          percentage: item.percentage || 0
        }));
        break;

      case 'dsa':
        console.log('Fetching DSA data for email:', user.email);
        const pdsaData = await PDSA_Submission.find({ email: user.email });
        console.log('DSA data found:', pdsaData.length);
        scores = pdsaData.map(item => ({
          topic: item.topic || 'Unknown Topic',
          score: item.score || 0,
          maxScore: item.maxScore || 100,
          percentage: item.percentage || 0
        }));
        break;

      case 'algebra':
        console.log('Fetching algebra data for email:', user.email);
        const algebraData = await AlgebraScoreAdd.find({ email: user.email });
        console.log('Algebra data found:', algebraData.length);
        scores = algebraData.map(item => ({
          topic: item.topic || 'Unknown Topic',
          score: item.score || 0,
          maxScore: item.maxScore || 100,
          percentage: item.percentage || 0
        }));
        break;

      default:
        throw new Error('Invalid subject');
    }

    // Calculate totals
    totalScore = scores.reduce((sum, item) => sum + item.score, 0);
    maxScore = scores.reduce((sum, item) => sum + item.maxScore, 0);

    console.log('Final scores:', scores);
    console.log('Total score:', totalScore, 'Max score:', maxScore);

    return {
      user: { name: user.username || 'Unknown', email: user.email },
      subject,
      scores,
      totalScore,
      maxScore,
      overallPercentage: maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    };
  } catch (error) {
    console.error('getUserScores Error:', error);
    throw error;
  }
}

// Generate AI analysis and feedback
async function generateAnalysis(userData) {
  const prompt = `
    Analyze this student's performance data and provide detailed feedback:

    Student: ${userData.user.name}
    Subject: ${userData.subject}
    Overall Score: ${userData.totalScore}/${userData.maxScore} (${userData.overallPercentage.toFixed(1)}%)

    Topic Breakdown:
    ${userData.scores.map(score => 
      `- ${score.topic}: ${score.score}/${score.maxScore} (${score.percentage.toFixed(1)}%)`
    ).join('\n')}

    Please provide:
    1. A detailed analysis of their performance
    2. Identify specific knowledge gaps and weak areas
    3. Provide actionable feedback for improvement
    4. Suggest specific topics they should focus on
    5. Recommend study strategies based on their performance pattern

    Format your response as JSON with these fields:
    - analysis: "detailed performance analysis"
    - feedback: "specific actionable feedback"
    - gaps: [{area: "topic name", description: "what they struggle with", priority: "high/medium/low"}]
    - recommendations: [{topic: "suggested topic", description: "why this topic", difficulty: "beginner/intermediate/advanced"}]

    Keep the analysis professional and encouraging, focusing on growth opportunities.
  `;

  try {
    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.warn('Gemini API key not found, using fallback analysis');
      throw new Error('Gemini API key not configured');
    }

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
    });
    const text = completion.choices[0]?.message?.content || '';
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Could not parse AI response');
    }
  } catch (error) {
    console.error('AI Analysis Error:', error);
    // Fallback analysis with actual data
    const weakAreas = userData.scores
      .filter(score => score.percentage < 60)
      .map(score => ({
        area: score.topic,
        description: `Score of ${score.score}/${score.maxScore} (${score.percentage.toFixed(1)}%) indicates difficulty with this topic`,
        priority: score.percentage < 40 ? 'high' : 'medium'
      }));

    const recommendations = userData.scores
      .filter(score => score.percentage < 70)
      .map(score => ({
        topic: score.topic,
        description: `Focus on ${score.topic} to improve understanding and scores`,
        difficulty: 'beginner'
      }));

    return {
      analysis: `Student ${userData.user.name} scored ${userData.totalScore}/${userData.maxScore} (${userData.overallPercentage.toFixed(1)}%) in ${userData.subject}. ${weakAreas.length > 0 ? 'Areas needing improvement include: ' + weakAreas.map(g => g.area).join(', ') + '.' : 'Overall performance is good with room for improvement in some areas.'}`,
      feedback: `Continue practicing ${userData.subject} regularly. Focus on the identified weak areas and seek additional resources or help if needed. Consistent practice will lead to improvement.`,
      gaps: weakAreas.length > 0 ? weakAreas : [{area: 'General Practice', description: 'Continue regular practice to maintain and improve skills', priority: 'low'}],
      recommendations: recommendations.length > 0 ? recommendations : [{topic: 'Regular Practice', description: 'Continue regular practice of all topics', difficulty: 'beginner'}]
    };
  }
}

// POST /api/analyze/:subject/:userId - Generate analysis for a specific user and subject
router.post('/analyze/:subject/:userId', async (req, res) => {
  try {
    const { subject, userId } = req.params;
    
    // Get user scores
    const userData = await getUserScores(userId, subject);
    
    // Generate AI analysis
    const aiAnalysis = await generateAnalysis(userData);
    
    // Save to database
    const analysis = new SubjectAnalysis({
      subject,
      userId,
      analysis: aiAnalysis.analysis,
      feedback: aiAnalysis.feedback,
      gaps: aiAnalysis.gaps || [],
      recommendations: aiAnalysis.recommendations || []
    });

    await analysis.save();

    res.json({
      success: true,
      data: {
        ...userData,
        analysis: analysis.analysis,
        feedback: analysis.feedback,
        gaps: analysis.gaps,
        recommendations: analysis.recommendations
      }
    });

  } catch (error) {
    console.error('Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate analysis'
    });
  }
});

// GET /api/analyze/:subject/:userId - Generate analysis for a specific user and subject (GET version)
router.get('/analyze/:subject/:userId', async (req, res) => {
  try {
    const { subject, userId } = req.params;
    
    // Get user scores
    const userData = await getUserScores(userId, subject);
    
    // Generate AI analysis
    const aiAnalysis = await generateAnalysis(userData);
    
    // Save to database
    const analysis = new SubjectAnalysis({
      subject,
      userId,
      analysis: aiAnalysis.analysis,
      feedback: aiAnalysis.feedback,
      gaps: aiAnalysis.gaps || [],
      recommendations: aiAnalysis.recommendations || []
    });

    await analysis.save();

    res.json({
      success: true,
      data: {
        ...userData,
        analysis: analysis.analysis,
        feedback: analysis.feedback,
        gaps: analysis.gaps,
        recommendations: analysis.recommendations
      }
    });

  } catch (error) {
    console.error('Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate analysis'
    });
  }
});

// GET /api/analysis/:subject/:userId - Get existing analysis for a user
router.get('/analysis/:subject/:userId', async (req, res) => {
  try {
    const { subject, userId } = req.params;
    
    const analysis = await SubjectAnalysis.findOne({
      subject,
      userId
    }).sort({ createdAt: -1 });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'No analysis found for this user and subject'
      });
    }

    // Get latest user scores for context
    const userData = await getUserScores(userId, subject);

    res.json({
      success: true,
      data: {
        ...userData,
        analysis: analysis.analysis,
        feedback: analysis.feedback,
        gaps: analysis.gaps,
        recommendations: analysis.recommendations,
        lastUpdated: analysis.updatedAt
      }
    });

  } catch (error) {
    console.error('Get Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analysis'
    });
  }
});

// GET /api/analysis/user/:userId - Get all analyses for a user
router.get('/analysis/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const analyses = await SubjectAnalysis.find({
      userId
    }).sort({ createdAt: -1 });

    if (!analyses.length) {
      return res.status(404).json({
        success: false,
        message: 'No analyses found for this user'
      });
    }

    res.json({
      success: true,
      data: analyses
    });

  } catch (error) {
    console.error('Get User Analyses Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user analyses'
    });
  }
});

// POST /api/math_exam_ai_feedback - AI feedback for a single enriched exam attempt
router.post('/math_exam_ai_feedback', async (req, res) => {
  try {
    const { student, attempt, enrichedResults, insights } = req.body;

    if (!attempt || !enrichedResults) {
      return res.status(400).json({ success: false, message: 'Missing exam data' });
    }

    const { difficultyStats, typeStats, avgTimeSec, totalTimeSec } = insights;

    // Build a concise wrong-question summary (max 8 to keep prompt tight)
    const wrongQuestions = enrichedResults
      .filter(r => !r.isCorrect)
      .slice(0, 8)
      .map(r =>
        `  Q${r.questionNumber} [${r.difficulty || 'unknown'} | ${(r.type || 'unknown').replace(/_/g, ' ')}]: ` +
        `"${(r.questionText || '').slice(0, 120)}" ` +
        `| Student answered: "${r.userAnswer || '—'}" | Correct: "${Array.isArray(r.correctAnswer) ? r.correctAnswer.join(', ') : r.correctAnswer}" ` +
        `| Time: ${r.timeTaken}s` +
        (r.explanation ? ` | Explanation: "${r.explanation.slice(0, 150)}"` : '')
      ).join('\n');

    const diffLines = Object.entries(difficultyStats)
      .filter(([, s]) => s.total > 0)
      .map(([d, s]) => `  ${d}: ${s.correct}/${s.total} correct (${Math.round((s.correct / s.total) * 100)}%)`)
      .join('\n');

    const typeLines = Object.entries(typeStats)
      .map(([t, s]) => `  ${t.replace(/_/g, ' ')}: ${s.correct}/${s.total} correct`)
      .join('\n');

    const prompt = `
You are an expert mathematics tutor reviewing a student's exam attempt. Provide a deeply personalised, constructive analysis.

STUDENT: ${student?.username || 'Student'} (${student?.email || ''})
TOPIC: ${attempt.topic}
ATTEMPT: #${attempt.attemptNumber}  |  DATE: ${new Date(attempt.timestamp).toLocaleDateString()}

OVERALL RESULT: ${attempt.correctAnswers}/${attempt.totalQuestions} correct = ${Math.round(attempt.percentage)}%

DIFFICULTY BREAKDOWN:
${diffLines}

QUESTION TYPE BREAKDOWN:
${typeLines}

TIME: Total ${Math.round(totalTimeSec / 60)} min | Avg ${avgTimeSec}s per question

WRONG QUESTIONS (${enrichedResults.filter(r => !r.isCorrect).length} total, showing up to 8):
${wrongQuestions || '  (none — all correct!)'}

Based on this data, provide a JSON response with these exact fields:
{
  "summary": "2-3 sentence honest overall assessment — mention the score, strongest and weakest areas",
  "conceptualGaps": ["list each distinct concept or sub-topic the student clearly doesn't understand yet, based on the wrong questions and their explanations"],
  "mistakePatterns": ["patterns you notice — e.g. struggling with a specific question type, running out of time on hard questions, careless errors on easy ones"],
  "difficultyInsight": "one paragraph: how the student performed across difficulty levels and what it reveals about their current mastery",
  "timeInsight": "one paragraph: what the time data suggests — rushing, overthinking, confidence gaps",
  "priorityActions": [
    { "action": "specific thing to do", "reason": "why this matters based on the data", "urgency": "high/medium/low" }
  ],
  "encouragement": "one genuine, specific sentence of encouragement that acknowledges actual effort visible in the data"
}

Be specific and data-driven. Reference actual question numbers or topics. Do NOT be generic.
`.trim();

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI service not configured (GEMINI_API_KEY missing)' });
    }

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
    });
    const text = completion.choices[0]?.message?.content || '';

    // Extract JSON block
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ success: false, message: 'AI returned unreadable response', raw: text });
    }

    const feedback = JSON.parse(jsonMatch[0]);
    res.json({ success: true, feedback });

  } catch (error) {
    console.error('Math exam AI feedback error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
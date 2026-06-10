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
      case 'stats1':
        const statsData = await StatisticsSchema.find({ email: user.email });
        const statsRecord = statsData[0];
        scores = statsRecord?.quizScores
          ? statsRecord.quizScores.map(q => ({
              topic: q.topic || 'Unknown Topic',
              score: q.correctAnswers || q.score || 0,
              maxScore: q.totalQuestions || 100,
              percentage: q.percentage || 0
            }))
          : statsData.map(item => ({
              topic: item.topic || 'Unknown Topic',
              score: item.score || 0,
              maxScore: item.maxScore || 100,
              percentage: item.percentage || 0
            }));
        break;

      case 'programming':
      case 'python':
        const codingData = await CodingSubmission.find({ email: user.email });
        scores = codingData.map(item => ({
          topic: item.topic || 'Unknown Topic',
          score: item.score || 0,
          maxScore: item.maxScore || 100,
          percentage: item.percentage || 0
        }));
        break;

      case 'dsa':
      case 'pdsa':
        const pdsaData = await PDSA_Submission.find({ email: user.email });
        scores = pdsaData.map(item => ({
          topic: item.topic || 'Unknown Topic',
          score: item.score || 0,
          maxScore: item.maxScore || 100,
          percentage: item.percentage || 0
        }));
        break;

      case 'algebra':
        const algebraData = await AlgebraScoreAdd.find({ email: user.email });
        scores = algebraData.map(item => ({
          topic: item.topic || 'Unknown Topic',
          score: item.score || 0,
          maxScore: item.maxScore || 100,
          percentage: item.percentage || 0
        }));
        break;

      case 'math2':
        const math2Record = await IITM_Maths_2_Score.findOne({ email: user.email });
        scores = (math2Record?.scores || []).map(q => ({
          topic: q.subtopic || `Week ${q.week}`,
          score: q.correctAnswers || 0,
          maxScore: q.totalQuestions || 0,
          percentage: q.totalQuestions > 0 ? Math.round((q.correctAnswers / q.totalQuestions) * 100) : 0
        }));
        break;

      case 'stats2':
        const stats2Record = await IITM_Stats_2_Score.findOne({ email: user.email });
        scores = (stats2Record?.scores || []).map(q => ({
          topic: q.subtopic || `Week ${q.week}`,
          score: q.correctAnswers || 0,
          maxScore: q.totalQuestions || 0,
          percentage: q.totalQuestions > 0 ? Math.round((q.correctAnswers / q.totalQuestions) * 100) : 0
        }));
        break;

      case 'ct':
        const ctRecord = await require('../model/iitm_ct_scores').findOne({ email: user.email });
        scores = (ctRecord?.quizScores || []).map(q => ({
          topic: q.topic || 'CT Exercise',
          score: q.correctAnswers || q.score || 0,
          maxScore: q.totalQuestions || 0,
          percentage: q.percentage || 0
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

// Build rich behavioral signals from the student's data
function analyzeStudentBehavior(userData) {
  const scores = userData.scores || [];
  if (scores.length === 0) return { scenario: 'new', signals: {} };

  const pcts = scores.map(s => parseFloat(s.percentage) || 0);
  const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
  const totalAttempts = scores.length;

  // Topic diversity
  const uniqueTopics = new Set(scores.map(s => s.topic)).size;
  const topicRetries = totalAttempts - uniqueTopics; // >0 means they retried topics

  // Zero scores
  const zeroCount = pcts.filter(p => p === 0).length;
  const zeroRatio = zeroCount / totalAttempts;

  // Score trend over time (requires timestamps)
  const withTime = scores
    .filter(s => s.timestamp)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let trend = 'flat';
  let improving = false;
  if (withTime.length >= 4) {
    const half = Math.floor(withTime.length / 2);
    const firstAvg = withTime.slice(0, half).reduce((a, b) => a + (parseFloat(b.percentage) || 0), 0) / half;
    const secondAvg = withTime.slice(half).reduce((a, b) => a + (parseFloat(b.percentage) || 0), 0) / (withTime.length - half);
    if (secondAvg > firstAvg + 8) { trend = 'improving'; improving = true; }
    else if (secondAvg < firstAvg - 8) trend = 'declining';
  }

  // Score consistency
  const variance = pcts.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / pcts.length;
  const stdDev = Math.sqrt(variance);

  // Engagement score (0–100) — purely about behavior, not raw scores
  let engagementScore = 0;
  engagementScore += Math.min(totalAttempts * 6, 30);   // up to 30: more attempts = more engaged
  engagementScore += Math.min(uniqueTopics * 4, 20);    // up to 20: topic breadth
  engagementScore += topicRetries > 0 ? 20 : 0;         // 20: retrying topics = perseverance
  engagementScore += improving ? 20 : 0;                // 20: score trend improving
  engagementScore += zeroRatio < 0.2 ? 10 : 0;          // 10: not skipping/blanking quizzes

  // Classification — engagement-first, score is secondary context
  let scenario;
  if (scores.length === 0) {
    scenario = 'new';
  } else if (engagementScore < 20 && avg < 30 && zeroRatio > 0.4) {
    // Low engagement AND low scores AND many zeros → genuinely not trying
    scenario = 'time_waster';
  } else if (engagementScore >= 30 && avg < 45) {
    // Engaged but struggling — quizzes may genuinely be hard
    scenario = 'struggling_engaged';
  } else if (totalAttempts <= 3 || (uniqueTopics <= 2 && !improving)) {
    // Just getting started
    scenario = 'beginner';
  } else {
    // Consistent effort, decent coverage
    scenario = 'serious';
  }

  return {
    scenario,
    signals: {
      avg: avg.toFixed(1),
      totalAttempts,
      uniqueTopics,
      topicRetries,
      zeroRatio: (zeroRatio * 100).toFixed(0) + '%',
      trend,
      stdDev: stdDev.toFixed(1),
      engagementScore: Math.round(engagementScore)
    }
  };
}

// Build a scenario-specific prompt based on student classification
function buildPrompt(userData, behavior) {
  const { scenario, signals } = behavior;

  const topicLines = userData.scores
    .map(s => `  - ${s.topic}: ${s.score}/${s.maxScore} (${parseFloat(s.percentage).toFixed(1)}%)`)
    .join('\n');

  const zeroTopics = userData.scores.filter(s => parseFloat(s.percentage) === 0).map(s => s.topic);
  const strongTopics = userData.scores.filter(s => parseFloat(s.percentage) >= 70).map(s => s.topic);
  const weakTopics = userData.scores.filter(s => parseFloat(s.percentage) < 50 && parseFloat(s.percentage) > 0).map(s => s.topic);

  const baseInfo = `
STUDENT: ${userData.user.name}
SUBJECT: ${userData.subject}
OVERALL: ${userData.totalScore}/${userData.maxScore} (${userData.overallPercentage.toFixed(1)}%)

BEHAVIORAL SIGNALS:
  - Total quiz attempts: ${signals.totalAttempts}
  - Unique topics covered: ${signals.uniqueTopics}
  - Topics retried (persistence): ${signals.topicRetries}
  - Score trend over time: ${signals.trend}
  - Engagement score: ${signals.engagementScore}/100
  - Average score: ${signals.avg}%
  - Score consistency (std dev): ${signals.stdDev}% ${parseFloat(signals.stdDev) > 25 ? '(highly inconsistent)' : parseFloat(signals.stdDev) > 15 ? '(somewhat inconsistent)' : '(consistent)'}
  - Zero-score rate: ${signals.zeroRatio}

TOPIC BREAKDOWN:
${topicLines}

STRONG TOPICS (≥70%): ${strongTopics.join(', ') || 'None yet'}
STRUGGLING TOPICS (0–50%): ${weakTopics.join(', ') || 'None'}
ZERO SCORE TOPICS: ${zeroTopics.join(', ') || 'None'}`.trim();

  const jsonFields = `{
  "analysis": "...",
  "feedback": "...",
  "gaps": [{ "area": "topic", "description": "specific gap", "priority": "high/medium/low" }],
  "recommendations": [{ "topic": "action/topic", "description": "concrete step with reasoning", "difficulty": "beginner/intermediate/advanced" }],
  "scenario": "${scenario}",
  "scenarioMessage": "one direct sentence for the student"
}`;

  if (scenario === 'time_waster') {
    return `
You are a strict but caring academic coach. This student's behavioral data clearly shows disengagement — not just low scores, but low engagement score (${signals.engagementScore}/100), high zero-score rate (${signals.zeroRatio}), and minimal topic retries (${signals.topicRetries}).

${baseInfo}

Important: Low scores alone do NOT mean disengagement. But this student's combination of low engagement score, many zeros, and no retries suggests they are not genuinely trying.

Provide a firm, honest, caring response. Call out the pattern directly. The goal is to wake them up — not shame them. Reference their actual numbers.

Respond with ONLY this JSON (no extra text):
${jsonFields}

- "analysis": Direct 2-3 sentences. Name the disengagement pattern specifically using their data.
- "feedback": Firm wake-up call — what this pattern means for their learning if it continues.
- "scenarioMessage": One honest sentence speaking directly to the student about why this is their loss.
`.trim();
  }

  if (scenario === 'struggling_engaged') {
    return `
You are an empathetic academic coach. This student is GENUINELY TRYING but struggling with the material. Their engagement score is ${signals.engagementScore}/100, they've retried topics ${signals.topicRetries} times, and their score trend is ${signals.trend} — but their scores remain low. This is NOT laziness. The quizzes may be genuinely difficult, or there are foundational gaps.

${baseInfo}

CRITICAL: Do NOT treat low scores as disengagement. This student is putting in effort. Acknowledge the struggle, identify likely root causes, and give them a clear path forward.

Respond with ONLY this JSON (no extra text):
${jsonFields}

- "analysis": 2-3 sentences acknowledging their effort while being honest about where they stand. Distinguish between effort and outcome.
- "feedback": Compassionate but actionable. Identify likely foundational gaps causing the low scores — not just "study more". What specific concepts are probably missing?
- "gaps": Focus on ROOT CAUSE gaps — the foundational concepts whose absence explains multiple low scores.
- "recommendations": Targeted steps that address root causes. Start from prerequisites if needed.
- "scenarioMessage": One sentence that validates their effort while redirecting their strategy — not just "keep going".
`.trim();
  }

  if (scenario === 'beginner') {
    return `
You are an encouraging academic mentor. This student is in the early stages — ${signals.totalAttempts} attempts across ${signals.uniqueTopics} topics. Their score trend is ${signals.trend}. They are building foundations and need clear, supportive direction.

${baseInfo}

Respond with ONLY this JSON (no extra text):
${jsonFields}

- "analysis": Warm, honest 2-3 sentences. Where are they in their journey? What do their early scores actually tell you?
- "feedback": Celebrate what they've done right, then give 2-3 crystal-clear next steps. Beginners get lost with vague advice — be specific.
- "gaps": Frame gaps as "what to build next", not "what's wrong".
- "recommendations": Beginner-friendly, concrete, with expected outcomes.
- "scenarioMessage": One genuinely encouraging sentence with a clear direction — not generic praise.
`.trim();
  }

  // serious learner
  return `
You are a subject matter expert giving peer-level feedback to a serious student. Engagement score: ${signals.engagementScore}/100. They've attempted ${signals.uniqueTopics} topics, retried ${signals.topicRetries} times, and their score trend is ${signals.trend}. They deserve depth, not encouragement.

${baseInfo}

Respond with ONLY this JSON (no extra text):
${jsonFields}

- "analysis": 3-4 nuanced sentences. What patterns emerge across their topics? What does the gap between their strong and weak areas reveal about their understanding?
- "feedback": Explain the WHY behind each gap — what conceptual misunderstanding likely caused it. Reference specific topics and percentages.
- "gaps": Conceptual gaps with depth — what does each gap mean for their broader understanding of the subject?
- "recommendations": Advanced, targeted — what to study, HOW to study it, and what mastery looks like.
- "scenarioMessage": One insight about their learning pattern they may not have noticed themselves.
`.trim();
}

// Generate AI analysis and feedback
async function generateAnalysis(userData) {
  const behavior = analyzeStudentBehavior(userData);
  const prompt = buildPrompt(userData, behavior);

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('AI API key not configured');
    }

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
    });
    const text = completion.choices[0]?.message?.content || '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Could not parse AI response');
    }
  } catch (error) {
    console.error('AI Analysis Error:', error);

    const { scenario } = behavior;
    const weakAreas = userData.scores
      .filter(s => parseFloat(s.percentage) < 60)
      .map(s => ({
        area: s.topic,
        description: `${parseFloat(s.percentage).toFixed(1)}% — needs focused attention`,
        priority: parseFloat(s.percentage) < 40 ? 'high' : 'medium'
      }));

    const scenarioMessages = {
      time_waster: 'The data shows low engagement — retrying topics and attempting more quizzes is the first step.',
      struggling_engaged: 'You are clearly trying — the issue is likely foundational gaps, not effort. Identify and fix the root concepts.',
      beginner: 'You have made a start — that is the hardest part. Keep going, topic by topic.',
      serious: 'Your engagement is clear — now target the specific conceptual gaps holding back your score.',
      new: 'Start with any topic and build from there.'
    };

    return {
      analysis: `${userData.user.name} scored ${userData.overallPercentage.toFixed(1)}% overall in ${userData.subject} across ${userData.scores.length} topics. Engagement score: ${behavior.signals.engagementScore}/100, trend: ${behavior.signals.trend}.`,
      feedback: scenarioMessages[scenario] || scenarioMessages.serious,
      gaps: weakAreas.length > 0 ? weakAreas : [{ area: 'General Practice', description: 'Keep practising consistently', priority: 'low' }],
      recommendations: weakAreas.slice(0, 3).map(g => ({
        topic: g.area,
        description: `Revisit ${g.area} — review core concepts then reattempt the quiz`,
        difficulty: scenario === 'serious' ? 'intermediate' : 'beginner'
      })),
      scenario,
      scenarioMessage: scenarioMessages[scenario] || scenarioMessages.serious
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

// POST /api/sat_exam_ai_feedback - AI feedback for a single enriched SAT exam attempt
router.post('/sat_exam_ai_feedback', async (req, res) => {
  try {
    const { student, attempt, enrichedResults, insights } = req.body;

    if (!attempt || !enrichedResults) {
      return res.status(400).json({ success: false, message: 'Missing exam data' });
    }

    const { difficultyStats, typeStats } = insights || {};

    // Build a concise wrong-question summary (max 8 to keep prompt tight)
    const wrongQuestions = enrichedResults
      .filter(r => !r.isCorrect && r.userAnswer != null)
      .slice(0, 8)
      .map(r =>
        `  Q${r.questionNumber} [${r.difficulty || 'unknown'} | ${(r.type || 'unknown').replace(/_/g, ' ')}]: ` +
        `"${(r.questionText || '').slice(0, 120)}" ` +
        `| Student answered: "${r.userAnswer || '—'}" | Correct: "${Array.isArray(r.correctAnswer) ? r.correctAnswer.join(', ') : r.correctAnswer}"` +
        (r.explanation ? ` | Explanation: "${r.explanation.slice(0, 150)}"` : '')
      ).join('\n');

    const unattemptedCount = enrichedResults.filter(r => r.userAnswer == null).length;

    const diffLines = Object.entries(difficultyStats || {})
      .filter(([, s]) => s.total > 0)
      .map(([d, s]) => `  ${d}: ${s.correct}/${s.total} correct (${Math.round((s.correct / s.total) * 100)}%)`)
      .join('\n');

    const typeLines = Object.entries(typeStats || {})
      .map(([t, s]) => `  ${t.replace(/_/g, ' ')}: ${s.correct}/${s.total} correct`)
      .join('\n');

    const prompt = `
You are an expert SAT tutor reviewing a student's exam attempt. Provide a deeply personalised, constructive analysis.

STUDENT: ${student?.name || 'Student'} (${student?.email || ''})
SECTION: ${attempt.subject}
ATTEMPT: #${attempt.attemptNumber}  |  DATE: ${attempt.dateAttempted ? new Date(attempt.dateAttempted).toLocaleDateString() : 'N/A'}

OVERALL RESULT: ${attempt.correctAnswers}/${attempt.totalQuestions} correct = ${Math.round(attempt.percentage)}%  |  Unattempted: ${unattemptedCount}

DIFFICULTY BREAKDOWN:
${diffLines || '  (no data)'}

QUESTION TYPE BREAKDOWN:
${typeLines || '  (no data)'}

WRONG QUESTIONS (${enrichedResults.filter(r => !r.isCorrect && r.userAnswer != null).length} total, showing up to 8):
${wrongQuestions || '  (none — all attempted questions correct!)'}

Based on this data, provide a JSON response with these exact fields:
{
  "summary": "2-3 sentence honest overall assessment — mention the score, strongest and weakest areas",
  "conceptualGaps": ["list each distinct concept or sub-topic the student clearly doesn't understand yet, based on the wrong questions and their explanations"],
  "mistakePatterns": ["patterns you notice — e.g. struggling with a specific question type, leaving questions unattempted, careless errors on easy ones"],
  "difficultyInsight": "one paragraph: how the student performed across difficulty levels and what it reveals about their current mastery",
  "timeInsight": "one paragraph: based on the unattempted count and difficulty pattern, what this suggests about pacing and time management on the test",
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
    console.error('SAT exam AI feedback error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

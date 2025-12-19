const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const fileUpload = require('express-fileupload');
const puppeteer = require('puppeteer');
const User = require('../models/User');
const Question = require('../models/Question');
const { authenticateToken } = require('../middleware/auth');
const Auth = require('../models/Auth');


const router = express.Router();

// Save individual answer
router.post('/user/save-answer', authenticateToken, async (req, res) => {
  try {
    const { userId, questionId, selectedOption, attemptNumber } = req.body;

    console.log('Received save-answer request:', { userId, questionId, selectedOption, attemptNumber });

    // Validate request body
    if (!userId || !questionId || !selectedOption || attemptNumber == null) {
      console.error('Missing required fields:', { userId, questionId, selectedOption, attemptNumber });
      return res.status(400).json({ error: 'userId, questionId, selectedOption, and attemptNumber are required' });
    }

    // Validate questionId format
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      console.error('Invalid questionId format:', questionId);
      return res.status(400).json({ error: 'Invalid questionId format' });
    }

    // Find the question
    const question = await Question.findById(questionId);
    if (!question) {
      console.error('Question not found:', questionId);
      return res.status(404).json({ error: 'Question not found' });
    }

    // Validate selectedOption
    const option = question.options.find(opt => opt.label === selectedOption);
    if (!option) {
      console.error('Invalid option selected:', selectedOption, 'for question:', questionId);
      return res.status(400).json({ error: 'Invalid option selected' });
    }

    // Find or create user
    let user = await User.findOne({ userId });
    if (!user) {
      console.log('Creating new user:', userId);
      user = new User({
        userId,
        name: req.user.profile.name || 'Default User',
        email: req.user.email || `${userId}@example.com`,
        assessmentAttempts: 0,
        questionHistory: [],
        categoryScores: [],
        assessmentHistory: [],
        totalScore: 0,
        totalPossibleScore: 0,
        overallPercentage: 0,
        lastActivity: new Date(),
        createdAt: new Date(),
        notifications: {
          email: true,
          assessment: true,
          achievements: true,
          security: true
        },
        privacy: {
          showOnLeaderboard: true,
          shareProgress: false,
          publicProfile: false
        }
      });
    }

    // Check attempt limit
    if (user.assessmentAttempts >= 10) {
      console.error('Maximum assessment attempts reached for user:', userId);
      return res.status(400).json({ error: 'Maximum assessment attempts (10) reached' });
    }

    // Calculate score based on option weight
    const questionWeight = isFinite(Number(question.weight)) ? Number(question.weight) : 10;
    const scoreEarned = (option.weight / 100) * questionWeight;

    // Update or add answer to questionHistory
    const existingAnswer = user.questionHistory.find(
      history => history.questionId.toString() === questionId && history.attemptNumber === attemptNumber
    );
    if (existingAnswer) {
      existingAnswer.selectedOption = selectedOption;
      existingAnswer.scoreEarned = scoreEarned;
      existingAnswer.optionWeight = option.weight;
      existingAnswer.questionWeight = questionWeight;
      existingAnswer.answeredAt = new Date();
      console.log('Updated existing answer:', { questionId, selectedOption, attemptNumber, scoreEarned });
    } else {
      user.questionHistory.push({
        questionId,
        questionText: question.question,
        complianceName: question.complianceName,
        selectedOption,
        optionWeight: option.weight,
        scoreEarned,
        questionWeight,
        answeredAt: new Date(),
        attemptNumber
      });
      console.log('Added new answer:', { questionId, selectedOption, attemptNumber, scoreEarned });
    }

    await user.save();
    console.log('User saved successfully:', userId);

    res.status(200).json({ success: true, scoreEarned });
  } catch (err) {
    console.error('Save answer error:', err);
    res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
});

// Submit assessment
router.post('/user/submit-assessment', authenticateToken, async (req, res) => {
  try {
    const { userId, name, answers, attemptNumber } = req.body;

    console.log('Received submit-assessment request:', { userId, answers, attemptNumber });

    // Validate request body
    if (!userId || !answers || attemptNumber == null) {
      console.error('Missing required fields:', { userId, answers, attemptNumber });
      return res.status(400).json({ error: 'userId, answers, and attemptNumber are required' });
    }

    // Find or create user
    let user = await User.findOne({ userId });
    if (!user) {
      console.log('Creating new user:', userId);
      user = new User({
        userId,
        name: name || req.user.profile.name || 'Default User',
        email: req.user.email || `${userId}@example.com`,
        assessmentAttempts: 0,
        questionHistory: [],
        categoryScores: [],
        assessmentHistory: [],
        totalScore: 0,
        totalPossibleScore: 0,
        overallPercentage: 0,
        lastActivity: new Date(),
        createdAt: new Date(),
        notifications: {
          email: true,
          assessment: true,
          achievements: true,
          security: true
        },
        privacy: {
          showOnLeaderboard: true,
          shareProgress: false,
          publicProfile: false
        }
      });
    }

    // Check attempt limit
    if (user.assessmentAttempts >= 10) {
      console.error('Maximum assessment attempts reached for user:', userId);
      return res.status(400).json({ error: 'Maximum assessment attempts (10) reached' });
    }

    // Validate question IDs
    const questionIds = Object.keys(answers).filter(id => mongoose.Types.ObjectId.isValid(id));
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]));
    const invalidQuestionIds = Object.keys(answers).filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidQuestionIds.length > 0) {
      console.warn('Invalid question IDs encountered:', invalidQuestionIds);
    }

    // Calculate scores
    let totalScored = 0;
    let totalWeighted = 0;
    const categoryScores = {};

    for (const [questionId, selectedOption] of Object.entries(answers)) {
      if (!mongoose.Types.ObjectId.isValid(questionId)) {
        console.warn('Skipping invalid questionId:', questionId);
        continue;
      }

      const question = questionMap.get(questionId);
      if (!question) {
        console.warn('Question not found for ID:', questionId);
        continue;
      }

      const option = question.options.find(opt => opt.label === selectedOption);
      if (!option) {
        console.warn(`Invalid option ${selectedOption} for question ${questionId}`);
        continue;
      }

      const questionWeight = isFinite(Number(question.weight)) ? Number(question.weight) : 10;
      const scoreEarned = (option.weight / 100) * questionWeight;

      const complianceName = question.complianceName || 'General';
      if (!categoryScores[complianceName]) {
        categoryScores[complianceName] = {
          totalScored: 0,
          totalWeighted: 0,
          questionsAnswered: 0
        };
      }
      categoryScores[complianceName].totalScored += scoreEarned;
      categoryScores[complianceName].totalWeighted += questionWeight;
      categoryScores[complianceName].questionsAnswered += 1;

      totalScored += scoreEarned;
      totalWeighted += questionWeight;

      const existingAnswer = user.questionHistory.find(
        history => history.questionId.toString() === questionId && history.attemptNumber === attemptNumber
      );
      if (!existingAnswer) {
        user.questionHistory.push({
          questionId,
          questionText: question.question,
          complianceName,
          selectedOption,
          optionWeight: option.weight,
          scoreEarned,
          questionWeight,
          answeredAt: new Date(),
          attemptNumber
        });
      }
    }

    if (!isFinite(totalScored) || !isFinite(totalWeighted)) {
      console.error('Invalid total scores:', { totalScored, totalWeighted });
      return res.status(400).json({ error: 'Invalid score calculations: NaN detected' });
    }

    const newCategoryScores = Object.entries(categoryScores).map(([complianceName, data]) => {
      if (!isFinite(data.totalScored) || !isFinite(data.totalWeighted)) {
        console.warn(`Invalid category scores for ${complianceName}:`, data);
        return {
          complianceName,
          totalScored: 0,
          totalWeighted: 0,
          percentageScore: 0,
          questionsAnswered: data.questionsAnswered,
          lastActivity: new Date(),
          attemptNumber
        };
      }
      return {
        complianceName,
        totalScored: data.totalScored,
        totalWeighted: data.totalWeighted,
        percentageScore: data.totalWeighted > 0 ? (data.totalScored / data.totalWeighted) * 100 : 0,
        questionsAnswered: data.questionsAnswered,
        lastActivity: new Date(),
        attemptNumber
      };
    });

    user.categoryScores = user.categoryScores.filter(cs => cs.attemptNumber !== attemptNumber);
    user.categoryScores.push(...newCategoryScores);

    const overallPercentage = totalWeighted > 0 ? (totalScored / totalWeighted) * 100 : 0;
    user.assessmentHistory.push({
      attemptNumber,
      overallPercentage,
      completedAt: new Date(),
      userName: name || user.name
    });

    user.assessmentAttempts += 1;
    user.totalScore = totalScored;
    user.totalPossibleScore = totalWeighted;
    user.overallPercentage = overallPercentage;
    user.lastActivity = new Date();
    user.name = name || user.name;

    await user.save();
    console.log('Assessment submitted successfully for user:', userId);

    res.status(200).json({
      success: true,
      overallPercentage,
      categoryScores: newCategoryScores,
      attemptNumber,
      redirect: '/user/reports'
    });
  } catch (err) {
    console.error('Submit assessment error:', err);
    res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
});

// Fetch user report
router.get('/user/report', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;

    console.log('Received report request for user:', userId);

    if (!userId) {
      console.error('userId is required');
      return res.status(400).json({ error: 'userId is required' });
    }

    let user = await User.findOne({ userId });
    if (!user) {
      console.log('Creating new user for report:', userId);
      user = new User({
        userId,
        name: req.user.profile.name || 'Default User',
        email: req.user.email || `${userId}@example.com`,
        assessmentAttempts: 0,
        questionHistory: [],
        categoryScores: [],
        assessmentHistory: [],
        totalScore: 0,
        totalPossibleScore: 0,
        overallPercentage: 0,
        lastActivity: new Date(),
        createdAt: new Date(),
        notifications: {
          email: true,
          assessment: true,
          achievements: true,
          security: true
        },
        privacy: {
          showOnLeaderboard: true,
          shareProgress: false,
          publicProfile: false
        }
      });
      await user.save();
      console.log('New user created for report:', userId);
    }

    const latestAttempt = user.assessmentHistory.reduce(
      (max, attempt) => Math.max(max, attempt.attemptNumber || 0),
      0
    );
    const categoryScoresObj = {};
    user.categoryScores
      .filter(cs => cs.attemptNumber === latestAttempt)
      .forEach(cs => {
        categoryScoresObj[cs.complianceName] = cs.percentageScore;
      });

    const recommendations = user.categoryScores
      .filter(cs => cs.attemptNumber === latestAttempt && cs.percentageScore < 80)
      .map(cs => ({
        category: cs.complianceName,
        issue: `Low score in ${cs.complianceName}`,
        description: `Your score of ${cs.percentageScore.toFixed(2)}% in ${cs.complianceName} is below the recommended threshold.`,
        action: `Review ${cs.complianceName} best practices and implement stronger measures.`,
        priority: cs.percentageScore < 40 ? 'High' : cs.percentageScore < 60 ? 'Medium' : 'Low'
      }));

    const improvements = user.assessmentHistory.map(ah => ({
      date: ah.completedAt,
      score: ah.overallPercentage,
      category: 'Overall',
      userName: ah.userName
    }));

    // Calculate rank based on overallPercentage
    let rank = 'Bronze';
    if (user.overallPercentage >= 90) rank = 'Gold';
    else if (user.overallPercentage >= 70) rank = 'Silver';

    res.status(200).json({
      userName: user.name,
      email: user.email,
      overallScore: user.overallPercentage,
      previousScore: user.assessmentHistory.length > 1
        ? user.assessmentHistory[user.assessmentHistory.length - 2]?.overallPercentage || 0
        : 0,
      lastAssessment: user.lastActivity ? user.lastActivity.toLocaleDateString() : 'No assessments yet',
      totalAssessments: user.assessmentAttempts,
      attempts: user.assessmentHistory.map(ah => ({
        attemptNumber: ah.attemptNumber,
        overallPercentage: ah.overallPercentage,
        completedAt: ah.completedAt,
        userName: ah.userName,
        accuracyChange: user.assessmentHistory.length > 1 && ah.attemptNumber > 1
          ? ah.overallPercentage - (user.assessmentHistory.find(h => h.attemptNumber === ah.attemptNumber - 1)?.overallPercentage || 0)
          : 0
      })),
      categoryScores: categoryScoresObj,
      recommendations,
      improvements,
      benchmarks: {
        industry: 75,
        peers: 68,
        topPerformers: 92
      },
      joinDate: user.createdAt ? user.createdAt.toLocaleDateString() : undefined,
      achievements: user.assessmentHistory.length,
      rank
    });
  } catch (err) {
    console.error('Fetch report error:', err);
    res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
});

// Generate PDF report
router.get('/user/generateReport', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;

    console.log('Received generateReport request for user:', userId);

    if (!userId) {
      console.error('userId is required');
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      console.error('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const latestAttempt = user.assessmentHistory.reduce(
      (max, attempt) => Math.max(max, attempt.attemptNumber || 0),
      0
    );
    const categoryScoresObj = {};
    user.categoryScores
      .filter(cs => cs.attemptNumber === latestAttempt)
      .forEach(cs => {
        categoryScoresObj[cs.complianceName] = cs.percentageScore;
      });

    const recommendations = user.categoryScores
      .filter(cs => cs.attemptNumber === latestAttempt && cs.percentageScore < 80)
      .map(cs => ({
        category: cs.complianceName,
        issue: `Low score in ${cs.complianceName}`,
        description: `Your score of ${cs.percentageScore.toFixed(2)}% in ${cs.complianceName} is below the recommended threshold.`,
        action: `Review ${cs.complianceName} best practices and implement stronger measures.`,
        priority: cs.percentageScore < 40 ? 'High' : cs.percentageScore < 60 ? 'Medium' : 'Low'
      }));

    const improvements = user.assessmentHistory.map(ah => ({
      date: ah.completedAt,
      score: ah.overallPercentage,
      category: 'Overall',
      userName: ah.userName
    }));

    const reportData = {
      userName: user.name,
      email: user.email,
      overallScore: user.overallPercentage,
      previousScore: user.assessmentHistory.length > 1
        ? user.assessmentHistory[user.assessmentHistory.length - 2]?.overallPercentage || 0
        : 0,
      lastAssessment: user.lastActivity ? user.lastActivity.toLocaleDateString() : 'No assessments yet',
      totalAssessments: user.assessmentAttempts,
      attempts: user.assessmentHistory.map(ah => ({
        attemptNumber: ah.attemptNumber,
        overallPercentage: ah.overallPercentage,
        completedAt: ah.completedAt,
        userName: ah.userName,
        accuracyChange: user.assessmentHistory.length > 1 && ah.attemptNumber > 1
          ? ah.overallPercentage - (user.assessmentHistory.find(h => h.attemptNumber === ah.attemptNumber - 1)?.overallPercentage || 0)
          : 0
      })),
      categoryScores: categoryScoresObj,
      recommendations,
      improvements,
      benchmarks: {
        industry: 75,
        peers: 68,
        topPerformers: 92
      },
      joinDate: user.createdAt ? user.createdAt.toLocaleDateString() : undefined,
      achievements: user.assessmentHistory.length
    };

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Generate HTML template for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20mm; color: #1f2937; }
          .container { max-width: 700px; margin: 0 auto; }
          .header { text-align: center; padding: 20px; background: #f3f4f6; border-radius: 12px; }
          .header h1 { font-size: 24px; margin: 0; }
          .header p { font-size: 16px; color: #4b5563; }
          .section { margin-top: 20px; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
          .card-title { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
          .score { font-size: 36px; font-weight: bold; }
          .score-green { color: #10b981; }
          .score-yellow { color: #f59e0b; }
          .score-red { color: #ef4444; }
          .progress { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
          .progress-bar { height: 100%; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; }
          .badge-green { background: #d1fae5; color: #065f46; }
          .badge-yellow { background: #fef3c7; color: #92400e; }
          .badge-red { background: #fee2e2; color: #991b1b; }
          .badge-blue { background: #dbeafe; color: #1e40af; }
          .table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          .table th, .table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
          .table th { background: #f3f4f6; }
          .footer { text-align: center; font-size: 10px; color: #6b7280; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Security Assessment Report</h1>
            <p>Generated for: ${reportData.userName} (${reportData.email})</p>
            <p>Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>

          <div class="section">
            <div class="card">
              <div class="card-title">Overall Security Score</div>
              <div class="${reportData.overallScore >= 80 ? 'score score-green' : reportData.overallScore >= 60 ? 'score score-yellow' : 'score score-red'}">
                ${reportData.overallScore.toFixed(1)}%
              </div>
              <div class="progress">
                <div class="progress-bar" style="width: ${reportData.overallScore}%; background: ${reportData.overallScore >= 80 ? '#10b981' : reportData.overallScore >= 60 ? '#f59e0b' : '#ef4444'};"></div>
              </div>
              <p>Last Assessment: ${reportData.lastAssessment}</p>
              <p>Total Assessments: ${reportData.totalAssessments}</p>
              ${reportData.attempts.length > 1 ? `<p>Change: ${(reportData.overallScore - reportData.previousScore).toFixed(1)}%</p>` : ''}
              ${reportData.joinDate ? `<p>Join Date: ${reportData.joinDate}</p>` : ''}
              ${reportData.achievements ? `<p>Achievements: ${reportData.achievements}</p>` : ''}
            </div>
          </div>

          <div class="section">
            <div class="card">
              <div class="card-title">Category Performance</div>
              ${Object.entries(reportData.categoryScores).map(([category, score]) => `
                <div style="margin-bottom: 12px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span>${category}</span>
                    <span class="badge ${score >= 80 ? 'badge-green' : score >= 60 ? 'badge-yellow' : 'badge-red'}">${score.toFixed(1)}%</span>
                  </div>
                  <div class="progress">
                    <div class="progress-bar" style="width: ${score}%; background: ${score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'};"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="section">
            <div class="card">
              <div class="card-title">Industry Benchmarks</div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center;">
                <div>
                  <div style="font-size: 20px; font-weight: bold; color: #f59e0b;">${reportData.benchmarks.industry.toFixed(1)}%</div>
                  <div>Industry Average</div>
                </div>
                <div>
                  <div style="font-size: 20px; font-weight: bold; color: #3b82f6;">${reportData.benchmarks.peers.toFixed(1)}%</div>
                  <div>Similar Users</div>
                </div>
                <div>
                  <div style="font-size: 20px; font-weight: bold; color: #10b981;">${reportData.benchmarks.topPerformers.toFixed(1)}%</div>
                  <div>Top Performers</div>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="card">
              <div class="card-title">Security Score Trends</div>
              ${reportData.attempts.length > 0 ? `
                <table class="table">
                  <tr>
                    <th>Attempt</th>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Change</th>
                  </tr>
                  ${reportData.attempts.map(attempt => `
                    <tr>
                      <td>#${attempt.attemptNumber}</td>
                      <td>${new Date(attempt.completedAt).toLocaleDateString()}</td>
                      <td>${attempt.overallPercentage.toFixed(1)}%</td>
                      <td>${attempt.accuracyChange !== 0 ? `${attempt.accuracyChange >= 0 ? '+' : ''}${attempt.accuracyChange.toFixed(1)}%` : '-'}</td>
                    </tr>
                  `).join('')}
                </table>
              ` : '<p>No assessment history available.</p>'}
            </div>
          </div>

          <div class="section">
            <div class="card">
              <div class="card-title">Recommendations</div>
              ${reportData.recommendations.length > 0 ? `
                ${reportData.recommendations.map((rec, index) => `
                  <div style="margin-bottom: 16px;">
                    <div style="display: flex; gap: 8px; margin-bottom: 4px;">
                      <span class="badge badge-blue">${rec.category}</span>
                      <span class="badge ${rec.priority === 'High' ? 'badge-red' : rec.priority === 'Medium' ? 'badge-yellow' : 'badge-green'}">${rec.priority}</span>
                    </div>
                    <h4 style="font-weight: bold;">${rec.issue}</h4>
                    <p>${rec.description}</p>
                    <p><strong>Action:</strong> ${rec.action}</p>
                  </div>
                `).join('')}
              ` : '<p>No recommendations available. Your security practices are excellent!</p>'}
            </div>
          </div>

          <div class="section">
            <div class="card">
              <div class="card-title">Compliance Status</div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; text-align: center;">
                ${[
                  { name: 'NIST Framework', status: reportData.overallScore >= 80 ? 'Compliant' : 'Partial' },
                  { name: 'ISO 27001', status: reportData.overallScore >= 85 ? 'Compliant' : 'Non-Compliant' },
                  { name: 'GDPR', status: reportData.overallScore >= 75 ? 'Compliant' : 'Partial' },
                  { name: 'SOC 2', status: reportData.overallScore >= 70 ? 'Partial' : 'Non-Compliant' }
                ].map(framework => `
                  <div>
                    <div style="font-size: 24px; margin-bottom: 8px;">🛡️</div>
                    <div style="font-weight: bold;">${framework.name}</div>
                    <span class="badge ${framework.status === 'Compliant' ? 'badge-green' : framework.status === 'Partial' ? 'badge-yellow' : 'badge-red'}">${framework.status}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="card">
              <div class="card-title">Improvements</div>
              ${reportData.improvements.length > 0 ? `
                <table class="table">
                  <tr>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Category</th>
                  </tr>
                  ${reportData.improvements.map(imp => `
                    <tr>
                      <td>${new Date(imp.date).toLocaleDateString()}</td>
                      <td>${imp.score.toFixed(1)}%</td>
                      <td>${imp.category}</td>
                    </tr>
                  `).join('')}
                </table>
              ` : '<p>No improvements recorded.</p>'}
            </div>
          </div>

          <div class="footer">
            <p>Generated by Compliance Platform | Page ${page._pageNumber} of ${page._totalPages}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.addStyleTag({
      content: `
        @page { size: A4; margin: 20mm; }
        body { font-size: 12px; }
      `
    });

    // Add page numbers
    const pages = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    });

    await browser.close();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Security_Assessment_Report_${reportData.userName}_${new Date().toISOString().split('T')[0]}.pdf`);

    // Send PDF buffer
    res.status(200).send(pages);
  } catch (err) {
    console.error('Generate report error:', err);
    res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
});

// Fetch user profile and settings
router.get('/user/profile', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;

    console.log('Received profile request for user:', userId);

    if (!userId) {
      console.error('userId is required');
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      console.error('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      name: user.name,
      email: user.email,
      notifications: user.notifications,
      privacy: user.privacy
    });
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
});

// Update user profile and settings
router.post('/user/profile/update', authenticateToken, async (req, res) => {
  try {
    const { userId, name, email, notifications, privacy } = req.body;

    console.log('Received profile update request:', { userId, name, email });

    if (!userId) {
      console.error('userId is required');
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      console.error('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (notifications) {
      user.notifications = {
        email: notifications.email ?? user.notifications.email,
        assessment: notifications.assessment ?? user.notifications.assessment,
        achievements: notifications.achievements ?? user.notifications.achievements,
        security: notifications.security ?? user.notifications.security
      };
    }
    if (privacy) {
      user.privacy = {
        showOnLeaderboard: privacy.showOnLeaderboard ?? user.privacy.showOnLeaderboard,
        shareProgress: privacy.shareProgress ?? user.privacy.shareProgress,
        publicProfile: privacy.publicProfile ?? user.privacy.publicProfile
      };
    }

    user.lastActivity = new Date();
    await user.save();

    console.log('Profile updated successfully for user:', userId);

    res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
});

// Fetch questions
router.get('/user/questions', authenticateToken, async (req, res) => {
  try {
    const { userType, userId, complianceName } = req.query;

    console.log('Received questions request:', { userType, userId, complianceName });

    if (!userId) {
      console.error('userId is required');
      return res.status(400).json({ error: 'userId is required' });
    }

    let user = await User.findOne({ userId });
    if (!user) {
      console.log('Creating new user for questions:', userId);
      user = new User({
        userId,
        name: req.user.profile.name || 'Default User',
        email: req.user.email || `${userId}@example.com`,
        assessmentAttempts: 0,
        questionHistory: [],
        categoryScores: [],
        assessmentHistory: [],
        totalScore: 0,
        totalPossibleScore: 0,
        overallPercentage: 0,
        lastActivity: new Date(),
        createdAt: new Date(),
        notifications: {
          email: true,
          assessment: true,
          achievements: true,
          security: true
        },
        privacy: {
          showOnLeaderboard: true,
          shareProgress: false,
          publicProfile: false
        }
      });
      await user.save();
      console.log('New user created for questions:', userId);
    }

    if (user.assessmentAttempts >= 10) {
      console.error('Maximum assessment attempts reached for user:', userId);
      return res.status(400).json({ error: 'Maximum assessment attempts (10) reached' });
    }

    let filter = { isActive: true };
    if (complianceName) {
      filter.complianceName = complianceName;
    }
    if (userType) {
      // Include questions for the specific userType or 'both'
      filter.$or = [
        { userType: userType },
        { userType: 'both' }
      ];
    }

    console.log('Questions filter:', JSON.stringify(filter, null, 2));

    const questions = await Question.find(filter);
    console.log(`Found ${questions.length} questions with filter:`, filter);
    
    if (!questions || questions.length === 0) {
      // Additional debugging
      const totalQuestions = await Question.countDocuments({});
      const activeQuestions = await Question.countDocuments({ isActive: true });
      const userTypeQuestions = await Question.countDocuments({ userType: 'user', isActive: true });
      const bothTypeQuestions = await Question.countDocuments({ userType: 'both', isActive: true });
      
      console.log('Database stats:', {
        totalQuestions,
        activeQuestions,
        userTypeQuestions,
        bothTypeQuestions
      });
      
      console.error('No questions available for filter:', filter);
      return res.status(404).json({ 
        error: 'No questions available',
        debug: {
          filter,
          totalQuestions,
          activeQuestions,
          userTypeQuestions,
          bothTypeQuestions
        }
      });
    }

    const formattedQuestions = questions.map(q => ({
      _id: q._id.toString(),
      question: q.question,
      options: q.options.map(opt => ({
        label: opt.label,
        text: opt.text,
        weight: opt.weight || 0
      })),
      complianceName: q.complianceName || 'General',
      weight: isFinite(Number(q.weight)) ? Number(q.weight) : 10
    }));

    console.log(`Returning ${formattedQuestions.length} formatted questions to user ${userId}`);
    res.status(200).json(formattedQuestions);
  } catch (err) {
    console.error('Fetch questions error:', err);
    res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
});

// Send report via email
router.post('/user/sendReport', fileUpload(), authenticateToken, async (req, res) => {
  try {
    const { recipientEmail, recipientName, testName } = req.body;
    const pdfBuffer = req.files?.pdf?.data;

    console.log('Received sendReport request:', { recipientEmail, recipientName, testName, hasPdf: !!pdfBuffer });

    if (!recipientEmail || !recipientName || !testName || !pdfBuffer) {
      console.error('Missing required fields:', { recipientEmail, recipientName, testName, hasPdf: !!pdfBuffer });
      return res.status(400).json({ error: 'Missing required fields or PDF attachment' });
    }

    const transporter = nodemailer.createTransport({
      port: 465,
      host: "smtp.gmail.com",
      auth: {
        user: 'gaganprajapati799@gmail.com',
        pass: 'czmx pbqx lejb rxxp',
      },
      secure: true,
    });

    const mailOptions = {
      from: 'gaganltce@gmail.com',
      to: recipientEmail,
      subject: `Compliance Report for ${testName}`,
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Compliance Report</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f9f9f9; padding: 20px;">
  <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
    <h2 style="color: #2c3e50;">Your Compliance Report for <span style="color: #2980b9;">${testName}</span></h2>
    <p>Dear <strong>${recipientName}</strong>,</p>
    <p>Greetings from <strong>Compliance Platform</strong>!</p>
    <p>We are pleased to share with you the PDF report for the compliance assessment titled <strong>${testName}</strong>.</p>
    <p><strong>What's included in the report:</strong></p>
    <ul>
      <li>Overview of the compliance test</li>
      <li>Section-wise analysis</li>
      <li>Compliance score and status</li>
      <li>Recommendations for improvement (if any)</li>
    </ul>
    <p>Please find the attached PDF for full details. If you have any questions or need clarification, feel free to reach out to us at <a href="mailto:support@example.com">support@example.com</a>.</p>
    <p>Thank you for choosing <strong>Compliance Platform</strong> as your trusted partner in managing and assessing compliance.</p>
    <p style="margin-top: 30px;">Warm regards,</p>
    <p><strong>Compliance Platform Team</strong><br>
    <a href="mailto:support@example.com">support@example.com</a> | +91-XXXXXXXXXX<br>
    <a href="https://www.complianceplatform.com" target="_blank">www.complianceplatform.com</a></p>
  </div>
</body>
</html>`,
      attachments: [
        {
          filename: `${testName}_Compliance_Report.pdf`,
          content: pdfBuffer,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', recipientEmail);

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error('Send report error:', err);
    res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
});

// Get analytics for a company
router.get('/company/basic-analytics', async (req, res) => {
  try {
    const { companyCode } = req.query;

    if (!companyCode) {
      return res.status(400).json({ error: 'companyCode is required' });
    }

    const users = await Auth.find({ companyCode, userType: 'user' });
    const userIds = users.map((u) => u._id);

    const reports = await User.find({ userId: { $in: userIds } });

    const totalEmployees = users.length;
    const assessedEmployees = reports.length;

    // Optional: You can add aggregate scoring if needed
    const totalScore = reports.reduce((sum, user) => sum + (user.totalScore || 0), 0);
    const totalPossible = reports.reduce((sum, user) => sum + (user.totalPossibleScore || 0), 0);
    const overallPercentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;

    res.json({
      totalEmployees,
      assessedEmployees,
      overallPercentage: overallPercentage.toFixed(2)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/company/data', async (req, res) => {
  try {
    const companyCode = req.query.companyCode;
    if (!companyCode) {
      return res.status(400).json({ error: 'companyCode is required' });
    }

    // Fetch company info
    const company = await Auth.findOne({ companyCode, userType: 'company' }).lean();
    if (!company) return res.status(404).json({ error: 'Company not found' });

    // Fetch users under this company
    const employees = await User.find({ companyCode }).lean();

    // Prepare departments
    const departmentMap = {};
    employees.forEach(emp => {
      if (!departmentMap[emp.department]) departmentMap[emp.department] = [];
      departmentMap[emp.department].push(emp);
    });

    const departments = Object.entries(departmentMap).map(([name, emps]) => {
      return {
        name,
        employees: emps.length,
        percentage: ((emps.length / employees.length) * 100).toFixed(1),
        color: 'bg-blue-500', // You can later make this dynamic
      };
    });

    // Leaderboard logic (top 5)
    const leaderboard = [...employees]
      .filter(e => e.overallPercentage)
      .sort((a, b) => b.overallPercentage - a.overallPercentage)
      .slice(0, 5)
      .map((emp, idx) => ({
        name: emp.name,
        department: emp.department,
        rank: idx + 1,
        securityScore: emp.categoryScores?.['Security Awareness'] ?? null,
        quizScore: emp.categoryScores?.['Security Quiz'] ?? null,
        perfectScores: emp.perfectScores ?? 0,
        avgTime: emp.avgTime ?? null,
      }));

    // Recommendation mock (replace later with real logic if needed)
    const recommendations = [
      {
        id: 'rec1',
        title: 'Enable Multi-Factor Authentication',
        description: 'MFA adds an extra layer of security...',
        priority: 'High',
        category: 'Authentication',
        impact: 'High',
        cost: 'Medium',
        timeline: '1 Week',
        effort: 'Moderate',
        affectedEmployees: employees.length,
        details: {
          currentState: 'Employees only use password-based logins.',
          proposedSolution: 'Enable MFA for all accounts.',
          benefits: ['Reduced risk of breaches', 'Improved compliance'],
          steps: ['Evaluate MFA solutions', 'Pilot rollout', 'Company-wide deployment']
        }
      }
    ];

    // Quiz analytics (mocked, adjust based on your data model)
    const quizAnalytics = {
      totalQuizzes: 12,
      completionRate: 84,
      averageScore: 78,
      passRate: 92,
      averageTime: '4m 36s',
      categories: [
        {
          name: 'Phishing',
          avgScore: 76,
          difficulty: 'Medium',
          completions: 120
        },
        {
          name: 'Password Hygiene',
          avgScore: 84,
          difficulty: 'Easy',
          completions: 132
        }
      ],
      commonMistakes: [
        {
          question: 'What is phishing?',
          errorRate: 45,
          category: 'Phishing'
        },
        {
          question: 'Best practices for password management?',
          errorRate: 39,
          category: 'Password Hygiene'
        }
      ]
    };

    const complianceFrameworks = [
      { name: 'ISO 27001', expiry: '2026-05-01', status: 'Active' },
      { name: 'GDPR', expiry: '2025-12-31', status: 'Active' }
    ];

    const companyData = {
      companyName: company.companyName,
      companyCode: company.companyCode,
      totalEmployees: employees.length,
      foundedYear: company.foundedYear || '2019',
      industry: company.industry || 'Technology',
      securityLevel: company.securityLevel || 'Medium',
      primaryContact: company.email,
      securityOfficer: company.name,
      phone: company.phone || 'N/A',
      location: company.location || 'N/A',
      departments,
      recommendations,
      quizAnalytics,
      complianceFrameworks,
      employees,
      leaderboard,
    };

    res.json(companyData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
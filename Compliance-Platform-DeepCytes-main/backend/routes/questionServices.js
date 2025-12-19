const express = require('express');
const router = express.Router();
const Question = require('../models/Question');

const categories = [
  'Password Management',
  'Authentication',
  'Device Security',
  'Network Security',
  'Data Protection'
];

const sampleQuestions = [
  {
    complianceName: 'Password Management',
    question: 'How do you manage your passwords across platforms?',
    userType: 'user',
    options: [
      { label: 'A', text: 'Use a password manager with unique passwords for each account', weight: 100 },
      { label: 'B', text: 'Maintain a notebook with all passwords written down', weight: 60 },
      { label: 'C', text: 'Use the same password with slight variations', weight: 30 },
      { label: 'D', text: 'Memorize one common password and reuse it', weight: 10 }
    ],
    weight: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    complianceName: 'Password Management',
    question: 'How often do you change your passwords?',
    userType: 'user',
    options: [
      { label: 'A', text: 'Every 3–6 months', weight: 100 },
      { label: 'B', text: 'Only when prompted or forced', weight: 70 },
      { label: 'C', text: 'Rarely or never', weight: 30 },
      { label: 'D', text: 'I only change them if there\'s a security issue', weight: 50 }
    ],
    weight: 8,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    complianceName: 'Password Management',
    question: 'What is the length of your typical password?',
    userType: 'user',
    options: [
      { label: 'A', text: '12+ characters with special symbols and numbers', weight: 100 },
      { label: 'B', text: '8–11 characters with some variety', weight: 75 },
      { label: 'C', text: '6–7 characters, mostly alphabets', weight: 40 },
      { label: 'D', text: '4–5 characters, usually easy to remember', weight: 10 }
    ],
    weight: 9,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    complianceName: 'Authentication',
    question: 'Which authentication method is used for logging into company systems?',
    userType: 'user',
    options: [
      { label: 'A', text: 'Username + password + OTP or authenticator app', weight: 100 },
      { label: 'B', text: 'Username + password only', weight: 60 },
      { label: 'C', text: 'Biometric login only (fingerprint/face ID)', weight: 80 },
      { label: 'D', text: 'No authentication is required', weight: 0 }
    ],
    weight: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    complianceName: 'Authentication',
    question: 'Which of these best describes how multi-factor authentication (MFA) is used by you?',
    userType: 'user',
    options: [
      { label: 'A', text: 'Enabled on all critical accounts (email, banking, work)', weight: 100 },
      { label: 'B', text: 'Enabled only on financial or work-related apps', weight: 80 },
      { label: 'C', text: 'Used rarely, only when enforced', weight: 40 },
      { label: 'D', text: 'Never used MFA', weight: 0 }
    ],
    weight: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    complianceName: 'Device Security',
    question: 'How is your device protected when not in use?',
    userType: 'user',
    options: [
      { label: 'A', text: 'Auto-locked with strong password or biometric', weight: 100 },
      { label: 'B', text: 'Only screensaver or screen lock', weight: 60 },
      { label: 'C', text: 'No lock, anyone can use it', weight: 0 },
      { label: 'D', text: 'I manually lock it when I remember', weight: 30 }
    ],
    weight: 8,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    complianceName: 'Device Security',
    question: 'How is antivirus or endpoint protection managed?',
    userType: 'user',
    options: [
      { label: 'A', text: 'Centrally managed antivirus or EDR installed', weight: 100 },
      { label: 'B', text: 'Free antivirus software installed by the user', weight: 70 },
      { label: 'C', text: 'No antivirus installed', weight: 0 },
      { label: 'D', text: 'I\'m not sure about protection status', weight: 20 }
    ],
    weight: 9,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    complianceName: 'Network Security',
    question: 'How do you connect to the internet for work or personal use?',
    userType: 'user',
    options: [
      { label: 'A', text: 'Secure, private Wi-Fi with WPA3 or WPA2 encryption', weight: 100 },
      { label: 'B', text: 'Home Wi-Fi with unchanged router password', weight: 50 },
      { label: 'C', text: 'Frequently use public Wi-Fi (cafes, malls, stations)', weight: 20 },
      { label: 'D', text: 'I use mobile hotspots most of the time', weight: 70 }
    ],
    weight: 7,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    complianceName: 'Data Protection',
    question: 'How are system backups handled?',
    userType: 'user',
    options: [
      { label: 'A', text: 'Automated, encrypted backups to secure cloud', weight: 100 },
      { label: 'B', text: 'Manual backups done weekly', weight: 70 },
      { label: 'C', text: 'Occasionally backup important files', weight: 40 },
      { label: 'D', text: 'No backup process in place', weight: 0 }
    ],
    weight: 8,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    complianceName: 'Data Protection',
    question: 'How is confidential data shared within your team?',
    userType: 'user',
    options: [
      { label: 'A', text: 'Through encrypted channels with limited access', weight: 100 },
      { label: 'B', text: 'Shared via internal tools like email or Slack', weight: 60 },
      { label: 'C', text: 'Shared freely with anyone who asks', weight: 20 },
      { label: 'D', text: 'No formal rule for data sharing', weight: 30 }
    ],
    weight: 7,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function validateAndUpdateQuestions() {
  try {
    console.log('Validating and updating questions collection...');

    // Remove invalid questions
    // const questions = await Question.find({});
    // for (const question of questions) {
    //   const isValid = question.complianceName &&
    //                   categories.includes(question.complianceName) &&
    //                   question.options &&
    //                   question.options.length === 4 &&
    //                   question.options.every(opt => 
    //                     opt.label && 
    //                     ['A', 'B', 'C', 'D'].includes(opt.label) && 
    //                     opt.text && 
    //                     typeof opt.weight === 'number'
    //                   ) &&
    //                   question.isActive;

    //   if (!isValid) {
    //     console.log(`Removing invalid question: ${question._id}, complianceName: ${question.complianceName || 'undefined'}`);
    //     await Question.deleteOne({ _id: question._id });
    //   }
    // }

    // Get current questions
    const existingQuestions = await Question.find({ isActive: true });
    const existingQuestionMap = new Map(existingQuestions.map(q => [q.question, q]));
    const categoryCounts = {};
    existingQuestions.forEach(q => {
      categoryCounts[q.complianceName] = (categoryCounts[q.complianceName] || 0) + 1;
    });

    // Expected question counts
    const expectedCounts = {
      'Password Management': 3,
      'Authentication': 2,
      'Device Security': 2,
      'Network Security': 1,
      'Data Protection': 2
    };

    // Process each category
    for (const category of categories) {
      const currentCount = categoryCounts[category] || 0;
      const expectedCount = expectedCounts[category] || 0;

      // Remove excess questions
      if (currentCount > expectedCount) {
        console.log(`Removing ${currentCount - expectedCount} excess questions for ${category}`);
        const questionsToRemove = await Question.find({ complianceName: category, isActive: true })
          .sort({ createdAt: 1 })
          .limit(currentCount - expectedCount);
        const removedIds = questionsToRemove.map(q => q._id);
        await Question.deleteMany({ _id: { $in: removedIds } });
        console.log(`Removed ${questionsToRemove.length} questions for ${category}`);
        categoryCounts[category] = expectedCount;
        questionsToRemove.forEach(q => existingQuestionMap.delete(q.question));
      }

      // Add missing questions
      if (currentCount < expectedCount) {
        console.log(`Adding ${expectedCount - currentCount} questions for ${category}`);
        const questionsToAdd = sampleQuestions
          .filter(sq => sq.complianceName === category && !existingQuestionMap.has(sq.question))
          .slice(0, expectedCount - currentCount);
        
        if (questionsToAdd.length > 0) {
          await Question.insertMany(questionsToAdd);
          console.log(`Added ${questionsToAdd.length} questions for ${category}`);
          categoryCounts[category] = (categoryCounts[category] || 0) + questionsToAdd.length;
          questionsToAdd.forEach(q => existingQuestionMap.set(q.question, q));
        } else {
          console.warn(`No new questions available to add for ${category}`);
        }
      }
    }

    // Verify total question count
    const totalCount = await Question.countDocuments({ isActive: true });
    if (totalCount !== 10) {
      console.warn(`Total questions (${totalCount}) does not match expected (10)`);
    } else {
      console.log(`Total questions verified: ${totalCount}`);
    }

    console.log('Question collection validation and update complete');
  } catch (err) {
    console.error('Error validating and updating questions:', err.message, err.stack);
  }
}

async function seedInitialQuestions(force = false) {
  try {
    if (force) {
      console.log('Force seeding: Clearing existing questions...');
      await Question.deleteMany({});
      console.log('Seeding initial questions...');
      await Question.insertMany(sampleQuestions);
      console.log(`Seeded ${sampleQuestions.length} questions across all categories`);
      return;
    }

    await validateAndUpdateQuestions();
  } catch (err) {
    console.error('Error seeding questions:', err.message, err.stack);
  }
}

// Run validation and update on server startup
(async () => {
  await validateAndUpdateQuestions();
})();

router.get('/seed', async (req, res) => {
  try {
    await seedInitialQuestions();
    res.json({ message: 'Questions seeded successfully' });
  } catch (err) {
    console.error('Error in /api/questions/seed:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

router.get('/seed/force', async (req, res) => {
  try {
    await seedInitialQuestions(true);
    res.json({ message: 'Questions force seeded successfully' });
  } catch (err) {
    console.error('Error in /api/questions/seed/force:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.seedInitialQuestions = seedInitialQuestions;
module.exports.validateAndUpdateQuestions = validateAndUpdateQuestions;
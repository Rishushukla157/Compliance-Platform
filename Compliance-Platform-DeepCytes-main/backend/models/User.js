const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, default: 'Default User' },
  email: { type: String, default: '' },
  companyCode: {
    type: String,
    required: false, // only needed for users associated with a company
  },
  assessmentAttempts: { type: Number, default: 0 },
  questionHistory: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    questionText: String,
    complianceName: String,
    selectedOption: String,
    optionWeight: Number,
    scoreEarned: Number,
    questionWeight: Number,
    answeredAt: Date,
    attemptNumber: Number
  }],
  categoryScores: [{
    complianceName: String,
    totalScored: Number,
    totalWeighted: Number,
    percentageScore: Number,
    questionsAnswered: Number,
    lastActivity: Date,
    attemptNumber: Number
  }],
  assessmentHistory: [{
    attemptNumber: Number,
    overallPercentage: Number,
    completedAt: Date,
    userName: String
  }],
  totalScore: { type: Number, default: 0 },
  totalPossibleScore: { type: Number, default: 0 },
  overallPercentage: { type: Number, default: 0 },
  lastActivity: Date,
  createdAt: Date,
  notifications: {
    email: { type: Boolean, default: true },
    assessment: { type: Boolean, default: true },
    achievements: { type: Boolean, default: true },
    security: { type: Boolean, default: true }
  },
  privacy: {
    showOnLeaderboard: { type: Boolean, default: true },
    shareProgress: { type: Boolean, default: false },
    publicProfile: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model('User', UserSchema);
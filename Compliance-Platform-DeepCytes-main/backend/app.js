const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const path = require('path')
const adminRoutes = require('./routes/admin')
const userRoutes = require('./routes/user')
const authRoutes = require('./routes/auth')
const companyRoutes = require('./routes/company')
const questionRoutes = require('./routes/questionServices')
const fileUpload = require('express-fileupload');
const cors = require('cors')

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(__dirname, '.env') })

const app = express()

app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost',
  credentials: true,
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3001
  });
});

// Test endpoint for questions (no auth required)
app.get('/api/test/questions', async (req, res) => {
  try {
    const Question = require('./models/Question');
    const questions = await Question.find({ isActive: true });
    res.json({
      totalQuestions: questions.length,
      sample: questions.slice(0, 2).map(q => ({
        id: q._id,
        question: q.question.substring(0, 50) + '...',
        userType: q.userType,
        complianceName: q.complianceName
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes
app.use('/api', authRoutes)
app.use('/api', adminRoutes)
app.use('/api', userRoutes)
app.use('/api', companyRoutes)
app.use('/api/questions', questionRoutes)


mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ MongoDB Connected')
    const PORT = process.env.PORT || 3001; // Changed from 3000 to 3001
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
})
.catch((err) => {
    console.error('MongoDB connection failed:', err.message);
});
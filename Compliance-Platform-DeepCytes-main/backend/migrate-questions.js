const mongoose = require('mongoose');
const Question = require('./models/Question');
require('dotenv').config();

async function migrateQuestions() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Connected to MongoDB');

        // Update all existing questions to have userType: 'user' if they don't have userType
        const result = await Question.updateMany(
            { userType: { $exists: false } },
            { $set: { userType: 'user' } }
        );

        console.log(`Updated ${result.modifiedCount} questions with userType: 'user'`);

        // Display all questions to verify
        const allQuestions = await Question.find({});
        console.log(`Total questions in database: ${allQuestions.length}`);
        
        allQuestions.forEach((q, index) => {
            console.log(`${index + 1}. Question: "${q.question.substring(0, 50)}..." - UserType: ${q.userType} - ComplianceName: ${q.complianceName}`);
        });

        await mongoose.disconnect();
        console.log('Migration completed and disconnected from MongoDB');
    } catch (error) {
        console.error('Migration failed:', error);
        await mongoose.disconnect();
    }
}

migrateQuestions();

const express = require('express')
const router = express.Router();
const Question = require('../models/Question')
const Auth = require('../models/Auth')
const { authenticateToken, requirePermission } = require('../middleware/auth')

router.post('/admin/add-question', authenticateToken, requirePermission('canCreateQuestions'), async (req, res) => {
    const { question, options, complianceName, weight, userType } = req.body

    try {
        console.log('Adding new question with data:', {
            question: question?.substring(0, 50) + '...',
            complianceName,
            weight: weight || 1,
            userType: userType || 'user',
            optionsCount: options?.length
        });

        const newQuestion = new Question({ 
            question, 
            options, 
            complianceName, 
            weight: weight || 1,
            userType: userType || 'user'
        })
        await newQuestion.save();
        
        console.log('Question saved successfully with ID:', newQuestion._id, 'userType:', newQuestion.userType);
        
        // Verify the question is now visible to users
        const verificationFilter = {
            isActive: true,
            $or: [
                { userType: newQuestion.userType },
                { userType: 'both' }
            ]
        };
        const visibleQuestions = await Question.find(verificationFilter);
        console.log(`Total questions now visible to users: ${visibleQuestions.length}`);
        
        res.status(201).json({ 
            message: 'Question added successfully', 
            question: newQuestion,
            totalVisibleQuestions: visibleQuestions.length
        });
    } catch (err) {
        console.error('Error adding question:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/questions', async (req, res) => {
    try {
        const { complianceName } = req.query;
        
        const filter = {};
        if (complianceName) {
            filter.complianceName = complianceName;
        }
        
        const questions = await Question.find(filter);
        res.json(questions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/admin/update-question/:id', authenticateToken, requirePermission('canCreateQuestions'), async (req, res) => {
    const { id } = req.params;
    const { question, options, complianceName, weight, userType, isActive } = req.body;

    try {
        console.log(`Updating question ${id} with data:`, {
            question: question?.substring(0, 50) + '...',
            complianceName,
            weight: weight || 1,
            userType: userType || 'user',
            isActive: isActive !== undefined ? isActive : true,
            optionsCount: options?.length
        });

        const updatedQuestion = await Question.findByIdAndUpdate(
            id,
            { 
                question, 
                options, 
                complianceName, 
                weight: weight || 1, 
                userType: userType || 'user',
                isActive: isActive !== undefined ? isActive : true
            },
            { new: true, runValidators: true }
        );

        if (!updatedQuestion) {
            console.log(`Question with id ${id} not found`);
            return res.status(404).json({ error: 'Question not found' });
        }

        console.log(`Question ${id} updated successfully. New isActive status:`, updatedQuestion.isActive);
        res.json({ message: 'Question updated successfully', question: updatedQuestion });
    } catch (err) {
        console.error(`Error updating question ${id}:`, err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/admin/delete-question/:id', authenticateToken, requirePermission('canCreateQuestions'), async (req, res) => {
    const { id } = req.params;

    try {
        const deletedQuestion = await Question.findByIdAndDelete(id);

        if (!deletedQuestion) {
            return res.status(404).json({ error: 'Question not found' });
        }

        res.json({ message: 'Question deleted successfully', question: deletedQuestion });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/admin/question/:id', authenticateToken, requirePermission('canCreateQuestions'), async (req, res) => {
    const { id } = req.params;

    try {
        const question = await Question.findById(id);

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        res.json(question);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Dashboard - Get all users
router.get('/admin/users', authenticateToken, requirePermission('canCreateQuestions'), async (req, res) => {
    try {
        const users = await Auth.find({}, '-password').sort({ createdAt: -1 });
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Dashboard - Get all questions
router.get('/admin/questions', authenticateToken, requirePermission('canCreateQuestions'), async (req, res) => {
    try {
        const questions = await Question.find({}).sort({ updatedAt: -1, createdAt: -1 });
        res.json(questions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Dashboard - Delete user
router.delete('/admin/users/:id', authenticateToken, requirePermission('canCreateQuestions'), async (req, res) => {
    const { id } = req.params;

    try {
        const deletedUser = await Auth.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully', user: deletedUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Dashboard - Get single user by ID
router.get('/admin/users/:id', authenticateToken, requirePermission('canCreateQuestions'), async (req, res) => {
    const { id } = req.params;

    try {
        const user = await Auth.findById(id, '-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Dashboard - Update user
router.put('/admin/users/:id', authenticateToken, requirePermission('canCreateQuestions'), async (req, res) => {
    const { id } = req.params;
    const { name, phone, companyName, department, userType, isActive } = req.body;

    try {
        const updateData = {
            userType,
            'profile.name': name,
            'profile.phone': phone,
            'profile.companyName': companyName,
            'profile.department': department,
            'profile.isActive': isActive
        };

        const updatedUser = await Auth.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User updated successfully', user: updatedUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Dashboard - Add new user
router.post('/admin/add-user', authenticateToken, requirePermission('canCreateQuestions'), async (req, res) => {
    try {
        const { email, password, userType, name, phone, companyName, department } = req.body;

        // Check if user already exists
        const existingUser = await Auth.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Create new user
        const newUser = new Auth({
            email,
            password,
            userType: userType || 'user',
            profile: {
                name,
                phone,
                companyName,
                department
            }
        });

        await newUser.save();

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser._id,
                email: newUser.email,
                userType: newUser.userType,
                profile: newUser.profile,
                permissions: newUser.permissions
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
const express = require('express')
const router = express.Router();
const User = require('../models/User')
const Auth = require('../models/Auth')
const Question = require('../models/Question')
const { authenticateToken, requirePermission } = require('../middleware/auth')

// Get company analytics and dashboard data
router.get('/company/analytics', authenticateToken, requirePermission('canManageCompany'), async (req, res) => {
    try {
        const currentUser = req.user;
console.log('🧠 currentUser =', currentUser);

        // If company code is provided, use it, otherwise use current user's company
        // you know the user is authenticated and is a company‐type, so:
const targetCompanyCode = req.user.companyCode;

       console.log('→ GET /company/analytics called');
  console.log('   query.companyCode =', req.query.companyCode);
  console.log('   currentUser.companyCode =', req.user.companyCode);
        if (!targetCompanyCode) {
  return res.status(400).json({ error: 'Company code missing' });
}

        // Get all employees from the same company
        const companyEmployees = await Auth.find({ 
            companyCode: targetCompanyCode,
            userType: { $in: ['user', 'company'] }
        }).select('profile email userType lastLogin createdAt');

        // Get assessment data for company employees
        const employeeIds = companyEmployees.map(emp => emp._id.toString());
        const assessmentData = await User.find({ 
    userId: { $in: employeeIds },
    totalPossibleScore: { $gt: 0 }  // ✅ Only include actually assessed users
});
console.log('📊 assessmentData =', assessmentData);


        // Calculate overall company statistics
        const totalEmployees = companyEmployees.length;
        const assessedEmployees = assessmentData.length;
        
        let totalScore = 0;
        let totalPossible = 0;
        let categoryStats = {};

        assessmentData.forEach(user => {
            totalScore += user.totalScore || 0;
            totalPossible += user.totalPossibleScore || 0;

            // Process category scores
            if (user.categoryScores && Array.isArray(user.categoryScores)) {
                user.categoryScores.forEach(category => {
                    if (!categoryStats[category.complianceName]) {
                        categoryStats[category.complianceName] = {
                            name: category.complianceName,
                            totalScore: 0,
                            totalPossible: 0,
                            employees: 0
                        };
                    }
                    categoryStats[category.complianceName].totalScore += category.totalScored || 0;
                    categoryStats[category.complianceName].totalPossible += category.totalWeighted || 0;
                    categoryStats[category.complianceName].employees += 1;
                });
            }
        });


        // Calculate overall score and risk level
        // ✅ Calculate overall score first
const overallScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

// ✅ Then assign risk level
let riskLevel = 'Low';
if (overallScore < 60) riskLevel = 'High';
else if (overallScore < 80) riskLevel = 'Medium';

console.log('✅ totalScore:', totalScore);
console.log('✅ totalPossible:', totalPossible);
console.log('✅ overallScore:', overallScore);
console.log('✅ riskLevel:', riskLevel);


        // Process category statistics
        const categories = Object.values(categoryStats).map(cat => ({
            name: cat.name,
            averageScore: cat.totalPossible > 0 ? Math.round((cat.totalScore / cat.totalPossible) * 100) : 0,
            employees: cat.employees
        }));

        // Create employee details with assessment data
        const employees = companyEmployees.map(emp => {
            const userAssessment = assessmentData.find(u => u.userId === emp._id.toString());
            const overallPercentage = userAssessment ? userAssessment.overallPercentage || 0 : 0;
            
            let status = 'not-assessed';
            if (userAssessment) {
                if (overallPercentage >= 85) status = 'compliant';
                else if (overallPercentage >= 70) status = 'needs-attention';
                else status = 'at-risk';
            }

            // Calculate weak areas based on category scores
            let weakAreas = [];
            if (userAssessment && userAssessment.categoryScores) {
                weakAreas = userAssessment.categoryScores
                    .filter(cat => (cat.score || 0) < 70)
                    .map(cat => cat.complianceName)
                    .slice(0, 3); // Limit to top 3 weak areas
            }

            return {
                id: emp._id,
                name: emp.profile.name,
                email: emp.email,
                department: emp.profile.department || 'Unassigned',
                role: emp.userType === 'company' ? 'Company Admin' : 'Employee',
                securityScore: Math.round(overallPercentage),
                quizScore: Math.round(overallPercentage), // Using same score for now
                status: status,
                lastAssessment: userAssessment ? userAssessment.lastActivity : emp.lastLogin,
                lastLogin: emp.lastLogin,
                createdAt: emp.createdAt,
                userType: emp.userType,
                weakAreas: weakAreas
            };
        });

        // Create leaderboard (top performing employees)
        const leaderboard = employees
            .filter(emp => emp.securityScore > 0)
            .sort((a, b) => b.securityScore - a.securityScore)
            .slice(0, 10)
            .map((emp, index) => ({
                ...emp,
                rank: index + 1
            }));

        res.json({
            overallScore,
            assessedEmployees,
            totalEmployees,
            riskLevel,
            categories,
            employees,
            leaderboard,
            companyCode: targetCompanyCode
        });

    } catch (error) {
        console.error('Error fetching company analytics:', error);
        res.status(500).json({ error: 'Failed to fetch company analytics' });
    }
});

// Get company employees
router.get('/company/employees', authenticateToken, requirePermission('canManageCompany'), async (req, res) => {
    try {
        const currentUser = req.user;
       // you know the user is authenticated and is a company‐type, so:
const targetCompanyCode = req.user.companyCode;

        
        if (!targetCompanyCode) {
  return res.status(400).json({ error: 'Company code missing' });
}


        const { department, status, search } = req.query;

        // Build query
        let query = { 
            companyCode: targetCompanyCode,
            userType: { $in: ['user', 'company'] }
        };

        if (department && department !== 'all') {
            query['profile.department'] = department;
        }

        if (search) {
            query.$or = [
                { 'profile.name': { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const employees = await Auth.find(query)
            .select('profile email userType lastLogin createdAt')
            .sort({ 'profile.name': 1 });

        // Get assessment data for these employees
        const employeeIds = employees.map(emp => emp._id.toString());
        const assessmentData = await User.find({ 
            userId: { $in: employeeIds }
        });

        // Combine employee and assessment data
        const employeesWithAssessments = employees.map(emp => {
            const userAssessment = assessmentData.find(u => u.userId === emp._id.toString());
            const overallPercentage = userAssessment ? userAssessment.overallPercentage || 0 : 0;
            
            let assessmentStatus = 'not-assessed';
            if (userAssessment) {
                if (overallPercentage >= 85) assessmentStatus = 'compliant';
                else if (overallPercentage >= 70) assessmentStatus = 'needs-attention';
                else assessmentStatus = 'at-risk';
            }

            return {
                id: emp._id,
                name: emp.profile.name,
                email: emp.email,
                department: emp.profile.department || 'Unassigned',
                role: emp.userType === 'company' ? 'Company Admin' : 'Employee',
                securityScore: Math.round(overallPercentage),
                status: assessmentStatus,
                lastAssessment: userAssessment ? userAssessment.lastActivity : null,
                lastLogin: emp.lastLogin,
                createdAt: emp.createdAt,
                userType: emp.userType,
                isActive: emp.profile.isActive
            };
        });

        // Filter by status if provided
        let filteredEmployees = employeesWithAssessments;
        if (status && status !== 'all') {
            filteredEmployees = employeesWithAssessments.filter(emp => emp.status === status);
        }

        res.json({
            employees: filteredEmployees,
            total: filteredEmployees.length,
            departments: [...new Set(employees.map(emp => emp.profile.department).filter(Boolean))]
        });

    } catch (error) {
        console.error('Error fetching company employees:', error);
        res.status(500).json({ error: 'Failed to fetch company employees' });
    }
});

// Get company reports
router.get('/company/reports', authenticateToken, requirePermission('canManageCompany'), async (req, res) => {
    try {
        const currentUser = req.user;
       // you know the user is authenticated and is a company‐type, so:
const targetCompanyCode = req.user.companyCode;


        
        if (!targetCompanyCode) {
  return res.status(400).json({ error: 'Company code missing' });
}

        // Get all company employees
        const companyEmployees = await Auth.find({ 
            companyCode: targetCompanyCode,
            userType: { $in: ['user', 'company'] }
        }).select('profile email userType');

        // Get assessment data
        const employeeIds = companyEmployees.map(emp => emp._id.toString());
        const assessmentData = await User.find({ 
            userId: { $in: employeeIds }
        });

        // Generate department-wise statistics
        const departmentStats = {};
        companyEmployees.forEach(emp => {
            const dept = emp.profile.department || 'Unassigned';
            if (!departmentStats[dept]) {
                departmentStats[dept] = {
                    name: dept,
                    totalEmployees: 0,
                    assessedEmployees: 0,
                    averageScore: 0,
                    totalScore: 0,
                    totalPossible: 0
                };
            }
            departmentStats[dept].totalEmployees += 1;

            const userAssessment = assessmentData.find(u => u.userId === emp._id.toString());
            if (userAssessment) {
                departmentStats[dept].assessedEmployees += 1;
                departmentStats[dept].totalScore += userAssessment.totalScore || 0;
                departmentStats[dept].totalPossible += userAssessment.totalPossibleScore || 0;
            }
        });

        // Calculate average scores for departments
        Object.values(departmentStats).forEach(dept => {
            if (dept.totalPossible > 0) {
                dept.averageScore = Math.round((dept.totalScore / dept.totalPossible) * 100);
            }
        });

        // Generate category-wise analysis
        const categoryAnalysis = {};
        assessmentData.forEach(user => {
            if (user.categoryScores && Array.isArray(user.categoryScores)) {
                user.categoryScores.forEach(category => {
                    if (!categoryAnalysis[category.complianceName]) {
                        categoryAnalysis[category.complianceName] = {
                            name: category.complianceName,
                            totalScore: 0,
                            totalPossible: 0,
                            employees: 0,
                            questionsAnswered: 0
                        };
                    }
                    categoryAnalysis[category.complianceName].totalScore += category.totalScored || 0;
                    categoryAnalysis[category.complianceName].totalPossible += category.totalWeighted || 0;
                    categoryAnalysis[category.complianceName].employees += 1;
                    categoryAnalysis[category.complianceName].questionsAnswered += category.questionsAnswered || 0;
                });
            }
        });

        // Process category analysis
        const categories = Object.values(categoryAnalysis).map(cat => ({
            name: cat.name,
            averageScore: cat.totalPossible > 0 ? Math.round((cat.totalScore / cat.totalPossible) * 100) : 0,
            employees: cat.employees,
            questionsAnswered: cat.questionsAnswered,
            totalQuestions: cat.totalPossible
        }));

        res.json({
            companyCode: targetCompanyCode,
            totalEmployees: companyEmployees.length,
            assessedEmployees: assessmentData.length,
            departments: Object.values(departmentStats),
            categories: categories,
            overallScore: assessmentData.length > 0 ? 
                Math.round(assessmentData.reduce((sum, user) => sum + (user.overallPercentage || 0), 0) / assessmentData.length) : 0
        });

    } catch (error) {
        console.error('Error fetching company reports:', error);
        res.status(500).json({ error: 'Failed to fetch company reports' });
    }
});

// Get company leaderboard
router.get('/company/leaderboard', authenticateToken, requirePermission('canManageCompany'), async (req, res) => {
    try {
        const currentUser = req.user;
        // you know the user is authenticated and is a company‐type, so:
const targetCompanyCode = req.user.companyCode;


        
        if (!targetCompanyCode) {
  return res.status(400).json({ error: 'Company code missing' });
}


        // Get all company employees
        const companyEmployees = await Auth.find({ 
            companyCode: targetCompanyCode,
            userType: { $in: ['user', 'company'] }
        }).select('profile email userType');

        // Get assessment data
        const employeeIds = companyEmployees.map(emp => emp._id.toString());
        const assessmentData = await User.find({ 
            userId: { $in: employeeIds }
        }).sort({ overallPercentage: -1 });

        // Create leaderboard
        const leaderboard = assessmentData
            .filter(user => user.overallPercentage > 0)
            .map((user, index) => {
                const employee = companyEmployees.find(emp => emp._id.toString() === user.userId);
                return {
                    rank: index + 1,
                    id: user.userId,
                    name: employee ? employee.profile.name : 'Unknown',
                    email: employee ? employee.email : 'Unknown',
                    department: employee ? employee.profile.department || 'Unassigned' : 'Unknown',
                    securityScore: Math.round(user.overallPercentage || 0),
                    totalScore: user.totalScore || 0,
                    totalPossible: user.totalPossibleScore || 0,
                    lastActivity: user.lastActivity,
                    categories: user.categoryScores || []
                };
            });

        res.json({
            leaderboard: leaderboard,
            totalParticipants: leaderboard.length,
            companyCode: targetCompanyCode
        });

    } catch (error) {
        console.error('Error fetching company leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch company leaderboard' });
    }
});

// Update employee status (activate/deactivate)
router.put('/company/employee/:id/status', authenticateToken, requirePermission('canManageCompany'), async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const currentUser = req.user;

        // Check if the employee belongs to the same company
        const employee = await Auth.findById(id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        if (employee.companyCode !== currentUser.companyCode)
 {
            return res.status(403).json({ error: 'Access denied: Employee not in your company' });
        }

        // Update employee status
        employee.profile.isActive = isActive;
        await employee.save();

        res.json({ 
            message: 'Employee status updated successfully',
            employee: {
                id: employee._id,
                name: employee.profile.name,
                isActive: employee.profile.isActive
            }
        });

    } catch (error) {
        console.error('Error updating employee status:', error);
        res.status(500).json({ error: 'Failed to update employee status' });
    }
});

module.exports = router;

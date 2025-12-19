const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Auth = require('../models/Auth');
const router = express.Router();

// Email configuration - Initialize when first needed to ensure env vars are loaded
let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        console.log('Initializing email transporter...');
        console.log('EMAIL_USER:', process.env.EMAIL_USER);
        console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');
        
        transporter = nodemailer.createTransport({
            port: 465,
            host: "smtp.gmail.com",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            secure: true,
        });

        // Verify email configuration
        transporter.verify((error, success) => {
            if (error) {
                console.log('Email configuration error:', error);
            } else {
                console.log('Email server is ready to send messages');
            }
        });
    }
    return transporter;
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification - Compliance Platform',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Email Verification</h2>
                <p>Your verification code is:</p>
                <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
                    ${otp}
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this verification, please ignore this email.</p>
            </div>
        `
    };

    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
};

// Generate JWT tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId, type: 'access' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' } // Extended for easier testing - change back to '15m' in production
    );
    
    const refreshToken = jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
        { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
};

// Step 1: Send OTP for email verification
router.post('/auth/send-otp', async (req, res) => {
    try {
        const { email, userType, companyCode } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Check if user already exists and is verified
        const existingUser = await Auth.findOne({ email });
        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // If user exists but not verified, allow them to resend OTP
        let user = existingUser;
        let isResend = false;
        
        if (!user) {
            // Create a temporary user record with userType and companyCode
            const userData = {
                email,
                password: 'temporary', // Will be updated later
                userType: userType || 'user', // Use provided userType or default to 'user'
                profile: { name: 'temporary' } // Will be updated later
            };

            // Add companyCode if provided (for all user types)
            if (companyCode) {
                userData.companyCode = companyCode;
            }

            user = new Auth(userData);
        } else {
            // User exists but not verified - this is a resend scenario
            isResend = true;
            
            // Update userType and companyCode if provided in resend
            if (userType) {
                user.userType = userType;
            }
            if (companyCode) {
                user.companyCode = companyCode;
            }
        }

        // Generate and set OTP
        const otp = user.generateOTP();
        await user.save();

        // Send OTP email
        await sendOTPEmail(email, otp);

        res.json({ 
            message: isResend ? 'New OTP sent successfully' : 'OTP sent successfully',
            email: email,
            isResend: isResend
        });
    } catch (err) {
        console.error('Send OTP error:', err);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Step 2: Verify OTP
router.post('/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        const user = await Auth.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const verification = user.verifyOTP(otp);
        if (!verification.success) {
            await user.save(); // Save updated attempt count
            return res.status(400).json({ error: verification.message });
        }

        await user.save(); // Save verification status

        res.json({ 
            message: 'Email verified successfully',
            isVerified: true
        });
    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
});

// Step 3: Complete registration (after OTP verification)
router.post('/auth/complete-registration', async (req, res) => {
    try {
        const { 
            email, 
            password, 
            userType, 
            name, 
            phone, 
            companyName, 
            department, 
            companyCode 
        } = req.body;

        // Find the verified user
        const user = await Auth.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ error: 'Email not verified' });
        }

        // Validate userType (remove admin option)
        if (!['user', 'company'].includes(userType)) {
            return res.status(400).json({ error: 'Invalid user type. Must be "user" or "company"' });
        }

        // Handle company code logic
        let finalCompanyCode = user.companyCode; // Keep existing companyCode as default
        if (userType === 'company') {
            if (!companyCode || companyCode.length !== 6) {
                return res.status(400).json({ error: 'Please provide a valid 6-digit company code' });
            }

            // Check if company code is already in use (more robust check)
            const existingCode = await Auth.findOne({ 
                companyCode: companyCode.toUpperCase(), // Case insensitive check
                userType: 'company',
                _id: { $ne: user._id } // Exclude current user
            });
            if (existingCode) {
                return res.status(400).json({ error: 'Company code already in use. Please choose another one.' });
            }

            finalCompanyCode = companyCode.toUpperCase(); // Store in uppercase
        } else if (userType === 'user') {
            // For individual users, companyCode is optional
            if (companyCode) {
                // If companyCode is provided, validate it
                const companyExists = await Auth.findOne({ 
                    companyCode: companyCode.toUpperCase(), // Search in uppercase
                    userType: 'company'
                });
                if (!companyExists) {
                    return res.status(400).json({ error: 'Invalid company code' });
                }

                finalCompanyCode = companyCode.toUpperCase(); // Store in uppercase
            }
            // If no companyCode provided, keep the existing one (from send-otp step)
        }

        // Update user with complete information
        user.password = password; // Will be hashed by pre-save middleware
        user.userType = userType;
        user.companyCode = finalCompanyCode;
        user.profile = {
            name,
            phone,
            companyName,
            department,
            isActive: true
        };

        await user.save();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);
        
        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        res.status(201).json({
            message: 'Registration completed successfully',
            user: {
                id: user._id,
                email: user.email,
                userType: user.userType,
                profile: user.profile,
                companyCode: user.companyCode,
                permissions: user.permissions,
                isVerified: user.isVerified
            },
            accessToken,
            refreshToken
        });
    } catch (err) {
        console.error('Complete registration error:', err);
        
        // Handle MongoDB duplicate key errors
        if (err.code === 11000) {
            if (err.keyPattern && err.keyPattern.companyCode) {
                return res.status(400).json({ 
                    error: 'Company code already in use. Please choose another one.' 
                });
            } else if (err.keyPattern && err.keyPattern.email) {
                return res.status(400).json({ 
                    error: 'Email already registered. Please use a different email.' 
                });
            } else {
                return res.status(400).json({ 
                    error: 'This information is already in use. Please check your details.' 
                });
            }
        }
        
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

// Check if company code is available
router.post('/auth/check-company-code', async (req, res) => {
    try {
        const { companyCode } = req.body;

        if (!companyCode) {
            return res.status(400).json({ error: 'Company code is required' });
        }

        if (companyCode.length !== 6) {
            return res.status(400).json({ 
                error: 'Company code must be exactly 6 characters long',
                isAvailable: false 
            });
        }

        const existingCode = await Auth.findOne({ 
            companyCode: companyCode.toUpperCase(),
            userType: 'company'
        });

        res.json({
            isAvailable: !existingCode,
            companyCode: companyCode.toUpperCase(),
            message: existingCode ? 'Company code is already in use' : 'Company code is available'
        });
    } catch (err) {
        console.error('Check company code error:', err);
        res.status(500).json({ error: 'Failed to check company code' });
    }
});

// Legacy register endpoint (kept for backward compatibility, but modified)
router.post('/auth/register', async (req, res) => {
    return res.status(400).json({ 
        error: 'Please use the new registration flow: send-otp -> verify-otp -> complete-registration',
        newFlow: {
            step1: '/auth/send-otp',
            step2: '/auth/verify-otp', 
            step3: '/auth/complete-registration'
        }
    });
});

// Admin registration endpoint (requires master key)
router.post('/auth/register-admin', async (req, res) => {
    try {
        const { 
            email, 
            password, 
            name, 
            phone, 
            department, 
            masterKey 
        } = req.body;

        // Check master key (you should set this in your .env file)
        const ADMIN_MASTER_KEY = process.env.ADMIN_MASTER_KEY || 'ADMIN_SECRET_2025_KEY';
        if (!masterKey || masterKey !== ADMIN_MASTER_KEY) {
            return res.status(403).json({ error: 'Invalid master key. Admin registration not authorized.' });
        }

        // Check if admin with this email already exists
        const existingAdmin = await Auth.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin with this email already exists' });
        }

        // Create admin user
        const adminUser = new Auth({
            email,
            password, // Will be hashed by pre-save middleware
            userType: 'admin',
            companyCode: null, // Admins don't belong to a specific company
            isVerified: true, // Admins are pre-verified
            profile: {
                name,
                phone,
                department: department || 'Administration',
                isActive: true
            }
        });

        await adminUser.save();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(adminUser._id);
        
        // Save refresh token
        adminUser.refreshToken = refreshToken;
        await adminUser.save();

        res.status(201).json({
            message: 'Admin registered successfully',
            user: {
                id: adminUser._id,
                email: adminUser.email,
                userType: adminUser.userType,
                profile: adminUser.profile,
                permissions: adminUser.permissions,
                isVerified: adminUser.isVerified
            },
            accessToken,
            refreshToken
        });
    } catch (err) {
        console.error('Admin registration error:', err);
        res.status(500).json({ error: 'Failed to register admin' });
    }
});

// Promote user to admin (requires existing admin authorization)
router.post('/auth/promote-to-admin', async (req, res) => {
    try {
        const { email, masterKey } = req.body;
        
        // Check master key
        const ADMIN_MASTER_KEY = process.env.ADMIN_MASTER_KEY || 'ADMIN_SECRET_2025_KEY';
        if (!masterKey || masterKey !== ADMIN_MASTER_KEY) {
            return res.status(403).json({ error: 'Invalid master key. Admin promotion not authorized.' });
        }

        // Find the user to promote
        const user = await Auth.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.userType === 'admin') {
            return res.status(400).json({ error: 'User is already an admin' });
        }

        // Promote to admin
        user.userType = 'admin';
        user.companyCode = null; // Admins don't belong to specific companies
        await user.save(); // This will trigger the pre-save hook to set admin permissions

        res.json({
            message: 'User promoted to admin successfully',
            user: {
                id: user._id,
                email: user.email,
                userType: user.userType,
                profile: user.profile,
                permissions: user.permissions
            }
        });
    } catch (err) {
        console.error('Promote to admin error:', err);
        res.status(500).json({ error: 'Failed to promote user to admin' });
    }
});

// Login user
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await Auth.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({ 
                error: 'Email not verified. Please verify your email first.',
                requiresVerification: true
            });
        }

        // Check if user is active
        if (!user.profile.isActive) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id);
        
        // Update refresh token and last login
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();

        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                userType: user.userType,
                companyCode: user.companyCode,
                profile: user.profile,
                permissions: user.permissions,
                isVerified: user.isVerified
            },
            accessToken,
            refreshToken
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.post('/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret');
        
        
        const user = await Auth.findById(decoded.userId);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

       
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
        
       
        user.refreshToken = newRefreshToken;
        await user.save();

        res.json({
            accessToken,
            refreshToken: newRefreshToken
        });
    } catch (err) {
        res.status(403).json({ error: 'Invalid refresh token' });
    }
});

// Logout user
router.post('/auth/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            
            const user = await Auth.findOne({ refreshToken });
            if (user) {
                user.refreshToken = null;
                await user.save();
            }
        }

        res.json({ message: 'Logout successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.get('/auth/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user = await Auth.findById(decoded.userId).select('-password -refreshToken');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                id: user._id,
                email: user.email,
                userType: user.userType,
                companyCode: user.companyCode,
                profile: user.profile,
                permissions: user.permissions,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

router.put('/auth/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const { name, phone, companyName, department } = req.body;

        const user = await Auth.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update profile
        user.profile.name = name || user.profile.name;
        user.profile.phone = phone || user.profile.phone;
        user.profile.companyName = companyName || user.profile.companyName;
        user.profile.department = department || user.profile.department;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                email: user.email,
                userType: user.userType,
                profile: user.profile,
                permissions: user.permissions
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin only: Get all users
router.get('/auth/users', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const adminUser = await Auth.findById(decoded.userId);
        
        if (!adminUser || !adminUser.permissions.canViewAllUsers) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const users = await Auth.find().select('-password -refreshToken');
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
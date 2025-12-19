const jwt = require('jsonwebtoken');
const Auth = require('../models/Auth');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user = await Auth.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({ 
                error: 'Email not verified. Please verify your email first.',
                requiresVerification: true
            });
        }

        if (!user.profile.isActive) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Middleware to check user permissions
const requirePermission = (permission) => {
    return (req, res, next) => {
        console.log('🔐 requirePermission middleware called');
        console.log('→ Required permission:', permission);
        console.log('→ req.user =', req.user);

        if (!req.user) {
            console.log('❌ No user found in req');
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!req.user.permissions || !req.user.permissions[permission]) {
            console.log('❌ Permission check failed:', permission);
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        console.log('✅ Permission check passed');
        next();
    };
};


// Middleware to check user type
const requireUserType = (userTypes) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const allowedTypes = Array.isArray(userTypes) ? userTypes : [userTypes];
        if (!allowedTypes.includes(req.user.userType)) {
            return res.status(403).json({ error: 'Access denied for this user type' });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    requirePermission,
    requireUserType
};
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const authSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    isVerified: {type: Boolean, required: true, default: false},
    otp: {
        code: { type: String },
        expiresAt: { type: Date },
        attempts: { type: Number, default: 0 }
    },
    password: { 
        type: String, 
        required: true,
        minlength: 6
    },
    userId: {
        type: String,
        required: false,
        sparse: true  // Allow multiple null values, but unique non-null values
    },
    companyCode: {
        type: String,
        required: function () {
            // Only require companyCode if user is verified (not during OTP phase)
            // return this.isVerified && (this.userType === 'company' || this.userType === 'user');
            return this.isVerified && (this.userType === 'company');
        }
    },

    userType: { 
        type: String, 
        required: true, 
        enum: ['user', 'company', 'admin'],
        default: 'user'
    },
    profile: {
        name: { type: String, required: true },
        phone: String,
        companyName: String,
        department: String,  
        isActive: { type: Boolean, default: true }
    },
    permissions: {
        canCreateQuestions: { type: Boolean, default: false },
        canViewAllUsers: { type: Boolean, default: false },
        canManageCompany: { type: Boolean, default: false },
        canAccessAnalytics: { type: Boolean, default: false }
    },
    lastLogin: Date,
    refreshToken: String
}, {
    timestamps: true
});

// Hash password before saving
authSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
authSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate OTP
authSchema.methods.generateOTP = function() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    this.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        attempts: 0
    };
    return otp;
};

// Verify OTP
authSchema.methods.verifyOTP = function(inputOTP) {
    if (!this.otp || !this.otp.code) {
        return { success: false, message: 'No OTP found' };
    }
    
    if (this.otp.attempts >= 3) {
        return { success: false, message: 'Too many failed attempts' };
    }
    
    if (this.otp.expiresAt < new Date()) {
        return { success: false, message: 'OTP expired' };
    }
    
    if (this.otp.code !== inputOTP) {
        this.otp.attempts += 1;
        return { success: false, message: 'Invalid OTP' };
    }
    
    // OTP is valid
    this.isVerified = true;
    this.otp = undefined; // Clear OTP after successful verification
    return { success: true, message: 'OTP verified successfully' };
};

// Clear expired OTP
authSchema.methods.clearExpiredOTP = function() {
    if (this.otp && this.otp.expiresAt < new Date()) {
        this.otp = undefined;
    }
};

// Set permissions based on user type
authSchema.pre('save', function(next) {
    if (this.isModified('userType')) {
        switch(this.userType) {
            case 'admin':
                this.permissions = {
                    canCreateQuestions: true,
                    canViewAllUsers: true,
                    canManageCompany: true,
                    canAccessAnalytics: true
                };
                break;
            case 'company':
                this.permissions = {
                    canCreateQuestions: true,
                    canViewAllUsers: false,
                    canManageCompany: true,
                    canAccessAnalytics: true
                };
                break;
            case 'user':
                this.permissions = {
                    canCreateQuestions: false,
                    canViewAllUsers: false,
                    canManageCompany: false,
                    canAccessAnalytics: false
                };
                break;
        }
    }
    next();
});

module.exports = mongoose.model('Auth', authSchema);

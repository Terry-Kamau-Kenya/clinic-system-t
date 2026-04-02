const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false 
    },
    role: {
        type: String,
        enum: ['patient', 'admin'],
        default: 'patient',
        required: true
    }
}, {
    timestamps: true,
    // This is the CRITICAL fix:
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id; // Explicitly map _id to id
            return ret;
        }
    },
    toObject: { virtuals: true }
});

/**
 * Instance method to return public user profile
 */
userSchema.methods.getPublicProfile = function() {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        createdAt: this.createdAt
    };
};

const User = mongoose.model('User', userSchema);
module.exports = User;
const mongoose = require('mongoose');

// --- 1. USER SCHEMA ---
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'admin', 'doctor'], default: 'patient' }
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

userSchema.methods.getPublicProfile = function() {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        role: this.role
    };
};

// --- 2. DOCTOR SCHEMA ---
const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    email: { type: String }, 
    role: { type: String },  
    status: { type: String, default: 'available' } 
}, { 
    collection: 'doctors', 
    timestamps: true 
});

// --- 3. APPOINTMENT SCHEMA ---
const appointmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true }, 
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ['pending', 'serving', 'completed', 'cancelled'], default: 'pending' },
    queueNumber: { type: Number }
}, { timestamps: true });

appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ patientId: 1 });

// --- VERCEL FIX: MODEL EXPORTS ---
// Use mongoose.models[Name] || mongoose.model(Name, Schema)
// This prevents the "OverwriteModelError" in Vercel.

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema);
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

module.exports = { User, Doctor, Appointment };
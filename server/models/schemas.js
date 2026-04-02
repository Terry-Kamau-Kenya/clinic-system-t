const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // ADDED 'doctor' to the enum below
    role: { type: String, enum: ['patient', 'admin', 'doctor'], default: 'patient' }
});

const doctorSchema = new mongoose.Schema({
    // Link this profile to a User account
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    availability: { type: Boolean, default: true }
});

const appointmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ['pending', 'serving', 'completed', 'cancelled'], default: 'pending' },
    queueNumber: { type: Number }
});

// Export all models
const User = mongoose.model('User', userSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = { User, Doctor, Appointment };
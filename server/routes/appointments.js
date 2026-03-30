const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendBookingEmail } = require('../utils/emailService');

// Book Appointment
router.post('/', auth, async (req, res) => {
    const { doctorId, date, time } = req.body;
    try {
        // Check for double booking
        const existing = await Appointment.findOne({ doctor: doctorId, date, time, status: 'pending' });
        if (existing) return res.status(400).json({ message: 'Slot already booked' });

        const appointment = new Appointment({
            patient: req.user.id,
            doctor: doctorId,
            date,
            time
        });

        await appointment.save();
        
        // Populate doctor details for email
        const doc = await Doctor.findById(doctorId);
        const user = await User.findById(req.user.id);

        // Send Email
        await sendBookingEmail(user.email, doc.name, date, time);

        res.json(appointment);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get My Appointments
router.get('/my', auth, async (req, res) => {
    try {
        const appointments = await Appointment.find({ patient: req.user.id }).populate('doctor');
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
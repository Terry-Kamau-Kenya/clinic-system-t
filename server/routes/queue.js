const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get Queue Status (Public)
router.get('/status', async (req, res) => {
    try {
        // Find appointments for today that are pending or currently serving
        const today = new Date().toISOString().split('T')[0];
        
        // Logic: 
        // 1. Current Serving: Status = 'confirmed' (or a specific 'serving' status if added)
        // 2. Next/Waiting: Status = 'pending'
        // For simplicity in this MVP: 
        // 'pending' = Waiting
        // 'confirmed' = Now Serving
        // 'completed' = Done

        const waiting = await Appointment.find({ date: today, status: 'pending' })
            .populate('patient', 'name')
            .sort({ createdAt: 1 }); // FIFO

        const current = await Appointment.findOne({ date: today, status: 'confirmed' })
            .populate('patient', 'name');

        const next = waiting.length > 0 ? waiting[0] : null;

        res.json({
            current: current ? { queueNumber: current._id, patientName: current.patient.name } : null,
            next: next ? { queueNumber: next._id, patientName: next.patient.name } : null,
            waiting: waiting.map(a => ({ queueNumber: a._id, patientName: a.patient.name }))
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Call Next (Admin)
router.post('/next', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Mark current as completed if exists
        await Appointment.findOneAndUpdate({ date: today, status: 'confirmed' }, { status: 'completed' });

        // Find next pending
        const nextAppt = await Appointment.findOne({ date: today, status: 'pending' }).sort({ createdAt: 1 });
        
        if (nextAppt) {
            nextAppt.status = 'confirmed';
            await nextAppt.save();
        }

        res.json({ message: 'Queue updated' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark Completed (Admin)
router.post('/complete', auth, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    try {
        const today = new Date().toISOString().split('T')[0];
        await Appointment.findOneAndUpdate({ date: today, status: 'confirmed' }, { status: 'completed' });
        res.json({ message: 'Marked completed' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
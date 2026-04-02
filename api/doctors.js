const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');

// ============================================
// GET ALL DOCTORS - PUBLIC ACCESS
// ============================================
router.get('/', async (req, res) => {
    try {
        console.log('🔍 [GET /api/doctors] Fetching all doctors...');
        
        const doctors = await Doctor.find()
            .select('-__v')  // Exclude version key
            .sort({ name: 1 }); // Sort alphabetically by name
        
        console.log(`✅ [GET /api/doctors] Found ${doctors.length} doctors`);
        
        res.json(doctors);
    } catch (error) {
        console.error('❌ [GET /api/doctors] Error:', error.message);
        res.status(500).json({
            message: 'Server error while fetching doctors',
            error: error.message
        });
    }
});

// ============================================
// GET SINGLE DOCTOR BY ID - PUBLIC ACCESS
// ============================================
router.get('/:id', async (req, res) => {
    try {
        console.log(`🔍 [GET /api/doctors/${req.params.id}] Fetching doctor...`);
        
        const doctor = await Doctor.findById(req.params.id).select('-__v');
        
        if (!doctor) {
            console.log(`⚠️ [GET /api/doctors/${req.params.id}] Doctor not found`);
            return res.status(404).json({
                message: 'Doctor not found'
            });
        }
        
        console.log(`✅ [GET /api/doctors/${req.params.id}] Doctor found: ${doctor.name}`);
        res.json(doctor);
    } catch (error) {
        console.error(`❌ [GET /api/doctors/${req.params.id}] Error:`, error.message);
        
        if (error.kind === 'ObjectId') {
            return res.status(400).json({
                message: 'Invalid doctor ID'
            });
        }
        
        res.status(500).json({
            message: 'Server error while fetching doctor',
            error: error.message
        });
    }
});

// ============================================
// ADD NEW DOCTOR - ADMIN ONLY
// ============================================
router.post('/', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            console.log(`⚠️ [POST /api/doctors] Unauthorized access attempt by user: ${req.user.id}`);
            return res.status(403).json({
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        const { name, specialization } = req.body;
        
        // Validation
        if (!name || !specialization) {
            return res.status(400).json({
                message: 'Please provide both name and specialization'
            });
        }
        
        console.log(`➕ [POST /api/doctors] Adding new doctor: ${name} - ${specialization}`);
        
        // Create new doctor
        const doctor = new Doctor({
            name,
            specialization
        });
        
        await doctor.save();
        
        console.log(`✅ [POST /api/doctors] Doctor added successfully: ${doctor._id}`);
        
        res.status(201).json({
            message: 'Doctor added successfully',
            doctor: {
                id: doctor._id,
                name: doctor.name,
                specialization: doctor.specialization
            }
        });
    } catch (error) {
        console.error('❌ [POST /api/doctors] Error:', error.message);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Doctor with this name already exists'
            });
        }
        
        res.status(500).json({
            message: 'Server error while adding doctor',
            error: error.message
        });
    }
});

// ============================================
// UPDATE DOCTOR - ADMIN ONLY
// ============================================
router.put('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        const { name, specialization } = req.body;
        
        console.log(`🔄 [PUT /api/doctors/${req.params.id}] Updating doctor...`);
        
        const doctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            { name, specialization },
            { new: true, runValidators: true }
        );
        
        if (!doctor) {
            return res.status(404).json({
                message: 'Doctor not found'
            });
        }
        
        console.log(`✅ [PUT /api/doctors/${req.params.id}] Doctor updated: ${doctor.name}`);
        res.json({
            message: 'Doctor updated successfully',
            doctor
        });
    } catch (error) {
        console.error('❌ [PUT /api/doctors/:id] Error:', error.message);
        res.status(500).json({
            message: 'Server error while updating doctor',
            error: error.message
        });
    }
});

// ============================================
// DELETE DOCTOR - ADMIN ONLY
// ============================================
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required.'
            });
        }
        
        console.log(`🗑️ [DELETE /api/doctors/${req.params.id}] Deleting doctor...`);
        
        const doctor = await Doctor.findByIdAndDelete(req.params.id);
        
        if (!doctor) {
            return res.status(404).json({
                message: 'Doctor not found'
            });
        }
        
        console.log(`✅ [DELETE /api/doctors/${req.params.id}] Doctor deleted: ${doctor.name}`);
        res.json({
            message: 'Doctor deleted successfully',
            doctor: {
                id: doctor._id,
                name: doctor.name
            }
        });
    } catch (error) {
        console.error('❌ [DELETE /api/doctors/:id] Error:', error.message);
        res.status(500).json({
            message: 'Server error while deleting doctor',
            error: error.message
        });
    }
});

module.exports = router;
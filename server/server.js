require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Doctor, Appointment } = require('./models/Schemas');
const auth = require('./middleware/auth');

const app = express();

// 1. CONFIGURATION & MIDDLEWARE
mongoose.set('bufferCommands', false); // ⚡ Stops the 10-second "waiting" error
app.use(cors());
app.use(express.json());

// 2. MONGODB ATLAS CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB Atlas');
        console.log("📂 Database Name:", mongoose.connection.name);
    })
    .catch(err => console.error('❌ Connection Error:', err));

// 3. EMAIL CONFIGURATION
let transporter;
try {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS 
        }
    });
} catch (error) {
    console.log("⚠️ Email setup failed, switching to simulation mode.");
}

// 4. ROUTES: AUTHENTICATION
app.post('/api/auth/register', async (req, res, next) => {
    try {
        const { name, email, password, role, specialization } = req.body;
        
        let existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashed, role: role || 'patient' });
        await user.save();

        if (user.role === 'doctor') {
            const doctorProfile = new Doctor({
                name: user.name,
                specialization: specialization || 'General Medicine'
            });
            await doctorProfile.save();
        }

        res.status(201).json({ message: "User created" });
    } catch (err) { next(err); }
});

app.post('/api/auth/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email }, 
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
    } catch (err) { next(err); }
});

// 5. ROUTES: DOCTORS
app.get('/api/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ message: "Error fetching doctors" });
    }
});

// 6. ROUTES: APPOINTMENTS
app.post('/api/appointments', auth, async (req, res, next) => {
    try {
        const { doctorId, date, time } = req.body;
        const userId = req.user?.id;
        const userEmail = req.user?.email;

        const count = await Appointment.countDocuments({ date });
        const queueNumber = count + 1;

        const appt = new Appointment({
            patientId: userId,
            doctorId,
            date,
            time,
            queueNumber
        });
        await appt.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Appointment Confirmed',
            text: `Confirmed for ${date} at ${time}. Queue: ${queueNumber}`
        };

        if (transporter) {
            transporter.sendMail(mailOptions, (err) => {
                if (err) console.log("📧 Email failed to send, but booking was successful.");
            });
        }

        res.status(201).json({ message: "Booked successfully", queueNumber });
    } catch (err) { next(err); }
});

// 7. GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
    console.error("Internal Error:", err.message);
    res.status(500).json({ success: false, message: "Server Error: " + err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
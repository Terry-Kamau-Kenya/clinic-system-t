const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Doctor = mongoose.model('Doctor', new mongoose.Schema({ name: String, specialization: String }));

const seedDoctors = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    await Doctor.deleteMany(); // Clears current list
    await Doctor.insertMany([
        { name: "Dr. Smith", specialization: "Cardiology" },
        { name: "Dr. Adams", specialization: "Pediatrics" },
        { name: "Dr. Brown", specialization: "Dermatology" }
    ]);
    console.log("✅ Doctors Seeded!");
    process.exit();
};

seedDoctors();
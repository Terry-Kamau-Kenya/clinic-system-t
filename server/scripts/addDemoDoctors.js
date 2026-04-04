const mongoose = require('mongoose');
const { Doctor } = require('../models/schemas');
require('dotenv').config();

const demoDoctors = [
    { name: 'Dr. Sarah Johnson', specialization: 'Cardiologist' },
    { name: 'Dr. Michael Chen', specialization: 'Dermatologist' },
    { name: 'Dr. Emily Rodriguez', specialization: 'Pediatrician' },
    { name: 'Dr. James Wilson', specialization: 'Orthopedic Surgeon' },
    { name: 'Dr. Lisa Anderson', specialization: 'General Physician' },
    { name: 'Dr. Robert Martinez', specialization: 'Neurologist' },
    { name: 'Dr. Jennifer Lee', specialization: 'Gynecologist' },
    { name: 'Dr. David Thompson', specialization: 'Ophthalmologist' }
];

async function addDemoDoctors() {
    try {
        if (!process.env.MONGO_URI) {
            console.error('❌ Error: MONGO_URI not found in .env file');
            process.exit(1);
        }

        console.log('🔄 Connecting to MongoDB...');
        
        // Connect without deprecated options (they're default in new versions)
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected Successfully');
        console.log(`   Database: ${mongoose.connection.db.databaseName}`);

        // Check for existing demo doctors
        console.log('\n🔍 Checking for existing demo doctors...');
        const existingDocs = await Doctor.find({
            name: { $in: demoDoctors.map(d => d.name) }
        });

        if (existingDocs.length > 0) {
            console.log(`   ⚠️  Found ${existingDocs.length} existing demo doctors:`);
            existingDocs.forEach(doc => {
                console.log(`      - ${doc.name}`);
            });
        }

        // Filter out existing doctors
        const newDoctors = demoDoctors.filter(demo => {
            return !existingDocs.find(existing => existing.name === demo.name);
        });

        if (newDoctors.length === 0) {
            console.log('\n✅ All demo doctors already exist in database!');
            await mongoose.disconnect();
            console.log('\n👋 Disconnected from MongoDB');
            return;
        }

        // Insert new demo doctors
        console.log(`\n➕ Adding ${newDoctors.length} new demo doctors...`);
        const insertedDoctors = await Doctor.insertMany(newDoctors);
        
        console.log('\n✅ Successfully added demo doctors:');
        console.log('   ' + '─'.repeat(50));
        insertedDoctors.forEach((doc, index) => {
            console.log(`   ${index + 1}. ${doc.name}`);
            console.log(`      Specialization: ${doc.specialization}`);
        });
        console.log('   ' + '─'.repeat(50));

        console.log('\n📊 Summary:');
        console.log(`   Total doctors added: ${insertedDoctors.length}`);
        console.log(`   Already existed: ${existingDocs.length}`);

        console.log('\n🎯 Next Steps:');
        console.log('   1. Deploy or run: vercel dev');
        console.log('   2. Login as patient');
        console.log('   3. Book an appointment with any doctor');

    } catch (error) {
        console.error('\n❌ Error adding demo doctors:');
        console.error('   ' + error.message);
        
        if (error.name === 'MongoServerError' && error.code === 8000) {
            console.error('\n💡 Authentication Error:');
            console.error('   - Check your MONGO_URI in .env file');
            console.error('   - Verify username and password are correct');
            console.error('   - Make sure password is URL-encoded if it has special characters');
        }
        
        process.exit(1);
    } finally {
        // Disconnect from MongoDB
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log('\n👋 Disconnected from MongoDB');
        }
    }
}

// Run the script
console.log('╔════════════════════════════════════════════════════════╗');
console.log('║        MediQueue - Demo Doctors Seeder                 ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('');

addDemoDoctors();
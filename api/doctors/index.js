const { dbConnect } = require('../_lib/clinic');
const { Doctor } = require('../_lib/schema'); // Import directly from your schema file
const { requireRole } = require('../_lib/clinic');

module.exports = async function handler(req, res) {
  // 1. Establish Database Connection
  await dbConnect();

  // --- GET: List all doctors ---
  if (req.method === 'GET') {
    try {
      // Fetch doctors and sort alphabetically by name
      const doctors = await Doctor.find({}).sort({ name: 1 });
      return res.status(200).json(doctors);
    } catch (error) {
      console.error('Doctors list error:', error);
      return res.status(500).json({ message: 'Server error while fetching doctors' });
    }
  }

  // --- POST: Add a new doctor (Admin only) ---
  if (req.method === 'POST') {
    // Authentication check
    const user = await requireRole(req, res, ['admin']);
    if (!user) return; // requireRole sends the 401/403 response

    try {
      const { name, specialization, email, status } = req.body;

      // Validation
      if (!name || !specialization) {
        return res.status(400).json({ message: 'Name and specialization are required' });
      }

      // Create the doctor record
      const doctor = await Doctor.create({
        name: String(name).trim(),
        specialization: String(specialization).trim(),
        email: email ? String(email).trim() : undefined,
        status: status || 'available',
      });

      return res.status(201).json({
        message: 'Doctor added successfully',
        doctor,
      });
    } catch (error) {
      console.error('Doctor create error:', error);
      return res.status(500).json({ message: 'Server error while adding doctor' });
    }
  }

  // --- Handle invalid methods ---
  return res.status(405).json({ message: 'Method not allowed' });
};
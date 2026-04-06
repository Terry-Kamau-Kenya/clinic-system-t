const { dbConnect, getModels, requireRole } = require('../_lib/clinic');

module.exports = async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { Doctor } = await getModels();
      const doctors = await Doctor.find({}).sort({ name: 1 });
      return res.json(doctors);
    } catch (error) {
      console.error('Doctors list error:', error);
      return res.status(500).json({ message: 'Server error while fetching doctors' });
    }
  }

  if (req.method === 'POST') {
    const user = await requireRole(req, res, ['admin']);
    if (!user) {
      return;
    }

    try {
      const { Doctor } = await getModels();
      const { name, specialization, email, status } = req.body;
      if (!name || !specialization) {
        return res.status(400).json({ message: 'Please provide both name and specialization' });
      }

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

  return res.status(405).json({ message: 'Method not allowed' });
};

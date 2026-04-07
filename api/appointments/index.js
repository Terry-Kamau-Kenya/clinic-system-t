const { dbConnect, requireUser } = require('../_lib/clinic');
const { Appointment } = require('../_lib/schema');

module.exports = async function handler(req, res) {
    await dbConnect();
    const user = await requireUser(req, res);
    if (!user) return; // requireUser handles the 401 error

    if (req.method === 'POST') {
        try {
            const { doctorId, date, time } = req.body;
            if (!doctorId || !date || !time) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            // Calculate queue number safely
            const count = await Appointment.countDocuments({ doctorId, date });
            const queueNumber = count + 1;

            const appointment = await Appointment.create({
                patientId: user._id,
                doctorId,
                date,
                time,
                queueNumber,
                status: 'pending'
            });

            // If creation worked, send 201. If not, send 400.
            if (appointment) {
                return res.status(201).json({ message: 'Success', queueNumber: appointment.queueNumber });
            } else {
                throw new Error("Database failed to return appointment object");
            }
        } catch (err) {
            console.error("Booking Crash:", err);
            return res.status(500).json({ message: "Server crashed during booking", error: err.message });
        }
    }

    if (req.method === 'GET') {
        const apps = await Appointment.find({ patientId: user._id }).sort({ createdAt: -1 });
        return res.status(200).json(apps);
    }
};
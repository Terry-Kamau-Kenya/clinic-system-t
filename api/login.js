module.exports = async function handler(req, res) {
  return res.status(404).json({ message: 'This path is a client-side script, not an API route.' });
};
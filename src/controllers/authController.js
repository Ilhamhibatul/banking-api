const pool = require('../config/database');
const crypto = require('crypto');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, pesan: 'Email dan password wajib diisi' });
    }

    const result = await pool.query(
      'SELECT id, nama, email, role, password FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0 || result.rows[0].password !== password) {
      return res.status(401).json({ success: false, pesan: 'Email atau password salah' });
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server saat login' });
  }
};

module.exports = { login };

const pool = require('../config/database');

const checkBalance = async (req, res) => {
  try {
    const nomorRekening = req.query.nomor_rekening;
    if (!nomorRekening) {
      return res.status(400).json({ success: false, pesan: 'Parameter nomor_rekening wajib diisi' });
    }

    const result = await pool.query(
      'SELECT id, nama_rekening, nomor_rekening, saldo FROM accounts WHERE nomor_rekening = $1',
      [nomorRekening]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, pesan: 'Rekening tidak ditemukan' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server saat cek saldo' });
  }
};

const transactionHistory = async (req, res) => {
  try {
    const { nomor_rekening, limit } = req.body;
    if (!nomor_rekening) {
      return res.status(400).json({ success: false, pesan: 'nomor_rekening wajib diisi' });
    }

    const history = await pool.query(
      `SELECT t.id, t.type, t.amount, t.balance_before, t.balance_after, t.description, t.created_at
       FROM account_transactions t
       JOIN accounts a ON t.account_id = a.id
       WHERE a.nomor_rekening = $1
       ORDER BY t.created_at DESC
       LIMIT $2`,
      [nomor_rekening, limit || 20]
    );

    res.json({ success: true, data: history.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server saat ambil mutasi' });
  }
};

module.exports = { checkBalance, transactionHistory };

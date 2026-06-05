const pool = require('../config/database');

// Daftar nasabah baru
const daftarNasabah = async (req, res) => {
  try {
    const { nama, nik, email, no_hp } = req.body;

    // Validasi input wajib
    if (!nama || !nik) {
      return res.status(400).json({
        success: false,
        pesan: 'Nama dan NIK wajib diisi'
      });
    }

    // Simpan ke database
    const result = await pool.query(
      `INSERT INTO nasabah (nama, nik, email, no_hp) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [nama, nik, email, no_hp]
    );

    // Buat nomor rekening otomatis (sederhana)
    const nomorRekening = Date.now().toString().slice(-10);
    await pool.query(
      `INSERT INTO rekening (nasabah_id, nomor_rekening) VALUES ($1, $2)`,
      [result.rows[0].id, nomorRekening]
    );

    res.status(201).json({
      success: true,
      pesan: 'Nasabah berhasil didaftarkan',
      data: {
        nasabah: result.rows[0],
        nomor_rekening: nomorRekening
      }
    });

  } catch (error) {
    // Error duplikat NIK
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        pesan: 'NIK atau email sudah terdaftar'
      });
    }
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server' });
  }
};

// Lihat data nasabah by ID
const getNasabah = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT n.*, r.nomor_rekening, r.saldo, r.jenis
       FROM nasabah n
       LEFT JOIN rekening r ON n.id = r.nasabah_id
       WHERE n.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        pesan: 'Nasabah tidak ditemukan'
      });
    }

    res.json({ success: true, data: result.rows[0] });

  } catch (error) {
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server' });
  }
};

module.exports = { daftarNasabah, getNasabah };
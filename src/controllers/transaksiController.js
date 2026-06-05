const pool = require('../config/database');

// Setor tunai
const setor = async (req, res) => {
  try {
    const { nomor_rekening, jumlah, keterangan } = req.body;

    if (!nomor_rekening || !jumlah || jumlah <= 0) {
      return res.status(400).json({
        success: false,
        pesan: 'Nomor rekening dan jumlah setor wajib diisi'
      });
    }

    // Cek rekening ada
    const rekening = await pool.query(
      'SELECT * FROM rekening WHERE nomor_rekening = $1',
      [nomor_rekening]
    );

    if (rekening.rows.length === 0) {
      return res.status(404).json({
        success: false,
        pesan: 'Rekening tidak ditemukan'
      });
    }

    const saldoSebelum = parseFloat(rekening.rows[0].saldo);
    const saldoSesudah = saldoSebelum + parseFloat(jumlah);

    // Update saldo
    await pool.query(
      'UPDATE rekening SET saldo = $1 WHERE nomor_rekening = $2',
      [saldoSesudah, nomor_rekening]
    );

    // Catat transaksi
    await pool.query(
      `INSERT INTO transaksi (rekening_id, jenis, jumlah, saldo_sebelum, saldo_sesudah, keterangan)
       VALUES ($1, 'setor', $2, $3, $4, $5)`,
      [rekening.rows[0].id, jumlah, saldoSebelum, saldoSesudah, keterangan || 'Setor tunai']
    );

    res.json({
      success: true,
      pesan: 'Setor berhasil',
      data: {
        nomor_rekening,
        jumlah_setor: jumlah,
        saldo_sebelum: saldoSebelum,
        saldo_sesudah: saldoSesudah
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server' });
  }
};

// Tarik tunai
const tarik = async (req, res) => {
  try {
    const { nomor_rekening, jumlah, keterangan } = req.body;

    if (!nomor_rekening || !jumlah || jumlah <= 0) {
      return res.status(400).json({
        success: false,
        pesan: 'Nomor rekening dan jumlah tarik wajib diisi'
      });
    }

    const rekening = await pool.query(
      'SELECT * FROM rekening WHERE nomor_rekening = $1',
      [nomor_rekening]
    );

    if (rekening.rows.length === 0) {
      return res.status(404).json({
        success: false,
        pesan: 'Rekening tidak ditemukan'
      });
    }

    const saldoSebelum = parseFloat(rekening.rows[0].saldo);

    // Cek saldo cukup — logika bisnis perbankan!
    if (saldoSebelum < parseFloat(jumlah)) {
      return res.status(400).json({
        success: false,
        pesan: 'Saldo tidak mencukupi',
        saldo_tersedia: saldoSebelum
      });
    }

    const saldoSesudah = saldoSebelum - parseFloat(jumlah);

    await pool.query(
      'UPDATE rekening SET saldo = $1 WHERE nomor_rekening = $2',
      [saldoSesudah, nomor_rekening]
    );

    await pool.query(
      `INSERT INTO transaksi (rekening_id, jenis, jumlah, saldo_sebelum, saldo_sesudah, keterangan)
       VALUES ($1, 'tarik', $2, $3, $4, $5)`,
      [rekening.rows[0].id, jumlah, saldoSebelum, saldoSesudah, keterangan || 'Tarik tunai']
    );

    res.json({
      success: true,
      pesan: 'Penarikan berhasil',
      data: {
        nomor_rekening,
        jumlah_tarik: jumlah,
        saldo_sebelum: saldoSebelum,
        saldo_sesudah: saldoSesudah
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server' });
  }
};

// Transfer antar rekening
const transfer = async (req, res) => {
  // Pakai database transaction — kalau salah satu gagal, semua dibatalkan
  const client = await pool.connect();

  try {
    const { rekening_asal, rekening_tujuan, jumlah, keterangan } = req.body;

    if (!rekening_asal || !rekening_tujuan || !jumlah || jumlah <= 0) {
      return res.status(400).json({
        success: false,
        pesan: 'Rekening asal, tujuan, dan jumlah wajib diisi'
      });
    }

    if (rekening_asal === rekening_tujuan) {
      return res.status(400).json({
        success: false,
        pesan: 'Rekening asal dan tujuan tidak boleh sama'
      });
    }

    // Mulai transaction database
    await client.query('BEGIN');

    const rekeningAsal = await client.query(
      'SELECT * FROM rekening WHERE nomor_rekening = $1',
      [rekening_asal]
    );
    const rekeningTujuan = await client.query(
      'SELECT * FROM rekening WHERE nomor_rekening = $1',
      [rekening_tujuan]
    );

    if (rekeningAsal.rows.length === 0 || rekeningTujuan.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        pesan: 'Rekening asal atau tujuan tidak ditemukan'
      });
    }

    const saldoAsal = parseFloat(rekeningAsal.rows[0].saldo);

    if (saldoAsal < parseFloat(jumlah)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        pesan: 'Saldo tidak mencukupi untuk transfer'
      });
    }

    const saldoAsalSesudah = saldoAsal - parseFloat(jumlah);
    const saldoTujuanSebelum = parseFloat(rekeningTujuan.rows[0].saldo);
    const saldoTujuanSesudah = saldoTujuanSebelum + parseFloat(jumlah);

    // Kurangi saldo asal
    await client.query(
      'UPDATE rekening SET saldo = $1 WHERE nomor_rekening = $2',
      [saldoAsalSesudah, rekening_asal]
    );

    // Tambah saldo tujuan
    await client.query(
      'UPDATE rekening SET saldo = $1 WHERE nomor_rekening = $2',
      [saldoTujuanSesudah, rekening_tujuan]
    );

    // Catat transaksi keluar
    await client.query(
      `INSERT INTO transaksi (rekening_id, jenis, jumlah, saldo_sebelum, saldo_sesudah, keterangan)
       VALUES ($1, 'transfer_keluar', $2, $3, $4, $5)`,
      [rekeningAsal.rows[0].id, jumlah, saldoAsal, saldoAsalSesudah,
       keterangan || `Transfer ke ${rekening_tujuan}`]
    );

    // Catat transaksi masuk
    await client.query(
      `INSERT INTO transaksi (rekening_id, jenis, jumlah, saldo_sebelum, saldo_sesudah, keterangan)
       VALUES ($1, 'transfer_masuk', $2, $3, $4, $5)`,
      [rekeningTujuan.rows[0].id, jumlah, saldoTujuanSebelum, saldoTujuanSesudah,
       keterangan || `Transfer dari ${rekening_asal}`]
    );

    // Semua berhasil — simpan semua perubahan
    await client.query('COMMIT');

    res.json({
      success: true,
      pesan: 'Transfer berhasil',
      data: {
        rekening_asal,
        rekening_tujuan,
        jumlah_transfer: jumlah,
        saldo_asal_sesudah: saldoAsalSesudah
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server' });
  } finally {
    client.release();
  }
};

// Riwayat transaksi
const riwayat = async (req, res) => {
  try {
    const { nomor } = req.params;

    const result = await pool.query(
      `SELECT t.*, r.nomor_rekening
       FROM transaksi t
       JOIN rekening r ON t.rekening_id = r.id
       WHERE r.nomor_rekening = $1
       ORDER BY t.created_at DESC
       LIMIT 10`,
      [nomor]
    );

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server' });
  }
};

module.exports = { setor, tarik, transfer, riwayat };
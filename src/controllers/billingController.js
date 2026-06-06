const pool = require('../config/database');

const billInquiry = async (req, res) => {
  try {
    const { idbilling } = req.params;
    const result = await pool.query(
      `SELECT b.id_billing, b.amount, b.status, b.due_date, b.note,
              u.id AS user_id, u.nama AS user_name, u.email AS user_email,
              p.id AS product_id, p.nama AS product_name, p.description AS product_description,
              a.nomor_rekening AS account_number, a.nama_rekening AS account_name
       FROM billings b
       JOIN users u ON b.user_id = u.id
       JOIN products p ON b.product_id = p.id
       JOIN accounts a ON b.account_id = a.id
       WHERE b.id_billing = $1`,
      [idbilling]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, pesan: 'Billing tidak ditemukan' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server saat inquiry billing' });
  }
};

const billPay = async (req, res) => {
  try {
    const { id_billing } = req.body;
    if (!id_billing) {
      return res.status(400).json({ success: false, pesan: 'id_billing wajib diisi' });
    }

    const billResult = await pool.query(
      `SELECT b.id, b.id_billing, b.amount, b.status, b.account_id,
              u.id AS user_id, u.nama AS user_name
       FROM billings b
       JOIN users u ON b.user_id = u.id
       WHERE b.id_billing = $1`,
      [id_billing]
    );

    if (billResult.rows.length === 0) {
      return res.status(404).json({ success: false, pesan: 'Billing tidak ditemukan' });
    }

    const billing = billResult.rows[0];
    if (billing.status !== 'pending') {
      return res.status(400).json({ success: false, pesan: 'Billing sudah tidak dapat dibayar' });
    }

    const accountResult = await pool.query('SELECT * FROM accounts WHERE id = $1', [billing.account_id]);
    if (accountResult.rows.length === 0) {
      return res.status(404).json({ success: false, pesan: 'Rekening tujuan pembayaran tidak ditemukan' });
    }

    const account = accountResult.rows[0];
    const balanceBefore = parseFloat(account.saldo);
    const balanceAfter = balanceBefore + parseFloat(billing.amount);

    await pool.query('BEGIN');
    await pool.query('UPDATE billings SET status = $1, updated_at = NOW() WHERE id = $2', ['paid', billing.id]);
    await pool.query('UPDATE accounts SET saldo = $1 WHERE id = $2', [balanceAfter, account.id]);
    await pool.query(
      `INSERT INTO account_transactions (account_id, type, amount, balance_before, balance_after, description)
       VALUES ($1, 'payment', $2, $3, $4, $5)`,
      [account.id, billing.amount, balanceBefore, balanceAfter, `Pembayaran billing ${billing.id_billing}`]
    );
    await pool.query(
      `INSERT INTO billing_transactions (billing_id, type, amount, note)
       VALUES ($1, 'payment', $2, $3)`,
      [billing.id, billing.amount, `Pembayaran oleh ${billing.user_name}`]
    );
    await pool.query('COMMIT');

    res.json({
      success: true,
      pesan: 'Pembayaran berhasil',
      data: {
        id_billing: billing.id_billing,
        amount: billing.amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter
      }
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server saat membayar billing' });
  }
};

const refundBilling = async (req, res) => {
  try {
    const { id_billing, note } = req.body;
    if (!id_billing) {
      return res.status(400).json({ success: false, pesan: 'id_billing wajib diisi' });
    }

    const billResult = await pool.query(
      `SELECT b.id, b.id_billing, b.amount, b.status, b.account_id
       FROM billings b
       WHERE b.id_billing = $1`,
      [id_billing]
    );

    if (billResult.rows.length === 0) {
      return res.status(404).json({ success: false, pesan: 'Billing tidak ditemukan' });
    }

    const billing = billResult.rows[0];
    if (billing.status !== 'paid') {
      return res.status(400).json({ success: false, pesan: 'Refund hanya dapat dilakukan untuk billing yang sudah dibayar' });
    }

    const accountResult = await pool.query('SELECT * FROM accounts WHERE id = $1', [billing.account_id]);
    if (accountResult.rows.length === 0) {
      return res.status(404).json({ success: false, pesan: 'Rekening settlement tidak ditemukan' });
    }

    const account = accountResult.rows[0];
    const balanceBefore = parseFloat(account.saldo);
    const amount = parseFloat(billing.amount);
    if (balanceBefore < amount) {
      return res.status(400).json({ success: false, pesan: 'Saldo rekening tidak cukup untuk refund' });
    }

    const balanceAfter = balanceBefore - amount;

    await pool.query('BEGIN');
    await pool.query('UPDATE billings SET status = $1, updated_at = NOW() WHERE id = $2', ['refunded', billing.id]);
    await pool.query('UPDATE accounts SET saldo = $1 WHERE id = $2', [balanceAfter, account.id]);
    await pool.query(
      `INSERT INTO account_transactions (account_id, type, amount, balance_before, balance_after, description)
       VALUES ($1, 'refund', $2, $3, $4, $5)`,
      [account.id, amount, balanceBefore, balanceAfter, `Refund billing ${billing.id_billing}`]
    );
    await pool.query(
      `INSERT INTO billing_transactions (billing_id, type, amount, note)
       VALUES ($1, 'refund', $2, $3)`,
      [billing.id, amount, note || 'Refund admin']
    );
    await pool.query('COMMIT');

    res.json({
      success: true,
      pesan: 'Refund berhasil',
      data: {
        id_billing: billing.id_billing,
        amount,
        balance_before: balanceBefore,
        balance_after: balanceAfter
      }
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server saat refund billing' });
  }
};

const listBilling = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const params = [];
    let filter = '';

    if (!isAdmin) {
      filter = 'WHERE u.id = $1';
      params.push(req.user.id);
    }

    const result = await pool.query(
      `SELECT b.id_billing, b.amount, b.status, b.due_date, b.note,
              u.nama AS user_name, p.nama AS product_name, a.nomor_rekening AS account_number
       FROM billings b
       JOIN users u ON b.user_id = u.id
       JOIN products p ON b.product_id = p.id
       JOIN accounts a ON b.account_id = a.id
       ${filter}
       ORDER BY b.created_at DESC`,
      params
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server saat mengambil daftar billing' });
  }
};

const detailBilling = async (req, res) => {
  try {
    const { idbilling } = req.params;
    const result = await pool.query(
      `SELECT b.id_billing, b.amount, b.status, b.due_date, b.note,
              u.nama AS user_name, u.email AS user_email, p.nama AS product_name, p.description AS product_description,
              a.nomor_rekening AS account_number, a.nama_rekening AS account_name
       FROM billings b
       JOIN users u ON b.user_id = u.id
       JOIN products p ON b.product_id = p.id
       JOIN accounts a ON b.account_id = a.id
       WHERE b.id_billing = $1`,
      [idbilling]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, pesan: 'Billing tidak ditemukan' });
    }

    if (req.user.role !== 'admin' && result.rows[0].user_email !== req.user.email) {
      return res.status(403).json({ success: false, pesan: 'Anda tidak berhak melihat detail billing ini' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server saat mengambil detail billing' });
  }
};

const createBilling = async (req, res) => {
  try {
    const { id_billing, user_id, product_id, account_id, amount, due_date, note } = req.body;
    if (!id_billing || !user_id || !product_id || !account_id || !amount || !due_date) {
      return res.status(400).json({ success: false, pesan: 'Semua field billing wajib diisi kecuali note' });
    }

    const result = await pool.query(
      `INSERT INTO billings (id_billing, user_id, product_id, account_id, amount, due_date, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id_billing, amount, status, due_date`,
      [id_billing, user_id, product_id, account_id, amount, due_date, note || null]
    );

    res.status(201).json({ success: true, data: result.rows[0], pesan: 'Billing berhasil dibuat' });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, pesan: 'id_billing sudah terdaftar' });
    }
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server saat membuat billing' });
  }
};

const updateBilling = async (req, res) => {
  try {
    const { id_billing, amount, due_date, note } = req.body;
    if (!id_billing) {
      return res.status(400).json({ success: false, pesan: 'id_billing wajib diisi' });
    }

    const existing = await pool.query('SELECT id, status FROM billings WHERE id_billing = $1', [id_billing]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, pesan: 'Billing tidak ditemukan' });
    }
    if (existing.rows[0].status !== 'pending') {
      return res.status(400).json({ success: false, pesan: 'Billing hanya dapat diperbarui jika belum dibayar' });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (amount) {
      fields.push(`amount = $${idx++}`);
      values.push(amount);
    }
    if (due_date) {
      fields.push(`due_date = $${idx++}`);
      values.push(due_date);
    }
    if (note !== undefined) {
      fields.push(`note = $${idx++}`);
      values.push(note);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, pesan: 'Tidak ada data yang ingin diperbarui' });
    }

    values.push(id_billing);
    const query = `UPDATE billings SET ${fields.join(', ')}, updated_at = NOW() WHERE id_billing = $${idx} RETURNING id_billing, amount, status, due_date, note`;

    const updated = await pool.query(query, values);
    res.json({ success: true, data: updated.rows[0], pesan: 'Billing berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server saat memperbarui billing' });
  }
};

const deleteBilling = async (req, res) => {
  try {
    const { id_billing } = req.body;
    if (!id_billing) {
      return res.status(400).json({ success: false, pesan: 'id_billing wajib diisi' });
    }

    const existing = await pool.query('SELECT id, status FROM billings WHERE id_billing = $1', [id_billing]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, pesan: 'Billing tidak ditemukan' });
    }
    if (existing.rows[0].status !== 'pending') {
      return res.status(400).json({ success: false, pesan: 'Billing hanya dapat dihapus jika belum dibayar' });
    }

    await pool.query('DELETE FROM billings WHERE id_billing = $1', [id_billing]);
    res.json({ success: true, pesan: 'Billing berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server saat menghapus billing' });
  }
};

const listProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nama, description, default_amount FROM products ORDER BY id');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server saat mengambil daftar produk' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { nama, description, default_amount } = req.body;
    if (!nama || !default_amount) {
      return res.status(400).json({ success: false, pesan: 'Nama produk dan default_amount wajib diisi' });
    }

    const result = await pool.query(
      `INSERT INTO products (nama, description, default_amount)
       VALUES ($1, $2, $3) RETURNING id, nama, description, default_amount`,
      [nama, description || null, default_amount]
    );

    res.status(201).json({ success: true, data: result.rows[0], pesan: 'Product berhasil dibuat' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server saat membuat product' });
  }
};

module.exports = {
  billInquiry,
  billPay,
  refundBilling,
  listBilling,
  detailBilling,
  createBilling,
  updateBilling,
  deleteBilling,
  listProducts,
  createProduct
};

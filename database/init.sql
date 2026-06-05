-- Hapus tabel lama kalau ada
DROP TABLE IF EXISTS transaksi;
DROP TABLE IF EXISTS rekening;
DROP TABLE IF EXISTS nasabah;

-- Buat tabel nasabah
CREATE TABLE nasabah (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    nik VARCHAR(16) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    no_hp VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buat tabel rekening
CREATE TABLE rekening (
    id SERIAL PRIMARY KEY,
    nasabah_id INTEGER REFERENCES nasabah(id),
    nomor_rekening VARCHAR(20) UNIQUE NOT NULL,
    saldo DECIMAL(15,2) DEFAULT 0,
    jenis VARCHAR(20) DEFAULT 'tabungan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buat tabel transaksi
CREATE TABLE transaksi (
    id SERIAL PRIMARY KEY,
    rekening_id INTEGER REFERENCES rekening(id),
    jenis VARCHAR(20) NOT NULL,
    jumlah DECIMAL(15,2) NOT NULL,
    saldo_sebelum DECIMAL(15,2) NOT NULL,
    saldo_sesudah DECIMAL(15,2) NOT NULL,
    keterangan VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data contoh
INSERT INTO nasabah (nama, nik, email, no_hp) VALUES
('Budi Santoso', '3404012501990001', 'budi@email.com', '081234567890'),
('Sari Dewi', '3404015506000002', 'sari@email.com', '081234567891');

INSERT INTO rekening (nasabah_id, nomor_rekening, saldo, jenis) VALUES
(1, '1234567890', 1000000, 'tabungan'),
(2, '0987654321', 500000, 'tabungan');
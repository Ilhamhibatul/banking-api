DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS billing_transactions;
DROP TABLE IF EXISTS account_transactions;
DROP TABLE IF EXISTS billings;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    nama_rekening VARCHAR(150) NOT NULL,
    nomor_rekening VARCHAR(30) UNIQUE NOT NULL,
    saldo DECIMAL(18,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    description TEXT,
    default_amount DECIMAL(18,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE billings (
    id SERIAL PRIMARY KEY,
    id_billing VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    account_id INTEGER REFERENCES accounts(id),
    amount DECIMAL(18,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    note VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE account_transactions (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id),
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    balance_before DECIMAL(18,2) NOT NULL,
    balance_after DECIMAL(18,2) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE billing_transactions (
    id SERIAL PRIMARY KEY,
    billing_id INTEGER REFERENCES billings(id),
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    note VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token VARCHAR(128) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (nama, email, password, role) VALUES
('Admin Bendahara', 'admin@fakultas.ac.id', 'admin123', 'admin'),
('Mawar Mahasiswa', 'mahasiswa1@kampus.ac.id', 'mahasiswa123', 'student'),
('Andi Mahasiswa', 'mahasiswa2@kampus.ac.id', 'mahasiswa234', 'student');

INSERT INTO accounts (nama_rekening, nomor_rekening, saldo) VALUES
('Rekening Settlement Fakultas', '1111222233334444', 10000000),
('Rekening Kas Mahasiswa', '2222333344445555', 2500000);

INSERT INTO products (nama, description, default_amount) VALUES
('SPP', 'Tagihan SPP semester berjalan', 1500000),
('Praktikum', 'Tagihan biaya praktikum laboratorium', 500000),
('Daftar Ulang', 'Biaya daftar ulang semester', 750000);

INSERT INTO billings (id_billing, user_id, product_id, account_id, amount, due_date, status, note) VALUES
('BILL-1001', 2, 1, 1, 1500000, CURRENT_DATE + INTERVAL '7 day', 'pending', 'SPP semester genap'),
('BILL-1002', 2, 2, 1, 500000, CURRENT_DATE + INTERVAL '10 day', 'pending', 'Praktikum basis data'),
('BILL-1003', 3, 3, 1, 750000, CURRENT_DATE + INTERVAL '14 day', 'pending', 'Daftar ulang fakultas');
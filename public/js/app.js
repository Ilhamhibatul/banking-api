const API_BASE = '';

const getToken = () => localStorage.getItem('billing_token');
const setToken = (token) => localStorage.setItem('billing_token', token);
const clearToken = () => localStorage.removeItem('billing_token');

const authFetch = async (url, options = {}) => {
  const token = getToken();
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(API_BASE + url, { ...options, headers });
  return response.json();
};

const showMessage = (selector, message, isSuccess = false) => {
  const el = document.querySelector(selector);
  if (el) {
    el.textContent = message;
    el.className = isSuccess ? 'message success' : 'message';
  }
};

const handleLogout = () => {
  clearToken();
  window.location.href = '/login.html';
};

const setupLogoutLinks = () => {
  document.querySelectorAll('#logout-link').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      handleLogout();
    });
  });
};

const loginPage = () => {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = formData.get('email').trim();
    const password = formData.get('password').trim();

    if (!email || !password) {
      showMessage('#login-message', 'Email dan password wajib diisi');
      return;
    }

    const result = await fetch(API_BASE + '/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then((r) => r.json());

    if (!result.success) {
      showMessage('#login-message', result.pesan || 'Gagal login');
      return;
    }

    setToken(result.data.token);
    window.location.href = '/billing-list.html';
  });
};

const billingListPage = async () => {
  if (!document.getElementById('billing-table-body')) return;
  setupLogoutLinks();

  const result = await authFetch('/list-billing');
  if (!result.success) {
    showMessage('#billing-message', result.pesan || 'Gagal ambil data tagihan');
    return;
  }

  const tbody = document.getElementById('billing-table-body');
  tbody.innerHTML = '';
  result.data.forEach((billing) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${billing.id_billing}</td>
      <td>${billing.user_name}</td>
      <td>${billing.product_name}</td>
      <td>${billing.account_number}</td>
      <td>${billing.amount.toLocaleString('id-ID')}</td>
      <td>${billing.status}</td>
      <td>${billing.due_date ? billing.due_date.substring(0, 10) : '-'}</td>
    `;
    tbody.appendChild(row);
  });
};

const billingManagePage = async () => {
  if (!document.getElementById('create-billing-form')) return;
  setupLogoutLinks();

  const createForm = document.getElementById('create-billing-form');
  const updateForm = document.getElementById('update-billing-form');
  const deleteForm = document.getElementById('delete-billing-form');

  createForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(createForm));
    if (!data.id_billing || !data.user_id || !data.product_id || !data.account_id || !data.amount || !data.due_date) {
      showMessage('#manage-message', 'Semua field wajib diisi');
      return;
    }

    const result = await authFetch('/create-billing', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    showMessage('#manage-message', result.pesan || 'Selesai', result.success);
  });

  updateForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(updateForm));
    if (!data.id_billing) {
      showMessage('#manage-message', 'ID Billing wajib diisi');
      return;
    }
    const result = await authFetch('/update-billing', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    showMessage('#manage-message', result.pesan || 'Selesai', result.success);
  });

  deleteForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(deleteForm));
    if (!data.id_billing) {
      showMessage('#manage-message', 'ID Billing wajib diisi');
      return;
    }
    const result = await authFetch('/delete-billing', {
      method: 'DELETE',
      body: JSON.stringify(data)
    });
    showMessage('#manage-message', result.pesan || 'Selesai', result.success);
  });
};

const payBillPage = async () => {
  if (!document.getElementById('pay-bill-form')) return;
  setupLogoutLinks();

  const form = document.getElementById('pay-bill-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const { id_billing } = Object.fromEntries(new FormData(form));
    if (!id_billing) {
      showMessage('#pay-message', 'ID Billing wajib diisi');
      return;
    }

    const result = await authFetch('/bill-pay', {
      method: 'POST',
      body: JSON.stringify({ id_billing })
    });
    showMessage('#pay-message', result.pesan || 'Selesai', result.success);
  });
};

const accountPage = async () => {
  if (!document.getElementById('check-balance-form')) return;
  setupLogoutLinks();

  document.getElementById('check-balance-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const { nomor_rekening } = Object.fromEntries(new FormData(event.target));
    if (!nomor_rekening) {
      showMessage('#account-message', 'Nomor rekening wajib diisi');
      return;
    }

    const result = await authFetch(`/check-balance?nomor_rekening=${encodeURIComponent(nomor_rekening)}`);
    if (!result.success) {
      showMessage('#account-message', result.pesan || 'Gagal cek saldo');
      return;
    }

    showMessage('#account-message', 'Cek saldo berhasil', true);
    document.getElementById('balance-result').innerHTML = `
      <p><strong>Nama Rekening:</strong> ${result.data.nama_rekening}</p>
      <p><strong>Nomor Rekening:</strong> ${result.data.nomor_rekening}</p>
      <p><strong>Saldo:</strong> Rp ${parseFloat(result.data.saldo).toLocaleString('id-ID')}</p>
    `;
  });

  document.getElementById('transaction-history-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const { nomor_rekening } = Object.fromEntries(new FormData(event.target));
    if (!nomor_rekening) {
      showMessage('#account-message', 'Nomor rekening wajib diisi');
      return;
    }

    const result = await authFetch('/transaction-history', {
      method: 'POST',
      body: JSON.stringify({ nomor_rekening, limit: 20 })
    });

    if (!result.success) {
      showMessage('#account-message', result.pesan || 'Gagal ambil mutasi');
      return;
    }

    const tbody = document.getElementById('history-table-body');
    tbody.innerHTML = '';
    result.data.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(item.created_at).toLocaleString('id-ID')}</td>
        <td>${item.type}</td>
        <td>Rp ${parseFloat(item.amount).toLocaleString('id-ID')}</td>
        <td>Rp ${parseFloat(item.balance_before).toLocaleString('id-ID')}</td>
        <td>Rp ${parseFloat(item.balance_after).toLocaleString('id-ID')}</td>
        <td>${item.description || '-'}</td>
      `;
      tbody.appendChild(row);
    });
  });
};

const init = () => {
  loginPage();
  billingListPage();
  billingManagePage();
  payBillPage();
  accountPage();
};

window.addEventListener('DOMContentLoaded', init);

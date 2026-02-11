const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock data
const mockUsers = {
  'user_1': { id: 'user_1', email: 'test@example.com', name: 'Test User', credits: 50 },
  'user_2': { id: 'user_2', email: 'john@example.com', name: 'John Doe', credits: 100 }
};

// Admin credentials
const ADMIN_EMAIL = 'admin@aicreator.app';
const ADMIN_PASSWORD = 'Admin@123456';

// Ping endpoint
app.get('/ping', (req, res) => {
  res.json({ status: 'pong', timestamp: new Date().toISOString() });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    res.json({
      success: true,
      message: 'Login successful',
      admin: {
        email: ADMIN_EMAIL,
        name: 'Admin User',
        role: 'admin'
      },
      token: 'admin_token_' + Date.now()
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Get users
app.get('/api/admin/users', (req, res) => {
  res.json({
    success: true,
    users: Object.values(mockUsers),
    total: Object.keys(mockUsers).length
  });
});

// Add credits
app.post('/api/admin/credits/add', (req, res) => {
  const { userId, amount, reason } = req.body;
  
  if (!userId || !amount) {
    return res.status(400).json({ error: 'userId and amount required' });
  }
  
  if (!mockUsers[userId]) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const prev = mockUsers[userId].credits;
  mockUsers[userId].credits += amount;
  
  res.json({
    success: true,
    message: 'Credits added by admin',
    transaction: {
      id: 'txn_' + Date.now(),
      userId,
      amount,
      reason: reason || 'Admin adjustment',
      previousBalance: prev,
      newBalance: mockUsers[userId].credits,
      addedBy: ADMIN_EMAIL,
      timestamp: new Date().toISOString()
    },
    user: mockUsers[userId]
  });
});

// Get stats
app.get('/api/admin/stats', (req, res) => {
  const totalCredits = Object.values(mockUsers).reduce((sum, u) => sum + u.credits, 0);
  
  res.json({
    success: true,
    stats: {
      totalUsers: Object.keys(mockUsers).length,
      totalCredits: totalCredits,
      timestamp: new Date().toISOString()
    }
  });
});

// Serve login page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Dashboard - AI Creator</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .container {
          background: white;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          padding: 40px;
          width: 100%;
          max-width: 400px;
        }
        
        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 30px;
          font-size: 28px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          color: #555;
          font-weight: 500;
        }
        
        input {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 5px;
          font-size: 16px;
          transition: border-color 0.3s;
        }
        
        input:focus {
          outline: none;
          border-color: #667eea;
        }
        
        button {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        button:hover {
          transform: translateY(-2px);
        }
        
        button:active {
          transform: translateY(0);
        }
        
        .error {
          color: #e74c3c;
          text-align: center;
          margin-top: 10px;
          display: none;
        }
        
        .success {
          color: #27ae60;
          text-align: center;
          margin-top: 10px;
          display: none;
        }
        
        .credentials {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
          font-size: 14px;
          color: #666;
        }
        
        .credentials strong {
          color: #333;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎛️ Admin Dashboard</h1>
        
        <form id="loginForm">
          <div class="form-group">
            <label for="email">البريد الإلكتروني</label>
            <input type="email" id="email" placeholder="admin@aicreator.app" required>
          </div>
          
          <div class="form-group">
            <label for="password">كلمة المرور</label>
            <input type="password" id="password" placeholder="••••••••" required>
          </div>
          
          <button type="submit">تسجيل الدخول</button>
          
          <div class="error" id="error"></div>
          <div class="success" id="success"></div>
        </form>
        
        <div class="credentials">
          <strong>بيانات الدخول التجريبية:</strong><br>
          البريد: admin@aicreator.app<br>
          كلمة المرور: Admin@123456
        </div>
      </div>
      
      <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const errorEl = document.getElementById('error');
          const successEl = document.getElementById('success');
          
          errorEl.style.display = 'none';
          successEl.style.display = 'none';
          
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              successEl.textContent = 'تم تسجيل الدخول بنجاح!';
              successEl.style.display = 'block';
              localStorage.setItem('adminToken', data.token);
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 1500);
            } else {
              errorEl.textContent = data.error || 'فشل تسجيل الدخول';
              errorEl.style.display = 'block';
            }
          } catch (err) {
            errorEl.textContent = 'خطأ في الاتصال';
            errorEl.style.display = 'block';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Serve dashboard page
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>لوحة التحكم - AI Creator</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f5f5f5;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          text-align: center;
        }
        
        .container {
          max-width: 1000px;
          margin: 20px auto;
          padding: 20px;
        }
        
        .card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        h2 {
          color: #333;
          margin-bottom: 15px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
          color: #555;
          font-weight: 500;
        }
        
        input, select {
          width: 100%;
          padding: 10px;
          border: 2px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
        }
        
        input:focus, select:focus {
          outline: none;
          border-color: #667eea;
        }
        
        button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 600;
        }
        
        button:hover {
          opacity: 0.9;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        
        th, td {
          padding: 12px;
          text-align: right;
          border-bottom: 1px solid #ddd;
        }
        
        th {
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
        }
        
        .success {
          color: #27ae60;
          margin-top: 10px;
          display: none;
        }
        
        .error {
          color: #e74c3c;
          margin-top: 10px;
          display: none;
        }
        
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .stat-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
        }
        
        .stat-number {
          font-size: 32px;
          font-weight: bold;
        }
        
        .stat-label {
          font-size: 14px;
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎛️ لوحة التحكم - AI Creator</h1>
        <p>إدارة المستخدمين والكريديتات</p>
      </div>
      
      <div class="container">
        <div class="stats" id="stats"></div>
        
        <div class="card">
          <h2>➕ إضافة كريديت</h2>
          <form id="creditForm">
            <div class="form-group">
              <label for="userId">اختر المستخدم</label>
              <select id="userId" required>
                <option value="">-- اختر مستخدم --</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="amount">عدد الكريديتات</label>
              <input type="number" id="amount" min="1" placeholder="50" required>
            </div>
            
            <div class="form-group">
              <label for="reason">السبب (اختياري)</label>
              <input type="text" id="reason" placeholder="Top-up">
            </div>
            
            <button type="submit">إضافة كريديت</button>
            <div class="success" id="creditSuccess"></div>
            <div class="error" id="creditError"></div>
          </form>
        </div>
        
        <div class="card">
          <h2>👥 قائمة المستخدمين</h2>
          <table id="usersTable">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>البريد الإلكتروني</th>
                <th>الكريديتات</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
      
      <script>
        // Load users on page load
        async function loadUsers() {
          try {
            const response = await fetch('/api/admin/users');
            const data = await response.json();
            
            if (data.success) {
              const tbody = document.querySelector('#usersTable tbody');
              const userSelect = document.getElementById('userId');
              
              tbody.innerHTML = '';
              userSelect.innerHTML = '<option value="">-- اختر مستخدم --</option>';
              
              data.users.forEach(user => {
                // Add to table
                const row = document.createElement('tr');
                row.innerHTML = \`
                  <td>\${user.name}</td>
                  <td>\${user.email}</td>
                  <td>\${user.credits}</td>
                \`;
                tbody.appendChild(row);
                
                // Add to select
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = \`\${user.name} (\${user.email})\`;
                userSelect.appendChild(option);
              });
            }
          } catch (err) {
            console.error('Error loading users:', err);
          }
        }
        
        // Load stats
        async function loadStats() {
          try {
            const response = await fetch('/api/admin/stats');
            const data = await response.json();
            
            if (data.success) {
              const statsDiv = document.getElementById('stats');
              statsDiv.innerHTML = \`
                <div class="stat-box">
                  <div class="stat-number">\${data.stats.totalUsers}</div>
                  <div class="stat-label">إجمالي المستخدمين</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">\${data.stats.totalCredits}</div>
                  <div class="stat-label">إجمالي الكريديتات</div>
                </div>
              \`;
            }
          } catch (err) {
            console.error('Error loading stats:', err);
          }
        }
        
        // Add credits
        document.getElementById('creditForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const userId = document.getElementById('userId').value;
          const amount = parseInt(document.getElementById('amount').value);
          const reason = document.getElementById('reason').value;
          
          const successEl = document.getElementById('creditSuccess');
          const errorEl = document.getElementById('creditError');
          
          successEl.style.display = 'none';
          errorEl.style.display = 'none';
          
          try {
            const response = await fetch('/api/admin/credits/add', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, amount, reason })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              successEl.textContent = \`✅ تم إضافة \${amount} كريديت بنجاح!\`;
              successEl.style.display = 'block';
              document.getElementById('creditForm').reset();
              loadUsers();
              loadStats();
            } else {
              errorEl.textContent = data.error || 'حدث خطأ';
              errorEl.style.display = 'block';
            }
          } catch (err) {
            errorEl.textContent = 'خطأ في الاتصال';
            errorEl.style.display = 'block';
          }
        });
        
        // Initial load
        loadUsers();
        loadStats();
      </script>
    </body>
    </html>
  `);
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🎛️  Admin Dashboard');
  console.log('='.repeat(60));
  console.log(`\n✅ Admin Dashboard running on 0.0.0.0:${PORT}`);
  console.log(`\n🔐 Login Credentials:`);
  console.log(`   Email: admin@aicreator.app`);
  console.log(`   Password: Admin@123456`);
  console.log(`\n📱 Public URL: https://3001-iquo2hb07nd93l0roye51-1cdaf514.sg1.manus.computer`);
  console.log('='.repeat(60) + '\n');
});

module.exports = app;

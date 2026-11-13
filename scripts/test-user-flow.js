const http = require('http');

function post(path, body, cookie = '') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          Cookie: cookie,
        },
      },
      (res) => {
        let resBody = '';
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          const setCookie = res.headers['set-cookie'];
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resBody), setCookie });
          } catch (e) {
            resolve({ status: res.statusCode, raw: resBody, setCookie });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, cookie = '') {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'GET',
        headers: {
          Cookie: cookie,
        },
      },
      (res) => {
        let resBody = '';
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resBody) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: resBody });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const testEmail = `postgres_user_${Date.now()}@test.com`;
  console.log(`1. Testing registration with ${testEmail}...`);
  const regRes = await post('/api/v1/auth/register', { email: testEmail, password: 'password123' });
  console.log('Registration status:', regRes.status, regRes.data?.message || regRes.data?.error);

  const cookie = regRes.setCookie ? regRes.setCookie[0].split(';')[0] : '';
  console.log('Session Cookie received:', cookie ? 'YES' : 'NO');

  console.log('\n2. Testing onboarding submission (solo profile)...');
  const onboardRes = await post(
    '/api/v1/onboarding',
    {
      name: 'Tanvir Hossain',
      occupation: 'Lead Architect',
      monthlyIncome: 125000,
      salaryDate: '2026-11-01',
      lastExpense: 4500,
    },
    cookie
  );
  console.log('Onboarding status:', onboardRes.status, onboardRes.data?.message || onboardRes.data?.error);

  const updatedCookie = onboardRes.setCookie ? onboardRes.setCookie[0].split(';')[0] : cookie;

  console.log('\n3. Testing dashboard retrieval for solo user...');
  const dashRes = await get('/api/v1/dashboard', updatedCookie);
  console.log('Dashboard status:', dashRes.status);
  console.log('User Name:', dashRes.data?.data?.user?.name);
  console.log('Total Balance:', '৳' + dashRes.data?.data?.totalBalance);
  console.log('Total Inflow:', '৳' + dashRes.data?.data?.totalInflow);
  console.log('Total Expense:', '৳' + dashRes.data?.data?.totalExpense);
  console.log('Recent Transactions:', dashRes.data?.data?.recentTransactions?.length);

  console.log('\n4. Testing add new transaction for this user...');
  const txRes = await post(
    '/api/v1/transactions',
    {
      title: 'DBeaver Testing Expense',
      amount: 1500,
      type: 'expense',
      category: 'Tech & Gadgets',
      notes: 'Testing postgres persistence and DBeaver table sync',
    },
    updatedCookie
  );
  console.log('Transaction status:', txRes.status, txRes.data?.message);

  const dashRes2 = await get('/api/v1/dashboard', updatedCookie);
  console.log('New Total Expense:', '৳' + dashRes2.data?.data?.totalExpense);
  console.log('New Pocket Balance:', '৳' + dashRes2.data?.data?.availablePocketCash);
}

run().catch(console.error);


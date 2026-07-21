const http = require('http');

function apiCall(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(responseData) });
        } catch (e) {
          resolve({ status: res.statusCode, body: responseData });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTest() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  console.log('\n========================================');
  console.log('STEP 1: Creating a new booking...');
  console.log('========================================');

  const bookingRes = await apiCall('POST', '/bookings', {
    customer_name: 'Test Customer',
    customer_email: 'pokhriyalhimanshu09@gmail.com',
    phone: '9999999999',
    mobile: '9999999999',
    country_code: '+91',
    hairstyle: 'Haircut',
    service_name: 'Haircut',
    stylist: 'Test Barber',
    booking_date: dateStr,
    appointment_date: dateStr,
    booking_time: '02:00 PM',
    appointment_time: '02:00 PM',
    payment_method: 'cash',
    total_price: 500,
    booking_type: 'salon',
  });

  console.log('Booking API Status:', bookingRes.status);
  if (!bookingRes.body.success) {
    console.error('Booking FAILED:', JSON.stringify(bookingRes.body));
    return;
  }

  const bookingId = bookingRes.body.data.id;
  console.log('✅ Booking created! ID:', bookingId);
  console.log('   Status:', bookingRes.body.data.booking_status);
  console.log('   Email:', bookingRes.body.data.customer_email);
  console.log('\n>>> Email 1 (Booking Request Received) should have arrived! <<<\n');

  // Wait 2 seconds
  await new Promise(r => setTimeout(r, 2000));

  // Login as admin first
  console.log('\n========================================');
  console.log('STEP 2: Getting admin token...');
  console.log('========================================');
  const loginRes = await apiCall('POST', '/auth/admin-login', {
    email: 'admin@glowup.com',
    password: 'Himu@123',
  });
  console.log('Login Status:', loginRes.status);
  if (!loginRes.body.success && !loginRes.body.token) {
    console.error('Admin login FAILED:', JSON.stringify(loginRes.body));
    // Try to confirm directly via updateAdminBooking with superadmin approach
  }
  const token = loginRes.body.token || loginRes.body.data?.token;
  console.log('Token:', token ? 'received ✅' : 'NOT RECEIVED ❌');

  // Step 3: Confirm the booking
  console.log('\n========================================');
  console.log('STEP 3: Confirming booking as admin...');
  console.log('========================================');

  const confirmRes = await new Promise((resolve, reject) => {
    const body = JSON.stringify({ booking_status: 'confirmed' });
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/admin/bookings/${bookingId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${token}`,
      },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  console.log('Confirm API Status:', confirmRes.status);
  if (confirmRes.body.success) {
    console.log('✅ Booking CONFIRMED!');
    console.log('   New status:', confirmRes.body.data?.booking_status);
    console.log('\n>>> Email 2 (🎉 Slot Confirmed!) should have arrived! <<<\n');
  } else {
    console.error('Confirm FAILED:', JSON.stringify(confirmRes.body));
  }
}

runTest().catch(console.error);

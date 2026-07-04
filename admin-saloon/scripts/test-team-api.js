(async ()=>{
  try {
    const loginRes = await fetch('http://localhost:3000/api/v1/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@glowup.test', password: 'admin123' })
    });
    const login = await loginRes.json();
    console.log('login status', loginRes.status, login);
    if (!login.token) return;
    const token = login.token;
    const createRes = await fetch('http://localhost:3000/api/v1/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ name: 'Test Stylist', role: 'stylist', experience: '5 years' })
    });
    const created = await createRes.json().catch(async ()=>{ const t=await createRes.text(); return t });
    console.log('create status', createRes.status, created);
  } catch (e) {
    console.error('err', e);
  }
})();

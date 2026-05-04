(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department: 'informatique', password: 'chef_informatique123' }),
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    console.log('Body:', text);
  } catch (err) {
    console.error('Request failed', err);
  }
})();

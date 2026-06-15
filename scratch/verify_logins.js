const departments = [
  { name: "Materiel de Bord (MDB)", password: "MDB2026*+" },
  { name: "Qualite Hygienne et surete Environmental (QHSE)", password: "QHSE26++" },
  { name: "Audit", password: "Audits735-+" }
];

async function testLogin(dept) {
  console.log(`Testing login for: ${dept.name}`);
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department: dept.name, password: dept.password }),
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Result:`, data);
    return res.ok;
  } catch (err) {
    console.error(`Failed to test ${dept.name}:`, err.message);
    return false;
  }
}

(async () => {
  for (const dept of departments) {
    await testLogin(dept);
    console.log('---');
  }
})();

const sanitize = (s) => s.trim().replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase();
console.log('MDB:', sanitize("Materiel de Bord (MDB)"));
console.log('QHSE:', sanitize("Qualite Hygienne et surete Environmental (QHSE)"));

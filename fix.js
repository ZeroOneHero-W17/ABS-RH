const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content
    .replace(/EmployA\(c\)/g, 'Employé')
    .replace(/gA\(c\)rer/g, 'gérer')
    .replace(/AccA"s/g, 'Accès')
    .replace(/CrA\(c\)er/g, 'Créer')
    .replace(/crA\(c\)A\(c\)/g, 'créé')
    .replace(/GAnArez/g, 'Générez')
    .replace(/sAcurisA/g, 'sécurisé')
    .replace(/A\(c\)/g, 'é')
    .replace(/A"s/g, 'ès');
  fs.writeFileSync(filePath, content, 'utf8');
}

fixFile('app/page.tsx');
fixFile('app/admin/employes/page.tsx');
fixFile('app/dashboard/page.tsx');

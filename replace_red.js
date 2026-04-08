const fs = require('fs');
const path = './src/pages/LandingPage.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/red-500/g, 'lime-500');
fs.writeFileSync(path, content);
console.log('Replaced red-500 with lime-500');

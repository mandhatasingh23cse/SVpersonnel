const fs = require('fs');
const lines = fs.readFileSync('app.js', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.trim().startsWith('app.get("') || l.trim().startsWith("app.get('")) {
    console.log(i+1, l.trim());
  }
});

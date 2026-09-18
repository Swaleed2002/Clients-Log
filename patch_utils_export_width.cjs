const fs = require('fs');
let c = fs.readFileSync('src/utils.ts', 'utf8');

c = c.replace(
  /\{ wch: 10 \}, \/\/ D: Travel From\n\s*\{ wch: 10 \}, \/\/ E: Travel To/,
  `{ wch: 20 }, // D: Travel From\n    { wch: 20 }, // E: Travel To`
);

fs.writeFileSync('src/utils.ts', c);

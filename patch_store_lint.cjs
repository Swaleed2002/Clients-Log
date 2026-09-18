const fs = require('fs');
let c = fs.readFileSync('src/components/StoreInventory.tsx', 'utf8');

c = c.replace(
  /PrinterBrand \n\} from '\.\.\/types';/,
  "PrinterBrand,\n  WorkshopCase\n} from '../types';"
);

fs.writeFileSync('src/components/StoreInventory.tsx', c);

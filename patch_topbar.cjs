const fs = require('fs');
const p = './src/components/DesktopTopBar.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/import \{ ViewState, UserProfile \} from '\.\.\/types';/, "import { ViewState, UserProfile } from '../types';\nimport { canAccessModule } from '../utils/permissions';");

c = c.replace(/\{currentView !== 'form' && currentView !== 'serviceReportForm' && \(/, "{currentView !== 'form' && currentView !== 'serviceReportForm' && canAccessModule(profile, 'workEntries') && (");

fs.writeFileSync(p, c);

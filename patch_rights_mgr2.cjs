const fs = require('fs');
const p = './src/components/UserRightsManager.tsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');

const newRender = `                {Object.entries(permissions).map(([moduleKey, mods]) => (
                  <div key={moduleKey} className={\`border \${(mods as any).access ? 'border-gray-200' : 'border-gray-300'} rounded-lg overflow-hidden transition-all\`}>
                    <div className={\`px-4 py-3 font-bold capitalize flex justify-between items-center \${(mods as any).access ? 'bg-gray-50 text-gray-800 border-b border-gray-200' : 'bg-gray-100 text-gray-500'}\`}>
                      <span>{moduleKey.replace(/([A-Z])/g, ' $1').trim()} Module</span>
                      <label className="flex items-center cursor-pointer group">
                        <span className="text-xs text-gray-500 mr-2 font-medium">{(mods as any).access ? 'ON' : 'OFF'}</span>
                        <div className={\`w-10 h-5 rounded-full p-0.5 transition-colors \${(mods as any).access ? 'bg-indigo-600' : 'bg-gray-300'}\`}>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={!!(mods as any).access}
                            onChange={() => handleToggle(moduleKey as keyof UserPermissions, 'access')}
                          />
                          <div className={\`w-4 h-4 rounded-full bg-white shadow transform transition-transform \${(mods as any).access ? 'translate-x-5' : 'translate-x-0'}\`} />
                        </div>
                      </label>
                    </div>
                    
                    {/* Collapsible body */}
                    <div className={\`p-4 space-y-3 \${!(mods as any).access ? 'hidden' : ''}\`}>
                      {Object.keys(mods).filter(a => a !== 'access').map((action) => {
                        const act = action as keyof ModulePermissions;
                        return (
                          <label key={action} className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm font-medium text-gray-700 capitalize group-hover:text-indigo-600">
                              {action.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <div className={\`w-10 h-5 rounded-full p-0.5 transition-colors \${(mods as any)[act] ? 'bg-indigo-600' : 'bg-gray-200'}\`}>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={!!(mods as any)[act]}
                                onChange={() => handleToggle(moduleKey as keyof UserPermissions, act)}
                              />
                              <div className={\`w-4 h-4 rounded-full bg-white shadow transform transition-transform \${(mods as any)[act] ? 'translate-x-5' : 'translate-x-0'}\`} />
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}`;

lines.splice(193, 32, newRender);

fs.writeFileSync(p, lines.join('\n'));

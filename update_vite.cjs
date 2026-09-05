const fs = require('fs');

let content = fs.readFileSync('vite.config.ts', 'utf-8');

// Add the base path configuration
const searchStr = "plugins: [react(), tailwindcss()],";
const replacementStr = "base: '/Clients-Log/',\n    plugins: [react(), tailwindcss()],";

if (!content.includes("base: '/Clients-Log/'")) {
  content = content.replace(searchStr, replacementStr);
  fs.writeFileSync('vite.config.ts', content);
  console.log("Updated vite.config.ts successfully");
} else {
  console.log("vite.config.ts already configured");
}

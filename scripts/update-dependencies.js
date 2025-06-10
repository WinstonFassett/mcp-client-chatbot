// Script to update package.json with necessary dependencies from bolt.diy
const fs = require('fs');
const path = require('path');

// Paths to package.json files
const ourPackageJsonPath = path.join(__dirname, '..', 'package.json');
const boltPackageJsonPath = path.join(__dirname, '..', 'inspiration', 'bolt.diy', 'package.json');

// Read package.json files
const ourPackageJson = JSON.parse(fs.readFileSync(ourPackageJsonPath, 'utf8'));
const boltPackageJson = JSON.parse(fs.readFileSync(boltPackageJsonPath, 'utf8'));

// Dependencies we need from bolt.diy that we don't already have
const neededDependencies = {
  // Core WebContainer dependencies
  '@webcontainer/api': boltPackageJson.dependencies['@webcontainer/api'],
  '@xterm/xterm': boltPackageJson.dependencies['@xterm/xterm'],
  '@xterm/addon-fit': boltPackageJson.dependencies['@xterm/addon-fit'],
  '@xterm/addon-web-links': boltPackageJson.dependencies['@xterm/addon-web-links'],
  
  // CodeMirror dependencies (if not already present)
  '@codemirror/autocomplete': boltPackageJson.dependencies['@codemirror/autocomplete'],
  '@codemirror/commands': boltPackageJson.dependencies['@codemirror/commands'],
  '@codemirror/lang-css': boltPackageJson.dependencies['@codemirror/lang-css'],
  '@codemirror/lang-html': boltPackageJson.dependencies['@codemirror/lang-html'],
  '@codemirror/lang-json': boltPackageJson.dependencies['@codemirror/lang-json'],
  '@codemirror/search': boltPackageJson.dependencies['@codemirror/search'],
  '@lezer/highlight': boltPackageJson.dependencies['@lezer/highlight'],
  '@uiw/codemirror-theme-vscode': boltPackageJson.dependencies['@uiw/codemirror-theme-vscode'],
  
  // Other utilities
  'istextorbinary': boltPackageJson.dependencies['istextorbinary'],
  'diff': boltPackageJson.dependencies['diff'],
  'nanostores': boltPackageJson.dependencies['nanostores'],
  '@nanostores/react': boltPackageJson.dependencies['@nanostores/react'],
};

// Filter out dependencies we already have
const dependenciesToAdd = {};
for (const [name, version] of Object.entries(neededDependencies)) {
  if (!ourPackageJson.dependencies[name]) {
    dependenciesToAdd[name] = version;
  }
}

// Log dependencies to add
console.log('Dependencies to add:');
console.log(JSON.stringify(dependenciesToAdd, null, 2));

// Create a script to install these dependencies
const installScript = `#!/bin/bash
# Script to install bolt.diy dependencies
pnpm add ${Object.entries(dependenciesToAdd).map(([name, version]) => `${name}@${version}`).join(' ')}
`;

fs.writeFileSync(path.join(__dirname, 'install-bolt-dependencies.sh'), installScript);
fs.chmodSync(path.join(__dirname, 'install-bolt-dependencies.sh'), '755');

console.log('Created install script at scripts/install-bolt-dependencies.sh');

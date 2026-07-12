const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = [];
  fs.readdirSync(dir).forEach(f => {
    let full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(walk(full));
    } else if (full.endsWith('.css')) {
      files.push(full);
    }
  });
  return files;
}

walk('src/styles').forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  // PowerShell inserted literally `n
  // And it swapped the order. Let's revert back to standard first then prefixed, OR prefixed then standard.
  // Wait, if autoprefixer is there, we ONLY need standard!
  // Let's just remove all `-webkit-backdrop-filter` lines because autoprefixer will handle it!
  // And fix the broken `n
  
  // First fix literal `n
  c = c.replace(/`n/g, '\n');
  
  // Then let's just strip all -webkit-backdrop-filter entirely.
  // Because we have autoprefixer now, having manual prefixes is redundant and might cause issues.
  c = c.replace(/\s*-webkit-backdrop-filter:.*?;/g, '');
  
  fs.writeFileSync(f, c, 'utf8');
});
console.log('Fixed CSS files');

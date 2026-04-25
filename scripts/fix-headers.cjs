const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove import
  content = content.replace(/import\s+Header\s+from\s+['"][^'"]+Header\.astro['"];?\s*\n?/g, '');
  
  // Remove Header usage
  content = content.replace(/<Header[^>]*\/>\s*\n?/g, '');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed duplicate Header in ${filePath}`);
}

fixFile('src/pages/events/[id]/edit.astro');
fixFile('src/pages/groups/[id]/edit.astro');

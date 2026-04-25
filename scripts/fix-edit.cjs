const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the old session select block
  const pattern = /const \[session\] = await db\s*\n\s*\.select\(\)\s*\n\s*\.from\(sessions\)\s*\n\s*\.where\(eq\(sessions\.id,\s*sessionId\)\)\s*\n\s*\.limit\(1\);\s*\n\s*if \(!session \|\| new Date\(session\.expiresAt\) < new Date\(\)\) \{\s*\n\s*return Astro\.redirect\("\/auth\/login"\);\s*\n\s*\}/g;
  
  if (pattern.test(content)) {
    content = content.replace(pattern, '');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${filePath}`);
  } else {
    console.log(`Pattern not found in ${filePath}`);
  }
}

fixFile('src/pages/events/[id]/edit.astro');
fixFile('src/pages/groups/[id]/edit.astro');

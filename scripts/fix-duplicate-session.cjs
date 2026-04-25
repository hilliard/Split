const fs = require('fs');
const path = require('path');

const pagesDir = path.join(process.cwd(), 'src/pages');

function findAstroFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'auth') {
        findAstroFiles(filePath, fileList);
      }
    } else if (file.endsWith('.astro')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const astroFiles = findAstroFiles(pagesDir);

let fixedCount = 0;

for (const filePath of astroFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Looking for the pattern:
  // // Verify session
  // const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  //
  // if (!session || new Date(session.expiresAt) < new Date()) {
  //   return Astro.redirect('/auth/login');
  // }
  
  const searchPattern1 = /\/\/ Verify session\s*const \[session\] = await db\.select\(\)\.from\(sessions\).*?return Astro\.redirect\(['"]\/auth\/login['"]\);\s*\}/s;
  
  if (searchPattern1.test(content)) {
    content = content.replace(searchPattern1, '');
    
    // Also remove unused imports if they exist
    // Actually, let's just leave imports, TS will warn but not error 500.
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed redundant session check in ${filePath}`);
    fixedCount++;
  } else {
    // try a slightly different pattern
    const searchPattern2 = /const \[session\] = await db\.select\(\)\.from\(sessions\).*?return Astro\.redirect\(['"]\/auth\/login['"]\);\s*\}/s;
    if (searchPattern2.test(content)) {
      // make sure it's after the getSession check
      if (content.includes('const session = await getSession')) {
        content = content.replace(searchPattern2, '');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed redundant session check (pattern 2) in ${filePath}`);
        fixedCount++;
      }
    }
  }
}

console.log(`Total fixed: ${fixedCount}`);

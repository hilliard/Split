const fs = require('fs');
const path = require('path');

const pagesDir = path.join(process.cwd(), 'src/pages');
const utilsSessionPath = path.join(process.cwd(), 'src/utils/session');

function findAstroFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      // skip auth dir
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

let updatedCount = 0;

for (const filePath of astroFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if it already has the check
  if (content.includes('await getSession(sessionId)') || content.includes('import { getSession }')) {
    continue;
  }
  
  // Check if it's an authenticated page by checking if it reads sessionId
  if (!content.includes('Astro.cookies.get(\'sessionId\')') && !content.includes('Astro.cookies.get("sessionId")')) {
    continue;
  }
  
  // Calculate relative path to utils/session
  let relPath = path.relative(path.dirname(filePath), utilsSessionPath).replace(/\\/g, '/');
  if (!relPath.startsWith('.')) {
    relPath = './' + relPath;
  }
  
  const importStatement = `import { getSession } from '${relPath}';\n`;
  
  // Insert import statement after the first line (---)
  content = content.replace(/^---\r?\n/, `---\n${importStatement}`);
  
  // Replace the check
  const searchPattern1 = /const sessionId = Astro\.cookies\.get\(['"]sessionId['"]\)\?\.value;\s*if \(!sessionId\) \{\s*return Astro\.redirect\(['"]\/auth\/login['"]\);\s*\}/s;
  
  const replaceStr = `const sessionId = Astro.cookies.get('sessionId')?.value;
if (!sessionId) {
  return Astro.redirect('/auth/login');
}

const session = await getSession(sessionId);
if (!session) {
  Astro.cookies.delete('sessionId', { path: '/' });
  return Astro.redirect('/auth/login');
}`;

  if (searchPattern1.test(content)) {
    content = content.replace(searchPattern1, replaceStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
    updatedCount++;
  } else {
    console.log(`Could not find standard auth block in ${filePath}`);
  }
}

console.log(`Total updated: ${updatedCount}`);

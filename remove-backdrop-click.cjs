const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.astro')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src/pages');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Regex to match the standard backdrop click listener block
  // e.g.
  //    if (editExpenseModal) {
  //      editExpenseModal.addEventListener('click', (e) => {
  //        if (e.target === editExpenseModal) {
  //          editExpenseModal.classList.add('hidden');
  //          editExpenseForm.reset();
  //        }
  //      });
  //    }
  
  // A generic regex to catch these
  const regex = /[ \t]*\/\/ Close modal on backdrop click[\s\S]*?addEventListener\('click'[\s\S]*?e\.target === \w+Modal[\s\S]*?\}\);\s*\}\s*/g;
  
  if (content.match(regex)) {
    content = content.replace(regex, '');
    changed = true;
  }

  // Handle the ones without "Close modal on backdrop click" comment just in case
  const regex2 = /[ \t]*if \(\w+Modal\) \{\s*\w+Modal\.addEventListener\('click',\s*\(e\)\s*=>\s*\{\s*if\s*\(e\.target === \w+Modal\)\s*\{\s*\w+Modal\.classList\.add\('hidden'\);\s*(?:\w+Form\.reset\(\);\s*)?\}\s*\}\);\s*\}\s*/g;
  if (content.match(regex2)) {
    content = content.replace(regex2, '');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Removed backdrop click listener from ' + file);
  }
});

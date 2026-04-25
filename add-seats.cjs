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

  if (content.includes("['Outbound Arrival', ''],") && !content.includes("['Outbound Seat', '']")) {
    content = content.replace(/\['Outbound Arrival', ''\],/g, "['Outbound Arrival', ''],\n        ['Outbound Seat', ''],");
    changed = true;
  }
  
  if (content.includes("['Return Arrival', ''],") && !content.includes("['Return Seat', '']")) {
    content = content.replace(/\['Return Arrival', ''\],/g, "['Return Arrival', ''],\n        ['Return Seat', ''],");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated seats in ' + file);
  }
});

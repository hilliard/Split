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

  // Add dropdown option
  if (content.includes('value="hotel"') && !content.includes('value="car_rental"')) {
    content = content.replace(/(<option\s+value="hotel".*?<\/option>)/g, '$1\n                    <option value="car_rental">🚗 Car Rental</option>');
    changed = true;
  }

  // Add array template (like in events/[id].astro)
  const arrayTemplate = `
      car_rental: [
        ['Rental Company', ''],
        ['Reservation #', ''],
        ['Vehicle Type', ''],
        ['Pick Up Location', ''],
        ['Pick Up Time', ''],
        ['Drop Off Location', ''],
        ['Drop Off Time', ''],
      ],`;
  if (content.includes('hotel: [') && !content.includes('car_rental: [')) {
    content = content.replace(/hotel:\s*\[([\s\S]*?)\],/g, `hotel: [$1],${arrayTemplate}`);
    changed = true;
  }

  // Add object template (like in expenses/create.astro)
  const objectTemplate = `
        car_rental: {
          "Rental Company": "",
          "Reservation #": "",
          "Vehicle Type": "",
          "Pick Up Location": "",
          "Pick Up Time": "",
          "Drop Off Location": "",
          "Drop Off Time": ""
        },`;
  if (content.includes('hotel: {') && !content.includes('car_rental: {')) {
    content = content.replace(/hotel:\s*\{([\s\S]*?)\},/g, `hotel: {$1},${objectTemplate}`);
    changed = true;
  }

  // Also add roundtrip_flight object template to expenses/create.astro if missing
  const rtfObjectTemplate = `
        roundtrip_flight: {
          "Airline Company": "",
          "Confirmation Number": "",
          "Outbound Flight #": "",
          "Outbound Take Off": "",
          "Outbound Arrival": "",
          "Outbound Seat": "",
          "Return Flight #": "",
          "Return Take Off": "",
          "Return Arrival": "",
          "Return Seat": ""
        },`;
  if (content.includes('flight: {') && !content.includes('roundtrip_flight: {') && !content.includes('roundtrip_flight: [')) {
    content = content.replace(/flight:\s*\{([\s\S]*?)\},/g, `flight: {$1},${rtfObjectTemplate}`);
    changed = true;
  }


  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Added car rental to ' + file);
  }
});

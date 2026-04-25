const fs = require('fs');

const filesToFix = [
  'src/pages/activities/index.astro',
  'src/pages/activities/[id].astro',
  'src/pages/events/[id].astro'
];

const carRentalStr = `
      car_rental: [
        ['Rental Company', ''],
        ['Reservation #', ''],
        ['Vehicle Type', ''],
        ['Pick Up Location', ''],
        ['Pick Up Time', ''],
        ['Drop Off Location', ''],
        ['Drop Off Time', ''],
      ],`;

// The exact string that was incorrectly inserted:
const regexToRemove = /\s*car_rental: \[\s*\['Rental Company', ''\],\s*\['Reservation #', ''\],\s*\['Vehicle Type', ''\],\s*\['Pick Up Location', ''\],\s*\['Pick Up Time', ''\],\s*\['Drop Off Location', ''\],\s*\['Drop Off Time', ''\],\s*\],/g;

filesToFix.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Step 1: Remove all incorrectly placed car_rental array blocks
  content = content.replace(regexToRemove, '');

  // Step 2: Now that hotel: [ ... ] is intact again, insert car_rental after it.
  // We match `hotel: [ ... ],` completely.
  
  // We can match hotel array until the matching `],` at the root of the array.
  // A safe way is to match `hotel: [\s*(\[.*?\]\s*,?\s*)*],`
  
  // Actually, an easier way is to just look for `restaurant: [` which is right after `hotel: [`
  // Or look for `],` followed by `restaurant: [`
  
  content = content.replace(/(\],\s*restaurant: \[)/g, `],${carRentalStr}\n      restaurant: [`);
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed syntax in ' + file);
});

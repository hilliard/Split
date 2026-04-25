const fs = require('fs');

// Patch events/[id]/edit.astro
let file1 = 'src/pages/events/[id]/edit.astro';
let c1 = fs.readFileSync(file1, 'utf8');

c1 = c1.replace(
  '<div id="metadataContainer" class="space-y-3">',
  `<!-- Template Selector -->
            <div class="mb-4 flex gap-2 items-end">
              <div class="flex-1">
                <label for="templateSelect" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Quick Templates
                </label>
                <select id="templateSelect" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm">
                  <option value="">-- Select a template --</option>
                  <option value="wedding">💍 Wedding</option>
                  <option value="dinner">🍽️ Company Team Dinner</option>
                  <option value="conference">🎤 Conference</option>
                </select>
              </div>
              <button type="button" id="applyTemplateBtn" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm whitespace-nowrap">
                Apply Template
              </button>
            </div>
            <div id="metadataContainer" class="space-y-3">`
);

c1 = c1.replace(
  'const addMetadataFieldBtn = document.getElementById(',
  `// Event Template Logic
      const eventTemplates = {
        wedding: {
          "Venue": "",
          "Address": "",
          "Contact": "",
          "Phone": "",
          "Capacity": "",
          "Dress Code": "",
          "Menu Selection Due": ""
        },
        dinner: {
          "Restaurant": "",
          "Address": "",
          "Reservation Name": "",
          "Party Size": "",
          "Budget Per Person": "",
          "Time": "",
          "Dietary Restrictions": ""
        },
        conference: {
          "Venue": "",
          "Address": "",
          "Contact": "",
          "Phone": "",
          "Capacity": "",
          "Parking": "",
          "WiFi Password": ""
        }
      };

      const applyTemplateBtn = document.getElementById("applyTemplateBtn");
      if (applyTemplateBtn) {
        applyTemplateBtn.addEventListener("click", () => {
          const templateSelect = document.getElementById("templateSelect");
          const selectedTemplate = templateSelect.value;
          
          if (selectedTemplate && eventTemplates[selectedTemplate]) {
            const template = eventTemplates[selectedTemplate];
            Object.keys(template).forEach(key => {
              addMetadataField(key, "");
            });
            templateSelect.value = "";
          }
        });
      }

      const addMetadataFieldBtn = document.getElementById(`
);

fs.writeFileSync(file1, c1);
console.log('patched 1');

// Patch events/create.astro
let file2 = 'src/pages/events/create.astro';
let c2 = fs.readFileSync(file2, 'utf8');

c2 = c2.replace(
  '            ></textarea>\n          </div>',
  `            ></textarea>
          </div>

          <!-- Details/Metadata Section -->
          <div>
            <label class="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Event Details (Location, Venue, Contact, etc.)
            </label>
            
            <!-- Template Selector -->
            <div class="mb-4 flex gap-2 items-end">
              <div class="flex-1">
                <label for="templateSelect" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Quick Templates
                </label>
                <select id="templateSelect" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm">
                  <option value="">-- Select a template --</option>
                  <option value="wedding">💍 Wedding</option>
                  <option value="dinner">🍽️ Company Team Dinner</option>
                  <option value="conference">🎤 Conference</option>
                </select>
              </div>
              <button type="button" id="applyTemplateBtn" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm whitespace-nowrap">
                Apply Template
              </button>
            </div>

            <div id="metadataContainer" class="space-y-3">
              <!-- Dynamic metadata fields will be added here -->
            </div>
            <button
              type="button"
              id="addMetadataFieldBtn"
              class="mt-3 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium text-sm"
            >
              + Add Detail
            </button>
          </div>`
);

c2 = c2.replace(
  '        const description = document.getElementById("eventDescription").value;',
  `        const description = document.getElementById("eventDescription").value;
        
        // Collect metadata
        const metadata = {};
        const metadataKeys = formData.getAll("metadataKey");
        const metadataValues = formData.getAll("metadataValue");

        for (let i = 0; i < metadataKeys.length; i++) {
          const key = metadataKeys[i]?.trim();
          const value = metadataValues[i]?.trim();
          if (key && value) {
            metadata[key] = value;
          }
        }`
);

c2 = c2.replace(
  '          description: description || undefined,',
  `          description: description || undefined,
          metadata: Object.keys(metadata).length > 0 ? metadata : {},`
);

c2 = c2.replace(
  '      if (createEventForm) {',
  `      // Metadata Management
      let metadataCount = 0;

      function addMetadataField(key = "", value = "") {
        const container = document.getElementById("metadataContainer");
        if (!container) return;

        const fieldId = \`metadata_field_\${metadataCount++}\`;
        const fieldHTML = \`
          <div id="\${fieldId}" class="flex gap-2 items-center">
            <input
              type="text"
              name="metadataKey"
              placeholder="Key (e.g., Venue)"
              value="\${key}"
              class="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
            />
            <input
              type="text"
              name="metadataValue"
              placeholder="Value (e.g., Grand Ballroom)"
              value="\${value}"
              class="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
            />
            <button
              type="button"
              onclick="document.getElementById('\${fieldId}').remove()"
              class="px-3 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-sm font-medium"
            >
              ✕
            </button>
          </div>
        \`;
        container.insertAdjacentHTML("beforeend", fieldHTML);
      }

      // Event Template Logic
      const eventTemplates = {
        wedding: {
          "Venue": "",
          "Address": "",
          "Contact": "",
          "Phone": "",
          "Capacity": "",
          "Dress Code": "",
          "Menu Selection Due": ""
        },
        dinner: {
          "Restaurant": "",
          "Address": "",
          "Reservation Name": "",
          "Party Size": "",
          "Budget Per Person": "",
          "Time": "",
          "Dietary Restrictions": ""
        },
        conference: {
          "Venue": "",
          "Address": "",
          "Contact": "",
          "Phone": "",
          "Capacity": "",
          "Parking": "",
          "WiFi Password": ""
        }
      };

      const applyTemplateBtn = document.getElementById("applyTemplateBtn");
      if (applyTemplateBtn) {
        applyTemplateBtn.addEventListener("click", () => {
          const templateSelect = document.getElementById("templateSelect");
          const selectedTemplate = templateSelect.value;
          
          if (selectedTemplate && eventTemplates[selectedTemplate]) {
            const template = eventTemplates[selectedTemplate];
            Object.keys(template).forEach(key => {
              addMetadataField(key, "");
            });
            templateSelect.value = "";
          }
        });
      }

      const addMetadataFieldBtn = document.getElementById("addMetadataFieldBtn");
      if (addMetadataFieldBtn) {
        addMetadataFieldBtn.addEventListener("click", (e) => {
          e.preventDefault();
          addMetadataField();
        });
      }

      if (createEventForm) {`
);

fs.writeFileSync(file2, c2);
console.log('patched 2');

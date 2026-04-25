const fs = require('fs');

const file = 'src/components/Header.astro';
let content = fs.readFileSync(file, 'utf8');

const desktopActivitiesLink = `<a
            href="/standalone-activities"
            class={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${
              currentPage === 'activities'
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
            }\`}
          >
            Activities
          </a>`;

const desktopEventsLink = `<a
            href="/events/create"
            class={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${
              currentPage === 'events'
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
            }\`}
          >
            Events
          </a>`;

const desktopGroupsLink = `<a
            href="/groups/create"
            class={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${
              currentPage === 'groups'
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
            }\`}
          >
            Groups
          </a>`;

const desktopExpensesLink = `<a
            href="/expenses/create"
            class={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors \${
              currentPage === 'expenses'
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
            }\`}
          >
            Add Expense
          </a>`;

const oldDesktop = [desktopActivitiesLink, desktopEventsLink, desktopGroupsLink, desktopExpensesLink].join('\n          ');
const newDesktop = [desktopEventsLink, desktopActivitiesLink, desktopExpensesLink, desktopGroupsLink].join('\n          ');

if (content.includes(oldDesktop)) {
  content = content.replace(oldDesktop, newDesktop);
  console.log('Desktop replaced successfully');
} else {
  console.log('Desktop string not found! Trying manual index search.');
  // More robust replace if exact newlines don't match
  content = content.replace(desktopActivitiesLink, '%%ACTIVITIES%%')
                   .replace(desktopEventsLink, '%%EVENTS%%')
                   .replace(desktopGroupsLink, '%%GROUPS%%')
                   .replace(desktopExpensesLink, '%%EXPENSES%%');
  
  // They are in some order, let's just find the block and rewrite it.
  const regex = /%%[A-Z]+%%(\s+)%%[A-Z]+%%(\s+)%%[A-Z]+%%(\s+)%%[A-Z]+%%/;
  content = content.replace(regex, `%%EVENTS%%$1%%ACTIVITIES%%$2%%EXPENSES%%$3%%GROUPS%%`);
  
  content = content.replace('%%ACTIVITIES%%', desktopActivitiesLink)
                   .replace('%%EVENTS%%', desktopEventsLink)
                   .replace('%%GROUPS%%', desktopGroupsLink)
                   .replace('%%EXPENSES%%', desktopExpensesLink);
}

const mobileActivitiesLink = `<a
          href="/standalone-activities"
          class="block px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Activities
        </a>`;

const mobileEventsLink = `<a
          href="/events/create"
          class="block px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Events
        </a>`;

const mobileGroupsLink = `<a
          href="/groups/create"
          class="block px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Groups
        </a>`;

const mobileExpensesLink = `<a
          href="/expenses/create"
          class="block px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Add Expense
        </a>`;

const oldMobile = [mobileActivitiesLink, mobileEventsLink, mobileGroupsLink, mobileExpensesLink].join('\n        ');
const newMobile = [mobileEventsLink, mobileActivitiesLink, mobileExpensesLink, mobileGroupsLink].join('\n        ');

if (content.includes(oldMobile)) {
  content = content.replace(oldMobile, newMobile);
  console.log('Mobile replaced successfully');
} else {
  console.log('Mobile string not found! Using robust replace.');
  content = content.replace(mobileActivitiesLink, '##ACTIVITIES##')
                   .replace(mobileEventsLink, '##EVENTS##')
                   .replace(mobileGroupsLink, '##GROUPS##')
                   .replace(mobileExpensesLink, '##EXPENSES##');
  
  const regex2 = /##[A-Z]+##(\s+)##[A-Z]+##(\s+)##[A-Z]+##(\s+)##[A-Z]+##/;
  content = content.replace(regex2, `##EVENTS##$1##ACTIVITIES##$2##EXPENSES##$3##GROUPS##`);
  
  content = content.replace('##ACTIVITIES##', mobileActivitiesLink)
                   .replace('##EVENTS##', mobileEventsLink)
                   .replace('##GROUPS##', mobileGroupsLink)
                   .replace('##EXPENSES##', mobileExpensesLink);
}

fs.writeFileSync(file, content);
console.log('Done');

// Debug script to check API response
const sessionCookie = process.env.SESSION_ID || '';

try {
  const response = await fetch('http://localhost:3000/api/events/list', {
    headers: {
      Cookie: `sessionId=${sessionCookie}`,
    },
  });

  const data = await response.json();
  console.log('API Response Events:');
  data.events.slice(0, 2).forEach((event) => {
    console.log(`\nEvent: ${event.title}`);
    console.log(`  currentExpensesCents: ${event.currentExpensesCents}`);
    console.log(`  currentExpenses: ${event.currentExpenses}`);
    console.log(`  budget: ${event.budget}`);
    console.log(`  budgetCents: ${event.budgetCents}`);
  });
} catch (error) {
  console.error('Error:', error.message);
}

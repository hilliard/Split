import { calculateGroupBalances } from './src/utils/balance-calculator';

async function test() {
  const balances = await calculateGroupBalances('61fc59d2-bd7b-4af4-a1e0-b75fec237b0d');
  console.log(balances);
  process.exit(0);
}

test().catch(console.error);

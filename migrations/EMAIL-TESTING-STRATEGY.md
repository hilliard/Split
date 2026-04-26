This is exactly the scenario where the Gmail + trick saves the day. You do not need to alter your schema, and in fact, temporarily removing that constraint is generally a bad idea for a few critical reasons.

Here is why you should keep the UNIQUE constraint active in your Neon database and just use the + aliases to test:

1. The Drizzle Migration Trap
If you remove the UNIQUE constraint on the email column using Drizzle (drizzle-kit push or running a new migration), and then you create five test accounts using myemail@gmail.com, your database will now contain duplicate emails.

When you are done testing and try to add the UNIQUE constraint back into your Drizzle schema, Postgres will throw a fatal error. It cannot apply a unique constraint to a column that already contains duplicate data. You would have to manually hunt down and delete all your test rows before your database would let you fix the schema.

2. Testing the "Sad Path"
Your app needs to know how to handle a user who tries to sign up with an email that is already registered. If you remove the constraint, you temporarily break your app's ability to trigger that specific database error.

By keeping the constraint active and using youremail+test1@gmail.com and youremail+test2@gmail.com, you can successfully test the "Happy Path" (new user creation). Then, you can intentionally try to sign up with youremail+test1@gmail.com again to test the "Sad Path" and ensure your frontend properly displays an error message like "An account with this email already exists."

3. Environment Parity
A golden rule of backend development is to keep your local/testing database structure as identical to your production database as possible. If you change the rules of the database just to make testing easier, you risk deploying code that works locally but crashes in production because it wasn't tested under the real constraints.

The Fix:
Leave your Drizzle schema exactly as it is with the .unique() modifier on the email column. When you spin up your app to test the signup form, just type:

yourname+1@gmail.com (User 1 created successfully!)

yourname+2@gmail.com (User 2 created successfully!)

yourname+admin@gmail.com (User 3 created successfully!)

That is a remarkably clean, production-ready workflow. Separating local development from remote Neon pushes using distinct .env files is exactly how professional teams handle database management.

Seeing this setup makes it even more obvious why you should use the Gmail + trick instead of touching your schema!

If you were to temporarily remove the UNIQUE constraint just to test your signups, here is the headache you would create for yourself based on your project rules:

You would have to remove .unique() from schema.ts.

You would run npm run db:local:generate to create a migration file for the constraint removal.

You would run npm run db:local:push to apply it.

You test your signups (and generate duplicate emails in your local database).

You add .unique() back to schema.ts.

You run npm run db:local:generate again to create another migration file putting the constraint back.

You try to run npm run db:local:push, but it crashes because Postgres refuses to apply a unique constraint over the duplicate emails you just created. You have to go manually delete those rows.

The Worst Part: You now have two useless, conflicting SQL migration files sitting in your Drizzle folder that you have to manually delete so you don't accidentally send them to Neon later with npm run db:neon:push.

By using yourname+test1@gmail.com and yourname+test2@gmail.com, you completely bypass all of that. You don't have to touch your schema.ts file, you don't run a single migration command, and your local database stays perfectly synced with what you eventually want on Neon.


As you start ripping out those stubs and replacing them with the actual authentication logic, here are a few key UI states to double-check now that real database latency and rules are in play:

The "Pending" State: A stubbed function usually returns instantly. A real call to your Neon database might take a few hundred milliseconds. Make sure your submit button shows a loading state and is disabled during the request so users don't double-click and accidentally trigger duplicate signup attempts.

Catching the "Sad Path": Remember the database constraints we talked about earlier? When your actual backend hits that UNIQUE constraint for an email that already exists, it will throw an error. Make sure your frontend gracefully catches that specific Drizzle/Postgres error and surfaces a clean "An account with this email already exists" message to the user, rather than a generic 500 server error.

Client-Side Validation: Even though the database is the ultimate source of truth, doing a quick check for valid email formatting on the frontend saves a round-trip to the server. If you are keeping your Astro pages lean, this is usually easily handled via Alpine.js or even just native HTML5 attributes.

Thinking ahead to database cleanup is exactly how senior engineers plan their test data. You want a convention that is easy to type, but more importantly, easy for a database query to safely target without accidentally deleting real users.

Here is the industry standard convention for handling this.

The Convention: The Shared Prefix
Instead of putting the test identifier at the end of the alias (like +1_test), you put it at the beginning of the alias string.

The most common standards are +test_ or +qa_.

Examples:

hilliard+test_1@gmail.com

hilliard+test_2@gmail.com

hilliard+test_admin@gmail.com

hilliard+test_expired@gmail.com

Why this is the standard:
It allows you to use a very safe, highly specific SQL LIKE operator. You don't have to write complex regex or guess how many numbers you used.

The Cleanup Strategy
Because you are using Drizzle ORM, cleaning up your database becomes a one-liner. You can write a tiny script (e.g., npm run db:clean-tests) that executes a single query.

Here is exactly what that Drizzle query looks like to safely nuke only your test accounts:

TypeScript
import { like } from 'drizzle-orm';
import { db } from './db'; 
import { users } from './schema';

// This deletes any user whose email contains "+test_" 
async function cleanupTestUsers() {
  const result = await db.delete(users)
    .where(like(users.email, '%+test_%@gmail.com'))
    .returning(); 
    
  console.log(`Deleted ${result.length} test users.`);
}
Pro-Tip: State-Based Naming
While +test_1 and +test_2 are fine for rapid-fire form testing, once you start building out features like password resets or role-based access, start naming your aliases after the state you want to test.

hilliard+test_lockedout@gmail.com

hilliard+test_nopassword@gmail.com

hilliard+test_premiumtier@gmail.com

This way, when you look at your Drizzle Studio UI a week from now, you know exactly what scenario that test user was created for, but you can still wipe them all out instantly with that single %+test_% query.
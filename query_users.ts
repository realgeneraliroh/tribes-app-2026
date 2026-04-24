import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });
import { db } from './src/db/index';
import { users, subscriptions, plans } from './src/db/schema';
import { eq, like } from 'drizzle-orm';

async function main() {
  console.log("Querying users...");
  const allUsers = await db.select().from(users).where(like(users.name, '%dustin%'));
  console.log("Users:", allUsers);

  if (allUsers.length > 0) {
    const user = allUsers[0];
    const subs = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id));
    console.log("Subscriptions for user:", subs);
    
    // Check if they have a founding subscription
    if (subs.length === 0) {
        console.log("No subscription. Giving founding subscription...");
        await db.insert(subscriptions).values({
            id: `sub-${user.id}-${Date.now()}`,
            userId: user.id,
            planId: 'individual_coop',
            status: 'active',
            source: 'founding',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        
        await db.update(users).set({ role: 'Human_Paid' }).where(eq(users.id, user.id));
        console.log("Done adding founding subscription.");
    }
  }
}

main().catch(console.error);

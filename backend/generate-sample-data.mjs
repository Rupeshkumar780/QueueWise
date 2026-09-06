import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
});

async function run() {
  await client.connect();
  console.log('Connected to Database. Generating sample data...');

  try {
    // 1. Get or Create Business
    let businessId;
    const bizRes = await client.query(`SELECT id FROM "Business" WHERE name = 'TechFix Solutions' LIMIT 1`);
    if (bizRes.rows.length > 0) {
      businessId = bizRes.rows[0].id;
    } else {
      const ownerRes = await client.query(`
        INSERT INTO "User" (id, name, email, "passwordHash", role, "updatedAt")
        VALUES (gen_random_uuid(), 'Admin', 'admin@techfix.com', 'dummy', 'BUSINESS_ADMIN', NOW())
        RETURNING id;
      `);
      const bizInsert = await client.query(`
        INSERT INTO "Business" (id, name, "ownerId", "updatedAt")
        VALUES (gen_random_uuid(), 'TechFix Solutions', $1, NOW())
        RETURNING id;
      `, [ownerRes.rows[0].id]);
      businessId = bizInsert.rows[0].id;
    }

    // 2. Get or Create Branch
    let branchId;
    const branchRes = await client.query(`SELECT id FROM "Branch" WHERE "businessId" = $1 AND name = 'Connaught Place Branch' LIMIT 1`, [businessId]);
    if (branchRes.rows.length > 0) {
      branchId = branchRes.rows[0].id;
    } else {
      const bInsert = await client.query(`
        INSERT INTO "Branch" (id, "businessId", name, address, latitude, longitude, "geofenceRadius", "googleMapsUrl", "isOpen", "updatedAt")
        VALUES (gen_random_uuid(), $1, 'Connaught Place Branch', 'Connaught Place, New Delhi', 28.6315, 77.2167, 500, 'https://maps.google.com/?q=28.6315,77.2167', true, NOW())
        RETURNING id;
      `, [businessId]);
      branchId = bInsert.rows[0].id;
    }

    // Ensure branch is OPEN
    await client.query(`UPDATE "Branch" SET "isOpen" = true WHERE id = $1`, [branchId]);

    // 3. Get or Create Services & Queues
    let laptopServiceId;
    let laptopQueueId;
    const svcRes = await client.query(`SELECT id FROM "Service" WHERE "branchId" = $1 AND name = 'Laptop Repair' LIMIT 1`, [branchId]);
    if (svcRes.rows.length > 0) {
      laptopServiceId = svcRes.rows[0].id;
      const qRes = await client.query(`SELECT id FROM "Queue" WHERE "serviceId" = $1 LIMIT 1`, [laptopServiceId]);
      laptopQueueId = qRes.rows[0].id;
    } else {
      const sInsert = await client.query(`
        INSERT INTO "Service" (id, "branchId", name, "estimatedDuration")
        VALUES (gen_random_uuid(), $1, 'Laptop Repair', 20)
        RETURNING id;
      `, [branchId]);
      laptopServiceId = sInsert.rows[0].id;
      
      const qInsert = await client.query(`
        INSERT INTO "Queue" (id, "branchId", "serviceId", name, status)
        VALUES (gen_random_uuid(), $1, $2, 'Laptop Repair', 'OPEN')
        RETURNING id;
      `, [branchId, laptopServiceId]);
      laptopQueueId = qInsert.rows[0].id;
    }

    // 4. Get or Create Counters
    let counterId;
    const counterRes = await client.query(`SELECT id FROM "Counter" WHERE "branchId" = $1 LIMIT 1`, [branchId]);
    if (counterRes.rows.length === 0) {
      const cInsert = await client.query(`
        INSERT INTO "Counter" (id, "branchId", name, status)
        VALUES (gen_random_uuid(), $1, 'Counter 1', 'AVAILABLE')
        RETURNING id;
      `, [branchId]);
      counterId = cInsert.rows[0].id;
    } else {
      counterId = counterRes.rows[0].id;
    }

    // 5. Generate Sample Queue Entries (Customers)
    // Clear existing for a clean state
    await client.query(`DELETE FROM "QueueEntry" WHERE "queueId" = $1`, [laptopQueueId]);
    await client.query(`UPDATE "Queue" SET "currentToken" = 0 WHERE id = $1`, [laptopQueueId]);

    console.log('Generating dummy customers...');
    
    // Insert a few users first
    const users = [];
    for(let i=1; i<=5; i++) {
      const email = 'cust' + Date.now() + '_' + i + '@test.com';
      const u = await client.query(`
        INSERT INTO "User" (id, name, email, "passwordHash", role, "updatedAt")
        VALUES (gen_random_uuid(), 'Customer ${i}', $1, 'dummy', 'CUSTOMER', NOW())
        RETURNING id, name;
      `, [email]);
      users.push(u.rows[0]);
    }

    // Add 1 currently SERVING
    await client.query(`
      INSERT INTO "QueueEntry" (id, "queueId", "userId", "tokenNumber", status, "assignedCounterId", "formData", "joinedAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, 1, 'SERVING', $3, '{"Issue": "Screen flickering", "Model": "MacBook Pro"}', NOW() - interval '15 minutes', NOW())
    `, [laptopQueueId, users[0].id, counterId]);

    // Update Counter to BUSY
    await client.query(`UPDATE "Counter" SET status = 'BUSY' WHERE id = $1`, [counterId]);

    // Add 1 CALLED (walking to counter)
    await client.query(`
      INSERT INTO "QueueEntry" (id, "queueId", "userId", "tokenNumber", status, "formData", "joinedAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, 2, 'CALLED', '{"Issue": "Keyboard broken"}', NOW() - interval '10 minutes', NOW())
    `, [laptopQueueId, users[1].id]);

    // Add 3 WAITING
    for(let i=2; i<5; i++) {
      await client.query(`
        INSERT INTO "QueueEntry" (id, "queueId", "userId", "tokenNumber", status, "joinedAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, ${i+1}, 'WAITING', NOW() - interval '${5-i} minutes', NOW())
      `, [laptopQueueId, users[i].id]);
    }

    // Update queue currentToken to 5
    await client.query(`UPDATE "Queue" SET "currentToken" = 5 WHERE id = $1`, [laptopQueueId]);

    console.log('==================================================');
    console.log('✅ Sample Data Successfully Generated!');
    console.log('==================================================');
    console.log('Here are your test URLs:');
    console.log('');
    console.log(`👨‍💼 BUSINESS DASHBOARD: http://localhost:3000/dashboard/${branchId}`);
    console.log(`📱 CUSTOMER LANDING PAGE: http://localhost:3000/branch/${branchId}`);
    console.log('==================================================');

  } catch (err) {
    console.error('Error generating data:', err);
  } finally {
    await client.end();
  }
}

run();

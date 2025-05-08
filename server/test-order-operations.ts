import { db } from './db';
import { storage } from './storage';
import { orders } from '@shared/schema';
import { sql } from 'drizzle-orm';

// Test the order operations with column naming mismatches
async function testOrderOperations() {
  try {
    console.log('=== Testing Order Operations - Column Name Mismatch Handling ===');
    
    // Example of schema vs actual DB naming differences:
    // JavaScript schema uses camelCase:
    // - orderType (in schema) vs order_type (in DB)
    // - taxParcelId (in schema) vs tax_parcel_id (in DB)
    // - status (in schema) vs status (in DB) - sometimes matches!
    
    console.log('\n--- Database Schema Check ---');
    try {
      // Run a direct query to see the actual column names in the database
      const tableInfo = await db.execute(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'orders'
        ORDER BY ordinal_position
      `);
      console.log('Actual database columns (snake_case):', tableInfo);
    } catch (error) {
      console.error('Failed to get table schema:', error);
    }
    
    // Create test orders
    console.log('\n--- Creating Test Orders ---');
    
    const order1 = await storage.createOrder({
      userId: 1,
      propertyId: 101,
      orderType: 'appraisal', // In JS: orderType, In DB: order_type
      status: 'pending',
      priority: 'normal',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      notes: 'Test order with column name mismatch handling',
      assignedTo: null,
      totalFee: 350.00 // In JS: totalFee, In DB: total_fee
    });
    
    console.log('Created order with camelCase fields:', order1);
    console.log('Note how the response from DB uses snake_case naming from the database, but TypeScript interface uses camelCase');
    
    // Demonstrate querying by order type (Snake Case vs Camel Case handling)
    console.log('\n--- Querying By Order Type (Snake vs Camel Case) ---');
    const ordersByType = await storage.getOrdersByType('appraisal');
    console.log(`Found ${ordersByType.length} orders with type 'appraisal'`, 
                `demonstrating orderType (JS) -> order_type (DB) mapping`);
    
    // Demonstrate querying by status
    console.log('\n--- Querying By Status ---');
    const ordersByStatus = await storage.getOrdersByStatus('pending');
    console.log(`Found ${ordersByStatus.length} orders with status 'pending'`);
    
    // Update order with camelCase fields
    console.log('\n--- Updating Order with CamelCase Fields ---');
    const updatedOrder = await storage.updateOrder(order1.id, {
      notes: 'Updated via camelCase field names',
      priority: 'high', // In JS: priority, in DB: priority (matches)
      totalFee: 375.50  // In JS: totalFee, in DB: total_fee
    });
    console.log('Updated order using camelCase fields:', updatedOrder);
    
    // Demonstrate using raw SQL vs ORM query
    console.log('\n--- ORM Query vs Raw SQL ---');
    
    console.log('1. Trying with ORM (potential mismatch issues):');
    try {
      // This could fail due to column name mismatch
      const ormResult = await db.select().from(orders)
        .where(sql`${orders.orderType} = ${'appraisal'}`);
      console.log('ORM query result:', ormResult);
    } catch (error) {
      console.error('ORM query failed (expected if column names mismatch):', error);
    }
    
    console.log('\n2. Using Raw SQL (correct column names):');
    try {
      // This should work because we explicitly use the DB column names
      const rawSqlResult = await db.execute(`
        SELECT * FROM "orders" 
        WHERE "order_type" = $1
      `, ['appraisal']);
      console.log('Raw SQL query result:', rawSqlResult);
    } catch (error) {
      console.error('Raw SQL query failed:', error);
    }
    
    // Delete test order to clean up
    console.log('\n--- Cleaning Up Test Order ---');
    const deleteResult = await storage.deleteOrder(order1.id);
    console.log(`Order deletion ${deleteResult ? 'successful' : 'failed'}`);
    
    console.log('\n=== Column Name Mismatch Test Completed ===');
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
console.log('Starting comprehensive test of order operations with column name mismatch handling...');
testOrderOperations().then(() => {
  console.log('Test script completed successfully.');
}).catch((error) => {
  console.error('Test script failed:', error);
});
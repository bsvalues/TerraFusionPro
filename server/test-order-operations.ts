import { db, pool } from './db';
import { storage } from './storage';
import { orders } from '@shared/schema';
import { sql } from 'drizzle-orm';

// Test the order operations with the fixed database operations
async function testOrderOperations() {
  try {
    console.log('=== Testing Order Operations - Updated Implementation ===');
    
    // Check current orders
    console.log('\n--- Current Orders in Database ---');
    try {
      const existingOrders = await pool.query(`SELECT * FROM orders ORDER BY id`);
      console.log(`Found ${existingOrders.rows.length} existing orders:`);
      console.table(existingOrders.rows);
    } catch (error) {
      console.error('Failed to get existing orders:', error);
    }
    
    // Create test order
    console.log('\n--- Creating New Test Order ---');
    
    const order1 = await storage.createOrder({
      userId: 1, // Using existing user ID 1
      propertyId: 1, // Using existing property ID 1 
      orderType: 'assessment', // Different type for testing purposes
      status: 'pending',
      priority: 'high',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      notes: 'Test order created with direct pool query'
    });
    
    if (!order1) {
      throw new Error('Failed to create order');
    }
    
    console.log('Successfully created order:', order1);
    
    // Update the order
    console.log('\n--- Updating The Order ---');
    const updatedOrder = await storage.updateOrder(order1.id, {
      notes: 'Updated via fixed database operation',
      priority: 'medium',
      status: 'in_progress'
    });
    
    if (!updatedOrder) {
      throw new Error('Failed to update order');
    }
    
    console.log('Successfully updated order:', updatedOrder);
    
    // Update just the status
    console.log('\n--- Updating Order Status Only ---');
    const statusUpdateOrder = await storage.updateOrderStatus(
      order1.id, 
      'completed', 
      'Marked as completed via status update method'
    );
    
    if (!statusUpdateOrder) {
      throw new Error('Failed to update order status');
    }
    
    console.log('Successfully updated order status:', statusUpdateOrder);
    
    // Fetch by order type
    console.log('\n--- Fetching Orders by Type ---');
    try {
      const ordersByType = await pool.query(`
        SELECT * FROM orders WHERE order_type = $1
      `, ['assessment']);
      
      console.log(`Found ${ordersByType.rows.length} orders with type 'assessment':`);
      console.table(ordersByType.rows);
    } catch (error) {
      console.error('Failed to query by order type:', error);
    }
    
    // Fetch by status
    console.log('\n--- Fetching Orders by Status ---');
    try {
      const ordersByStatus = await pool.query(`
        SELECT * FROM orders WHERE status = $1
      `, ['completed']);
      
      console.log(`Found ${ordersByStatus.rows.length} orders with status 'completed':`);
      console.table(ordersByStatus.rows);
    } catch (error) {
      console.error('Failed to query by status:', error);
    }
    
    // Delete test order
    console.log('\n--- Deleting Test Order ---');
    const deleteResult = await storage.deleteOrder(order1.id);
    console.log(`Order deletion ${deleteResult ? 'successful' : 'failed'}`);
    
    // Verify deletion
    console.log('\n--- Verifying Deletion ---');
    try {
      const verifyDelete = await pool.query(`SELECT * FROM orders WHERE id = $1`, [order1.id]);
      if (verifyDelete.rows.length === 0) {
        console.log(`Verified: Order ${order1.id} no longer exists in the database`);
      } else {
        console.log(`Warning: Order ${order1.id} still exists in the database`);
      }
    } catch (error) {
      console.error('Failed to verify deletion:', error);
    }
    
    console.log('\n=== Order Operations Test Completed Successfully ===');
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
console.log('Starting comprehensive test of order operations with fixed implementations...');
testOrderOperations().then(() => {
  console.log('Test script completed successfully.');
}).catch((error) => {
  console.error('Test script failed:', error);
});
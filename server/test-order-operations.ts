import { storage } from './storage';

// Test the order operations
async function testOrderOperations() {
  try {
    console.log('=== Testing Order Operations ===');
    
    // Create test orders
    console.log('Creating test orders...');
    
    const order1 = await storage.createOrder({
      userId: 1,
      propertyId: 101,
      orderType: 'appraisal',
      status: 'pending',
      priority: 'normal',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      notes: 'Test order 1',
      assignedTo: null,
      totalFee: 350.00
    });
    
    console.log('Order 1 created:', order1);
    
    const order2 = await storage.createOrder({
      userId: 1,
      propertyId: 102,
      orderType: 'tax_assessment',
      status: 'in_progress',
      priority: 'high',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      notes: 'Test order 2',
      assignedTo: 2,
      totalFee: 250.00
    });
    
    console.log('Order 2 created:', order2);
    
    // Get all orders
    console.log('\nGetting all orders...');
    const allOrders = await storage.getOrders();
    console.log(`Found ${allOrders.length} orders:`, allOrders);
    
    // Get order by id
    console.log('\nGetting order by id...');
    const orderById = await storage.getOrder(order1.id);
    console.log('Order by id:', orderById);
    
    // Get orders by user
    console.log('\nGetting orders by user...');
    const ordersByUser = await storage.getOrdersByUser(1);
    console.log(`Found ${ordersByUser.length} orders for user 1:`, ordersByUser);
    
    // Get orders by property
    console.log('\nGetting orders by property...');
    const ordersByProperty = await storage.getOrdersByProperty(101);
    console.log(`Found ${ordersByProperty.length} orders for property 101:`, ordersByProperty);
    
    // Get orders by status
    console.log('\nGetting orders by status...');
    const ordersByStatus = await storage.getOrdersByStatus('pending');
    console.log(`Found ${ordersByStatus.length} orders with 'pending' status:`, ordersByStatus);
    
    // Get orders by type
    console.log('\nGetting orders by type...');
    const ordersByType = await storage.getOrdersByType('tax_assessment');
    console.log(`Found ${ordersByType.length} orders of type 'tax_assessment':`, ordersByType);
    
    // Update order
    console.log('\nUpdating order...');
    const updatedOrder = await storage.updateOrder(order1.id, {
      notes: 'Updated test order 1',
      priority: 'high'
    });
    console.log('Updated order:', updatedOrder);
    
    // Update order status
    console.log('\nUpdating order status...');
    const statusUpdatedOrder = await storage.updateOrderStatus(
      order1.id, 
      'in_progress', 
      'Started working on this order'
    );
    console.log('Order with updated status:', statusUpdatedOrder);
    
    // Delete order (optional - commented out to keep test data)
    /*
    console.log('\nDeleting order...');
    const deleteResult = await storage.deleteOrder(order2.id);
    console.log(`Order deletion ${deleteResult ? 'successful' : 'failed'}`);
    
    // Verify deletion
    const remainingOrders = await storage.getOrders();
    console.log(`Remaining orders: ${remainingOrders.length}`);
    */
    
    console.log('\n=== Order Operations Test Completed ===');
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testOrderOperations().then(() => {
  console.log('Test script completed.');
}).catch((error) => {
  console.error('Test script failed:', error);
});
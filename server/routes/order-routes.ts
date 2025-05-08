import express from 'express';
import { eq, or, and, isNull } from 'drizzle-orm';
import { db } from '../db';
import { properties, orders, users } from '@shared/schema';
import { z } from 'zod';

const router = express.Router();

/**
 * Flexible property identifier lookup utility function
 * Supports finding properties by parcel_id, tax_parcel_id, or propertyIdentifier
 */
async function findPropertyByAnyIdentifier(identifier: string) {
  // Try multiple identifier fields to handle database schema variations
  const property = await db.query.properties.findFirst({
    where: or(
      eq(properties.parcelId, identifier),
      eq(properties.taxParcelId, identifier),
      eq(properties.propertyIdentifier, identifier)
    ),
  });

  return property;
}

// Get all orders
router.get('/', async (req, res) => {
  try {
    const allOrders = await db.query.orders.findMany({
      with: {
        property: true,
        user: true,
      }
    });
    
    return res.json(allOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        property: true,
        user: true,
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create new order with flexible property identifier lookup
router.post('/', async (req, res) => {
  // Order creation schema with flexible property identifier fields
  const createOrderSchema = z.object({
    userId: z.number(),
    propertyId: z.number().optional(),
    // Support various property identifier formats
    propertyIdentifier: z.string().optional(),
    parcelId: z.string().optional(),
    taxParcelId: z.string().optional(),
    orderType: z.enum(['appraisal', 'assessment', 'tax', 'other']),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    dueDate: z.string().optional(),
    notes: z.string().optional(),
  });

  try {
    const validatedData = createOrderSchema.parse(req.body);
    
    // Property lookup logic - try to find by any provided identifier
    let propertyId = validatedData.propertyId;
    
    // If no direct propertyId provided, try looking up by identifiers
    if (!propertyId) {
      const identifier = validatedData.propertyIdentifier || 
                         validatedData.parcelId || 
                         validatedData.taxParcelId;
      
      if (identifier) {
        const property = await findPropertyByAnyIdentifier(identifier);
        if (property) {
          propertyId = property.id;
        } else {
          return res.status(404).json({ 
            error: 'Property not found with the provided identifier(s)',
            attemptedIdentifiers: {
              propertyIdentifier: validatedData.propertyIdentifier,
              parcelId: validatedData.parcelId,
              taxParcelId: validatedData.taxParcelId
            }
          });
        }
      } else {
        return res.status(400).json({ error: 'No property identifier provided' });
      }
    }

    // Verify the user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, validatedData.userId)
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create the order with the resolved property ID
    const [order] = await db.insert(orders).values({
      userId: validatedData.userId,
      propertyId: propertyId,
      orderType: validatedData.orderType,
      status: validatedData.status,
      priority: validatedData.priority,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      notes: validatedData.notes || null,
    }).returning();

    // Return the created order with related property
    const orderWithRelations = await db.query.orders.findFirst({
      where: eq(orders.id, order.id),
      with: {
        property: true,
        user: true,
      }
    });

    return res.status(201).json(orderWithRelations);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating order:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status with diagnostics
router.patch('/:id/status', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const statusSchema = z.object({
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
      notes: z.string().optional(),
    });

    const validatedData = statusSchema.parse(req.body);

    // First check if the order exists
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, orderId)
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update the order status
    const [updatedOrder] = await db.update(orders)
      .set({
        status: validatedData.status,
        notes: validatedData.notes !== undefined ? validatedData.notes : existingOrder.notes,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Get the complete updated order with relations
    const orderWithRelations = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        property: true,
        user: true,
      }
    });

    return res.json(orderWithRelations);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating order status:', error);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Test route for querying properties with flexible identifiers
router.get('/property-lookup/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Attempt to find property using our flexible lookup function
    const property = await findPropertyByAnyIdentifier(identifier);
    
    if (!property) {
      // If property not found, return detailed diagnostics
      // This helps debugging schema issues
      const diagnostics = {
        error: 'Property not found',
        identifier,
        attemptedFields: ['parcelId', 'taxParcelId', 'propertyIdentifier'],
        dbSchema: {
          propertiesTableColumns: Object.keys(properties),
        }
      };
      
      return res.status(404).json(diagnostics);
    }
    
    return res.json(property);
  } catch (error) {
    console.error('Error in property lookup:', error);
    return res.status(500).json({ 
      error: 'Failed to lookup property',
      message: error.message,
      details: error.stack 
    });
  }
});

export const orderRoutes = router;
import { Router, Request, Response } from 'express';
import { getStorage } from '../storage';

const router = Router();

// GET /api/analytics/trends - Monthly trends data
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    
    // Mock trends data based on current properties in storage
    const properties = await storage.getAllProperties();
    
    if (properties.length === 0) {
      return res.json([]);
    }

    // Group properties by month for trend analysis
    const monthlyData = new Map();
    
    properties.forEach(property => {
      if (property.createdAt) {
        const monthKey = property.createdAt.toISOString().substring(0, 7); // YYYY-MM
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            prices: [],
            glas: [],
            count: 0
          });
        }
        
        const monthData = monthlyData.get(monthKey);
        monthData.count++;
        
        // Extract price and GLA from metadata if available
        if (property.metadata && typeof property.metadata === 'object') {
          const metadata = property.metadata as any;
          if (metadata.sale_price_usd) {
            monthData.prices.push(metadata.sale_price_usd);
          }
          if (metadata.gla_sqft) {
            monthData.glas.push(metadata.gla_sqft);
          }
        }
      }
    });

    const trends = Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      medianPrice: data.prices.length > 0 
        ? data.prices.sort((a: number, b: number) => a - b)[Math.floor(data.prices.length / 2)]
        : 0,
      avgGLA: data.glas.length > 0
        ? Math.round(data.glas.reduce((sum: number, gla: number) => sum + gla, 0) / data.glas.length)
        : 0,
      salesCount: data.count
    })).sort((a, b) => a.month.localeCompare(b.month));

    res.json(trends);
  } catch (error) {
    console.error('Analytics trends error:', error);
    res.status(500).json({ error: 'Failed to fetch trends data' });
  }
});

// GET /api/analytics/zip-codes - ZIP code analysis
router.get('/zip-codes', async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const properties = await storage.getAllProperties();
    
    if (properties.length === 0) {
      return res.json([]);
    }

    // Group by ZIP code
    const zipData = new Map();
    
    properties.forEach(property => {
      const zip = property.zip;
      
      if (zip) {
        if (!zipData.has(zip)) {
          zipData.set(zip, {
            prices: [],
            count: 0
          });
        }
        
        const data = zipData.get(zip);
        data.count++;
        
        // Extract price from metadata
        if (property.metadata && typeof property.metadata === 'object') {
          const metadata = property.metadata as any;
          if (metadata.sale_price_usd) {
            data.prices.push(metadata.sale_price_usd);
          }
        }
      }
    });

    const zipCodes = Array.from(zipData.entries()).map(([zipCode, data]) => ({
      zipCode,
      medianPrice: data.prices.length > 0 
        ? data.prices.sort((a: number, b: number) => a - b)[Math.floor(data.prices.length / 2)]
        : 0,
      salesCount: data.count
    })).sort((a, b) => b.medianPrice - a.medianPrice);

    res.json(zipCodes);
  } catch (error) {
    console.error('Analytics zip codes error:', error);
    res.status(500).json({ error: 'Failed to fetch ZIP code data' });
  }
});

// GET /api/analytics/property-types - Property type distribution
router.get('/property-types', async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const properties = await storage.getAllProperties();
    
    if (properties.length === 0) {
      return res.json([]);
    }

    // Group by property type
    const typeData = new Map();
    
    properties.forEach(property => {
      const type = property.propertyType || 'Unknown';
      
      typeData.set(type, (typeData.get(type) || 0) + 1);
    });

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
    
    const propertyTypes = Array.from(typeData.entries()).map(([type, count], index) => ({
      type,
      count,
      fill: COLORS[index % COLORS.length]
    })).sort((a, b) => b.count - a.count);

    res.json(propertyTypes);
  } catch (error) {
    console.error('Analytics property types error:', error);
    res.status(500).json({ error: 'Failed to fetch property type data' });
  }
});

// GET /api/analytics/summary - Summary statistics
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const storage = getStorage();
    const properties = await storage.getAllProperties();
    
    if (properties.length === 0) {
      return res.json({
        totalProperties: 0,
        totalValue: 0,
        avgPrice: 0,
        medianGLA: 0
      });
    }

    // Calculate summary stats
    const prices: number[] = [];
    const glas: number[] = [];
    
    properties.forEach(property => {
      if (property.metadata && typeof property.metadata === 'object') {
        const metadata = property.metadata as any;
        if (metadata.sale_price_usd) {
          prices.push(metadata.sale_price_usd);
        }
        if (metadata.gla_sqft) {
          glas.push(metadata.gla_sqft);
        }
      }
    });

    const totalValue = prices.reduce((sum, price) => sum + price, 0);
    const avgPrice = prices.length > 0 ? Math.round(totalValue / prices.length) : 0;
    const sortedGlas = glas.sort((a, b) => a - b);
    const medianGLA = sortedGlas.length > 0 ? sortedGlas[Math.floor(sortedGlas.length / 2)] : 0;

    res.json({
      totalProperties: properties.length,
      totalValue,
      avgPrice,
      medianGLA
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary data' });
  }
});

export default router;
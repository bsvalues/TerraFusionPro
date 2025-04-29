import express from "express";
import { z } from "zod";
import { db } from "../db";
import { properties, snapshots } from "@shared/schema";
import { eq, gte, between, and, or, like } from "drizzle-orm";
import * as turf from "@turf/helpers";
import turfBooleanWithin from "@turf/boolean-within";

export const compsRouter = express.Router();

// Schema for incoming search filters
const SearchFilterSchema = z.object({
  glaRange: z.tuple([z.number(), z.number()]).optional(),
  saleDateMaxDays: z.number().optional(),
  bedsMin: z.number().optional(),
  bathsMin: z.number().optional(),
  yearBuiltRange: z.tuple([z.number(), z.number()]).optional(),
  propertyType: z.string().optional(),
  priceRange: z.tuple([z.number(), z.number()]).optional(),
  lotSizeRange: z.tuple([z.number(), z.number()]).optional(),
});

const SearchRequestSchema = z.object({
  filters: SearchFilterSchema,
  polygon: z.any().optional(), // GeoJSON Polygon
  limit: z.number().default(50),
  offset: z.number().default(0),
});

// Route handler for comps search
compsRouter.post("/search", async (req, res) => {
  try {
    const parseResult = SearchRequestSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: parseResult.error.format() 
      });
    }
    
    const { filters, polygon, limit, offset } = parseResult.data;
    
    // Calculate date range from saleDateMaxDays
    const currentDate = new Date();
    let minSaleDate: Date | undefined;
    
    if (filters.saleDateMaxDays) {
      minSaleDate = new Date();
      minSaleDate.setDate(currentDate.getDate() - filters.saleDateMaxDays);
    }
    
    // Build query conditions
    const conditions = [];
    
    if (filters.glaRange) {
      conditions.push(between(properties.grossLivingArea, filters.glaRange[0], filters.glaRange[1]));
    }
    
    if (filters.bedsMin) {
      conditions.push(gte(properties.bedrooms, filters.bedsMin));
    }
    
    if (filters.bathsMin) {
      conditions.push(gte(properties.bathrooms, filters.bathsMin));
    }
    
    if (minSaleDate) {
      conditions.push(gte(snapshots.saleDate, minSaleDate));
    }
    
    if (filters.yearBuiltRange) {
      conditions.push(between(properties.yearBuilt, filters.yearBuiltRange[0], filters.yearBuiltRange[1]));
    }
    
    if (filters.propertyType) {
      conditions.push(eq(properties.propertyType, filters.propertyType));
    }
    
    if (filters.priceRange) {
      conditions.push(between(snapshots.salePrice, filters.priceRange[0], filters.priceRange[1]));
    }
    
    if (filters.lotSizeRange) {
      conditions.push(between(properties.lotSize, filters.lotSizeRange[0], filters.lotSizeRange[1]));
    }
    
    // 1. Fetch potential candidates from DB
    let query = db
      .select({
        id: properties.id,
        address: properties.address,
        city: properties.city,
        state: properties.state,
        zipCode: properties.zipCode,
        lat: properties.lat,
        lng: properties.lng,
        yearBuilt: properties.yearBuilt,
        propertyType: properties.propertyType,
        bedrooms: properties.bedrooms,
        bathrooms: properties.bathrooms,
        grossLivingArea: properties.grossLivingArea,
        lotSize: properties.lotSize,
        salePrice: snapshots.salePrice,
        saleDate: snapshots.saleDate,
        source: snapshots.source,
      })
      .from(properties)
      .leftJoin(snapshots, eq(properties.id, snapshots.propertyId));
    
    // Add conditions if they exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Add limit and offset
    query = query.limit(limit).offset(offset);
    
    // Execute the query
    let results = await query;
    
    // 2. Optional spatial filter
    if (polygon) {
      try {
        const polygonFeature = turf.polygon(polygon.coordinates);
        
        // Filter results by polygon
        results = results.filter(record => {
          if (!record.lat || !record.lng) return false;
          
          // Create a point from the property's coordinates
          const point = turf.point([record.lng, record.lat]);
          
          // Check if the point is within the polygon
          return turfBooleanWithin(point, polygonFeature);
        });
      } catch (error) {
        console.error("Error processing spatial filter:", error);
        return res.status(400).json({ error: "Invalid polygon data" });
      }
    }
    
    // 3. Respond with property information
    res.json({
      count: results.length,
      records: results.map(record => ({
        id: record.id,
        address: record.address,
        city: record.city,
        state: record.state,
        zipCode: record.zipCode,
        lat: record.lat,
        lng: record.lng,
        yearBuilt: record.yearBuilt,
        propertyType: record.propertyType,
        bedrooms: record.bedrooms,
        bathrooms: record.bathrooms,
        grossLivingArea: record.grossLivingArea,
        lotSize: record.lotSize,
        salePrice: record.salePrice,
        saleDate: record.saleDate,
        source: record.source,
      })),
    });
  } catch (error) {
    console.error("Error searching for comparable properties:", error);
    res.status(500).json({ error: "Server error when searching for comparable properties" });
  }
});

// Route handler for retrieving a specific comparable's details
compsRouter.get("/history/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }
    
    // Get the property details
    const propertyResult = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);
    
    if (propertyResult.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }
    
    // Get the property's snapshots/history
    const snapshotsResult = await db
      .select()
      .from(snapshots)
      .where(eq(snapshots.propertyId, id))
      .orderBy(snapshots.saleDate);
    
    // Combine the data
    const property = propertyResult[0];
    
    res.json({
      property,
      history: snapshotsResult,
    });
  } catch (error) {
    console.error("Error retrieving property history:", error);
    res.status(500).json({ error: "Server error when retrieving property history" });
  }
});

export default compsRouter;
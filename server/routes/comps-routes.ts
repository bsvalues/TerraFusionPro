import express from "express";
import { z } from "zod";
import { db } from "../db";
import { properties, comparableSales } from "@shared/schema";
import { eq, gte, between, and, or, like } from "drizzle-orm";
import * as turf from "@turf/helpers";
import turfBooleanWithin from "@turf/boolean-within";

export const compsRouter = express.Router();

// Schema for incoming search filters
const SearchFilterSchema = z.object({
  squareFeetRange: z.tuple([z.number(), z.number()]).optional(),
  saleDateMaxDays: z.number().optional(),
  bedsMin: z.number().optional(),
  bathsMin: z.number().optional(),
  yearBuiltRange: z.tuple([z.number(), z.number()]).optional(),
  propertyType: z.string().optional(),
  priceRange: z.tuple([z.number(), z.number()]).optional(),
  acreageRange: z.tuple([z.number(), z.number()]).optional(),
  county: z.string().optional(),
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
    
    // Build query conditions for comparable sales
    const compConditions = [];
    
    if (filters.squareFeetRange) {
      compConditions.push(between(comparableSales.squareFeet, filters.squareFeetRange[0], filters.squareFeetRange[1]));
    }
    
    if (filters.bedsMin) {
      compConditions.push(gte(comparableSales.bedrooms, filters.bedsMin));
    }
    
    if (filters.bathsMin) {
      compConditions.push(gte(comparableSales.bathrooms, filters.bathsMin));
    }
    
    if (minSaleDate) {
      compConditions.push(gte(comparableSales.saleDate, minSaleDate));
    }
    
    if (filters.yearBuiltRange) {
      compConditions.push(between(comparableSales.yearBuilt, filters.yearBuiltRange[0], filters.yearBuiltRange[1]));
    }
    
    if (filters.propertyType) {
      compConditions.push(eq(comparableSales.propertyType, filters.propertyType));
    }
    
    if (filters.priceRange) {
      compConditions.push(between(comparableSales.saleAmount, filters.priceRange[0], filters.priceRange[1]));
    }
    
    if (filters.acreageRange) {
      compConditions.push(between(comparableSales.acreage, filters.acreageRange[0], filters.acreageRange[1]));
    }
    
    if (filters.county) {
      compConditions.push(eq(comparableSales.county, filters.county));
    }
    
    // 1. Fetch comparable sales from DB
    let query = db
      .select({
        id: comparableSales.id,
        propertyId: comparableSales.propertyId,
        address: comparableSales.address,
        city: comparableSales.city,
        state: comparableSales.state,
        zipCode: comparableSales.zipCode,
        county: comparableSales.county,
        saleDate: comparableSales.saleDate,
        saleAmount: comparableSales.saleAmount,
        adjustedSaleAmount: comparableSales.adjustedSaleAmount,
        propertyType: comparableSales.propertyType,
        yearBuilt: comparableSales.yearBuilt,
        squareFeet: comparableSales.squareFeet,
        acreage: comparableSales.acreage,
        bedrooms: comparableSales.bedrooms,
        bathrooms: comparableSales.bathrooms,
        distanceToSubject: comparableSales.distanceToSubject,
      })
      .from(comparableSales);
    
    // Add conditions if they exist
    if (compConditions.length > 0) {
      query = query.where(and(...compConditions));
    }
    
    // Add limit and offset
    query = query.limit(limit).offset(offset);
    
    // Execute the query
    let results = await query;
    
    // Optional polygon filtering must be handled after the DB query
    // since we don't have direct geospatial capabilities in Drizzle
    // and would need to look up each property's lat/long via the propertyId
    
    // 2. Respond with property information
    res.json({
      count: results.length,
      records: results.map(record => ({
        id: record.id,
        propertyId: record.propertyId,
        address: record.address,
        city: record.city,
        state: record.state,
        zipCode: record.zipCode,
        county: record.county,
        saleDate: record.saleDate,
        saleAmount: record.saleAmount,
        adjustedSaleAmount: record.adjustedSaleAmount,
        propertyType: record.propertyType,
        yearBuilt: record.yearBuilt,
        squareFeet: record.squareFeet,
        acreage: record.acreage,
        bedrooms: record.bedrooms,
        bathrooms: record.bathrooms,
        distanceToSubject: record.distanceToSubject,
      })),
    });
  } catch (error) {
    console.error("Error searching for comparable properties:", error);
    res.status(500).json({ error: "Server error when searching for comparable properties" });
  }
});

// Route handler for retrieving a specific comparable's details
compsRouter.get("/details/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid comparable ID" });
    }
    
    // Get the comparable details
    const comparableResult = await db
      .select()
      .from(comparableSales)
      .where(eq(comparableSales.id, id))
      .limit(1);
    
    if (comparableResult.length === 0) {
      return res.status(404).json({ error: "Comparable not found" });
    }
    
    // If the comparable has a propertyId, fetch the property details as well
    const comparable = comparableResult[0];
    let property = null;
    
    if (comparable.propertyId) {
      const propertyResult = await db
        .select()
        .from(properties)
        .where(eq(properties.id, comparable.propertyId))
        .limit(1);
        
      if (propertyResult.length > 0) {
        property = propertyResult[0];
      }
    }
    
    res.json({
      comparable,
      property
    });
  } catch (error) {
    console.error("Error retrieving comparable details:", error);
    res.status(500).json({ error: "Server error when retrieving comparable details" });
  }
});

export default compsRouter;
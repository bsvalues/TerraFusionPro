/**
 * Database Storage Implementation
 * 
 * Implements the IStorage interface using a PostgreSQL database.
 */
import { IStorage } from './storage';
import { users, type User, type InsertUser } from '@shared/schema';
import { db } from './db';
import { eq } from 'drizzle-orm';

/**
 * Database Storage Class
 * 
 * This class provides a concrete implementation of IStorage
 * using a PostgreSQL database for persistence.
 */
export class DatabaseStorage implements IStorage {
  /**
   * Get a user by ID
   */
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select()
                              .from(users)
                              .where(eq(users.id, id));
      
      return user || undefined;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return undefined;
    }
  }

  /**
   * Get a user by username
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select()
                              .from(users)
                              .where(eq(users.username, username));
      
      return user || undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  /**
   * Create a new user
   */
  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users)
                              .values(insertUser)
                              .returning();
      
      if (!user) {
        throw new Error('Failed to create user');
      }
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Implement other IStorage methods as needed
  // For now, we're just focusing on user-related operations

  // To be implemented as needed:
  // Properties, Assessment Reports, Orders, etc.
}
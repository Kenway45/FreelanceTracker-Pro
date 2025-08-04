import {
  users,
  clients,
  projects,
  timeEntries,
  invoices,
  quotes,
  documents,
  paymentApiKeys,
  abTests,
  abTestResults,
  activityLogs,
  type User,
  type UpsertUser,
  type Client,
  type InsertClient,
  type Project,
  type InsertProject,
  type TimeEntry,
  type InsertTimeEntry,
  type Invoice,
  type InsertInvoice,
  type Quote,
  type InsertQuote,
  type Document,
  type InsertDocument,
  type PaymentApiKey,
  type InsertPaymentApiKey,
  type AbTest,
  type InsertAbTest,
  type AbTestResult,
  type InsertAbTestResult,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: 'admin' | 'freelancer' | 'client'): Promise<User>;
  
  // Client operations
  getClients(userId: string): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;
  
  // Project operations
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Time tracking operations
  getTimeEntries(userId: string, projectId?: string): Promise<TimeEntry[]>;
  getActiveTimeEntry(userId: string): Promise<TimeEntry | undefined>;
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: string, timeEntry: Partial<InsertTimeEntry>): Promise<TimeEntry>;
  stopTimeEntry(id: string, endTime: Date): Promise<TimeEntry>;
  deleteTimeEntry(id: string): Promise<void>;
  
  // Invoice operations
  getInvoices(userId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
  generateInvoiceNumber(): Promise<string>;
  
  // Quote operations
  getQuotes(userId: string): Promise<Quote[]>;
  getQuote(id: string): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: string, quote: Partial<InsertQuote>): Promise<Quote>;
  deleteQuote(id: string): Promise<void>;
  generateQuoteNumber(): Promise<string>;
  
  // Document operations
  getDocuments(userId: string, filters?: { type?: string; clientId?: string; projectId?: string }): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  
  // Payment API key operations (admin only)
  getPaymentApiKeys(): Promise<PaymentApiKey[]>;
  createPaymentApiKey(apiKey: InsertPaymentApiKey): Promise<PaymentApiKey>;
  updatePaymentApiKey(id: string, apiKey: Partial<InsertPaymentApiKey>): Promise<PaymentApiKey>;
  deletePaymentApiKey(id: string): Promise<void>;
  
  // A/B testing operations
  getAbTests(): Promise<AbTest[]>;
  getAbTest(id: string): Promise<AbTest | undefined>;
  createAbTest(test: InsertAbTest): Promise<AbTest>;
  updateAbTest(id: string, test: Partial<InsertAbTest>): Promise<AbTest>;
  recordAbTestResult(result: InsertAbTestResult): Promise<AbTestResult>;
  getAbTestResults(testId: string): Promise<AbTestResult[]>;
  
  // Activity logging
  logActivity(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(userId?: string, limit?: number): Promise<ActivityLog[]>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  deactivateUser(id: string): Promise<User>;
  activateUser(id: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: 'admin' | 'freelancer' | 'client'): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Client operations
  async getClients(userId: string): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: string, client: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...client, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Project operations
  async getProjects(userId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Time tracking operations
  async getTimeEntries(userId: string, projectId?: string): Promise<TimeEntry[]> {
    const conditions = projectId 
      ? and(eq(timeEntries.userId, userId), eq(timeEntries.projectId, projectId))
      : eq(timeEntries.userId, userId);
    
    return await db.select().from(timeEntries).where(conditions).orderBy(desc(timeEntries.createdAt));
  }

  async getActiveTimeEntry(userId: string): Promise<TimeEntry | undefined> {
    const [entry] = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.userId, userId), eq(timeEntries.isRunning, true)));
    return entry;
  }

  async createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const [newEntry] = await db.insert(timeEntries).values(timeEntry).returning();
    return newEntry;
  }

  async updateTimeEntry(id: string, timeEntry: Partial<InsertTimeEntry>): Promise<TimeEntry> {
    const [updatedEntry] = await db
      .update(timeEntries)
      .set({ ...timeEntry, updatedAt: new Date() })
      .where(eq(timeEntries.id, id))
      .returning();
    return updatedEntry;
  }

  async stopTimeEntry(id: string, endTime: Date): Promise<TimeEntry> {
    const [entry] = await db.select().from(timeEntries).where(eq(timeEntries.id, id));
    if (!entry) throw new Error('Time entry not found');
    
    const duration = Math.floor((endTime.getTime() - entry.startTime.getTime()) / (1000 * 60)); // in minutes
    
    const [updatedEntry] = await db
      .update(timeEntries)
      .set({ 
        endTime, 
        duration, 
        isRunning: false, 
        updatedAt: new Date() 
      })
      .where(eq(timeEntries.id, id))
      .returning();
    return updatedEntry;
  }

  async deleteTimeEntry(id: string): Promise<void> {
    await db.delete(timeEntries).where(eq(timeEntries.id, id));
  }

  // Invoice operations
  async getInvoices(userId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(sql`EXTRACT(YEAR FROM created_at) = ${year}`);
    
    const nextNumber = (result?.count || 0) + 1;
    return `INV-${year}-${nextNumber.toString().padStart(3, '0')}`;
  }

  // Quote operations
  async getQuotes(userId: string): Promise<Quote[]> {
    return await db.select().from(quotes).where(eq(quotes.userId, userId)).orderBy(desc(quotes.createdAt));
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote;
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [newQuote] = await db.insert(quotes).values(quote).returning();
    return newQuote;
  }

  async updateQuote(id: string, quote: Partial<InsertQuote>): Promise<Quote> {
    const [updatedQuote] = await db
      .update(quotes)
      .set({ ...quote, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning();
    return updatedQuote;
  }

  async deleteQuote(id: string): Promise<void> {
    await db.delete(quotes).where(eq(quotes.id, id));
  }

  async generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotes)
      .where(sql`EXTRACT(YEAR FROM created_at) = ${year}`);
    
    const nextNumber = (result?.count || 0) + 1;
    return `QUO-${year}-${nextNumber.toString().padStart(3, '0')}`;
  }

  // Document operations
  async getDocuments(userId: string, filters?: { type?: string; clientId?: string; projectId?: string }): Promise<Document[]> {
    let conditions = eq(documents.userId, userId);
    
    if (filters?.type) {
      conditions = and(conditions, eq(documents.type, filters.type));
    }
    if (filters?.clientId) {
      conditions = and(conditions, eq(documents.clientId, filters.clientId));
    }
    if (filters?.projectId) {
      conditions = and(conditions, eq(documents.projectId, filters.projectId));
    }
    
    return await db.select().from(documents).where(conditions).orderBy(desc(documents.createdAt));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Payment API key operations
  async getPaymentApiKeys(): Promise<PaymentApiKey[]> {
    return await db.select().from(paymentApiKeys).orderBy(desc(paymentApiKeys.createdAt));
  }

  async createPaymentApiKey(apiKey: InsertPaymentApiKey): Promise<PaymentApiKey> {
    const [newApiKey] = await db.insert(paymentApiKeys).values(apiKey).returning();
    return newApiKey;
  }

  async updatePaymentApiKey(id: string, apiKey: Partial<InsertPaymentApiKey>): Promise<PaymentApiKey> {
    const [updatedApiKey] = await db
      .update(paymentApiKeys)
      .set({ ...apiKey, updatedAt: new Date() })
      .where(eq(paymentApiKeys.id, id))
      .returning();
    return updatedApiKey;
  }

  async deletePaymentApiKey(id: string): Promise<void> {
    await db.delete(paymentApiKeys).where(eq(paymentApiKeys.id, id));
  }

  // A/B testing operations
  async getAbTests(): Promise<AbTest[]> {
    return await db.select().from(abTests).orderBy(desc(abTests.createdAt));
  }

  async getAbTest(id: string): Promise<AbTest | undefined> {
    const [test] = await db.select().from(abTests).where(eq(abTests.id, id));
    return test;
  }

  async createAbTest(test: InsertAbTest): Promise<AbTest> {
    const [newTest] = await db.insert(abTests).values(test).returning();
    return newTest;
  }

  async updateAbTest(id: string, test: Partial<InsertAbTest>): Promise<AbTest> {
    const [updatedTest] = await db
      .update(abTests)
      .set({ ...test, updatedAt: new Date() })
      .where(eq(abTests.id, id))
      .returning();
    return updatedTest;
  }

  async recordAbTestResult(result: InsertAbTestResult): Promise<AbTestResult> {
    const [newResult] = await db.insert(abTestResults).values(result).returning();
    return newResult;
  }

  async getAbTestResults(testId: string): Promise<AbTestResult[]> {
    return await db.select().from(abTestResults).where(eq(abTestResults.testId, testId));
  }

  // Activity logging
  async logActivity(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  async getActivityLogs(userId?: string, limit = 50): Promise<ActivityLog[]> {
    const conditions = userId ? eq(activityLogs.userId, userId) : undefined;
    return await db
      .select()
      .from(activityLogs)
      .where(conditions)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async deactivateUser(id: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async activateUser(id: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();

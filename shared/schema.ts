import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'freelancer', 'client']);
export const projectStatusEnum = pgEnum('project_status', ['active', 'paused', 'completed', 'cancelled']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']);
export const quoteStatusEnum = pgEnum('quote_status', ['draft', 'sent', 'accepted', 'rejected', 'expired']);
export const testStatusEnum = pgEnum('test_status', ['draft', 'running', 'paused', 'completed']);

// Users table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('freelancer').notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  company: varchar("company"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  clientId: varchar("client_id").references(() => clients.id),
  name: varchar("name").notNull(),
  description: text("description"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  status: projectStatusEnum("status").default('active').notNull(),
  deadline: timestamp("deadline"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Time entries table
export const timeEntries = pgTable("time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  projectId: varchar("project_id").references(() => projects.id).notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in minutes
  isRunning: boolean("is_running").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  invoiceNumber: varchar("invoice_number").unique().notNull(),
  projectId: varchar("project_id").references(() => projects.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum("status").default('draft').notNull(),
  issueDate: timestamp("issue_date").defaultNow(),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  notes: text("notes"),
  templateVariant: varchar("template_variant").default('A'), // For A/B testing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quotes table
export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  clientId: varchar("client_id").references(() => clients.id).notNull(),
  quoteNumber: varchar("quote_number").unique().notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: quoteStatusEnum("status").default('draft').notNull(),
  validUntil: timestamp("valid_until"),
  notes: text("notes"),
  templateVariant: varchar("template_variant").default('A'), // For A/B testing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  clientId: varchar("client_id").references(() => clients.id),
  projectId: varchar("project_id").references(() => projects.id),
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  quoteId: varchar("quote_id").references(() => quotes.id),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'invoice', 'quote', 'report', 'contract', etc.
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment API keys table (encrypted)
export const paymentApiKeys = pgTable("payment_api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: varchar("provider").notNull(), // 'stripe', 'paypal', etc.
  keyName: varchar("key_name").notNull(), // 'secret_key', 'public_key', etc.
  encryptedKey: text("encrypted_key").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// A/B tests table
export const abTests = pgTable("ab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // 'invoice_template', 'quote_template', etc.
  variantA: jsonb("variant_a").notNull(),
  variantB: jsonb("variant_b").notNull(),
  status: testStatusEnum("status").default('draft').notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  successMetric: varchar("success_metric").notNull(), // 'payment_rate', 'response_rate', etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// A/B test results table
export const abTestResults = pgTable("ab_test_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").references(() => abTests.id).notNull(),
  entityId: varchar("entity_id").notNull(), // ID of invoice/quote that was part of test
  entityType: varchar("entity_type").notNull(), // 'invoice', 'quote'
  variant: varchar("variant").notNull(), // 'A' or 'B'
  success: boolean("success").default(false), // Whether the success metric was achieved
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Activity logs table
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(),
  entityType: varchar("entity_type"), // 'project', 'invoice', 'client', etc.
  entityId: varchar("entity_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  projects: many(projects),
  timeEntries: many(timeEntries),
  invoices: many(invoices),
  quotes: many(quotes),
  documents: many(documents),
  activityLogs: many(activityLogs),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  projects: many(projects),
  invoices: many(invoices),
  quotes: many(quotes),
  documents: many(documents),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  timeEntries: many(timeEntries),
  documents: many(documents),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  user: one(users, { fields: [timeEntries.userId], references: [users.id] }),
  project: one(projects, { fields: [timeEntries.projectId], references: [projects.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, { fields: [invoices.userId], references: [users.id] }),
  client: one(clients, { fields: [invoices.clientId], references: [clients.id] }),
  project: one(projects, { fields: [invoices.projectId], references: [projects.id] }),
  documents: many(documents),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  user: one(users, { fields: [quotes.userId], references: [users.id] }),
  client: one(clients, { fields: [quotes.clientId], references: [clients.id] }),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, { fields: [documents.userId], references: [users.id] }),
  client: one(clients, { fields: [documents.clientId], references: [clients.id] }),
  project: one(projects, { fields: [documents.projectId], references: [projects.id] }),
  invoice: one(invoices, { fields: [documents.invoiceId], references: [invoices.id] }),
  quote: one(quotes, { fields: [documents.quoteId], references: [quotes.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertPaymentApiKeySchema = createInsertSchema(paymentApiKeys).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAbTestSchema = createInsertSchema(abTests).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAbTestResultSchema = createInsertSchema(abTestResults).omit({ id: true, recordedAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type PaymentApiKey = typeof paymentApiKeys.$inferSelect;
export type InsertPaymentApiKey = z.infer<typeof insertPaymentApiKeySchema>;
export type AbTest = typeof abTests.$inferSelect;
export type InsertAbTest = z.infer<typeof insertAbTestSchema>;
export type AbTestResult = typeof abTestResults.$inferSelect;
export type InsertAbTestResult = z.infer<typeof insertAbTestResultSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

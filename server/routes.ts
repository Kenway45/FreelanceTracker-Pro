import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertClientSchema, 
  insertProjectSchema, 
  insertTimeEntrySchema,
  insertInvoiceSchema,
  insertQuoteSchema,
  insertPaymentApiKeySchema,
  insertAbTestSchema,
  insertAbTestResultSchema,
} from "@shared/schema";
import { encrypt, decrypt } from "./encryption";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { createCashfreeOrder, getCashfreeOrderStatus, handleCashfreeWebhook, initiateCashfreePayment } from "./cashfree";

// Middleware to check admin role
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: "Failed to verify admin status" });
  }
};

// Activity logging middleware
const logActivity = async (req: any, action: string, entityType?: string, entityId?: string, details?: any) => {
  try {
    if (req.user?.claims?.sub) {
      await storage.logActivity({
        userId: req.user.claims.sub,
        action,
        entityType,
        entityId,
        details,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Client routes
  app.get('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clients = await storage.getClients(userId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clientData = insertClientSchema.parse({ ...req.body, userId });
      const client = await storage.createClient(clientData);
      
      await logActivity(req, 'create_client', 'client', client.id, { name: client.name });
      res.json(client);
    } catch (error) {
      res.status(400).json({ message: "Invalid client data" });
    }
  });

  app.put('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, clientData);
      
      await logActivity(req, 'update_client', 'client', client.id);
      res.json(client);
    } catch (error) {
      res.status(400).json({ message: "Failed to update client" });
    }
  });

  app.delete('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteClient(req.params.id);
      await logActivity(req, 'delete_client', 'client', req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = insertProjectSchema.parse({ ...req.body, userId });
      const project = await storage.createProject(projectData);
      
      await logActivity(req, 'create_project', 'project', project.id, { name: project.name });
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, projectData);
      
      await logActivity(req, 'update_project', 'project', project.id);
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteProject(req.params.id);
      await logActivity(req, 'delete_project', 'project', req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Time tracking routes
  app.get('/api/time-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { projectId } = req.query;
      const timeEntries = await storage.getTimeEntries(userId, projectId);
      res.json(timeEntries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  app.get('/api/time-entries/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activeEntry = await storage.getActiveTimeEntry(userId);
      res.json(activeEntry || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active time entry" });
    }
  });

  app.post('/api/time-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const timeEntryData = insertTimeEntrySchema.parse({ 
        ...req.body, 
        userId,
        startTime: new Date(),
        isRunning: true
      });
      
      // Stop any active timer first
      const activeEntry = await storage.getActiveTimeEntry(userId);
      if (activeEntry) {
        await storage.stopTimeEntry(activeEntry.id, new Date());
      }
      
      const timeEntry = await storage.createTimeEntry(timeEntryData);
      await logActivity(req, 'start_timer', 'time_entry', timeEntry.id, { projectId: timeEntry.projectId });
      res.json(timeEntry);
    } catch (error) {
      res.status(400).json({ message: "Failed to start time tracking" });
    }
  });

  app.put('/api/time-entries/:id/stop', isAuthenticated, async (req: any, res) => {
    try {
      const timeEntry = await storage.stopTimeEntry(req.params.id, new Date());
      await logActivity(req, 'stop_timer', 'time_entry', timeEntry.id, { duration: timeEntry.duration });
      res.json(timeEntry);
    } catch (error) {
      res.status(400).json({ message: "Failed to stop time tracking" });
    }
  });

  app.put('/api/time-entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const timeEntryData = insertTimeEntrySchema.partial().parse(req.body);
      const timeEntry = await storage.updateTimeEntry(req.params.id, timeEntryData);
      await logActivity(req, 'update_time_entry', 'time_entry', timeEntry.id);
      res.json(timeEntry);
    } catch (error) {
      res.status(400).json({ message: "Failed to update time entry" });
    }
  });

  app.delete('/api/time-entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteTimeEntry(req.params.id);
      await logActivity(req, 'delete_time_entry', 'time_entry', req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete time entry" });
    }
  });

  // Invoice routes
  app.get('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invoices = await storage.getInvoices(userId);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invoiceNumber = await storage.generateInvoiceNumber();
      
      // For A/B testing, randomly assign template variant
      const templateVariant = Math.random() > 0.5 ? 'A' : 'B';
      
      const invoiceData = insertInvoiceSchema.parse({ 
        ...req.body, 
        userId,
        invoiceNumber,
        templateVariant
      });
      
      const invoice = await storage.createInvoice(invoiceData);
      await logActivity(req, 'create_invoice', 'invoice', invoice.id, { invoiceNumber, amount: invoice.amount });
      res.json(invoice);
    } catch (error) {
      res.status(400).json({ message: "Failed to create invoice" });
    }
  });

  app.put('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const invoiceData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, invoiceData);
      await logActivity(req, 'update_invoice', 'invoice', invoice.id);
      res.json(invoice);
    } catch (error) {
      res.status(400).json({ message: "Failed to update invoice" });
    }
  });

  // Quote routes
  app.get('/api/quotes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quotes = await storage.getQuotes(userId);
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.post('/api/quotes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quoteNumber = await storage.generateQuoteNumber();
      
      // For A/B testing, randomly assign template variant
      const templateVariant = Math.random() > 0.5 ? 'A' : 'B';
      
      const quoteData = insertQuoteSchema.parse({ 
        ...req.body, 
        userId,
        quoteNumber,
        templateVariant
      });
      
      const quote = await storage.createQuote(quoteData);
      await logActivity(req, 'create_quote', 'quote', quote.id, { quoteNumber, amount: quote.amount });
      res.json(quote);
    } catch (error) {
      res.status(400).json({ message: "Failed to create quote" });
    }
  });

  // Document routes
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, clientId, projectId } = req.query;
      const documents = await storage.getDocuments(userId, { 
        type: type as string, 
        clientId: clientId as string, 
        projectId: projectId as string 
      });
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // A/B Testing routes
  app.get('/api/ab-tests', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const tests = await storage.getAbTests();
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch A/B tests" });
    }
  });

  app.post('/api/ab-tests', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const testData = insertAbTestSchema.parse(req.body);
      const test = await storage.createAbTest(testData);
      await logActivity(req, 'create_ab_test', 'ab_test', test.id, { name: test.name });
      res.json(test);
    } catch (error) {
      res.status(400).json({ message: "Failed to create A/B test" });
    }
  });

  app.post('/api/ab-tests/:id/results', isAuthenticated, async (req: any, res) => {
    try {
      const resultData = insertAbTestResultSchema.parse({
        ...req.body,
        testId: req.params.id
      });
      const result = await storage.recordAbTestResult(resultData);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Failed to record A/B test result" });
    }
  });

  app.get('/api/ab-tests/:id/results', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const results = await storage.getAbTestResults(req.params.id);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch A/B test results" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/admin/users/:id/role', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { role } = req.body;
      const user = await storage.updateUserRole(req.params.id, role);
      await logActivity(req, 'update_user_role', 'user', user.id, { newRole: role });
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Failed to update user role" });
    }
  });

  app.put('/api/admin/users/:id/deactivate', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const user = await storage.deactivateUser(req.params.id);
      await logActivity(req, 'deactivate_user', 'user', user.id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  // Payment API key routes (admin only)
  app.get('/api/admin/payment-keys', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const keys = await storage.getPaymentApiKeys();
      // Don't return the actual encrypted keys, just metadata
      const safeKeys = keys.map(key => ({
        ...key,
        encryptedKey: '***hidden***'
      }));
      res.json(safeKeys);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment keys" });
    }
  });

  app.post('/api/admin/payment-keys', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { provider, keyName, keyValue } = req.body;
      const encryptedKey = encrypt(keyValue);
      
      const keyData = insertPaymentApiKeySchema.parse({
        provider,
        keyName,
        encryptedKey
      });
      
      const apiKey = await storage.createPaymentApiKey(keyData);
      await logActivity(req, 'create_payment_key', 'payment_key', apiKey.id, { provider, keyName });
      
      res.json({
        ...apiKey,
        encryptedKey: '***hidden***'
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to create payment API key" });
    }
  });

  app.delete('/api/admin/payment-keys/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      await storage.deletePaymentApiKey(req.params.id);
      await logActivity(req, 'delete_payment_key', 'payment_key', req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete payment API key" });
    }
  });

  // Activity logs routes (admin only)
  app.get('/api/admin/activity-logs', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const { userId, limit } = req.query;
      const logs = await storage.getActivityLogs(
        userId as string, 
        limit ? parseInt(limit as string) : undefined
      );
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Cashfree payment routes
  app.post('/api/cashfree/orders', isAuthenticated, async (req: any, res) => {
    await createCashfreeOrder(req, res);
  });

  app.get('/api/cashfree/orders/:orderId', isAuthenticated, async (req: any, res) => {
    await getCashfreeOrderStatus(req, res);
  });

  app.post('/api/cashfree/webhook', async (req: any, res) => {
    await handleCashfreeWebhook(req, res);
  });

  app.post('/api/cashfree/initiate-payment', isAuthenticated, async (req: any, res) => {
    await initiateCashfreePayment(req, res);
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get basic stats
      const projects = await storage.getProjects(userId);
      const timeEntries = await storage.getTimeEntries(userId);
      const invoices = await storage.getInvoices(userId);
      
      // Calculate weekly hours
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyEntries = timeEntries.filter(entry => 
        entry.createdAt && entry.createdAt >= oneWeekAgo && entry.duration
      );
      const weeklyHours = weeklyEntries.reduce((total, entry) => total + (entry.duration || 0), 0) / 60;
      
      // Calculate pending invoices
      const pendingInvoices = invoices.filter(invoice => 
        invoice.status === 'sent' || invoice.status === 'overdue'
      );
      const pendingAmount = pendingInvoices.reduce((total, invoice) => 
        total + parseFloat(invoice.totalAmount), 0
      );
      
      // Calculate monthly revenue
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const monthlyInvoices = invoices.filter(invoice => 
        invoice.status === 'paid' && invoice.paidDate && invoice.paidDate >= oneMonthAgo
      );
      const monthlyRevenue = monthlyInvoices.reduce((total, invoice) => 
        total + parseFloat(invoice.totalAmount), 0
      );
      
      const stats = {
        weeklyHours: weeklyHours.toFixed(1),
        activeProjects: projects.filter(p => p.status === 'active').length,
        pendingInvoices: pendingAmount.toFixed(2),
        monthlyRevenue: monthlyRevenue.toFixed(2)
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

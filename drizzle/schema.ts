import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users / Auth ───────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Local Auth Users (email + password) ─────────────────────────────────────
// Parallel auth system alongside Manus OAuth. Admins can sign up freely;
// employees can only sign up if their email is on the allowlist.
export const localUsers = mysqlTable("local_users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  /** 'admin' = full platform access; 'employee' = clock-in/out portal only */
  role: mysqlEnum("role", ["admin", "employee"]).default("employee").notNull(),
  /** FK to employees table — set when employee account is linked */
  employeeId: int("employeeId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});
export type LocalUser = typeof localUsers.$inferSelect;
export type InsertLocalUser = typeof localUsers.$inferInsert;

// ─── Employee Email Allowlist ─────────────────────────────────────────────────
// Admins add emails here. Only allowlisted emails can sign up as employees.
export const employeeAllowlist = mysqlTable("employee_allowlist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** Optional: link to an existing employee record */
  employeeId: int("employeeId"),
  /** Display name hint shown during sign-up */
  employeeName: varchar("employeeName", { length: 255 }),
  addedByAdminId: int("addedByAdminId"),
  /** Whether this email has already been used to create an account */
  hasSignedUp: boolean("hasSignedUp").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmployeeAllowlist = typeof employeeAllowlist.$inferSelect;
export type InsertEmployeeAllowlist = typeof employeeAllowlist.$inferInsert;

// ─── CRM: Customers ──────────────────────────────────────────────────────────
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  status: mysqlEnum("status", ["active", "inactive", "prospect"]).default("prospect").notNull(),
  customerType: mysqlEnum("customerType", ["individual", "business", "reseller"]).default("individual").notNull(),
  notes: text("notes"),
  totalSpent: decimal("totalSpent", { precision: 12, scale: 2 }).default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ─── CRM: Interactions ───────────────────────────────────────────────────────
export const interactions = mysqlTable("interactions", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  type: mysqlEnum("type", ["call", "email", "meeting", "quote", "follow_up", "complaint", "other"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  notes: text("notes"),
  outcome: varchar("outcome", { length: 255 }),
  nextFollowUp: timestamp("nextFollowUp"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = typeof interactions.$inferInsert;

// ─── CRM: Leads ──────────────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  source: mysqlEnum("source", ["website", "referral", "social_media", "cold_call", "trade_show", "other"]).default("other").notNull(),
  stage: mysqlEnum("stage", ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]).default("new").notNull(),
  estimatedValue: decimal("estimatedValue", { precision: 12, scale: 2 }),
  printingNeeds: text("printingNeeds"),
  assignedTo: int("assignedTo"),
  notes: text("notes"),
  convertedToCustomer: boolean("convertedToCustomer").default(false),
  customerId: int("customerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Inventory: Items ────────────────────────────────────────────────────────
export const inventoryItems = mysqlTable("inventory_items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).unique(),
  category: mysqlEnum("category", ["paper", "vinyl", "fabric", "ink", "substrate", "laminate", "hardware", "consumable", "equipment", "other"]).notNull(),
  description: text("description"),
  unit: varchar("unit", { length: 50 }).default("unit"),
  currentStock: decimal("currentStock", { precision: 10, scale: 2 }).default("0"),
  minStockLevel: decimal("minStockLevel", { precision: 10, scale: 2 }).default("0"),
  maxStockLevel: decimal("maxStockLevel", { precision: 10, scale: 2 }),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }).default("0.00"),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).default("0.00"),
  supplier: varchar("supplier", { length: 255 }),
  supplierSku: varchar("supplierSku", { length: 100 }),
  location: varchar("location", { length: 100 }),
  isActive: boolean("isActive").default(true),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;

// ─── Inventory: Transactions ─────────────────────────────────────────────────
export const inventoryTransactions = mysqlTable("inventory_transactions", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("itemId").notNull(),
  type: mysqlEnum("type", ["purchase", "usage", "adjustment", "return", "waste"]).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }),
  reference: varchar("reference", { length: 255 }),
  notes: text("notes"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertInventoryTransaction = typeof inventoryTransactions.$inferInsert;

// ─── Orders ──────────────────────────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  customerId: int("customerId").notNull(),
  status: mysqlEnum("status", ["quote", "confirmed", "in_production", "quality_check", "ready", "dispatched", "delivered", "cancelled"]).default("quote").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  printType: mysqlEnum("printType", ["banner", "poster", "signage", "vehicle_wrap", "canvas", "fabric", "wallpaper", "floor_graphic", "window_graphic", "other"]).default("other"),
  width: decimal("width", { precision: 8, scale: 2 }),
  height: decimal("height", { precision: 8, scale: 2 }),
  dimensionUnit: mysqlEnum("dimensionUnit", ["mm", "cm", "m", "inch", "ft"]).default("m"),
  quantity: int("quantity").default(1),
  material: varchar("material", { length: 255 }),
  finishing: varchar("finishing", { length: 255 }),
  fileUrl: text("fileUrl"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0.00"),
  taxRate: decimal("taxRate", { precision: 5, scale: 2 }).default("0.00"),
  taxAmount: decimal("taxAmount", { precision: 12, scale: 2 }).default("0.00"),
  discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).default("0.00"),
  total: decimal("total", { precision: 12, scale: 2 }).default("0.00"),
  dueDate: timestamp("dueDate"),
  deliveryMethod: mysqlEnum("deliveryMethod", ["pickup", "delivery", "courier"]).default("pickup"),
  deliveryAddress: text("deliveryAddress"),
  assignedTo: int("assignedTo"),
  notes: text("notes"),
  internalNotes: text("internalNotes"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Order Items ─────────────────────────────────────────────────────────────
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  inventoryItemId: int("inventoryItemId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ─── Invoices ────────────────────────────────────────────────────────────────
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  orderId: int("orderId"),
  customerId: int("customerId").notNull(),
  /** Purchase order number provided by the customer */
  poNumber: varchar("poNumber", { length: 100 }),
  status: mysqlEnum("status", ["draft", "sent", "viewed", "partial", "paid", "overdue", "cancelled"]).default("draft").notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxRate: decimal("taxRate", { precision: 5, scale: 2 }).default("0.00"),
  taxAmount: decimal("taxAmount", { precision: 12, scale: 2 }).default("0.00"),
  discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).default("0.00"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  amountPaid: decimal("amountPaid", { precision: 12, scale: 2 }).default("0.00"),
  amountDue: decimal("amountDue", { precision: 12, scale: 2 }).notNull(),
  issueDate: timestamp("issueDate").defaultNow().notNull(),
  dueDate: timestamp("dueDate").notNull(),
  notes: text("notes"),
  terms: text("terms"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ─── Employees ───────────────────────────────────────────────────────────────
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  role: mysqlEnum("role", ["manager", "print_operator", "designer", "sales", "delivery", "admin", "other"]).notNull(),
  department: varchar("department", { length: 100 }),
  status: mysqlEnum("status", ["active", "inactive", "on_leave"]).default("active").notNull(),
  hireDate: timestamp("hireDate"),
  hourlyRate: decimal("hourlyRate", { precision: 8, scale: 2 }),
  skills: text("skills"),
  notes: text("notes"),
  /** Bcrypt hash of the employee's 4-digit clock-in PIN. Null means no PIN set. */
  pinHash: varchar("pinHash", { length: 255 }),
  pinSet: boolean("pinSet").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

// ─── Tasks ───────────────────────────────────────────────────────────────────
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  orderId: int("orderId"),
  assignedTo: int("assignedTo"),
  status: mysqlEnum("status", ["pending", "in_progress", "review", "completed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  category: mysqlEnum("category", ["design", "printing", "finishing", "quality_check", "delivery", "admin", "other"]).default("other"),
  estimatedHours: decimal("estimatedHours", { precision: 6, scale: 2 }),
  actualHours: decimal("actualHours", { precision: 6, scale: 2 }),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ─── Payments ────────────────────────────────────────────────────────────────
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  customerId: int("customerId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  method: mysqlEnum("method", ["cash", "card", "bank_transfer", "eft", "cheque", "online", "other"]).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  reference: varchar("reference", { length: 255 }),
  notes: text("notes"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ─── Appointments ────────────────────────────────────────────────────────────
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["client_consultation", "production", "delivery", "equipment_maintenance", "team_meeting", "other"]).notNull(),
  customerId: int("customerId"),
  orderId: int("orderId"),
  assignedTo: int("assignedTo"),
  status: mysqlEnum("status", ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "rescheduled"]).default("scheduled").notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  location: varchar("location", { length: 255 }),
  description: text("description"),
  notes: text("notes"),
  reminderSent: boolean("reminderSent").default(false),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// ─── Shift Logs (Clock In/Out) ────────────────────────────────────────────────
export const shiftLogs = mysqlTable("shift_logs", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  clockIn: timestamp("clockIn").notNull(),
  clockOut: timestamp("clockOut"),
  /** Computed and stored on clock-out: total hours worked as decimal (e.g. 7.5) */
  hoursWorked: decimal("hoursWorked", { precision: 8, scale: 2 }),
  /** Earnings = hoursWorked × employee.hourlyRate, stored at clock-out */
  earnings: decimal("earnings", { precision: 12, scale: 2 }),
  notes: text("notes"),
  /** Approval workflow: pending → approved | rejected */
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  /** ID of the local_users record who approved/rejected this shift */
  approvedBy: int("approvedBy"),
  approvedByName: varchar("approvedByName", { length: 255 }),
  approvedAt: timestamp("approvedAt"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShiftLog = typeof shiftLogs.$inferSelect;
export type InsertShiftLog = typeof shiftLogs.$inferInsert;

// ─── Pricing Rates (Print Cost Calculator) ───────────────────────────────────
export const pricingRates = mysqlTable("pricing_rates", {
  id: int("id").autoincrement().primaryKey(),
  printType: mysqlEnum("printType", ["banner", "poster", "signage", "vehicle_wrap", "canvas", "fabric", "wallpaper", "floor_graphic", "window_graphic", "other"]).notNull(),
  material: varchar("material", { length: 100 }).notNull(),
  /** Base rate per square metre in ZAR */
  ratePerSqm: decimal("ratePerSqm", { precision: 10, scale: 2 }).notNull(),
  /** One-time setup / artwork fee in ZAR */
  setupFee: decimal("setupFee", { precision: 10, scale: 2 }).default("0.00").notNull(),
  /** Minimum charge per job in ZAR */
  minCharge: decimal("minCharge", { precision: 10, scale: 2 }).default("0.00").notNull(),
  /** Optional finishing surcharge per sqm (e.g. lamination) */
  laminationRatePerSqm: decimal("laminationRatePerSqm", { precision: 10, scale: 2 }).default("0.00"),
  /** Optional eyelet/hem surcharge per linear metre */
  eyeletRatePerMetre: decimal("eyeletRatePerMetre", { precision: 10, scale: 2 }).default("0.00"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PricingRate = typeof pricingRates.$inferSelect;
export type InsertPricingRate = typeof pricingRates.$inferInsert;

// ─── Inventory Job Usage (actual materials consumed per order) ────────────────
export const inventoryJobUsage = mysqlTable("inventory_job_usage", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  inventoryItemId: int("inventoryItemId").notNull(),
  /** Quantity of inventory units consumed (e.g. metres, sheets, litres) */
  quantityUsed: decimal("quantityUsed", { precision: 10, scale: 3 }).notNull(),
  /** Unit cost at time of consumption (snapshot from inventory) */
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }).notNull(),
  /** Total cost = quantityUsed × unitCost */
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InventoryJobUsage = typeof inventoryJobUsage.$inferSelect;
export type InsertInventoryJobUsage = typeof inventoryJobUsage.$inferInsert;

// ─── Company Profile ─────────────────────────────────────────────────────────
export const companyProfile = mysqlTable("company_profile", {
  id: int("id").autoincrement().primaryKey(),
  /** Company display name */
  name: varchar("name", { length: 255 }).notNull().default("Bester.Builds"),
  /** Tagline shown on PDFs */
  tagline: varchar("tagline", { length: 255 }).default("Large Format Printing Specialists"),
  /** Primary contact email */
  email: varchar("email", { length: 320 }),
  /** Primary phone number */
  phone: varchar("phone", { length: 64 }),
  /** Physical / postal address (multi-line) */
  address: text("address"),
  /** VAT / tax registration number */
  vatNumber: varchar("vatNumber", { length: 64 }),
  /** Company registration number */
  regNumber: varchar("regNumber", { length: 64 }),
  /** Website URL */
  website: varchar("website", { length: 255 }),
  // ── Banking details ──────────────────────────────────────────────────────
  bankName: varchar("bankName", { length: 128 }),
  accountHolder: varchar("accountHolder", { length: 255 }),
  accountNumber: varchar("accountNumber", { length: 64 }),
  branchCode: varchar("branchCode", { length: 32 }),
  accountType: varchar("accountType", { length: 64 }),
  /** Optional payment reference instructions shown on invoices */
  paymentReference: text("paymentReference"),
  /** Invoice footer / terms text */
  invoiceTerms: text("invoiceTerms"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CompanyProfile = typeof companyProfile.$inferSelect;
export type InsertCompanyProfile = typeof companyProfile.$inferInsert;

// ─── Employee Notifications ───────────────────────────────────────────────────
export const employeeNotifications = mysqlTable("employee_notifications", {
  id: int("id").autoincrement().primaryKey(),
  /** The local_users.id of the employee who receives this notification */
  recipientId: int("recipientId").notNull(),
  /** The employee's name (denormalised for fast display) */
  recipientName: varchar("recipientName", { length: 255 }),
  /** Notification category: shift_approved | shift_rejected | general */
  type: mysqlEnum("type", ["shift_approved", "shift_rejected", "general"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  /** Optional link to the related shift log */
  shiftId: int("shiftId"),
  /** Whether the recipient has read this notification */
  isRead: boolean("isRead").default(false).notNull(),
  /** Who triggered this notification (admin name) */
  sentByName: varchar("sentByName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmployeeNotification = typeof employeeNotifications.$inferSelect;
export type InsertEmployeeNotification = typeof employeeNotifications.$inferInsert;

// ─── Job Cards ────────────────────────────────────────────────────────────────
export const jobCards = mysqlTable("job_cards", {
  id: int("id").autoincrement().primaryKey(),
  /** Job card number e.g. JC-0001 */
  jobCardNumber: varchar("jobCardNumber", { length: 50 }).notNull().unique(),
  /** The invoice this job card was generated from (null for manually created cards) */
  invoiceId: int("invoiceId"),
  /** Purchase order number from the invoice (optional for manual cards) */
  poNumber: varchar("poNumber", { length: 100 }),
  /** Short title for the job */
  jobTitle: varchar("jobTitle", { length: 255 }).notNull(),
  /** Customer name (denormalised for quick display) */
  customerName: varchar("customerName", { length: 255 }),
  /** Employee assigned to this job */
  assignedTo: int("assignedTo"),
  assignedToName: varchar("assignedToName", { length: 255 }),
  /** Due date for job completion */
  dueDate: timestamp("dueDate"),
  /** Print specifications: type, dimensions, material, finishing, quantity */
  printType: varchar("printType", { length: 100 }),
  width: decimal("width", { precision: 8, scale: 2 }),
  height: decimal("height", { precision: 8, scale: 2 }),
  dimensionUnit: varchar("dimensionUnit", { length: 10 }).default("m"),
  quantity: int("quantity").default(1),
  material: varchar("material", { length: 255 }),
  finishing: varchar("finishing", { length: 255 }),
  /** Special instructions for the production team */
  instructions: text("instructions"),
  /** Internal notes */
  notes: text("notes"),
  /** File/artwork URL */
  fileUrl: text("fileUrl"),
  /** Job card status */
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type JobCard = typeof jobCards.$inferSelect;
export type InsertJobCard = typeof jobCards.$inferInsert;

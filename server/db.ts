import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  appointments,
  customers,
  employees,
  interactions,
  inventoryItems,
  inventoryTransactions,
  invoices,
  leads,
  orderItems,
  orders,
  payments,
  shiftLogs,
  tasks,
  users,
  pricingRates,
  inventoryJobUsage,
  companyProfile,
  localUsers,
  employeeAllowlist,
  type LocalUser,
  type InsertLocalUser,
  type EmployeeAllowlist,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── CRM: Customers ──────────────────────────────────────────────────────────
export async function getCustomers(search?: string, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (search) conditions.push(or(like(customers.name, `%${search}%`), like(customers.company, `%${search}%`), like(customers.email, `%${search}%`)));
  if (status) conditions.push(eq(customers.status, status as any));
  return db.select().from(customers).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(customers.createdAt));
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result[0];
}

export async function createCustomer(data: typeof customers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(customers).values(data);
  return result;
}

export async function updateCustomer(id: number, data: Partial<typeof customers.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(customers).set(data).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.delete(customers).where(eq(customers.id, id));
}

// ─── CRM: Interactions ───────────────────────────────────────────────────────
export async function getInteractionsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interactions).where(eq(interactions.customerId, customerId)).orderBy(desc(interactions.createdAt));
}

export async function createInteraction(data: typeof interactions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(interactions).values(data);
}

// ─── CRM: Leads ──────────────────────────────────────────────────────────────
export async function getLeads(stage?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = stage ? [eq(leads.stage, stage as any)] : [];
  return db.select().from(leads).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(leads.createdAt));
}

export async function createLead(data: typeof leads.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(leads).values(data);
}

export async function updateLead(id: number, data: Partial<typeof leads.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(leads).set(data).where(eq(leads.id, id));
}

export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.delete(leads).where(eq(leads.id, id));
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export async function getInventoryItems(category?: string, lowStock?: boolean) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (category) conditions.push(eq(inventoryItems.category, category as any));
  if (lowStock) conditions.push(sql`${inventoryItems.currentStock} <= ${inventoryItems.minStockLevel}`);
  return db.select().from(inventoryItems).where(conditions.length ? and(...conditions) : undefined).orderBy(inventoryItems.name);
}

export async function getInventoryItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).limit(1);
  return result[0];
}

export async function createInventoryItem(data: typeof inventoryItems.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(inventoryItems).values(data);
}

export async function updateInventoryItem(id: number, data: Partial<typeof inventoryItems.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(inventoryItems).set(data).where(eq(inventoryItems.id, id));
}

export async function deleteInventoryItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.delete(inventoryItems).where(eq(inventoryItems.id, id));
}

export async function getInventoryTransactions(itemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventoryTransactions).where(eq(inventoryTransactions.itemId, itemId)).orderBy(desc(inventoryTransactions.createdAt));
}

export async function createInventoryTransaction(data: typeof inventoryTransactions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const item = await getInventoryItemById(data.itemId);
  if (!item) throw new Error("Item not found");
  const qty = parseFloat(data.quantity as string);
  const current = parseFloat(item.currentStock as string);
  let newStock = current;
  if (data.type === "purchase" || data.type === "return") newStock = current + qty;
  else if (data.type === "usage" || data.type === "waste") newStock = current - qty;
  else if (data.type === "adjustment") newStock = qty;
  await db.update(inventoryItems).set({ currentStock: newStock.toString() }).where(eq(inventoryItems.id, data.itemId));
  return db.insert(inventoryTransactions).values(data);
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export async function getOrders(status?: string, customerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (status) conditions.push(eq(orders.status, status as any));
  if (customerId) conditions.push(eq(orders.customerId, customerId));
  return db.select().from(orders).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function createOrder(data: typeof orders.$inferInsert, items: typeof orderItems.$inferInsert[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(orders).values(data);
  const insertId = (result as any)[0]?.insertId;
  if (items.length > 0 && insertId) {
    await db.insert(orderItems).values(items.map((i) => ({ ...i, orderId: insertId })));
  }
  return insertId;
}

export async function updateOrder(id: number, data: Partial<typeof orders.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(orders).set(data).where(eq(orders.id, id));
}

export async function deleteOrder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(orderItems).where(eq(orderItems.orderId, id));
  return db.delete(orders).where(eq(orders.id, id));
}

// ─── Invoices ────────────────────────────────────────────────────────────────
export async function getInvoices(status?: string, customerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (status) conditions.push(eq(invoices.status, status as any));
  if (customerId) conditions.push(eq(invoices.customerId, customerId));
  return db.select().from(invoices).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(invoices.createdAt));
}

export async function getInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result[0];
}

export async function createInvoice(data: typeof invoices.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(invoices).values(data);
}

export async function updateInvoice(id: number, data: Partial<typeof invoices.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(invoices).set(data).where(eq(invoices.id, id));
}

// ─── Employees ───────────────────────────────────────────────────────────────
export async function getEmployees(status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = status ? [eq(employees.status, status as any)] : [];
  return db.select().from(employees).where(conditions.length ? and(...conditions) : undefined).orderBy(employees.name);
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result[0];
}

export async function createEmployee(data: typeof employees.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(employees).values(data);
}

export async function updateEmployee(id: number, data: Partial<typeof employees.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(employees).set(data).where(eq(employees.id, id));
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.delete(employees).where(eq(employees.id, id));
}

// ─── Tasks ───────────────────────────────────────────────────────────────────
export async function getTasks(status?: string, assignedTo?: number, orderId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (status) conditions.push(eq(tasks.status, status as any));
  if (assignedTo) conditions.push(eq(tasks.assignedTo, assignedTo));
  if (orderId) conditions.push(eq(tasks.orderId, orderId));
  return db.select().from(tasks).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(tasks.createdAt));
}

export async function createTask(data: typeof tasks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(tasks).values(data);
}

export async function updateTask(id: number, data: Partial<typeof tasks.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.delete(tasks).where(eq(tasks.id, id));
}

// ─── Payments ────────────────────────────────────────────────────────────────
export async function getPayments(status?: string, customerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (status) conditions.push(eq(payments.status, status as any));
  if (customerId) conditions.push(eq(payments.customerId, customerId));
  return db.select().from(payments).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(payments.createdAt));
}

export async function createPayment(data: typeof payments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(payments).values(data);
  // Update invoice amountPaid and amountDue
  if (data.status === "completed" && data.invoiceId) {
    const invoice = await getInvoiceById(data.invoiceId);
    if (invoice) {
      const paid = parseFloat(invoice.amountPaid as string) + parseFloat(data.amount as string);
      const due = parseFloat(invoice.total as string) - paid;
      const newStatus = due <= 0 ? "paid" : paid > 0 ? "partial" : invoice.status;
      await updateInvoice(data.invoiceId, { amountPaid: paid.toString(), amountDue: Math.max(0, due).toString(), status: newStatus as any });
    }
  }
  return result;
}

export async function updatePayment(id: number, data: Partial<typeof payments.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(payments).set(data).where(eq(payments.id, id));
}

// ─── Appointments ────────────────────────────────────────────────────────────
export async function getAppointments(status?: string, from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (status) conditions.push(eq(appointments.status, status as any));
  if (from) conditions.push(gte(appointments.startTime, from));
  if (to) conditions.push(lte(appointments.startTime, to));
  return db.select().from(appointments).where(conditions.length ? and(...conditions) : undefined).orderBy(appointments.startTime);
}

export async function createAppointment(data: typeof appointments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(appointments).values(data);
}

export async function updateAppointment(id: number, data: Partial<typeof appointments.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(appointments).set(data).where(eq(appointments.id, id));
}

export async function deleteAppointment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.delete(appointments).where(eq(appointments.id, id));
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export async function getAnalyticsSummary() {
  const db = await getDb();
  if (!db) return null;

  const [totalCustomers] = await db.select({ count: sql<number>`count(*)` }).from(customers);
  const [totalOrders] = await db.select({ count: sql<number>`count(*)` }).from(orders);
  const [activeOrders] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(
    or(eq(orders.status, "confirmed"), eq(orders.status, "in_production"), eq(orders.status, "quality_check"), eq(orders.status, "ready"))
  );
  const [totalRevenue] = await db.select({ sum: sql<string>`COALESCE(SUM(amount), 0)` }).from(payments).where(eq(payments.status, "completed"));
  const [pendingInvoices] = await db.select({ count: sql<number>`count(*)` }).from(invoices).where(
    or(eq(invoices.status, "sent"), eq(invoices.status, "overdue"), eq(invoices.status, "partial"))
  );
  const [lowStockItems] = await db.select({ count: sql<number>`count(*)` }).from(inventoryItems).where(
    sql`${inventoryItems.currentStock} <= ${inventoryItems.minStockLevel}`
  );
  const [activeEmployees] = await db.select({ count: sql<number>`count(*)` }).from(employees).where(eq(employees.status, "active"));
  const [pendingTasks] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(
    or(eq(tasks.status, "pending"), eq(tasks.status, "in_progress"))
  );

  return {
    totalCustomers: totalCustomers?.count ?? 0,
    totalOrders: totalOrders?.count ?? 0,
    activeOrders: activeOrders?.count ?? 0,
    totalRevenue: parseFloat(totalRevenue?.sum ?? "0"),
    pendingInvoices: pendingInvoices?.count ?? 0,
    lowStockItems: lowStockItems?.count ?? 0,
    activeEmployees: activeEmployees?.count ?? 0,
    pendingTasks: pendingTasks?.count ?? 0,
  };
}

export async function getRevenueByMonth() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    month: sql<string>`DATE_FORMAT(paidAt, '%Y-%m')`,
    revenue: sql<string>`SUM(amount)`,
    count: sql<number>`count(*)`,
  }).from(payments).where(eq(payments.status, "completed")).groupBy(sql`DATE_FORMAT(paidAt, '%Y-%m')`).orderBy(sql`DATE_FORMAT(paidAt, '%Y-%m')`).limit(12);
}

export async function getOrdersByStatus() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    status: orders.status,
    count: sql<number>`count(*)`,
  }).from(orders).groupBy(orders.status);
}

export async function getTopCustomers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: customers.id,
    name: customers.name,
    company: customers.company,
    totalSpent: customers.totalSpent,
  }).from(customers).orderBy(desc(customers.totalSpent)).limit(10);
}

// ─── Shift Logs ───────────────────────────────────────────────────────────────

/** Return all shifts for an employee, newest first */
export async function getShiftLogs(employeeId?: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  const conditions = employeeId ? [eq(shiftLogs.employeeId, employeeId)] : [];
  return db
    .select()
    .from(shiftLogs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(shiftLogs.clockIn))
    .limit(limit);
}

/** Return the active (not yet clocked-out) shift for an employee, if any */
export async function getActiveShift(employeeId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(shiftLogs)
    .where(and(eq(shiftLogs.employeeId, employeeId), sql`${shiftLogs.clockOut} IS NULL`))
    .limit(1);
  return rows[0] ?? null;
}

/** Clock an employee in — fails if they already have an open shift */
export async function clockIn(employeeId: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await getActiveShift(employeeId);
  if (existing) throw new Error("Employee is already clocked in");
  const [result] = await db.insert(shiftLogs).values({
    employeeId,
    clockIn: new Date(),
    notes: notes ?? null,
  });
  const rows = await db.select().from(shiftLogs).where(eq(shiftLogs.id, (result as any).insertId)).limit(1);
  return rows[0];
}

/** Clock an employee out — calculates hours worked and earnings */
export async function clockOut(shiftId: number, employeeId: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Fetch the open shift
  const rows = await db.select().from(shiftLogs).where(eq(shiftLogs.id, shiftId)).limit(1);
  const shift = rows[0];
  if (!shift) throw new Error("Shift not found");
  if (shift.clockOut) throw new Error("Shift already closed");

  // Fetch employee hourly rate
  const empRows = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
  const emp = empRows[0];
  const hourlyRate = emp?.hourlyRate ? parseFloat(emp.hourlyRate as string) : 0;

  const clockOutTime = new Date();
  const msWorked = clockOutTime.getTime() - new Date(shift.clockIn).getTime();
  const hoursWorked = Math.round((msWorked / (1000 * 60 * 60)) * 100) / 100; // 2dp
  const earnings = Math.round(hoursWorked * hourlyRate * 100) / 100;

  await db.update(shiftLogs).set({
    clockOut: clockOutTime,
    hoursWorked: hoursWorked.toFixed(2),
    earnings: earnings.toFixed(2),
    notes: notes ?? shift.notes,
  }).where(eq(shiftLogs.id, shiftId));

  const updated = await db.select().from(shiftLogs).where(eq(shiftLogs.id, shiftId)).limit(1);
  return updated[0];
}

/** Aggregate shift summary per employee: total hours & earnings for a date range */
export async function getShiftSummary(employeeId?: number, from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [sql`${shiftLogs.clockOut} IS NOT NULL`];
  if (employeeId) conditions.push(eq(shiftLogs.employeeId, employeeId));
  if (from) conditions.push(gte(shiftLogs.clockIn, from));
  if (to) conditions.push(lte(shiftLogs.clockIn, to));

  return db
    .select({
      employeeId: shiftLogs.employeeId,
      employeeName: employees.name,
      employeeRole: employees.role,
      hourlyRate: employees.hourlyRate,
      totalShifts: sql<number>`count(${shiftLogs.id})`,
      totalHours: sql<number>`ROUND(SUM(${shiftLogs.hoursWorked}), 2)`,
      totalEarnings: sql<number>`ROUND(SUM(${shiftLogs.earnings}), 2)`,
    })
    .from(shiftLogs)
    .leftJoin(employees, eq(shiftLogs.employeeId, employees.id))
    .where(and(...conditions))
    .groupBy(shiftLogs.employeeId, employees.name, employees.role, employees.hourlyRate)
    .orderBy(desc(sql`SUM(${shiftLogs.earnings})`));
}

// ─── PIN Clock-In Helpers ─────────────────────────────────────────────────────

/** Hash a 4-digit PIN using bcrypt (salt rounds = 10). */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

/** Set or update an employee's clock-in PIN. */
export async function setEmployeePin(employeeId: number, pin: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const pinHash = await hashPin(pin);
  await db
    .update(employees)
    .set({ pinHash, pinSet: true })
    .where(eq(employees.id, employeeId));
}

/** Remove an employee's PIN (admin reset). */
export async function clearEmployeePin(employeeId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(employees)
    .set({ pinHash: null, pinSet: false })
    .where(eq(employees.id, employeeId));
}

/**
 * Look up an employee by PIN.
 * Returns the employee record (without pinHash) if the PIN matches, or null.
 */
export async function findEmployeeByPin(pin: string): Promise<Omit<typeof employees.$inferSelect, "pinHash"> | null> {
  const db = await getDb();
  if (!db) return null;

  // Fetch all employees that have a PIN set (pinHash is not null)
  const rows = await db
    .select()
    .from(employees)
    .where(eq(employees.pinSet, true));

  for (const emp of rows) {
    if (emp.pinHash && await bcrypt.compare(pin, emp.pinHash)) {
      // Return employee data without exposing the hash
      const { pinHash: _h, ...safe } = emp;
      return safe;
    }
  }
  return null;
}

/**
 * Clock in an employee identified by their PIN.
 * Returns the new shift record, or throws if PIN is invalid or employee already clocked in.
 */
export async function clockInByPin(pin: string, notes?: string) {
  const emp = await findEmployeeByPin(pin);
  if (!emp) throw new Error("Invalid PIN. Please try again.");

  const db = await getDb();
  if (!db) throw new Error("Database unavailable.");

  // Check for an open shift
  const existing = await db
    .select()
    .from(shiftLogs)
    .where(and(eq(shiftLogs.employeeId, emp.id), sql`${shiftLogs.clockOut} IS NULL`))
    .limit(1);

  if (existing.length > 0) {
    throw new Error(`${emp.name} is already clocked in.`);
  }

  await db.insert(shiftLogs).values({
    employeeId: emp.id,
    clockIn: new Date(),
    notes: notes ?? null,
  });

  const [newShift] = await db
    .select()
    .from(shiftLogs)
    .where(and(eq(shiftLogs.employeeId, emp.id), sql`${shiftLogs.clockOut} IS NULL`))
    .orderBy(desc(shiftLogs.clockIn))
    .limit(1);

  return { employee: emp, shift: newShift };
}

/**
 * Clock out an employee identified by their PIN.
 * Calculates hours worked and earnings, then updates the shift record.
 */
export async function clockOutByPin(pin: string) {
  const emp = await findEmployeeByPin(pin);
  if (!emp) throw new Error("Invalid PIN. Please try again.");

  const db = await getDb();
  if (!db) throw new Error("Database unavailable.");

  const [openShift] = await db
    .select()
    .from(shiftLogs)
    .where(and(eq(shiftLogs.employeeId, emp.id), sql`${shiftLogs.clockOut} IS NULL`))
    .orderBy(desc(shiftLogs.clockIn))
    .limit(1);

  if (!openShift) {
    throw new Error(`${emp.name} is not currently clocked in.`);
  }

  const clockOut = new Date();
  const hoursWorked = (clockOut.getTime() - new Date(openShift.clockIn).getTime()) / 3600000;
  const hourlyRate = parseFloat((emp.hourlyRate as string | null) ?? "0");
  const earnings = hoursWorked * hourlyRate;

  await db
    .update(shiftLogs)
    .set({
      clockOut,
      hoursWorked: hoursWorked.toFixed(4),
      earnings: earnings.toFixed(2),
    })
    .where(eq(shiftLogs.id, openShift.id));

  const [updated] = await db
    .select()
    .from(shiftLogs)
    .where(eq(shiftLogs.id, openShift.id))
    .limit(1);

  return { employee: emp, shift: updated };
}

// ─── Timesheet Export Helper ──────────────────────────────────────────────────

/**
 * Returns all completed shifts within a date range, joined with employee details.
 * Used for payroll CSV export.
 */
export async function getTimesheetExport(
  from: Date,
  to: Date,
  employeeId?: number
) {
  const db = await getDb();
  if (!db) return [];

  // Set `to` to end of day so the full last day is included
  const toEndOfDay = new Date(to);
  toEndOfDay.setHours(23, 59, 59, 999);

  const conditions = [
    gte(shiftLogs.clockIn, from),
    lte(shiftLogs.clockIn, toEndOfDay),
    // Only include completed shifts (clockOut is not null)
    sql`${shiftLogs.clockOut} IS NOT NULL`,
  ];

  if (employeeId) {
    conditions.push(eq(shiftLogs.employeeId, employeeId));
  }

  const rows = await db
    .select({
      shiftId: shiftLogs.id,
      employeeId: shiftLogs.employeeId,
      employeeName: employees.name,
      employeeRole: employees.role,
      department: employees.department,
      hourlyRate: employees.hourlyRate,
      clockIn: shiftLogs.clockIn,
      clockOut: shiftLogs.clockOut,
      hoursWorked: shiftLogs.hoursWorked,
      earnings: shiftLogs.earnings,
      notes: shiftLogs.notes,
    })
    .from(shiftLogs)
    .leftJoin(employees, eq(shiftLogs.employeeId, employees.id))
    .where(and(...conditions))
    .orderBy(shiftLogs.clockIn);

  return rows;
}

// ─── PDF Invoice Data ─────────────────────────────────────────────────────────
export async function getInvoiceForPDF(invoiceId: number) {
  const db = await getDb();
  if (!db) return null;

  // Fetch invoice with customer
  const rows = await db
    .select({
      invoice: invoices,
      customer: customers,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!rows.length || !rows[0]) return null;
  const { invoice, customer } = rows[0];

  // Fetch linked order (if any)
  let order = null;
  if (invoice.orderId) {
    const orderRows = await db
      .select({ id: orders.id, orderNumber: orders.orderNumber, title: orders.title })
      .from(orders)
      .where(eq(orders.id, invoice.orderId))
      .limit(1);
    if (orderRows.length) order = orderRows[0];
  }

  // Fetch line items from order_items (linked via orderId)
  let lineItems: { description: string; quantity: string; unitPrice: string; total: string }[] = [];
  if (invoice.orderId) {
    const items = await db
      .select({
        description: orderItems.description,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        total: orderItems.total,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, invoice.orderId));
    lineItems = items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.total,
    }));
  }

  // If no order items, create a single summary line from the invoice itself
  if (!lineItems.length) {
    lineItems = [
      {
        description: order ? `Print Job: ${order.title}` : "Printing Services",
        quantity: "1",
        unitPrice: invoice.subtotal,
        total: invoice.subtotal,
      },
    ];
  }

  return { invoice, customer, order, lineItems };
}

// ─── Quote-to-Invoice Conversion ─────────────────────────────────────────────
export async function getOrderWithItemsForInvoice(orderId: number) {
  const db = await getDb();
  if (!db) return null;

  const orderRows = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!orderRows.length || !orderRows[0]) return null;
  const { order, customer } = orderRows[0];

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return { order, customer, items };
}

export async function createInvoiceFromOrder(
  orderId: number,
  invoiceNumber: string,
  dueDate: Date,
  taxRate: string,
  terms?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const data = await getOrderWithItemsForInvoice(orderId);
  if (!data || !data.order) throw new Error("Order not found");
  if (!data.customer) throw new Error("Customer not found");

  const order = data.order;

  // Use order totals directly (already calculated when order was created)
  const subtotal = order.subtotal ?? "0.00";
  const rate = parseFloat(taxRate);
  const sub = parseFloat(subtotal);
  const taxAmt = ((sub * rate) / 100).toFixed(2);
  const disc = parseFloat(order.discountAmount ?? "0") || 0;
  const total = (sub + parseFloat(taxAmt) - disc).toFixed(2);

  // Insert the invoice
  await db.insert(invoices).values({
    invoiceNumber,
    orderId,
    customerId: order.customerId,
    status: "draft",
    subtotal,
    taxRate,
    taxAmount: taxAmt,
    discountAmount: order.discountAmount ?? "0.00",
    total,
    amountPaid: "0.00",
    amountDue: total,
    dueDate,
    notes: order.notes ?? null,
    terms: terms ?? "Payment due within 30 days. Late payments subject to 2% monthly interest.",
  });

  // Advance order status from quote → confirmed
  await db
    .update(orders)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  // Fetch the newly created invoice
  const newInvoice = await db
    .select()
    .from(invoices)
    .where(eq(invoices.invoiceNumber, invoiceNumber))
    .limit(1);

  return newInvoice[0] ?? null;
}

// ─── Pricing Rates & Cost Calculator ─────────────────────────────────────────
export async function getPricingRates(printType?: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(pricingRates).where(eq(pricingRates.isActive, true));
  if (printType) return rows.filter((r) => r.printType === printType);
  return rows;
}

export async function calculatePrintCost(input: {
  printType: string;
  material: string;
  widthM: number;
  heightM: number;
  quantity: number;
  addLamination: boolean;
  addEyelets: boolean;
  perimeter?: number; // linear metres for eyelets/hem
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { printType, material, widthM, heightM, quantity, addLamination, addEyelets, perimeter } = input;

  // Find the matching rate
  const rates = await db
    .select()
    .from(pricingRates)
    .where(eq(pricingRates.isActive, true));

  const rate = rates.find(
    (r) => r.printType === printType && r.material.toLowerCase() === material.toLowerCase()
  );

  if (!rate) throw new Error(`No pricing rate found for ${printType} / ${material}`);

  const sqm = widthM * heightM;
  const ratePerSqm = parseFloat(rate.ratePerSqm);
  const setupFee = parseFloat(rate.setupFee);
  const minCharge = parseFloat(rate.minCharge);
  const laminationRate = parseFloat(rate.laminationRatePerSqm ?? "0");
  const eyeletRate = parseFloat(rate.eyeletRatePerMetre ?? "0");

  // Print cost per unit
  const printCostPerUnit = sqm * ratePerSqm;
  const laminationCostPerUnit = addLamination ? sqm * laminationRate : 0;
  const perimetre = perimeter ?? 2 * (widthM + heightM);
  const eyeletCostPerUnit = addEyelets ? perimetre * eyeletRate : 0;
  const unitCost = printCostPerUnit + laminationCostPerUnit + eyeletCostPerUnit;

  // Total before setup
  const totalPrint = unitCost * quantity;
  const rawTotal = totalPrint + setupFee;
  const subtotal = Math.max(rawTotal, minCharge);

  // Build line items
  const lineItems: { description: string; quantity: string; unitPrice: string; total: string }[] = [];

  lineItems.push({
    description: `${printType.replace(/_/g, " ")} print — ${material} (${widthM}m × ${heightM}m = ${sqm.toFixed(2)}m²)`,
    quantity: String(quantity),
    unitPrice: printCostPerUnit.toFixed(2),
    total: (printCostPerUnit * quantity).toFixed(2),
  });

  if (addLamination && laminationCostPerUnit > 0) {
    lineItems.push({
      description: `Lamination (${sqm.toFixed(2)}m² @ R${laminationRate}/m²)`,
      quantity: String(quantity),
      unitPrice: laminationCostPerUnit.toFixed(2),
      total: (laminationCostPerUnit * quantity).toFixed(2),
    });
  }

  if (addEyelets && eyeletCostPerUnit > 0) {
    lineItems.push({
      description: `Eyelets/Hem (${perimetre.toFixed(1)}m perimeter @ R${eyeletRate}/m)`,
      quantity: String(quantity),
      unitPrice: eyeletCostPerUnit.toFixed(2),
      total: (eyeletCostPerUnit * quantity).toFixed(2),
    });
  }

  if (setupFee > 0) {
    lineItems.push({
      description: "Setup / Artwork fee",
      quantity: "1",
      unitPrice: setupFee.toFixed(2),
      total: setupFee.toFixed(2),
    });
  }

  return {
    sqm: parseFloat(sqm.toFixed(2)),
    unitCost: parseFloat(unitCost.toFixed(2)),
    subtotal: parseFloat(subtotal.toFixed(2)),
    lineItems,
    rateUsed: {
      material: rate.material,
      ratePerSqm,
      setupFee,
      minCharge,
    },
  };
}

// ─── Pricing Rate CRUD ────────────────────────────────────────────────────────
export async function createPricingRate(data: {
  printType: string;
  material: string;
  ratePerSqm: string;
  setupFee: string;
  minCharge: string;
  laminationRatePerSqm?: string;
  eyeletRatePerMetre?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(pricingRates).values({
    printType: data.printType as any,
    material: data.material,
    ratePerSqm: data.ratePerSqm,
    setupFee: data.setupFee,
    minCharge: data.minCharge,
    laminationRatePerSqm: data.laminationRatePerSqm ?? "0.00",
    eyeletRatePerMetre: data.eyeletRatePerMetre ?? "0.00",
    isActive: true,
  });
}

export async function updatePricingRate(
  id: number,
  data: Partial<{
    printType: string;
    material: string;
    ratePerSqm: string;
    setupFee: string;
    minCharge: string;
    laminationRatePerSqm: string;
    eyeletRatePerMetre: string;
    isActive: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { ...data };
  if (data.printType) updateData.printType = data.printType as any;
  await db.update(pricingRates).set(updateData).where(eq(pricingRates.id, id));
}

export async function deletePricingRate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pricingRates).where(eq(pricingRates.id, id));
}

export async function getAllPricingRates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pricingRates).orderBy(pricingRates.printType, pricingRates.material);
}

// ─── Job Costing / Material Usage ────────────────────────────────────────────
export async function logJobMaterialUsage(data: {
  orderId: number;
  inventoryItemId: number;
  quantityUsed: string;
  unitCost: string;
  totalCost: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(inventoryJobUsage).values(data);
}

export async function getJobUsageByOrder(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: inventoryJobUsage.id,
      orderId: inventoryJobUsage.orderId,
      inventoryItemId: inventoryJobUsage.inventoryItemId,
      itemName: inventoryItems.name,
      itemUnit: inventoryItems.unit,
      quantityUsed: inventoryJobUsage.quantityUsed,
      unitCost: inventoryJobUsage.unitCost,
      totalCost: inventoryJobUsage.totalCost,
      notes: inventoryJobUsage.notes,
      loggedAt: inventoryJobUsage.loggedAt,
    })
    .from(inventoryJobUsage)
    .leftJoin(inventoryItems, eq(inventoryJobUsage.inventoryItemId, inventoryItems.id))
    .where(eq(inventoryJobUsage.orderId, orderId));
  return rows;
}

export async function deleteJobUsageEntry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(inventoryJobUsage).where(eq(inventoryJobUsage.id, id));
}

export async function getJobCostingReport(from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return [];

  // Fetch all orders with their quoted total and customer name
  const orderRows = await db
    .select({
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      title: orders.title,
      status: orders.status,
      quotedTotal: orders.total,
      customerId: orders.customerId,
      customerName: customers.name,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .orderBy(orders.createdAt);

  // Fetch all job usage rows
  const usageRows = await db
    .select({
      orderId: inventoryJobUsage.orderId,
      totalCost: inventoryJobUsage.totalCost,
    })
    .from(inventoryJobUsage);

  // Aggregate actual cost per order
  const costByOrder: Record<number, number> = {};
  for (const u of usageRows) {
    costByOrder[u.orderId] = (costByOrder[u.orderId] ?? 0) + parseFloat(u.totalCost ?? "0");
  }

  // Filter by date range if provided
  const filtered = orderRows.filter((o) => {
    if (from && o.createdAt < from) return false;
    if (to && o.createdAt > to) return false;
    return true;
  });

  return filtered.map((o) => {
    const quoted = parseFloat(o.quotedTotal ?? "0");
    const actualCost = costByOrder[o.orderId] ?? 0;
    const grossMargin = quoted - actualCost;
    const marginPct = quoted > 0 ? (grossMargin / quoted) * 100 : null;
    return {
      orderId: o.orderId,
      orderNumber: o.orderNumber,
      title: o.title,
      status: o.status,
      customerName: o.customerName ?? "Unknown",
      quotedTotal: quoted,
      actualCost,
      grossMargin,
      marginPct: marginPct !== null ? parseFloat(marginPct.toFixed(1)) : null,
      hasMaterialsLogged: actualCost > 0,
      createdAt: o.createdAt,
    };
  });
}

// ─── Payroll Report ───────────────────────────────────────────────────────────
export async function getPayrollReport(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  // Fetch all completed shifts within the date range
  const shifts = await db
    .select({
      shiftId: shiftLogs.id,
      employeeId: shiftLogs.employeeId,
      employeeName: employees.name,
      employeeRole: employees.role,
      department: employees.department,
      hourlyRate: employees.hourlyRate,
      clockIn: shiftLogs.clockIn,
      clockOut: shiftLogs.clockOut,
      hoursWorked: shiftLogs.hoursWorked,
      earnings: shiftLogs.earnings,
    })
    .from(shiftLogs)
    .innerJoin(employees, eq(shiftLogs.employeeId, employees.id))
    .where(
      and(
        gte(shiftLogs.clockIn, startDate),
        lte(shiftLogs.clockIn, endDate),
        sql`${shiftLogs.clockOut} IS NOT NULL`
      )
    )
    .orderBy(employees.name, shiftLogs.clockIn);

  // Group by employee
  const employeeMap = new Map<
    number,
    {
      employeeId: number;
      employeeName: string;
      employeeRole: string;
      department: string | null;
      hourlyRate: string;
      totalShifts: number;
      totalHours: number;
      totalEarnings: number;
      shifts: typeof shifts;
    }
  >();

  for (const shift of shifts) {
    const hours = parseFloat(shift.hoursWorked ?? "0");
    const earn = parseFloat(shift.earnings ?? "0");

    if (!employeeMap.has(shift.employeeId)) {
      employeeMap.set(shift.employeeId, {
        employeeId: shift.employeeId,
        employeeName: shift.employeeName ?? "Unknown",
        employeeRole: shift.employeeRole ?? "staff",
        department: shift.department,
        hourlyRate: shift.hourlyRate ?? "0",
        totalShifts: 0,
        totalHours: 0,
        totalEarnings: 0,
        shifts: [],
      });
    }

    const emp = employeeMap.get(shift.employeeId)!;
    emp.totalShifts += 1;
    emp.totalHours += hours;
    emp.totalEarnings += earn;
    emp.shifts.push(shift);
  }

  return Array.from(employeeMap.values()).map((emp) => ({
    ...emp,
    totalHours: parseFloat(emp.totalHours.toFixed(2)),
    totalEarnings: parseFloat(emp.totalEarnings.toFixed(2)),
    avgHoursPerShift:
      emp.totalShifts > 0
        ? parseFloat((emp.totalHours / emp.totalShifts).toFixed(2))
        : 0,
  }));
}

// ─── Company Profile ─────────────────────────────────────────────────────────
export async function getCompanyProfile() {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(companyProfile).limit(1);
  return rows[0] ?? null;
}

export async function upsertCompanyProfile(
  data: Partial<Omit<typeof companyProfile.$inferInsert, "id" | "updatedAt">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Always update row id=1 (singleton pattern)
  const existing = await db.select({ id: companyProfile.id }).from(companyProfile).limit(1);
  if (existing.length === 0) {
    await db.insert(companyProfile).values({ name: "Bester.Builds", ...data });
  } else {
    await db.update(companyProfile).set(data).where(eq(companyProfile.id, existing[0].id));
  }
  const updated = await db.select().from(companyProfile).limit(1);
  return updated[0];
}

// ─── Local Auth: email + password ────────────────────────────────────────────

/** Hash a plain-text password using bcrypt (12 rounds). */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/** Verify a plain-text password against a stored bcrypt hash. */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Find a local user by email (case-insensitive). */
export async function findLocalUserByEmail(email: string): Promise<LocalUser | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(localUsers)
    .where(eq(localUsers.email, email.toLowerCase().trim()))
    .limit(1);
  return rows[0] ?? null;
}

/** Find a local user by id. */
export async function findLocalUserById(id: number): Promise<LocalUser | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(localUsers).where(eq(localUsers.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Create a new local user. Returns the inserted row. */
export async function createLocalUser(data: {
  email: string;
  password: string;
  name: string;
  role: "admin" | "employee";
  employeeId?: number | null;
}): Promise<LocalUser> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const passwordHash = await hashPassword(data.password);
  await db.insert(localUsers).values({
    email: data.email.toLowerCase().trim(),
    passwordHash,
    name: data.name,
    role: data.role,
    employeeId: data.employeeId ?? null,
    isActive: true,
  });
  const created = await findLocalUserByEmail(data.email);
  if (!created) throw new Error("Failed to create user");
  return created;
}

/** Update lastSignedIn timestamp for a local user. */
export async function touchLocalUserSignIn(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(localUsers).set({ lastSignedIn: new Date() }).where(eq(localUsers.id, id));
}

/** List all local users (admin view). */
export async function listLocalUsers(): Promise<LocalUser[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(localUsers).orderBy(localUsers.createdAt);
}

/** Deactivate / reactivate a local user. */
export async function setLocalUserActive(id: number, isActive: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(localUsers).set({ isActive }).where(eq(localUsers.id, id));
}

/** Update a local user's role. */
export async function setLocalUserRole(id: number, role: "admin" | "employee"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(localUsers).set({ role }).where(eq(localUsers.id, id));
}

/** Count how many admin-role local users exist (used to allow first-admin signup). */
export async function countLocalAdmins(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ id: localUsers.id })
    .from(localUsers)
    .where(eq(localUsers.role, "admin"));
  return rows.length;
}

// ─── Employee Allowlist ───────────────────────────────────────────────────────

/** Get all allowlisted emails. */
export async function listAllowlist(): Promise<EmployeeAllowlist[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employeeAllowlist).orderBy(employeeAllowlist.createdAt);
}

/** Check if an email is on the allowlist. Returns the entry or null. */
export async function findAllowlistEntry(email: string): Promise<EmployeeAllowlist | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(employeeAllowlist)
    .where(eq(employeeAllowlist.email, email.toLowerCase().trim()))
    .limit(1);
  return rows[0] ?? null;
}

/** Add an email to the allowlist. */
export async function addToAllowlist(data: {
  email: string;
  employeeId?: number | null;
  employeeName?: string | null;
  addedByAdminId?: number | null;
}): Promise<EmployeeAllowlist> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(employeeAllowlist).values({
    email: data.email.toLowerCase().trim(),
    employeeId: data.employeeId ?? null,
    employeeName: data.employeeName ?? null,
    addedByAdminId: data.addedByAdminId ?? null,
    hasSignedUp: false,
  });
  const entry = await findAllowlistEntry(data.email);
  if (!entry) throw new Error("Failed to add to allowlist");
  return entry;
}

/** Remove an email from the allowlist. */
export async function removeFromAllowlist(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(employeeAllowlist).where(eq(employeeAllowlist.id, id));
}

/** Mark an allowlist entry as signed-up (called after successful employee registration). */
export async function markAllowlistSignedUp(email: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(employeeAllowlist)
    .set({ hasSignedUp: true })
    .where(eq(employeeAllowlist.email, email.toLowerCase().trim()));
}

// ─── Shift Approval Workflow ─────────────────────────────────────────────────

/** Fetch shifts for the approval queue, optionally filtered by status and/or employee. */
export async function listShiftsForApproval(opts?: {
  status?: "pending" | "approved" | "rejected";
  employeeId?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [sql`${shiftLogs.clockOut} IS NOT NULL`];
  if (opts?.status) conditions.push(eq(shiftLogs.approvalStatus, opts.status));
  if (opts?.employeeId) conditions.push(eq(shiftLogs.employeeId, opts.employeeId));
  const rows = await db
    .select({
      id: shiftLogs.id,
      employeeId: shiftLogs.employeeId,
      employeeName: employees.name,
      employeeRole: employees.role,
      clockIn: shiftLogs.clockIn,
      clockOut: shiftLogs.clockOut,
      hoursWorked: shiftLogs.hoursWorked,
      earnings: shiftLogs.earnings,
      notes: shiftLogs.notes,
      approvalStatus: shiftLogs.approvalStatus,
      approvedBy: shiftLogs.approvedBy,
      approvedByName: shiftLogs.approvedByName,
      approvedAt: shiftLogs.approvedAt,
      rejectionReason: shiftLogs.rejectionReason,
      createdAt: shiftLogs.createdAt,
    })
    .from(shiftLogs)
    .leftJoin(employees, eq(shiftLogs.employeeId, employees.id))
    .where(and(...conditions))
    .orderBy(desc(shiftLogs.clockIn))
    .limit(opts?.limit ?? 200);
  return rows;
}

/** Approve a single shift log. */
export async function approveShift(
  shiftId: number,
  approvedById: number,
  approvedByName: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(shiftLogs)
    .set({
      approvalStatus: "approved",
      approvedBy: approvedById,
      approvedByName,
      approvedAt: new Date(),
      rejectionReason: null,
    })
    .where(eq(shiftLogs.id, shiftId));
}

/** Reject a single shift log with an optional reason. */
export async function rejectShift(
  shiftId: number,
  approvedById: number,
  approvedByName: string,
  reason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(shiftLogs)
    .set({
      approvalStatus: "rejected",
      approvedBy: approvedById,
      approvedByName,
      approvedAt: new Date(),
      rejectionReason: reason ?? null,
    })
    .where(eq(shiftLogs.id, shiftId));
}

/** Bulk-approve multiple shifts at once. */
export async function bulkApproveShifts(
  shiftIds: number[],
  approvedById: number,
  approvedByName: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (shiftIds.length === 0) return;
  await db
    .update(shiftLogs)
    .set({
      approvalStatus: "approved",
      approvedBy: approvedById,
      approvedByName,
      approvedAt: new Date(),
      rejectionReason: null,
    })
    .where(sql`${shiftLogs.id} IN (${sql.join(shiftIds.map((id) => sql`${id}`), sql`, `)})`);
}

/** Count pending shifts (for badge/notification). */
export async function countPendingShifts(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(shiftLogs)
    .where(
      and(
        eq(shiftLogs.approvalStatus, "pending"),
        sql`${shiftLogs.clockOut} IS NOT NULL`
      )
    );
  return Number(row?.count ?? 0);
}

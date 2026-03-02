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

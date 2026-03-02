import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAppointment,
  createCustomer,
  createEmployee,
  createInteraction,
  createInventoryItem,
  createInventoryTransaction,
  createInvoice,
  createLead,
  createOrder,
  createPayment,
  createTask,
  deleteAppointment,
  deleteCustomer,
  deleteEmployee,
  deleteInventoryItem,
  deleteLead,
  deleteOrder,
  deleteTask,
  getAnalyticsSummary,
  getAppointments,
  getCustomerById,
  getCustomers,
  getEmployeeById,
  getEmployees,
  getInteractionsByCustomer,
  getInventoryItems,
  getInventoryTransactions,
  getInvoiceById,
  getInvoices,
  getLeads,
  getOrderById,
  getOrderItems,
  getOrders,
  getOrdersByStatus,
  getPayments,
  getRevenueByMonth,
  getTopCustomers,
  getTasks,
  updateAppointment,
  updateCustomer,
  updateEmployee,
  updateInventoryItem,
  updateInvoice,
  updateLead,
  updateOrder,
  updatePayment,
  updateTask,
  clockIn,
  clockOut,
  getActiveShift,
  getShiftLogs,
  getShiftSummary,
  setEmployeePin,
  clearEmployeePin,
  clockInByPin,
  clockOutByPin,
  findEmployeeByPin,
} from "./db";

// ─── CRM Router ──────────────────────────────────────────────────────────────
const crmRouter = router({
  // Customers
  listCustomers: protectedProcedure
    .input(z.object({ search: z.string().optional(), status: z.string().optional() }).optional())
    .query(({ input }) => getCustomers(input?.search, input?.status)),

  getCustomer: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getCustomerById(input.id)),

  createCustomer: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      company: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      status: z.enum(["active", "inactive", "prospect"]).optional(),
      customerType: z.enum(["individual", "business", "reseller"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => createCustomer(input)),

  updateCustomer: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      company: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      status: z.enum(["active", "inactive", "prospect"]).optional(),
      customerType: z.enum(["individual", "business", "reseller"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => { const { id, ...data } = input; return updateCustomer(id, data); }),

  deleteCustomer: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteCustomer(input.id)),

  // Interactions
  listInteractions: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(({ input }) => getInteractionsByCustomer(input.customerId)),

  createInteraction: protectedProcedure
    .input(z.object({
      customerId: z.number(),
      type: z.enum(["call", "email", "meeting", "quote", "follow_up", "complaint", "other"]),
      subject: z.string().min(1),
      notes: z.string().optional(),
      outcome: z.string().optional(),
      nextFollowUp: z.date().optional(),
    }))
    .mutation(({ input, ctx }) => createInteraction({ ...input, createdBy: ctx.user.id })),

  // Leads
  listLeads: protectedProcedure
    .input(z.object({ stage: z.string().optional() }).optional())
    .query(({ input }) => getLeads(input?.stage)),

  createLead: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      company: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      source: z.enum(["website", "referral", "social_media", "cold_call", "trade_show", "other"]).optional(),
      stage: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]).optional(),
      estimatedValue: z.string().optional(),
      printingNeeds: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => createLead(input)),

  updateLead: protectedProcedure
    .input(z.object({
      id: z.number(),
      stage: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]).optional(),
      estimatedValue: z.string().optional(),
      notes: z.string().optional(),
      name: z.string().optional(),
      company: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      source: z.enum(["website", "referral", "social_media", "cold_call", "trade_show", "other"]).optional(),
      printingNeeds: z.string().optional(),
    }))
    .mutation(({ input }) => { const { id, ...data } = input; return updateLead(id, data); }),

  deleteLead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteLead(input.id)),
});

// ─── Inventory Router ────────────────────────────────────────────────────────
const inventoryRouter = router({
  listItems: protectedProcedure
    .input(z.object({ category: z.string().optional(), lowStock: z.boolean().optional() }).optional())
    .query(({ input }) => getInventoryItems(input?.category, input?.lowStock)),

  createItem: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      sku: z.string().optional(),
      category: z.enum(["paper", "vinyl", "fabric", "ink", "substrate", "laminate", "hardware", "consumable", "equipment", "other"]),
      description: z.string().optional(),
      unit: z.string().optional(),
      currentStock: z.string().optional(),
      minStockLevel: z.string().optional(),
      maxStockLevel: z.string().optional(),
      unitCost: z.string().optional(),
      unitPrice: z.string().optional(),
      supplier: z.string().optional(),
      supplierSku: z.string().optional(),
      location: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => createInventoryItem(input)),

  updateItem: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      sku: z.string().optional(),
      category: z.enum(["paper", "vinyl", "fabric", "ink", "substrate", "laminate", "hardware", "consumable", "equipment", "other"]).optional(),
      description: z.string().optional(),
      unit: z.string().optional(),
      currentStock: z.string().optional(),
      minStockLevel: z.string().optional(),
      maxStockLevel: z.string().optional(),
      unitCost: z.string().optional(),
      unitPrice: z.string().optional(),
      supplier: z.string().optional(),
      location: z.string().optional(),
      isActive: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => { const { id, ...data } = input; return updateInventoryItem(id, data); }),

  deleteItem: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteInventoryItem(input.id)),

  listTransactions: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .query(({ input }) => getInventoryTransactions(input.itemId)),

  addTransaction: protectedProcedure
    .input(z.object({
      itemId: z.number(),
      type: z.enum(["purchase", "usage", "adjustment", "return", "waste"]),
      quantity: z.string(),
      unitCost: z.string().optional(),
      reference: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input, ctx }) => createInventoryTransaction({ ...input, createdBy: ctx.user.id })),
});

// ─── Orders Router ───────────────────────────────────────────────────────────
const ordersRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional(), customerId: z.number().optional() }).optional())
    .query(({ input }) => getOrders(input?.status, input?.customerId)),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getOrderById(input.id)),

  getItems: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(({ input }) => getOrderItems(input.orderId)),

  create: protectedProcedure
    .input(z.object({
      customerId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(["quote", "confirmed", "in_production", "quality_check", "ready", "dispatched", "delivered", "cancelled"]).optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
      printType: z.enum(["banner", "poster", "signage", "vehicle_wrap", "canvas", "fabric", "wallpaper", "floor_graphic", "window_graphic", "other"]).optional(),
      width: z.string().optional(),
      height: z.string().optional(),
      dimensionUnit: z.enum(["mm", "cm", "m", "inch", "ft"]).optional(),
      quantity: z.number().optional(),
      material: z.string().optional(),
      finishing: z.string().optional(),
      subtotal: z.string().optional(),
      taxRate: z.string().optional(),
      taxAmount: z.string().optional(),
      discountAmount: z.string().optional(),
      total: z.string().optional(),
      dueDate: z.date().optional(),
      deliveryMethod: z.enum(["pickup", "delivery", "courier"]).optional(),
      deliveryAddress: z.string().optional(),
      assignedTo: z.number().optional(),
      notes: z.string().optional(),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.string(),
        unitPrice: z.string(),
        total: z.string(),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { items = [], ...orderData } = input;
      const orderNumber = `BB-${Date.now().toString().slice(-6)}`;
      return createOrder({ ...orderData, orderNumber, createdBy: ctx.user.id }, items as any);
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["quote", "confirmed", "in_production", "quality_check", "ready", "dispatched", "delivered", "cancelled"]).optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      printType: z.enum(["banner", "poster", "signage", "vehicle_wrap", "canvas", "fabric", "wallpaper", "floor_graphic", "window_graphic", "other"]).optional(),
      material: z.string().optional(),
      finishing: z.string().optional(),
      total: z.string().optional(),
      subtotal: z.string().optional(),
      taxRate: z.string().optional(),
      taxAmount: z.string().optional(),
      discountAmount: z.string().optional(),
      dueDate: z.date().optional(),
      deliveryMethod: z.enum(["pickup", "delivery", "courier"]).optional(),
      deliveryAddress: z.string().optional(),
      assignedTo: z.number().optional(),
      notes: z.string().optional(),
      internalNotes: z.string().optional(),
    }))
    .mutation(({ input }) => { const { id, ...data } = input; return updateOrder(id, data); }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteOrder(input.id)),
});

// ─── Invoices Router ─────────────────────────────────────────────────────────
const invoicesRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional(), customerId: z.number().optional() }).optional())
    .query(({ input }) => getInvoices(input?.status, input?.customerId)),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getInvoiceById(input.id)),

  create: protectedProcedure
    .input(z.object({
      customerId: z.number(),
      orderId: z.number().optional(),
      subtotal: z.string(),
      taxRate: z.string().optional(),
      taxAmount: z.string().optional(),
      discountAmount: z.string().optional(),
      total: z.string(),
      amountDue: z.string(),
      dueDate: z.date(),
      notes: z.string().optional(),
      terms: z.string().optional(),
    }))
    .mutation(({ input }) => {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      return createInvoice({ ...input, invoiceNumber });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["draft", "sent", "viewed", "partial", "paid", "overdue", "cancelled"]).optional(),
      notes: z.string().optional(),
      terms: z.string().optional(),
      dueDate: z.date().optional(),
    }))
    .mutation(({ input }) => { const { id, ...data } = input; return updateInvoice(id, data); }),
});

// ─── Employees Router ────────────────────────────────────────────────────────
const employeesRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(({ input }) => getEmployees(input?.status)),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getEmployeeById(input.id)),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      role: z.enum(["manager", "print_operator", "designer", "sales", "delivery", "admin", "other"]),
      department: z.string().optional(),
      status: z.enum(["active", "inactive", "on_leave"]).optional(),
      hireDate: z.date().optional(),
      hourlyRate: z.string().optional(),
      skills: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => createEmployee(input)),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      role: z.enum(["manager", "print_operator", "designer", "sales", "delivery", "admin", "other"]).optional(),
      department: z.string().optional(),
      status: z.enum(["active", "inactive", "on_leave"]).optional(),
      hourlyRate: z.string().optional(),
      skills: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => { const { id, ...data } = input; return updateEmployee(id, data); }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteEmployee(input.id)),
});

// ─── Tasks Router ────────────────────────────────────────────────────────────
const tasksRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional(), assignedTo: z.number().optional(), orderId: z.number().optional() }).optional())
    .query(({ input }) => getTasks(input?.status, input?.assignedTo, input?.orderId)),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      orderId: z.number().optional(),
      assignedTo: z.number().optional(),
      status: z.enum(["pending", "in_progress", "review", "completed", "cancelled"]).optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
      category: z.enum(["design", "printing", "finishing", "quality_check", "delivery", "admin", "other"]).optional(),
      estimatedHours: z.string().optional(),
      dueDate: z.date().optional(),
    }))
    .mutation(({ input, ctx }) => createTask({ ...input, createdBy: ctx.user.id })),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      assignedTo: z.number().optional(),
      status: z.enum(["pending", "in_progress", "review", "completed", "cancelled"]).optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
      category: z.enum(["design", "printing", "finishing", "quality_check", "delivery", "admin", "other"]).optional(),
      estimatedHours: z.string().optional(),
      actualHours: z.string().optional(),
      dueDate: z.date().optional(),
      completedAt: z.date().optional(),
    }))
    .mutation(({ input }) => { const { id, ...data } = input; return updateTask(id, data); }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTask(input.id)),
});

// ─── Payments Router ─────────────────────────────────────────────────────────
const paymentsRouter = router({
  list: protectedProcedure
    .input(z.object({ status: z.string().optional(), customerId: z.number().optional() }).optional())
    .query(({ input }) => getPayments(input?.status, input?.customerId)),

  create: protectedProcedure
    .input(z.object({
      invoiceId: z.number(),
      customerId: z.number(),
      amount: z.string(),
      method: z.enum(["cash", "card", "bank_transfer", "eft", "cheque", "online", "other"]),
      status: z.enum(["pending", "completed", "failed", "refunded"]).optional(),
      reference: z.string().optional(),
      notes: z.string().optional(),
      paidAt: z.date().optional(),
    }))
    .mutation(({ input }) => createPayment({ ...input, paidAt: input.paidAt ?? new Date() })),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "completed", "failed", "refunded"]).optional(),
      reference: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => { const { id, ...data } = input; return updatePayment(id, data); }),
});

// ─── Analytics Router ────────────────────────────────────────────────────────
const analyticsRouter = router({
  summary: protectedProcedure.query(() => getAnalyticsSummary()),
  revenueByMonth: protectedProcedure.query(() => getRevenueByMonth()),
  ordersByStatus: protectedProcedure.query(() => getOrdersByStatus()),
  topCustomers: protectedProcedure.query(() => getTopCustomers()),
});

// ─── Scheduling Router ───────────────────────────────────────────────────────
const schedulingRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      from: z.date().optional(),
      to: z.date().optional(),
    }).optional())
    .query(({ input }) => getAppointments(input?.status, input?.from, input?.to)),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      type: z.enum(["client_consultation", "production", "delivery", "equipment_maintenance", "team_meeting", "other"]),
      customerId: z.number().optional(),
      orderId: z.number().optional(),
      assignedTo: z.number().optional(),
      status: z.enum(["scheduled", "confirmed", "in_progress", "completed", "cancelled", "rescheduled"]).optional(),
      startTime: z.date(),
      endTime: z.date(),
      location: z.string().optional(),
      description: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(({ input, ctx }) => createAppointment({ ...input, createdBy: ctx.user.id })),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      type: z.enum(["client_consultation", "production", "delivery", "equipment_maintenance", "team_meeting", "other"]).optional(),
      status: z.enum(["scheduled", "confirmed", "in_progress", "completed", "cancelled", "rescheduled"]).optional(),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      location: z.string().optional(),
      description: z.string().optional(),
      notes: z.string().optional(),
      assignedTo: z.number().optional(),
    }))
    .mutation(({ input }) => { const { id, ...data } = input; return updateAppointment(id, data); }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteAppointment(input.id)),
});

// ─── Shifts Router (Clock In/Out) ───────────────────────────────────────────
const shiftsRouter = router({
  /** Get all shifts, optionally filtered by employee */
  list: protectedProcedure
    .input(z.object({ employeeId: z.number().optional(), limit: z.number().optional() }).optional())
    .query(({ input }) => getShiftLogs(input?.employeeId, input?.limit)),

  /** Get the currently active (open) shift for an employee */
  activeShift: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(({ input }) => getActiveShift(input.employeeId)),

  /** Clock an employee in */
  clockIn: protectedProcedure
    .input(z.object({ employeeId: z.number(), notes: z.string().optional() }))
    .mutation(({ input }) => clockIn(input.employeeId, input.notes)),

  /** Clock an employee out */
  clockOut: protectedProcedure
    .input(z.object({ shiftId: z.number(), employeeId: z.number(), notes: z.string().optional() }))
    .mutation(({ input }) => clockOut(input.shiftId, input.employeeId, input.notes)),

  /** Aggregated summary: total hours & earnings per employee */
  summary: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      from: z.date().optional(),
      to: z.date().optional(),
    }).optional())
    .query(({ input }) => getShiftSummary(input?.employeeId, input?.from, input?.to)),

  /** Set or update an employee's 4-digit clock-in PIN (admin only) */
  setPin: protectedProcedure
    .input(z.object({
      employeeId: z.number(),
      pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
    }))
    .mutation(({ input }) => setEmployeePin(input.employeeId, input.pin)),

  /** Clear/reset an employee's PIN (admin only) */
  clearPin: protectedProcedure
    .input(z.object({ employeeId: z.number() }))
    .mutation(({ input }) => clearEmployeePin(input.employeeId)),

  /** Check if a PIN is valid and return the employee (without hash) — public so kiosk works unauthenticated */
  lookupByPin: publicProcedure
    .input(z.object({ pin: z.string().length(4) }))
    .query(({ input }) => findEmployeeByPin(input.pin)),

  /** Clock in using a PIN — public so kiosk works unauthenticated */
  clockInByPin: publicProcedure
    .input(z.object({
      pin: z.string().length(4),
      notes: z.string().optional(),
    }))
    .mutation(({ input }) => clockInByPin(input.pin, input.notes)),

  /** Clock out using a PIN — public so kiosk works unauthenticated */
  clockOutByPin: publicProcedure
    .input(z.object({
      pin: z.string().length(4),
    }))
    .mutation(({ input }) => clockOutByPin(input.pin)),
});

// ─── App Router ──────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  crm: crmRouter,
  inventory: inventoryRouter,
  orders: ordersRouter,
  invoices: invoicesRouter,
  employees: employeesRouter,
  tasks: tasksRouter,
  payments: paymentsRouter,
  analytics: analyticsRouter,
  scheduling: schedulingRouter,
  shifts: shiftsRouter,
});

export type AppRouter = typeof appRouter;

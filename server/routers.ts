import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { TRPCError } from "@trpc/server";
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
  getTimesheetExport,
  createInvoiceFromOrder,
  getOrderWithItemsForInvoice,
  getPricingRates,
  calculatePrintCost,
  getAllPricingRates,
  createPricingRate,
  updatePricingRate,
  deletePricingRate,
  logJobMaterialUsage,
  getJobUsageByOrder,
  deleteJobUsageEntry,
  getJobCostingReport,
  getPayrollReport,
  getCompanyProfile,
  upsertCompanyProfile,
  // Local auth
  findLocalUserByEmail,
  findLocalUserById,
  createLocalUser,
  touchLocalUserSignIn,
  listLocalUsers,
  setLocalUserActive,
  setLocalUserRole,
  countLocalAdmins,
  verifyPassword,
  // Allowlist
  listAllowlist,
  findAllowlistEntry,
  addToAllowlist,
  removeFromAllowlist,
  markAllowlistSignedUp,
  // Shift approval
  listShiftsForApproval,
  approveShift,
  rejectShift,
  bulkApproveShifts,
  countPendingShifts,
  // Notifications
  listNotificationsForUser,
  countUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  listAllNotifications,
  // Job Cards
  listInvoicesWithPO,
  createJobCard,
  getJobCard,
  listJobCards,
  updateJobCard,
  updateInvoicePoNumber,
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

  // One-click quote-to-invoice conversion
  getForInvoice: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getOrderWithItemsForInvoice(input.id)),

  convertToInvoice: protectedProcedure
    .input(z.object({
      orderId: z.number(),
      taxRate: z.string().default("15"),
      dueDate: z.date(),
      terms: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      return createInvoiceFromOrder(
        input.orderId,
        invoiceNumber,
        input.dueDate,
        input.taxRate,
        input.terms
      );
    }),

  // Pricing calculator
  getPricingRates: protectedProcedure
    .input(z.object({ printType: z.string().optional() }).optional())
    .query(({ input }) => getPricingRates(input?.printType)),

  calculateCost: protectedProcedure
    .input(z.object({
      printType: z.string(),
      material: z.string(),
      widthM: z.number().positive(),
      heightM: z.number().positive(),
      quantity: z.number().int().positive().default(1),
      addLamination: z.boolean().default(false),
      addEyelets: z.boolean().default(false),
      perimeter: z.number().optional(),
    }))
    .mutation(({ input }) => calculatePrintCost(input)),
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
      poNumber: z.string().optional(),
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
      poNumber: z.string().optional().nullable(),
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

  /** Export timesheet data for a date range (payroll CSV) */
  exportTimesheet: protectedProcedure
    .input(z.object({
      from: z.date(),
      to: z.date(),
      employeeId: z.number().optional(),
    }))
    .query(({ input }) => getTimesheetExport(input.from, input.to, input.employeeId)),

  // ── Approval workflow ──────────────────────────────────────────────────────

  /** List shifts for the approval queue (admin only). */
  listForApproval: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected"]).optional(),
      employeeId: z.number().optional(),
      limit: z.number().optional(),
    }).optional())
    .query(({ input }) => listShiftsForApproval(input ?? undefined)),

  /** Count pending shifts (for sidebar badge). */
  countPending: protectedProcedure
    .query(() => countPendingShifts()),

  /** Approve a single shift (admin only). */
  approve: protectedProcedure
    .input(z.object({ shiftId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const isOAuthAdmin = ctx.user?.role === "admin";
      const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
      const session = await verifyLocalSession(token);
      if (!isOAuthAdmin && (!session || session.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      const adminId = session?.localUserId ?? 0;
      const adminName = isOAuthAdmin ? (ctx.user?.name ?? "Admin") : ((await findLocalUserById(adminId))?.name ?? "Admin");
      await approveShift(input.shiftId, adminId, adminName);
      return { success: true };
    }),
  /** Reject a shift with an optional reason (admin only). */
  reject: protectedProcedure
    .input(z.object({ shiftId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const isOAuthAdmin = ctx.user?.role === "admin";
      const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
      const session = await verifyLocalSession(token);
      if (!isOAuthAdmin && (!session || session.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      const adminId = session?.localUserId ?? 0;
      const adminName = isOAuthAdmin ? (ctx.user?.name ?? "Admin") : ((await findLocalUserById(adminId))?.name ?? "Admin");
      await rejectShift(input.shiftId, adminId, adminName, input.reason);
      return { success: true };
    }),
  /** Bulk-approve multiple shifts at once (admin only). */
  bulkApprove: protectedProcedure
    .input(z.object({ shiftIds: z.array(z.number()).min(1) }))
    .mutation(async ({ input, ctx }) => {
      const isOAuthAdmin = ctx.user?.role === "admin";
      const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
      const session = await verifyLocalSession(token);
      if (!isOAuthAdmin && (!session || session.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      const adminId = session?.localUserId ?? 0;
      const adminName = isOAuthAdmin ? (ctx.user?.name ?? "Admin") : ((await findLocalUserById(adminId))?.name ?? "Admin");
      await bulkApproveShifts(input.shiftIds, adminId, adminName);
      return { success: true, count: input.shiftIds.length };
    }),
});

// ─── Job Costing Router ─────────────────────────────────────────────────────────
const jobCostingRouter = router({
  report: protectedProcedure
    .input(
      z.object({
        from: z.date().optional(),
        to: z.date().optional(),
      }).optional()
    )
    .query(({ input }) => getJobCostingReport(input?.from, input?.to)),

  getUsageByOrder: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(({ input }) => getJobUsageByOrder(input.orderId)),

  logUsage: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        inventoryItemId: z.number(),
        quantityUsed: z.string(),
        unitCost: z.string(),
        totalCost: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ input }) => logJobMaterialUsage(input)),

  deleteUsage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteJobUsageEntry(input.id)),
});

// ─── Pricing Router ─────────────────────────────────────────────────────────
const pricingRouter = router({
  list: protectedProcedure.query(() => getAllPricingRates()),

  create: protectedProcedure
    .input(
      z.object({
        printType: z.string().min(1),
        material: z.string().min(1),
        ratePerSqm: z.string(),
        setupFee: z.string(),
        minCharge: z.string(),
        laminationRatePerSqm: z.string().optional(),
        eyeletRatePerMetre: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return createPricingRate(input);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        printType: z.string().optional(),
        material: z.string().optional(),
        ratePerSqm: z.string().optional(),
        setupFee: z.string().optional(),
        minCharge: z.string().optional(),
        laminationRatePerSqm: z.string().optional(),
        eyeletRatePerMetre: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const { id, ...data } = input;
      return updatePricingRate(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => {
      if (ctx.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return deletePricingRate(input.id);
    }),
});

// ─── Payroll Router ─────────────────────────────────────────────────────────
// ─── Company Profile Router ─────────────────────────────────────────────────
const companyRouter = router({
  getProfile: protectedProcedure.query(() => getCompanyProfile()),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        tagline: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        address: z.string().optional(),
        vatNumber: z.string().optional(),
        regNumber: z.string().optional(),
        website: z.string().optional(),
        bankName: z.string().optional(),
        accountHolder: z.string().optional(),
        accountNumber: z.string().optional(),
        branchCode: z.string().optional(),
        accountType: z.string().optional(),
        paymentReference: z.string().optional(),
        invoiceTerms: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }
      return upsertCompanyProfile(input);
    }),
});

const payrollRouter = router({
  report: protectedProcedure
    .input(
      (input: unknown) => {
        const i = input as { startDate: Date; endDate: Date };
        if (!i?.startDate || !i?.endDate) throw new TRPCError({ code: "BAD_REQUEST", message: "startDate and endDate are required" });
        return i;
      }
    )
    .query(async ({ input }) => {
      return getPayrollReport(new Date(input.startDate), new Date(input.endDate));
    }),
});

// ─── Local Auth Router ─────────────────────────────────────────────────────
// Provides email/password sign-up, sign-in, and session management.
// The JWT cookie is the same one used by Manus OAuth (same secret, same cookie name)
// but the payload uses localUserId instead of openId.
const LOCAL_AUTH_COOKIE = "bester_local_session";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

import { SignJWT, jwtVerify } from "jose";

async function signLocalSession(userId: number, role: string, name: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
  return new SignJWT({ localUserId: userId, role, name })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Math.floor((Date.now() + ONE_YEAR_MS) / 1000))
    .sign(secret);
}

export async function verifyLocalSession(token: string | undefined): Promise<{ localUserId: number; role: string; name: string } | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const { localUserId, role, name } = payload as Record<string, unknown>;
    if (typeof localUserId !== "number" || typeof role !== "string" || typeof name !== "string") return null;
    return { localUserId, role, name };
  } catch {
    return null;
  }
}

const localAuthRouter = router({
  /** Sign up with email + password. Admins can sign up freely if no admin exists yet.
   *  Employees must have their email on the allowlist. */
  signup: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8, "Password must be at least 8 characters"),
      name: z.string().min(1),
      role: z.enum(["admin", "employee"]).default("employee"),
    }))
    .mutation(async ({ input, ctx }) => {
      const email = input.email.toLowerCase().trim();

      // Check if email already registered
      const existing = await findLocalUserByEmail(email);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });

      let role = input.role;
      let employeeId: number | null = null;

      if (role === "admin") {
        // First admin can sign up freely; subsequent admins must be promoted by existing admin
        const adminCount = await countLocalAdmins();
        if (adminCount > 0) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin accounts can only be created by an existing admin." });
        }
      } else {
        // Employee: must be on the allowlist
        const entry = await findAllowlistEntry(email);
        if (!entry) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Your email is not on the employee access list. Please ask your admin to add you." });
        }
        if (entry.hasSignedUp) {
          throw new TRPCError({ code: "CONFLICT", message: "An account for this email already exists." });
        }
        employeeId = entry.employeeId ?? null;
      }

      const user = await createLocalUser({ email, password: input.password, name: input.name, role, employeeId });

      if (role === "employee") {
        await markAllowlistSignedUp(email);
      }

      const token = await signLocalSession(user.id, user.role, user.name);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(LOCAL_AUTH_COOKIE, token, { ...cookieOptions, maxAge: ONE_YEAR_MS, httpOnly: true });

      return { success: true, role: user.role, name: user.name };
    }),

  /** Sign in with email + password. */
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const email = input.email.toLowerCase().trim();
      const user = await findLocalUserByEmail(email);
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
      if (!user.isActive) throw new TRPCError({ code: "FORBIDDEN", message: "Your account has been deactivated. Contact your admin." });

      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });

      await touchLocalUserSignIn(user.id);
      const token = await signLocalSession(user.id, user.role, user.name);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(LOCAL_AUTH_COOKIE, token, { ...cookieOptions, maxAge: ONE_YEAR_MS, httpOnly: true });

      return { success: true, role: user.role, name: user.name, employeeId: user.employeeId };
    }),

  /** Get the current local session user. */
  me: publicProcedure.query(async ({ ctx }) => {
    const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
    const session = await verifyLocalSession(token);
    if (!session) return null;
    const user = await findLocalUserById(session.localUserId);
    if (!user || !user.isActive) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role, employeeId: user.employeeId };
  }),

  /** Sign out of local session. */
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(LOCAL_AUTH_COOKIE, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),

    /** Admin: list all local users. */
  listUsers: publicProcedure.query(async ({ ctx }) => {
    const isOAuthAdmin = ctx.user?.role === "admin";
    const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
    const session = await verifyLocalSession(token);
    if (!isOAuthAdmin && (!session || session.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN" });
    const users = await listLocalUsers();
    return users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, isActive: u.isActive, employeeId: u.employeeId, createdAt: u.createdAt, lastSignedIn: u.lastSignedIn }));
  }),
  /** Admin: activate or deactivate a user. */
  setActive: publicProcedure
    .input(z.object({ userId: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const isOAuthAdmin = ctx.user?.role === "admin";
      const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
      const session = await verifyLocalSession(token);
      if (!isOAuthAdmin && (!session || session.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      await setLocalUserActive(input.userId, input.isActive);
      return { success: true };
    }),
  /** Admin: change a user's role. */
  setRole: publicProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["admin", "employee"]) }))
    .mutation(async ({ input, ctx }) => {
      const isOAuthAdmin = ctx.user?.role === "admin";
      const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
      const session = await verifyLocalSession(token);
      if (!isOAuthAdmin && (!session || session.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      await setLocalUserRole(input.userId, input.role);
      return { success: true };
    }),
});

// ─── Employee Portal Shifts Router (local-auth aware) ────────────────────────
// These procedures accept the local session cookie so employees can clock in/out
// without needing a Manus OAuth session.
const employeePortalRouter = router({
  /** Get active shift for the calling employee (local auth). */
  activeShift: publicProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input, ctx }) => {
      const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
      const session = await verifyLocalSession(token);
      if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
      // Employees can only see their own shift; admins can see any
      if (session.role === "employee") {
        const user = await findLocalUserById(session.localUserId);
        if (!user || user.employeeId !== input.employeeId) throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getActiveShift(input.employeeId);
    }),

  /** List shifts for the calling employee (local auth). */
  list: publicProcedure
    .input(z.object({ employeeId: z.number(), limit: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
      const session = await verifyLocalSession(token);
      if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
      if (session.role === "employee") {
        const user = await findLocalUserById(session.localUserId);
        if (!user || (input?.employeeId && user.employeeId !== input.employeeId)) throw new TRPCError({ code: "FORBIDDEN" });
        return getShiftLogs(user.employeeId ?? undefined, input?.limit);
      }
      return getShiftLogs(input?.employeeId, input?.limit);
    }),

  /** Clock in (local auth). */
  clockIn: publicProcedure
    .input(z.object({ employeeId: z.number(), notes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
      const session = await verifyLocalSession(token);
      if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
      if (session.role === "employee") {
        const user = await findLocalUserById(session.localUserId);
        if (!user || user.employeeId !== input.employeeId) throw new TRPCError({ code: "FORBIDDEN" });
      }
      return clockIn(input.employeeId, input.notes);
    }),

  /** Clock out (local auth). */
  clockOut: publicProcedure
    .input(z.object({ shiftId: z.number(), employeeId: z.number(), notes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
      const session = await verifyLocalSession(token);
      if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
      if (session.role === "employee") {
        const user = await findLocalUserById(session.localUserId);
        if (!user || user.employeeId !== input.employeeId) throw new TRPCError({ code: "FORBIDDEN" });
      }
      return clockOut(input.shiftId, input.employeeId, input.notes);
    }),

  /** Get employee record (local auth). */
  getEmployee: publicProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input, ctx }) => {
      const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
      const session = await verifyLocalSession(token);
      if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
      if (session.role === "employee") {
        const user = await findLocalUserById(session.localUserId);
        if (!user || user.employeeId !== input.employeeId) throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getEmployeeById(input.employeeId);
    }),
});

// ─── Employee Allowlist Router ────────────────────────────────────────────────
const allowlistRouter = router({
    list: publicProcedure.query(async ({ ctx }) => {
    const isOAuthAdmin = ctx.user?.role === "admin";
    const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
    const session = await verifyLocalSession(token);
    if (!isOAuthAdmin && (!session || session.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN" });
    return listAllowlist();
  }),
  add: publicProcedure
    .input(z.object({
      email: z.string().email(),
      employeeId: z.number().optional(),
      employeeName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const isOAuthAdmin = ctx.user?.role === "admin";
      const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
      const session = await verifyLocalSession(token);
      if (!isOAuthAdmin && (!session || session.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      const entry = await addToAllowlist({
        email: input.email,
        employeeId: input.employeeId ?? null,
        employeeName: input.employeeName ?? null,
        addedByAdminId: session?.localUserId ?? 0,
      });
      return entry;
    }),
  remove: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const isOAuthAdmin = ctx.user?.role === "admin";
      const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
      const session = await verifyLocalSession(token);
      if (!isOAuthAdmin && (!session || session.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      await removeFromAllowlist(input.id);
      return { success: true };
    }),
});

// ─── Notifications Router ────────────────────────────────────────────────────
const notificationsRouter = router({
  /** List notifications for the calling local-auth user. */
  list: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
      const session = await verifyLocalSession(token);
      if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
      return listNotificationsForUser(session.localUserId, input?.limit);
    }),

  /** Count unread notifications for the calling user. */
  countUnread: publicProcedure
    .query(async ({ ctx }) => {
      const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
      const session = await verifyLocalSession(token);
      if (!session) return 0;
      return countUnreadNotifications(session.localUserId);
    }),

  /** Mark a single notification as read. */
  markRead: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
      const session = await verifyLocalSession(token);
      if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
      await markNotificationRead(input.id, session.localUserId);
      return { success: true };
    }),

  /** Mark all notifications as read for the calling user. */
  markAllRead: publicProcedure
    .mutation(async ({ ctx }) => {
      const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
      const session = await verifyLocalSession(token);
      if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
      await markAllNotificationsRead(session.localUserId);
      return { success: true };
    }),

  /** List all notifications across all employees (admin only). */
  listAll: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const isOAuthAdmin = ctx.user?.role === "admin";
      const token = ctx.req.cookies?.[LOCAL_AUTH_COOKIE];
      const session = await verifyLocalSession(token);
      if (!isOAuthAdmin && (!session || session.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      return listAllNotifications(input?.limit);
    }),
});

// ─── Job Cards Router ───────────────────────────────────────────────────────
const jobCardsRouter = router({
  /** List all invoices that have a PO number set. */
  listInvoicesWithPO: protectedProcedure.query(() => listInvoicesWithPO()),

  /** List all job cards, optionally filtered by status. */
  list: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(({ input }) => listJobCards(input?.status)),

  /** Get a single job card by ID. */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getJobCard(input.id)),

  /** Create a new job card from an invoice. */
  create: protectedProcedure
    .input(z.object({
      invoiceId: z.number(),
      poNumber: z.string().min(1),
      jobTitle: z.string().min(1),
      customerName: z.string().optional(),
      assignedTo: z.number().optional(),
      assignedToName: z.string().optional(),
      dueDate: z.string().optional(),
      printType: z.string().optional(),
      width: z.string().optional(),
      height: z.string().optional(),
      dimensionUnit: z.string().optional(),
      quantity: z.number().optional(),
      material: z.string().optional(),
      finishing: z.string().optional(),
      instructions: z.string().optional(),
      notes: z.string().optional(),
      fileUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return createJobCard({
        invoiceId: input.invoiceId,
        poNumber: input.poNumber,
        jobTitle: input.jobTitle,
        customerName: input.customerName ?? null,
        assignedTo: input.assignedTo ?? null,
        assignedToName: input.assignedToName ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        printType: input.printType ?? null,
        width: input.width ?? null,
        height: input.height ?? null,
        dimensionUnit: input.dimensionUnit ?? "m",
        quantity: input.quantity ?? 1,
        material: input.material ?? null,
        finishing: input.finishing ?? null,
        instructions: input.instructions ?? null,
        notes: input.notes ?? null,
        fileUrl: input.fileUrl ?? null,
        status: "pending",
      });
    }),
  /** Create a manual job card (no invoice required). */
  createManual: protectedProcedure
    .input(z.object({
      jobTitle: z.string().min(1),
      customerName: z.string().optional(),
      poNumber: z.string().optional(),
      assignedTo: z.number().optional(),
      assignedToName: z.string().optional(),
      dueDate: z.string().optional(),
      printType: z.string().optional(),
      width: z.string().optional(),
      height: z.string().optional(),
      dimensionUnit: z.string().optional(),
      quantity: z.number().optional(),
      material: z.string().optional(),
      finishing: z.string().optional(),
      instructions: z.string().optional(),
      notes: z.string().optional(),
      fileUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return createJobCard({
        invoiceId: null,
        poNumber: input.poNumber ?? null,
        jobTitle: input.jobTitle,
        customerName: input.customerName ?? null,
        assignedTo: input.assignedTo ?? null,
        assignedToName: input.assignedToName ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        printType: input.printType ?? null,
        width: input.width ?? null,
        height: input.height ?? null,
        dimensionUnit: input.dimensionUnit ?? "m",
        quantity: input.quantity ?? 1,
        material: input.material ?? null,
        finishing: input.finishing ?? null,
        instructions: input.instructions ?? null,
        notes: input.notes ?? null,
        fileUrl: input.fileUrl ?? null,
        status: "pending",
      });
    }),

  /** Update a job card's status or fields. */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      jobTitle: z.string().optional(),
      customerName: z.string().optional().nullable(),
      poNumber: z.string().optional().nullable(),
      status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
      assignedTo: z.number().optional().nullable(),
      assignedToName: z.string().optional().nullable(),
      dueDate: z.string().optional().nullable(),
      instructions: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      fileUrl: z.string().optional().nullable(),
      printType: z.string().optional().nullable(),
      width: z.string().optional().nullable(),
      height: z.string().optional().nullable(),
      dimensionUnit: z.string().optional().nullable(),
      quantity: z.number().optional().nullable(),
      material: z.string().optional().nullable(),
      finishing: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      const { id, dueDate, ...rest } = input;
      await updateJobCard(id, {
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });
      return { success: true };
    }),

  /** Set or update the PO number on an invoice. */
  setInvoicePO: protectedProcedure
    .input(z.object({ invoiceId: z.number(), poNumber: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await updateInvoicePoNumber(input.invoiceId, input.poNumber);
      return { success: true };
    }),
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
  pricing: pricingRouter,
  jobCosting: jobCostingRouter,
  payroll: payrollRouter,
  company: companyRouter,
  localAuth: localAuthRouter,
  allowlist: allowlistRouter,
  employeePortal: employeePortalRouter,
  notifications: notificationsRouter,
  jobCards: jobCardsRouter,
});

export type AppRouter = typeof appRouter;

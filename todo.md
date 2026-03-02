# Bester.Builds — Business Automation Platform TODO

## Phase 1: Database Schema & Migrations
- [x] Design and create customers table (CRM)
- [x] Design and create interactions table (CRM)
- [x] Design and create leads table (CRM)
- [x] Design and create inventory_items table
- [x] Design and create inventory_transactions table
- [x] Design and create orders table
- [x] Design and create order_items table
- [x] Design and create invoices table
- [x] Design and create employees table
- [x] Design and create tasks table
- [x] Design and create payments table
- [x] Design and create appointments table
- [x] Apply all migrations via webdev_execute_sql

## Phase 2: Backend tRPC Routers
- [x] CRM router (customers, interactions, leads)
- [x] Inventory router (items, transactions, alerts)
- [x] Orders router (orders, order items, quotes)
- [x] Invoices router (create, update, send)
- [x] Employees router (staff, roles, workload)
- [x] Tasks router (create, assign, track)
- [x] Payments router (transactions, status)
- [x] Analytics router (metrics, trends, reports)
- [x] Scheduling router (appointments, timelines)

## Phase 3: Global Layout & Theming
- [x] Purple color scheme in index.css
- [x] DashboardLayout with sidebar navigation (all 7 modules)
- [x] App.tsx routes for all pages
- [x] Bester.Builds branding in sidebar header
- [x] Responsive mobile-friendly layout

## Phase 4: CRM, Inventory, Orders Pages
- [x] CRM page — customer list, add/edit, interaction history, lead pipeline
- [x] Inventory page — materials list, stock levels, low-stock alerts, add/edit items
- [x] Orders page — order list, create order, job specs, status tracking
- [x] Invoicing page — invoice list, generate invoice, payment status

## Phase 5: Employee, Payments, Analytics, Scheduling Pages
- [x] Employee management page — staff list, roles, workload
- [x] Task management — assign tasks, track progress
- [x] Payments page — transaction history, revenue tracking
- [x] Analytics dashboard — KPIs, charts, sales trends, production stats
- [x] Scheduling page — calendar view, appointments, equipment booking

## Phase 6: Tests & Delivery
- [x] Write vitest tests for core routers (23 tests passing)
- [x] Save checkpoint
- [x] Deliver to user

## Clock-In/Out Feature
- [x] Add shift_logs table to database schema (employeeId, clockIn, clockOut, hoursWorked, earnings, notes)
- [x] Generate and apply migration SQL
- [x] Add DB query helpers for shift logs
- [x] Add tRPC router: clockIn, clockOut, listShifts, getActiveShift, getShiftSummary
- [x] Build ClockIn page: clock-in/out panel, active shift timer, shift history table, daily/weekly earnings summary
- [x] Add ClockIn route and sidebar navigation entry
- [x] Write vitest tests for clock-in/out procedures
- [x] Save checkpoint

## Bug Fixes
- [x] Fix "Maximum update depth exceeded" infinite loop on /clock-in page

## PIN-Based Clock-In Feature
- [x] Add `pin` (hashed) and `pinSet` fields to employees table schema
- [x] Generate and apply migration SQL
- [x] Add DB helpers: setEmployeePin, verifyEmployeePin, clockInByPin, clockOutByPin
- [x] Add tRPC procedures: shifts.setPin, shifts.clockInByPin, shifts.clockOutByPin
- [x] Build PinKiosk page: numpad UI, employee lookup by PIN, clock-in/out confirmation
- [x] Add PIN setup UI to Employees page (Set/Change PIN button per employee)
- [x] Add PinKiosk route (/kiosk) to App.tsx — no sidebar, full-screen kiosk mode
- [x] Add Kiosk link to sidebar under Team
- [x] Write vitest tests for PIN procedures
- [x] Save checkpoint

## Timesheet CSV Export Feature
- [x] Add getTimesheetExport DB helper (date range + optional employeeId, returns full shift rows with employee details)
- [x] Add shifts.exportTimesheet tRPC procedure
- [x] Add TimesheetExport section to ClockIn page with date-range pickers and employee filter
- [x] Implement client-side CSV generation and download (no server file needed)
- [x] Show preview table of shifts before export
- [x] Write vitest tests for exportTimesheet procedure
- [x] Save checkpoint

## Branded PDF Invoice Generator
- [x] Install pdfkit npm package for server-side PDF generation
- [x] Create server/pdf.ts with generateInvoicePDF() helper using PDFKit
- [x] Register GET /api/invoices/:id/pdf Express route in server/_core/index.ts
- [x] Add Download PDF button to Invoices page
- [x] Style PDF: Bester.Builds header, client block, line items table, totals, payment info
- [x] Write vitest test for the PDF route
- [x] Save checkpoint

## Bug Fixes
- [x] Fix empty SelectItem value crash on /invoices page

## Quote-to-Invoice Conversion
- [x] Add getOrderWithItems DB helper to fetch order + line items + customer
- [x] Add orders.convertToInvoice tRPC procedure (auto-calc totals, create invoice, advance order status)
- [x] Add "Create Invoice" button on Orders page for quote-status orders
- [x] Show confirmation dialog with invoice preview (customer, total, VAT) before converting
- [x] Navigate to Invoices page after successful conversion
- [x] Write vitest tests for convertToInvoice procedure
- [x] Save checkpoint

## Print Cost Calculator
- [x] Create pricing_rates table in DB schema (printType, material, baseRatePerSqm, setupFee, minCharge)
- [x] Generate and apply migration SQL
- [x] Seed default pricing rates for all print types and common materials
- [x] Add calculatePrintCost DB helper (dimensions, material, quantity, finishing → line items + subtotal)
- [x] Add orders.calculateCost tRPC procedure
- [x] Add orders.getPricingRates tRPC procedure (for the form dropdowns)
- [x] Integrate live cost calculator panel into the Orders form (dimension inputs → real-time price breakdown)
- [x] Auto-populate subtotal, line items, and total fields from calculator output
- [x] Write vitest tests for calculateCost procedure
- [x] Save checkpoint

## Pricing Rates Settings Page
- [x] Add DB helpers: createPricingRate, updatePricingRate, deletePricingRate
- [x] Add tRPC procedures: pricing.list, pricing.create, pricing.update, pricing.delete (admin-only)
- [x] Build PricingRates settings page with grouped table by print type
- [x] Add inline edit dialog per rate (all fields editable)
- [x] Add "New Rate" form with all fields
- [x] Add toggle to activate/deactivate a rate
- [x] Add PricingRates route (/settings/pricing) and sidebar nav entry under Settings
- [x] Write vitest tests for pricing CRUD procedures
- [x] Save checkpoint

## Job Costing Report
- [x] Add inventory_job_usage table to schema (orderId, inventoryItemId, quantityUsed, unitCost, totalCost)
- [x] Generate and apply migration SQL
- [x] Add DB helpers: logJobMaterialUsage, getJobCostingReport
- [x] Add analytics.jobCosting tRPC procedure
- [x] Add Job Costing section to Analytics page with per-job margin table
- [x] Add "Log Materials Used" button on Orders page to record actual consumption
- [x] Add profitability trend chart (quoted vs cost vs margin over time)
- [x] Write vitest tests for jobCosting procedure
- [x] Save checkpoint

## Payroll Report Page
- [x] Add getPayrollReport DB helper (date range → per-employee hours, earnings, shift count, avg hours/day)
- [x] Add payroll.report tRPC procedure
- [x] Register GET /api/payroll/pdf Express route for PDF generation
- [x] Create server/payrollPdf.ts with PDFKit payroll report generator
- [x] Build PayrollReport page under /settings/payroll with pay period selector
- [x] Show per-employee summary table (name, role, shifts, total hours, hourly rate, gross earnings)
- [x] Show company-wide totals row
- [x] Add "Download PDF" button for accountant-ready payroll report
- [x] Add PayrollReport route and sidebar nav entry under Settings
- [x] Write vitest tests for payroll.report procedure
- [x] Save checkpoint

## Company Profile Settings Page
- [x] Add company_profile table to schema (name, tagline, email, phone, address, vatNumber, bankName, accountHolder, accountNumber, branchCode, accountType, website)
- [x] Generate and apply migration SQL
- [x] Add DB helpers: getCompanyProfile, upsertCompanyProfile
- [x] Add tRPC procedures: company.getProfile, company.updateProfile (admin-only)
- [x] Build CompanyProfile settings page with grouped form sections
- [x] Add CompanyProfile route (/settings/company) and sidebar nav entry
- [x] Wire company profile into invoice PDF generator
- [x] Wire company profile into payroll PDF generator
- [x] Write vitest tests for company profile procedures
- [x] Save checkpoint

## Email/Password Auth & Role-Based Access Control
- [x] Audit existing auth (Manus OAuth) and design new parallel email/password auth
- [x] Add auth_users table (email, passwordHash, role: admin|employee, employeeId FK, isActive)
- [x] Add email_allowlist table (email, addedByAdminId, linkedEmployeeId, createdAt)
- [x] Add DB helpers: createAuthUser, findAuthUserByEmail, updateAuthUser, listAllowlist, addToAllowlist, removeFromAllowlist
- [x] Add tRPC procedures: auth.signup, auth.login, auth.logout, auth.me (email-based)
- [x] Build Sign In page (/login) with email + password form
- [x] Build Sign Up page (/signup) — only succeeds if email is on the allowlist or is the first admin
- [x] Add Employee Allowlist settings page (admin adds/removes emails, links to employee record)
- [x] Implement role-based route guards in App.tsx (admin vs employee)
- [x] Build restricted Employee Portal (clock-in/out + own shift history only)
- [x] Hide admin-only nav items from employee role
- [x] Write vitest tests for new auth procedures
- [x] Save checkpoint

## Shift Approval Workflow
- [x] Audit existing shift_logs schema and plan approval columns
- [x] Add approvalStatus (pending|approved|rejected), approvedBy, approvedAt, rejectionReason columns to shift_logs
- [x] Generate and apply migration SQL
- [x] Add DB helpers: approveShift, rejectShift, listPendingShifts, listShiftsForApproval
- [x] Add tRPC procedures: shifts.approve, shifts.reject, shifts.listForApproval
- [x] Build ShiftApproval admin page with pending/approved/rejected tabs
- [x] Add bulk approve action for multiple shifts at once
- [x] Show rejection reason dialog when rejecting a shift
- [x] Update Employee Portal shift history to show approval status badges
- [x] Add Shift Approval sidebar nav link (Team group)
- [x] Write vitest tests for approval procedures
- [x] Save checkpoint

## Automated Shift Notification System
- [x] Audit schema and plan notifications table (recipientId, type, title, message, shiftId, isRead, createdAt)
- [x] Generate and apply migration SQL for notifications table
- [x] Add DB helpers: createNotification, listNotificationsForUser, markNotificationRead, markAllRead, countUnread
- [x] Trigger notification on approveShift and rejectShift in DB helpers
- [x] Add tRPC procedures: notifications.list, notifications.countUnread, notifications.markRead, notifications.markAllRead
- [x] Build notification bell with unread badge in Employee Portal header
- [x] Build notification dropdown/panel showing recent notifications
- [x] Add notification centre page in admin sidebar (Team group)
- [x] Write vitest tests for notification procedures
- [x] Save checkpoint

## Job Card Generator
- [x] Audit invoice schema and PDF infrastructure
- [x] Add poNumber field to invoices table
- [x] Add job_cards table (invoiceId, poNumber, jobTitle, assignedTo, dueDate, instructions, status, printSpecs, notes)
- [x] Generate and apply migration SQL
- [x] Add DB helpers: createJobCard, getJobCard, listJobCards, updateJobCard, listInvoicesWithPO, updateInvoicePoNumber
- [x] Add tRPC procedures: jobCards.listInvoicesWithPO, jobCards.create, jobCards.get, jobCards.list, jobCards.update, jobCards.setInvoicePO
- [x] Build server-side PDF generator for job cards (jobCardPdf.ts) with branded layout
- [x] Add /api/job-cards/:id/pdf PDF download route
- [x] Build Job Card Generator page with two-step creation dialog, tabbed list, status management
- [x] Add Job Cards nav item to Operations group in sidebar
- [x] Write vitest tests for job card procedures
- [x] Save checkpoint

## PO Number on Invoice Form
- [x] Add PO Number input to invoice create form
- [x] Wire poNumber to invoices.create and invoices.update tRPC mutations
- [x] Show PO Number badge in invoice list (purple, with hash icon)
- [x] Save checkpoint

## Create Job Card Button on Invoices
- [x] Add "Create Job Card" button to invoice list rows that have a poNumber
- [x] Navigate to /job-cards?invoiceId=X on click to pre-select the invoice
- [x] Auto-open the creation dialog in JobCardGenerator when invoiceId query param is present
- [x] Pre-fill the job card form with data from the pre-selected invoice
- [x] Save checkpoint

## PO Number in Invoice PDF
- [x] Add PO number to invoice PDF details block (right column, below Due Date)
- [x] Add PO number to payment reference line in the payment info box
- [x] Save checkpoint

## Job Cards Kanban Board
- [x] Install @dnd-kit/core and @dnd-kit/utilities for drag-and-drop
- [x] Build KanbanBoard component with Pending/In Progress/Completed/Cancelled columns
- [x] Make job cards draggable between columns with optimistic status update on drop
- [x] Add list/kanban view toggle to Job Cards page header
- [x] Persist view preference in localStorage
- [x] Save checkpoint

## Bug Fix: FORBIDDEN error on Employee Access / Shift Approval pages
- [x] Diagnose: allowlist.list, localAuth.listUsers, shifts.approve/reject/bulkApprove required LOCAL_AUTH_COOKIE but Manus OAuth admin has no local cookie
- [x] Fix allowlist.list, allowlist.add, allowlist.remove to also accept ctx.user?.role === 'admin' (Manus OAuth)
- [x] Fix localAuth.listUsers, setActive, setRole to also accept ctx.user?.role === 'admin'
- [x] Fix shifts.approve, shifts.reject, shifts.bulkApprove to also accept ctx.user?.role === 'admin'
- [x] Save checkpoint

## Manual Job Card Creation
- [x] Make invoiceId and poNumber nullable in job_cards schema (allow NULL)
- [x] Generate and apply migration SQL
- [x] Update createJobCard DB helper to accept optional invoiceId/poNumber
- [x] Add jobCards.createManual tRPC procedure (no invoice required)
- [x] Add "Manual" button to Job Cards page header (alongside "From Invoice" button)
- [x] Build ManualJobCardDialog with all fields (title, customer, PO, assignee, due date, print specs, instructions, notes, file URL)
- [x] Manual job cards appear in list and kanban board alongside invoice-linked ones
- [x] Save checkpoint

## Full Job Card Editing
- [x] Expand jobCards.update tRPC procedure to accept all editable fields (jobTitle, customerName, poNumber, status, assignedToName, dueDate, printType, width, height, dimensionUnit, quantity, material, finishing, instructions, notes, fileUrl)
- [x] Replace UpdateStatusDialog with a full EditJobCardDialog pre-populated with all current field values
- [x] Form re-syncs when a different job card is opened (useEffect on jc.id)
- [x] Kanban board onUpdate opens the same full edit dialog
- [x] Save checkpoint

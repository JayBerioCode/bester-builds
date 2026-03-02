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

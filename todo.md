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

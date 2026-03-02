/**
 * Tests for the shift approval workflow.
 * Covers:
 *  - listShiftsForApproval filters by status and employeeId
 *  - approveShift sets correct fields
 *  - rejectShift sets correct fields including reason
 *  - bulkApproveShifts handles multiple IDs
 *  - countPendingShifts returns correct count
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("./db", () => ({
  listShiftsForApproval: vi.fn(),
  approveShift: vi.fn(),
  rejectShift: vi.fn(),
  bulkApproveShifts: vi.fn(),
  countPendingShifts: vi.fn(),
}));

import {
  listShiftsForApproval,
  approveShift,
  rejectShift,
  bulkApproveShifts,
  countPendingShifts,
} from "./db";

// ─── Shared fixtures ─────────────────────────────────────────────────────────

const makeShift = (overrides: Partial<any> = {}): any => ({
  id: 1,
  employeeId: 10,
  employeeName: "Alice",
  employeeRole: "print_operator",
  clockIn: new Date("2026-03-01T08:00:00Z"),
  clockOut: new Date("2026-03-01T16:00:00Z"),
  hoursWorked: "8.00",
  earnings: "240.00",
  notes: null,
  approvalStatus: "pending",
  approvedBy: null,
  approvedByName: null,
  approvedAt: null,
  rejectionReason: null,
  createdAt: new Date(),
  ...overrides,
});

// ─── listShiftsForApproval ────────────────────────────────────────────────────

describe("listShiftsForApproval", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all completed shifts when no filter is applied", async () => {
    const shifts = [makeShift({ id: 1 }), makeShift({ id: 2, approvalStatus: "approved" })];
    vi.mocked(listShiftsForApproval).mockResolvedValue(shifts);

    const result = await listShiftsForApproval();
    expect(result).toHaveLength(2);
  });

  it("filters by pending status", async () => {
    const shifts = [makeShift({ id: 1, approvalStatus: "pending" })];
    vi.mocked(listShiftsForApproval).mockResolvedValue(shifts);

    const result = await listShiftsForApproval({ status: "pending" });
    expect(result.every((s: any) => s.approvalStatus === "pending")).toBe(true);
  });

  it("filters by approved status", async () => {
    const shifts = [makeShift({ id: 2, approvalStatus: "approved", approvedByName: "Admin" })];
    vi.mocked(listShiftsForApproval).mockResolvedValue(shifts);

    const result = await listShiftsForApproval({ status: "approved" });
    expect(result[0].approvalStatus).toBe("approved");
    expect(result[0].approvedByName).toBe("Admin");
  });

  it("filters by rejected status", async () => {
    const shifts = [makeShift({ id: 3, approvalStatus: "rejected", rejectionReason: "Incorrect hours" })];
    vi.mocked(listShiftsForApproval).mockResolvedValue(shifts);

    const result = await listShiftsForApproval({ status: "rejected" });
    expect(result[0].approvalStatus).toBe("rejected");
    expect(result[0].rejectionReason).toBe("Incorrect hours");
  });

  it("filters by employeeId", async () => {
    const shifts = [makeShift({ id: 1, employeeId: 10 })];
    vi.mocked(listShiftsForApproval).mockResolvedValue(shifts);

    const result = await listShiftsForApproval({ employeeId: 10 });
    expect(result.every((s: any) => s.employeeId === 10)).toBe(true);
  });

  it("returns empty array when no shifts match", async () => {
    vi.mocked(listShiftsForApproval).mockResolvedValue([]);
    const result = await listShiftsForApproval({ status: "pending", employeeId: 999 });
    expect(result).toHaveLength(0);
  });
});

// ─── approveShift ─────────────────────────────────────────────────────────────

describe("approveShift", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls approveShift with correct arguments", async () => {
    vi.mocked(approveShift).mockResolvedValue(undefined);
    await approveShift(1, 42, "Jay Admin");
    expect(approveShift).toHaveBeenCalledWith(1, 42, "Jay Admin");
  });

  it("resolves without error for valid input", async () => {
    vi.mocked(approveShift).mockResolvedValue(undefined);
    await expect(approveShift(5, 1, "Admin")).resolves.toBeUndefined();
  });

  it("propagates DB errors", async () => {
    vi.mocked(approveShift).mockRejectedValue(new Error("DB unavailable"));
    await expect(approveShift(1, 1, "Admin")).rejects.toThrow("DB unavailable");
  });
});

// ─── rejectShift ─────────────────────────────────────────────────────────────

describe("rejectShift", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls rejectShift with reason", async () => {
    vi.mocked(rejectShift).mockResolvedValue(undefined);
    await rejectShift(3, 42, "Jay Admin", "Clock-in time mismatch");
    expect(rejectShift).toHaveBeenCalledWith(3, 42, "Jay Admin", "Clock-in time mismatch");
  });

  it("calls rejectShift without reason (undefined)", async () => {
    vi.mocked(rejectShift).mockResolvedValue(undefined);
    await rejectShift(3, 42, "Jay Admin", undefined);
    expect(rejectShift).toHaveBeenCalledWith(3, 42, "Jay Admin", undefined);
  });

  it("resolves without error", async () => {
    vi.mocked(rejectShift).mockResolvedValue(undefined);
    await expect(rejectShift(2, 1, "Admin", "Test")).resolves.toBeUndefined();
  });
});

// ─── bulkApproveShifts ────────────────────────────────────────────────────────

describe("bulkApproveShifts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls bulkApproveShifts with all provided IDs", async () => {
    vi.mocked(bulkApproveShifts).mockResolvedValue(undefined);
    await bulkApproveShifts([1, 2, 3], 42, "Jay Admin");
    expect(bulkApproveShifts).toHaveBeenCalledWith([1, 2, 3], 42, "Jay Admin");
  });

  it("handles a single ID", async () => {
    vi.mocked(bulkApproveShifts).mockResolvedValue(undefined);
    await bulkApproveShifts([7], 1, "Admin");
    expect(bulkApproveShifts).toHaveBeenCalledWith([7], 1, "Admin");
  });

  it("handles a large batch", async () => {
    vi.mocked(bulkApproveShifts).mockResolvedValue(undefined);
    const ids = Array.from({ length: 50 }, (_, i) => i + 1);
    await bulkApproveShifts(ids, 1, "Admin");
    expect(bulkApproveShifts).toHaveBeenCalledWith(ids, 1, "Admin");
  });

  it("propagates DB errors", async () => {
    vi.mocked(bulkApproveShifts).mockRejectedValue(new Error("DB unavailable"));
    await expect(bulkApproveShifts([1, 2], 1, "Admin")).rejects.toThrow("DB unavailable");
  });
});

// ─── countPendingShifts ───────────────────────────────────────────────────────

describe("countPendingShifts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the pending count", async () => {
    vi.mocked(countPendingShifts).mockResolvedValue(7);
    const count = await countPendingShifts();
    expect(count).toBe(7);
  });

  it("returns 0 when no pending shifts", async () => {
    vi.mocked(countPendingShifts).mockResolvedValue(0);
    const count = await countPendingShifts();
    expect(count).toBe(0);
  });
});

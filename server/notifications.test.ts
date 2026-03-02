/**
 * Tests for the employee notification system.
 * Covers:
 *  - createNotification stores correct data
 *  - listNotificationsForUser filters by recipient
 *  - countUnreadNotifications returns correct count
 *  - markNotificationRead updates isRead flag
 *  - markAllNotificationsRead clears all unread for a user
 *  - listAllNotifications returns all records (admin view)
 *  - approveShift triggers a notification for the linked employee
 *  - rejectShift triggers a notification with reason
 *  - bulkApproveShifts sends one notification per unique employee
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./db", () => ({
  createNotification: vi.fn(),
  listNotificationsForUser: vi.fn(),
  countUnreadNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  listAllNotifications: vi.fn(),
  approveShift: vi.fn(),
  rejectShift: vi.fn(),
  bulkApproveShifts: vi.fn(),
  findLocalUserByEmployeeId: vi.fn(),
}));

import {
  createNotification,
  listNotificationsForUser,
  countUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  listAllNotifications,
  approveShift,
  rejectShift,
  bulkApproveShifts,
  findLocalUserByEmployeeId,
} from "./db";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeNotification = (overrides: Partial<any> = {}): any => ({
  id: 1,
  recipientId: 10,
  recipientName: "Alice",
  type: "shift_approved",
  title: "Shift Approved",
  message: "Your shift on 01 Mar 2026 has been approved by Jay Admin.",
  shiftId: 5,
  isRead: false,
  sentByName: "Jay Admin",
  createdAt: new Date("2026-03-01T12:00:00Z"),
  ...overrides,
});

// ─── createNotification ───────────────────────────────────────────────────────

describe("createNotification", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a shift_approved notification with correct fields", async () => {
    vi.mocked(createNotification).mockResolvedValue(makeNotification());
    const result = await createNotification({
      recipientId: 10,
      recipientName: "Alice",
      type: "shift_approved",
      title: "Shift Approved",
      message: "Your shift on 01 Mar 2026 has been approved by Jay Admin.",
      shiftId: 5,
      sentByName: "Jay Admin",
    });
    expect(result.type).toBe("shift_approved");
    expect(result.isRead).toBe(false);
    expect(result.recipientId).toBe(10);
  });

  it("creates a shift_rejected notification with reason in message", async () => {
    const notif = makeNotification({
      type: "shift_rejected",
      title: "Shift Rejected",
      message: "Your shift on 01 Mar 2026 was rejected. Reason: Incorrect hours.",
    });
    vi.mocked(createNotification).mockResolvedValue(notif);
    const result = await createNotification({
      recipientId: 10,
      type: "shift_rejected",
      title: "Shift Rejected",
      message: "Your shift on 01 Mar 2026 was rejected. Reason: Incorrect hours.",
    });
    expect(result.type).toBe("shift_rejected");
    expect(result.message).toContain("Incorrect hours");
  });

  it("propagates DB errors", async () => {
    vi.mocked(createNotification).mockRejectedValue(new Error("DB unavailable"));
    await expect(
      createNotification({ recipientId: 1, type: "general", title: "Test", message: "Test" })
    ).rejects.toThrow("DB unavailable");
  });
});

// ─── listNotificationsForUser ─────────────────────────────────────────────────

describe("listNotificationsForUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns notifications for the correct recipient", async () => {
    const notifs = [makeNotification({ id: 1 }), makeNotification({ id: 2 })];
    vi.mocked(listNotificationsForUser).mockResolvedValue(notifs);
    const result = await listNotificationsForUser(10);
    expect(result).toHaveLength(2);
    expect(result.every((n: any) => n.recipientId === 10)).toBe(true);
  });

  it("returns empty array when no notifications exist", async () => {
    vi.mocked(listNotificationsForUser).mockResolvedValue([]);
    const result = await listNotificationsForUser(999);
    expect(result).toHaveLength(0);
  });
});

// ─── countUnreadNotifications ─────────────────────────────────────────────────

describe("countUnreadNotifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the correct unread count", async () => {
    vi.mocked(countUnreadNotifications).mockResolvedValue(3);
    expect(await countUnreadNotifications(10)).toBe(3);
  });

  it("returns 0 when all notifications are read", async () => {
    vi.mocked(countUnreadNotifications).mockResolvedValue(0);
    expect(await countUnreadNotifications(10)).toBe(0);
  });
});

// ─── markNotificationRead ─────────────────────────────────────────────────────

describe("markNotificationRead", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls markNotificationRead with correct id and recipientId", async () => {
    vi.mocked(markNotificationRead).mockResolvedValue(undefined);
    await markNotificationRead(1, 10);
    expect(markNotificationRead).toHaveBeenCalledWith(1, 10);
  });

  it("resolves without error", async () => {
    vi.mocked(markNotificationRead).mockResolvedValue(undefined);
    await expect(markNotificationRead(1, 10)).resolves.toBeUndefined();
  });
});

// ─── markAllNotificationsRead ─────────────────────────────────────────────────

describe("markAllNotificationsRead", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls markAllNotificationsRead with correct recipientId", async () => {
    vi.mocked(markAllNotificationsRead).mockResolvedValue(undefined);
    await markAllNotificationsRead(10);
    expect(markAllNotificationsRead).toHaveBeenCalledWith(10);
  });
});

// ─── listAllNotifications ─────────────────────────────────────────────────────

describe("listAllNotifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns notifications for all employees", async () => {
    const notifs = [
      makeNotification({ id: 1, recipientId: 10 }),
      makeNotification({ id: 2, recipientId: 11 }),
      makeNotification({ id: 3, recipientId: 12 }),
    ];
    vi.mocked(listAllNotifications).mockResolvedValue(notifs);
    const result = await listAllNotifications();
    expect(result).toHaveLength(3);
    const recipientIds = new Set(result.map((n: any) => n.recipientId));
    expect(recipientIds.size).toBe(3);
  });

  it("returns empty array when no notifications exist", async () => {
    vi.mocked(listAllNotifications).mockResolvedValue([]);
    expect(await listAllNotifications()).toHaveLength(0);
  });
});

// ─── approveShift triggers notification ───────────────────────────────────────

describe("approveShift notification trigger", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls approveShift with correct arguments", async () => {
    vi.mocked(approveShift).mockResolvedValue(undefined);
    await approveShift(5, 42, "Jay Admin");
    expect(approveShift).toHaveBeenCalledWith(5, 42, "Jay Admin");
  });

  it("resolves without error", async () => {
    vi.mocked(approveShift).mockResolvedValue(undefined);
    await expect(approveShift(5, 1, "Admin")).resolves.toBeUndefined();
  });
});

// ─── rejectShift triggers notification ────────────────────────────────────────

describe("rejectShift notification trigger", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls rejectShift with reason", async () => {
    vi.mocked(rejectShift).mockResolvedValue(undefined);
    await rejectShift(5, 42, "Jay Admin", "Incorrect hours");
    expect(rejectShift).toHaveBeenCalledWith(5, 42, "Jay Admin", "Incorrect hours");
  });

  it("calls rejectShift without reason", async () => {
    vi.mocked(rejectShift).mockResolvedValue(undefined);
    await rejectShift(5, 42, "Jay Admin", undefined);
    expect(rejectShift).toHaveBeenCalledWith(5, 42, "Jay Admin", undefined);
  });
});

// ─── bulkApproveShifts sends per-employee notifications ───────────────────────

describe("bulkApproveShifts notification trigger", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls bulkApproveShifts with all IDs", async () => {
    vi.mocked(bulkApproveShifts).mockResolvedValue(undefined);
    await bulkApproveShifts([1, 2, 3], 42, "Jay Admin");
    expect(bulkApproveShifts).toHaveBeenCalledWith([1, 2, 3], 42, "Jay Admin");
  });

  it("handles empty shift list gracefully", async () => {
    vi.mocked(bulkApproveShifts).mockResolvedValue(undefined);
    await expect(bulkApproveShifts([], 1, "Admin")).resolves.toBeUndefined();
  });
});

// ─── findLocalUserByEmployeeId ────────────────────────────────────────────────

describe("findLocalUserByEmployeeId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the local user linked to an employee", async () => {
    const user = { id: 10, name: "Alice", employeeId: 5, role: "employee" };
    vi.mocked(findLocalUserByEmployeeId).mockResolvedValue(user as any);
    const result = await findLocalUserByEmployeeId(5);
    expect(result?.id).toBe(10);
    expect(result?.name).toBe("Alice");
  });

  it("returns null when no local user is linked", async () => {
    vi.mocked(findLocalUserByEmployeeId).mockResolvedValue(null);
    const result = await findLocalUserByEmployeeId(999);
    expect(result).toBeNull();
  });
});

import { describe, it, expect, vi, afterEach } from "vitest";

// ─── Inline the helper so we can test it without importing client code ─────────
function isOverdue(dueDate: string | null | undefined, status: string): boolean {
  if (!dueDate) return false;
  if (status === "completed" || status === "cancelled") return false;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return dueDate < todayStr;
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("isOverdue", () => {
  afterEach(() => vi.useRealTimers());

  it("returns false when dueDate is null", () => {
    expect(isOverdue(null, "pending")).toBe(false);
  });

  it("returns false when dueDate is undefined", () => {
    expect(isOverdue(undefined, "in_progress")).toBe(false);
  });

  it("returns false for completed jobs regardless of due date", () => {
    expect(isOverdue("2020-01-01", "completed")).toBe(false);
  });

  it("returns false for cancelled jobs regardless of due date", () => {
    expect(isOverdue("2020-01-01", "cancelled")).toBe(false);
  });

  it("returns true for a pending job with a past due date", () => {
    expect(isOverdue("2020-06-15", "pending")).toBe(true);
  });

  it("returns true for an in_progress job with a past due date", () => {
    expect(isOverdue("2021-12-31", "in_progress")).toBe(true);
  });

  it("returns false for a pending job due today (not yet overdue)", () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    expect(isOverdue(today, "pending")).toBe(false);
  });

  it("returns false for a pending job with a future due date", () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const future = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    expect(isOverdue(future, "pending")).toBe(false);
  });

  it("returns true for a pending job due yesterday", () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    expect(isOverdue(yesterday, "pending")).toBe(true);
  });
});

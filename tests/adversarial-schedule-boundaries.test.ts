import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { checkScheduleAccess } from "../src/lib/auth.ts";
import { POST as loginPost } from "../src/app/api/auth/login/route.ts";

/**
 * Helper to construct an exact Date corresponding to a specific year-month-day
 * and time in the America/Sao_Paulo timezone (UTC-3).
 *
 * For America/Sao_Paulo (UTC-3):
 * UTC = SP + 3 hours
 */
function createSaoPauloDate(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  second: number
): Date {
  // Format as ISO string in America/Sao_Paulo offset (-03:00)
  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}-03:00`;
  return new Date(iso);
}

describe("Empirical Adversarial Challenge: Schedule Boundaries & HTTP 403 Enforcement (M2)", () => {
  const memberUser = {
    role: "MEMBER",
    allowedDays: "1,2,3,4,5",
    workStartTime: "08:00",
    workEndTime: "18:00",
  };

  const supervisorUser = {
    role: "SUPERVISOR",
    allowedDays: "1,2,3,4,5",
    workStartTime: "08:00",
    workEndTime: "18:00",
  };

  const adminUser = {
    role: "ADMIN",
    allowedDays: "1,2,3,4,5",
    workStartTime: "08:00",
    workEndTime: "18:00",
  };

  // ==========================================================================
  // Dimension 1: Exact Boundary Seconds in America/Sao_Paulo
  // ==========================================================================
  describe("Dimension 1: Exact Boundary Seconds (America/Sao_Paulo)", () => {
    // Reference week in 2026:
    // 2026-10-19: Monday
    // 2026-10-23: Friday

    test("1.1: Monday 07:59:59 (1 second before shift) is rejected with allowed=false", () => {
      const date = createSaoPauloDate(2026, 10, 19, 7, 59, 59);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, false, "07:59:59 must be rejected");
      assert.ok(res.reason?.includes("07:59"), "Reason must mention 07:59");
      assert.ok(res.reason?.includes("08:00"), "Reason must mention allowed start time");
    });

    test("1.2: Monday 08:00:00 (exact start boundary) is accepted with allowed=true", () => {
      const date = createSaoPauloDate(2026, 10, 19, 8, 0, 0);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, true, "08:00:00 must be allowed");
      assert.equal(res.reason, undefined);
    });

    test("1.3: Monday 08:00:01 (1 second into shift) is accepted with allowed=true", () => {
      const date = createSaoPauloDate(2026, 10, 19, 8, 0, 1);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, true, "08:00:01 must be allowed");
    });

    test("1.4: Friday 17:59:59 (1 second before shift ends) is accepted with allowed=true", () => {
      const date = createSaoPauloDate(2026, 10, 23, 17, 59, 59);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, true, "17:59:59 must be allowed");
    });

    test("1.5: Friday 18:00:00 (exact end boundary) is accepted with allowed=true", () => {
      const date = createSaoPauloDate(2026, 10, 23, 18, 0, 0);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, true, "18:00:00 must be allowed");
      assert.equal(res.reason, undefined);
    });

    test("1.6: Friday 18:00:01 (1 second after shift) is rejected with allowed=false", () => {
      const date = createSaoPauloDate(2026, 10, 23, 18, 0, 1);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, false, "18:00:01 must be rejected");
      assert.ok(res.reason?.includes("18:00"), "Reason must mention 18:00");
    });

    test("1.7: Friday 18:00:02 (2 seconds after shift) is rejected with allowed=false", () => {
      const date = createSaoPauloDate(2026, 10, 23, 18, 0, 2);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, false, "18:00:02 must be rejected");
    });

    test("1.8: Wednesday 12:00:00 (midday shift) is accepted with allowed=true", () => {
      const date = createSaoPauloDate(2026, 10, 21, 12, 0, 0);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, true, "Midday must be allowed");
    });

    test("1.9: Monday 00:00:00 (midnight before shift) is rejected with allowed=false", () => {
      const date = createSaoPauloDate(2026, 10, 19, 0, 0, 0);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, false, "Midnight must be rejected");
    });

    test("1.10: Friday 23:59:59 (late night after shift) is rejected with allowed=false", () => {
      const date = createSaoPauloDate(2026, 10, 23, 23, 59, 59);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, false, "Late night must be rejected");
    });
  });

  // ==========================================================================
  // Dimension 2: Weekend Access Control (Saturdays & Sundays)
  // ==========================================================================
  describe("Dimension 2: Weekend Blocking (Saturdays & Sundays)", () => {
    // 2026-10-24: Saturday
    // 2026-10-25: Sunday

    test("2.1: Saturday 00:00:00 is rejected for MEMBER", () => {
      const date = createSaoPauloDate(2026, 10, 24, 0, 0, 0);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, false);
      assert.ok(res.reason?.includes("Sábado"), "Reason must mention Saturday");
    });

    test("2.2: Saturday 08:00:00 (even during shift hours) is rejected for MEMBER", () => {
      const date = createSaoPauloDate(2026, 10, 24, 8, 0, 0);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, false);
      assert.ok(res.reason?.includes("Sábado"));
    });

    test("2.3: Saturday 12:00:00 (midday weekend) is rejected for MEMBER", () => {
      const date = createSaoPauloDate(2026, 10, 24, 12, 0, 0);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, false);
      assert.ok(res.reason?.includes("Sábado"));
    });

    test("2.4: Saturday 18:00:00 is rejected for MEMBER", () => {
      const date = createSaoPauloDate(2026, 10, 24, 18, 0, 0);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, false);
      assert.ok(res.reason?.includes("Sábado"));
    });

    test("2.5: Saturday 23:59:59 is rejected for MEMBER", () => {
      const date = createSaoPauloDate(2026, 10, 24, 23, 59, 59);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, false);
      assert.ok(res.reason?.includes("Sábado"));
    });

    test("2.6: Sunday 00:00:00 is rejected for MEMBER", () => {
      const date = createSaoPauloDate(2026, 10, 25, 0, 0, 0);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, false);
      assert.ok(res.reason?.includes("Domingo"), "Reason must mention Sunday");
    });

    test("2.7: Sunday 10:00:00 is rejected for MEMBER", () => {
      const date = createSaoPauloDate(2026, 10, 25, 10, 0, 0);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, false);
      assert.ok(res.reason?.includes("Domingo"));
    });

    test("2.8: Sunday 18:00:00 is rejected for MEMBER", () => {
      const date = createSaoPauloDate(2026, 10, 25, 18, 0, 0);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, false);
      assert.ok(res.reason?.includes("Domingo"));
    });

    test("2.9: Sunday 23:59:59 is rejected for MEMBER", () => {
      const date = createSaoPauloDate(2026, 10, 25, 23, 59, 59);
      const res = checkScheduleAccess(memberUser, date);
      assert.equal(res.allowed, false);
      assert.ok(res.reason?.includes("Domingo"));
    });
  });

  // ==========================================================================
  // Dimension 3: Supervisor & Admin 24/7 Schedule Bypass
  // ==========================================================================
  describe("Dimension 3: Supervisor & Admin 24/7 Bypass", () => {
    test("3.1: Supervisor on Sunday 03:00:00 (weekend night) is permitted", () => {
      const date = createSaoPauloDate(2026, 10, 25, 3, 0, 0);
      const res = checkScheduleAccess(supervisorUser, date);
      assert.equal(res.allowed, true);
    });

    test("3.2: Supervisor on Sunday 23:59:59 is permitted", () => {
      const date = createSaoPauloDate(2026, 10, 25, 23, 59, 59);
      const res = checkScheduleAccess(supervisorUser, date);
      assert.equal(res.allowed, true);
    });

    test("3.3: Supervisor on Saturday 12:00:00 is permitted", () => {
      const date = createSaoPauloDate(2026, 10, 24, 12, 0, 0);
      const res = checkScheduleAccess(supervisorUser, date);
      assert.equal(res.allowed, true);
    });

    test("3.4: Supervisor on Monday 07:59:59 (before shift) is permitted", () => {
      const date = createSaoPauloDate(2026, 10, 19, 7, 59, 59);
      const res = checkScheduleAccess(supervisorUser, date);
      assert.equal(res.allowed, true);
    });

    test("3.5: Supervisor on Friday 18:00:01 (after shift) is permitted", () => {
      const date = createSaoPauloDate(2026, 10, 23, 18, 0, 1);
      const res = checkScheduleAccess(supervisorUser, date);
      assert.equal(res.allowed, true);
    });

    test("3.6: Admin on Sunday 04:30:00 is permitted", () => {
      const date = createSaoPauloDate(2026, 10, 25, 4, 30, 0);
      const res = checkScheduleAccess(adminUser, date);
      assert.equal(res.allowed, true);
    });

    test("3.7: Admin on Saturday 23:59:59 is permitted", () => {
      const date = createSaoPauloDate(2026, 10, 24, 23, 59, 59);
      const res = checkScheduleAccess(adminUser, date);
      assert.equal(res.allowed, true);
    });

    test("3.8: Admin on Monday 05:00:00 is permitted", () => {
      const date = createSaoPauloDate(2026, 10, 19, 5, 0, 0);
      const res = checkScheduleAccess(adminUser, date);
      assert.equal(res.allowed, true);
    });
  });

  // ==========================================================================
  // Dimension 4: End-to-End HTTP Route Handler POST /api/auth/login
  // ==========================================================================
  describe("Dimension 4: HTTP 403 Enforcement via POST /api/auth/login", () => {
    const RealDate = globalThis.Date;

    function mockGlobalDate(targetDate: Date) {
      const targetTime = targetDate.getTime();
      class MockDate extends RealDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(targetTime);
          } else {
            // @ts-ignore
            super(...args);
          }
        }
        static override now() {
          return targetTime;
        }
      }
      globalThis.Date = MockDate as any;
    }

    function restoreGlobalDate() {
      globalThis.Date = RealDate;
    }

    test("4.1: Member login at 07:59:59 returns HTTP 403 with OUTSIDE_WORK_HOURS and no cookie", async () => {
      mockGlobalDate(createSaoPauloDate(2026, 10, 19, 7, 59, 59));
      try {
        const req = new Request("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "carlos@flowleads.com", password: "user123" }),
        });
        const res = await loginPost(req);
        assert.equal(res.status, 403, "Must return HTTP 403 Forbidden");

        const body = await res.json();
        assert.equal(body.code, "OUTSIDE_WORK_HOURS");
        assert.ok(body.error?.includes("07:59"));
        assert.deepEqual(body.allowedWindow, {
          days: "Segunda a Sexta-feira",
          hours: "08:00 às 18:00",
        });

        // Ensure session cookie was NOT set
        const setCookie = res.headers.get("Set-Cookie");
        assert.equal(setCookie, null, "No session cookie should be issued on 403");
      } finally {
        restoreGlobalDate();
      }
    });

    test("4.2: Member login at 08:00:00 returns HTTP 200 with valid session token and cookie", async () => {
      mockGlobalDate(createSaoPauloDate(2026, 10, 19, 8, 0, 0));
      try {
        const req = new Request("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 TestBrowser" },
          body: JSON.stringify({ email: "carlos@flowleads.com", password: "user123" }),
        });
        const res = await loginPost(req);
        assert.equal(res.status, 200, "Must return HTTP 200 OK");

        const body = await res.json();
        assert.equal(body.success, true);
        assert.ok(body.token);

        const setCookie = res.headers.get("Set-Cookie");
        assert.ok(setCookie?.includes("flowleads_session="));
        assert.ok(setCookie?.includes("HttpOnly"));
      } finally {
        restoreGlobalDate();
      }
    });

    test("4.3: Member login at 18:00:00 returns HTTP 200 with valid session token", async () => {
      mockGlobalDate(createSaoPauloDate(2026, 10, 23, 18, 0, 0));
      try {
        const req = new Request("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "carlos@flowleads.com", password: "user123" }),
        });
        const res = await loginPost(req);
        assert.equal(res.status, 200, "18:00:00 must return HTTP 200 OK");
        const body = await res.json();
        assert.equal(body.success, true);
      } finally {
        restoreGlobalDate();
      }
    });

    test("4.4: Member login at 18:00:01 returns HTTP 403 OUTSIDE_WORK_HOURS", async () => {
      mockGlobalDate(createSaoPauloDate(2026, 10, 23, 18, 0, 1));
      try {
        const req = new Request("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "carlos@flowleads.com", password: "user123" }),
        });
        const res = await loginPost(req);
        assert.equal(res.status, 403, "18:00:01 must return HTTP 403");
        const body = await res.json();
        assert.equal(body.code, "OUTSIDE_WORK_HOURS");
      } finally {
        restoreGlobalDate();
      }
    });

    test("4.5: Member login on Saturday 14:00 returns HTTP 403 with weekend reason", async () => {
      mockGlobalDate(createSaoPauloDate(2026, 10, 24, 14, 0, 0));
      try {
        const req = new Request("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "carlos@flowleads.com", password: "user123" }),
        });
        const res = await loginPost(req);
        assert.equal(res.status, 403);
        const body = await res.json();
        assert.equal(body.code, "OUTSIDE_WORK_HOURS");
        assert.ok(body.error?.includes("Sábado"));
      } finally {
        restoreGlobalDate();
      }
    });

    test("4.6: Admin login on Sunday 14:00 bypasses schedule restriction and returns HTTP 200", async () => {
      mockGlobalDate(createSaoPauloDate(2026, 10, 25, 14, 0, 0));
      try {
        const req = new Request("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "admin@flowleads.com", password: "admin123" }),
        });
        const res = await loginPost(req);
        assert.equal(res.status, 200, "Admin must be permitted on Sunday");
        const body = await res.json();
        assert.equal(body.success, true);
      } finally {
        restoreGlobalDate();
      }
    });
  });

  // ==========================================================================
  // Dimension 5: Robustness, Custom Schedules & Calendar Edge Cases
  // ==========================================================================
  describe("Dimension 5: Robustness & Custom Configurations", () => {
    test("5.1: Custom schedule (Tue/Thu 09:30 - 17:15) enforces boundaries strictly", () => {
      const customUser = {
        role: "MEMBER",
        allowedDays: "2,4", // Tuesday, Thursday
        workStartTime: "09:30",
        workEndTime: "17:15",
      };

      // Tuesday 09:29:59 -> blocked
      const t1 = createSaoPauloDate(2026, 10, 20, 9, 29, 59);
      assert.equal(checkScheduleAccess(customUser, t1).allowed, false);

      // Tuesday 09:30:00 -> allowed
      const t2 = createSaoPauloDate(2026, 10, 20, 9, 30, 0);
      assert.equal(checkScheduleAccess(customUser, t2).allowed, true);

      // Tuesday 17:15:00 -> allowed
      const t3 = createSaoPauloDate(2026, 10, 20, 17, 15, 0);
      assert.equal(checkScheduleAccess(customUser, t3).allowed, true);

      // Tuesday 17:15:01 -> blocked
      const t4 = createSaoPauloDate(2026, 10, 20, 17, 15, 1);
      assert.equal(checkScheduleAccess(customUser, t4).allowed, false);

      // Wednesday 10:00:00 (day not in allowedDays) -> blocked
      const t5 = createSaoPauloDate(2026, 10, 21, 10, 0, 0);
      assert.equal(checkScheduleAccess(customUser, t5).allowed, false);

      // Thursday 14:00:00 -> allowed
      const t6 = createSaoPauloDate(2026, 10, 22, 14, 0, 0);
      assert.equal(checkScheduleAccess(customUser, t6).allowed, true);
    });

    test("5.2: Leap year date (2028-02-29 is a Tuesday) calculates correctly", () => {
      // 2028-02-29 is a Tuesday
      const tLeapWork = createSaoPauloDate(2028, 2, 29, 10, 0, 0);
      assert.equal(checkScheduleAccess(memberUser, tLeapWork).allowed, true);

      const tLeapNight = createSaoPauloDate(2028, 2, 29, 20, 0, 0);
      assert.equal(checkScheduleAccess(memberUser, tLeapNight).allowed, false);
    });

    test("5.3: Year transition (Dec 31 23:59:59 -> Jan 1 00:00:00) calculates correctly", () => {
      // 2026-12-31 is a Thursday
      const tDec31 = createSaoPauloDate(2026, 12, 31, 23, 59, 59);
      assert.equal(checkScheduleAccess(memberUser, tDec31).allowed, false);

      // 2027-01-01 is a Friday
      const tJan1Midnight = createSaoPauloDate(2027, 1, 1, 0, 0, 0);
      assert.equal(checkScheduleAccess(memberUser, tJan1Midnight).allowed, false);

      const tJan1Work = createSaoPauloDate(2027, 1, 1, 14, 0, 0);
      assert.equal(checkScheduleAccess(memberUser, tJan1Work).allowed, true);
    });

    test("5.4: Fallback defaults when allowedDays, workStartTime, workEndTime are null", () => {
      const fallbackUser = {
        role: "MEMBER",
        allowedDays: null,
        workStartTime: null,
        workEndTime: null,
      };

      // Should default to 1,2,3,4,5 and 08:00 - 18:00
      const workHour = createSaoPauloDate(2026, 10, 19, 10, 0, 0);
      assert.equal(checkScheduleAccess(fallbackUser, workHour).allowed, true);

      const afterHour = createSaoPauloDate(2026, 10, 19, 19, 0, 0);
      assert.equal(checkScheduleAccess(fallbackUser, afterHour).allowed, false);

      const weekend = createSaoPauloDate(2026, 10, 25, 10, 0, 0);
      assert.equal(checkScheduleAccess(fallbackUser, weekend).allowed, false);
    });

    test("5.5: Adversarial whitespace in allowedDays string is parsed safely", () => {
      const whitespaceUser = {
        role: "MEMBER",
        allowedDays: " 1 , 2 , 3 , 4 , 5 ",
        workStartTime: "08:00",
        workEndTime: "18:00",
      };
      const workHour = createSaoPauloDate(2026, 10, 19, 10, 0, 0);
      assert.equal(checkScheduleAccess(whitespaceUser, workHour).allowed, true);
    });
  });

  // ==========================================================================
  // Dimension 6: Randomized Property-Based / Fuzz Oracle Verification (1,000 tests)
  // ==========================================================================
  describe("Dimension 6: Fuzz Testing & Independent Mathematical Oracle (1,000 samples)", () => {
    // Independent Oracle implementing ground-truth specification from ORIGINAL_REQUEST §R2
    function oracleSchedule(
      role: string,
      date: Date
    ): boolean {
      if (role === "ADMIN" || role === "SUPERVISOR") return true;

      // Independent timezone formatter
      const spParts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Sao_Paulo",
        hour12: false,
        weekday: "short",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      }).formatToParts(date);

      const partMap: Record<string, string> = {};
      for (const p of spParts) partMap[p.type] = p.value;

      const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      const d = dayMap[partMap.weekday] ?? 0;
      let h = parseInt(partMap.hour, 10);
      if (h === 24) h = 0;
      const m = parseInt(partMap.minute, 10);
      const s = parseInt(partMap.second, 10);

      // Rule: Monday (1) to Friday (5) only
      if (d < 1 || d > 5) return false;

      // Rule: 08:00:00 (28800s) to 18:00:00 (64800s) inclusive
      const totalSec = h * 3600 + m * 60 + s;
      return totalSec >= 28800 && totalSec <= 64800;
    }

    test("6.1: 1,000 random timestamps across 2026 match oracle for MEMBER, SUPERVISOR, and ADMIN", () => {
      // Deterministic PRNG seed
      let seed = 42;
      function pseudoRandom() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      }

      const startMs = new Date("2026-01-01T00:00:00Z").getTime();
      const endMs = new Date("2026-12-31T23:59:59Z").getTime();
      const range = endMs - startMs;

      let memberPassCount = 0;
      let supervisorPassCount = 0;
      let adminPassCount = 0;

      for (let i = 0; i < 1000; i++) {
        const randMs = startMs + Math.floor(pseudoRandom() * range);
        const testDate = new Date(randMs);

        // 1. Test MEMBER
        const expectedMember = oracleSchedule("MEMBER", testDate);
        const actualMember = checkScheduleAccess(memberUser, testDate).allowed;
        assert.equal(
          actualMember,
          expectedMember,
          `Mismatch at ${testDate.toISOString()} for MEMBER: expected ${expectedMember}, got ${actualMember}`
        );
        memberPassCount++;

        // 2. Test SUPERVISOR
        const actualSupervisor = checkScheduleAccess(supervisorUser, testDate).allowed;
        assert.equal(actualSupervisor, true, `Supervisor must always be allowed at ${testDate.toISOString()}`);
        supervisorPassCount++;

        // 3. Test ADMIN
        const actualAdmin = checkScheduleAccess(adminUser, testDate).allowed;
        assert.equal(actualAdmin, true, `Admin must always be allowed at ${testDate.toISOString()}`);
        adminPassCount++;
      }

      assert.equal(memberPassCount, 1000);
      assert.equal(supervisorPassCount, 1000);
      assert.equal(adminPassCount, 1000);
    });
  });
});

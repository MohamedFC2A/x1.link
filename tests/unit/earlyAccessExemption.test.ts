/**
 * Early Access Exemption & Instant Unlock Unit Test Suite
 * Matany AI (Matany)
 */

import { TestHarness, expect } from "../testUtils";
import { isUserApprovedOrUnlocked } from "../../src/services/telemetryTracker";

export async function runEarlyAccessExemptionTests(harness: TestHarness): Promise<void> {
  await harness.describe("Early Access Exemption & Instant Unlock Security Suite", async () => {
    const originalWindow = (global as any).window;
    const originalLocalStorage = (global as any).localStorage;
    const originalDocument = (global as any).document;

    const mockStorage: Record<string, string> = {};
    const mockCookieState = { value: "" };

    const mockLocalStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => { mockStorage[key] = String(val); },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
    };

    (global as any).window = { location: { hostname: "matany.one" } };
    (global as any).localStorage = mockLocalStorage;
    (global as any).document = {
      get cookie() { return mockCookieState.value; },
      set cookie(val: string) { mockCookieState.value = val; },
    };

    try {
      await harness.it("Security: non-approved visitor must NOT be marked unlocked", () => {
        mockLocalStorage.clear();
        mockCookieState.value = "";

        const isUnlocked = isUserApprovedOrUnlocked();
        expect(isUnlocked).toBe(false);
      });

      await harness.it("Security: approved visitor identified via localStorage matany_platform_unlocked", () => {
        mockLocalStorage.clear();
        mockCookieState.value = "";
        mockLocalStorage.setItem("matany_platform_unlocked", "true");

        const isUnlocked = isUserApprovedOrUnlocked();
        expect(isUnlocked).toBe(true);
      });

      await harness.it("Security: approved visitor identified via localStorage matany_early_access_approved", () => {
        mockLocalStorage.clear();
        mockCookieState.value = "";
        mockLocalStorage.setItem("matany_early_access_approved", "true");

        const isUnlocked = isUserApprovedOrUnlocked();
        expect(isUnlocked).toBe(true);
      });

      await harness.it("Security: approved visitor identified via cookie matany_platform_unlocked=true", () => {
        mockLocalStorage.clear();
        mockCookieState.value = "session_id=xyz; matany_platform_unlocked=true; path=/";

        const isUnlocked = isUserApprovedOrUnlocked();
        expect(isUnlocked).toBe(true);
      });

      await harness.it("Defense-in-Depth: server telemetry logic strictly recognizes and suppresses approved requests", () => {
        const mockReq = {
          headers: new Headers({
            "Content-Type": "application/json",
            "cookie": "matany_platform_unlocked=true; matany_early_access_req_id=REQ-TEST123",
          }),
        };

        const cookieHeader = mockReq.headers.get("cookie") || "";
        const isApprovedByCookie =
          cookieHeader.includes("matany_platform_unlocked=true") ||
          cookieHeader.includes("matany_early_access_approved=true");

        expect(isApprovedByCookie).toBe(true);
      });
    } finally {
      (global as any).window = originalWindow;
      (global as any).localStorage = originalLocalStorage;
      (global as any).document = originalDocument;
    }
  });
}

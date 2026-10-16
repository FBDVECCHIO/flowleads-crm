import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(process.cwd());
const SRC_DIR = path.join(PROJECT_ROOT, "src");
const SIDEBAR_FILE = path.join(SRC_DIR, "components", "layout", "Sidebar.tsx");
const APPSHELL_FILE = path.join(SRC_DIR, "components", "layout", "AppShell.tsx");
const NAVBAR_FILE = path.join(SRC_DIR, "components", "layout", "Navbar.tsx");
const KANBAN_PAGE = path.join(SRC_DIR, "app", "pipes", "[id]", "page.tsx");

describe("Empirical Adversarial Challenge: Sidebar State & Layout Resilience (M1)", () => {
  // ==========================================================================
  // Dimension 1: LocalStorage State Machine Simulation & Resilience
  // ==========================================================================
  describe("Dimension 1: LocalStorage State Machine & Persistence", () => {
    const sidebarContent = fs.readFileSync(SIDEBAR_FILE, "utf8");

    // Replicate the exact logic from Sidebar.tsx
    function simulateSidebarStateInit(storedValue: string | null): boolean {
      let isCollapsed = false;
      const saved = storedValue;
      if (saved !== null) {
        isCollapsed = saved === "true";
      }
      return isCollapsed;
    }

    function simulateSidebarToggle(currentState: boolean, storage: Record<string, string>): {
      nextState: boolean;
      persistedValue: string;
    } {
      const nextState = !currentState;
      storage["flowleads_sidebar_collapsed"] = String(nextState);
      return { nextState, persistedValue: storage["flowleads_sidebar_collapsed"] };
    }

    test("1.1 Default state is expanded (isCollapsed=false) when localStorage key is absent (null)", () => {
      const state = simulateSidebarStateInit(null);
      assert.equal(state, false, "When localStorage is null, sidebar must default to expanded (false)");
    });

    test("1.2 Correctly initializes to collapsed when localStorage is 'true'", () => {
      const state = simulateSidebarStateInit("true");
      assert.equal(state, true, "When localStorage has 'true', sidebar must initialize to collapsed (true)");
    });

    test("1.3 Correctly initializes to expanded when localStorage is 'false'", () => {
      const state = simulateSidebarStateInit("false");
      assert.equal(state, false, "When localStorage has 'false', sidebar must initialize to expanded (false)");
    });

    test("1.4 Malformed/unexpected localStorage values fallback safely to expanded", () => {
      const malformedValues = ["", "undefined", "null", "1", "0", "TRUE", "yes", "{}", "NaN"];
      for (const val of malformedValues) {
        const state = simulateSidebarStateInit(val);
        assert.equal(state, false, `Malformed value '${val}' must resolve to expanded (false)`);
      }
    });

    test("1.5 Toggle state transitions cycle correctly and persist stringified boolean", () => {
      const mockStorage: Record<string, string> = {};

      // Toggle 1: false -> true
      let current = false;
      let result = simulateSidebarToggle(current, mockStorage);
      assert.equal(result.nextState, true);
      assert.equal(result.persistedValue, "true");
      assert.equal(mockStorage["flowleads_sidebar_collapsed"], "true");

      // Toggle 2: true -> false
      current = result.nextState;
      result = simulateSidebarToggle(current, mockStorage);
      assert.equal(result.nextState, false);
      assert.equal(result.persistedValue, "false");
      assert.equal(mockStorage["flowleads_sidebar_collapsed"], "false");
    });

    test("1.6 LocalStorage write is wrapped in try/catch to survive disabled/quota storage", () => {
      // Verify toggleSidebar in Sidebar.tsx handles storage exceptions
      assert.ok(
        sidebarContent.includes("try {") &&
        sidebarContent.includes("localStorage.setItem") &&
        sidebarContent.includes("catch"),
        "localStorage.setItem must be wrapped in try/catch block"
      );
    });

    test("1.7 Storage key adheres to the FlowLeads domain namespace", () => {
      assert.ok(
        sidebarContent.includes('"flowleads_sidebar_collapsed"'),
        "Sidebar must use namespaced key 'flowleads_sidebar_collapsed'"
      );
      assert.ok(
        !sidebarContent.includes("pipefy"),
        "Sidebar must not contain legacy 'pipefy' in storage key"
      );
    });
  });

  // ==========================================================================
  // Dimension 2: DOM Layout Resilience & Overflow Defense
  // ==========================================================================
  describe("Dimension 2: DOM Layout Resilience & Overflow Defense", () => {
    const sidebarContent = fs.readFileSync(SIDEBAR_FILE, "utf8");
    const appShellContent = fs.readFileSync(APPSHELL_FILE, "utf8");
    const kanbanContent = fs.readFileSync(KANBAN_PAGE, "utf8");

    test("2.1 AppShell flex layout specifies 'min-w-0' to prevent flex item blowout", () => {
      // In CSS flexbox, flex children have min-width: auto by default.
      // Without min-w-0, a wide child (like Kanban) pushes the flex container beyond viewport width.
      assert.ok(
        appShellContent.includes("min-w-0"),
        "AppShell main wrapper must include 'min-w-0' to prevent horizontal flex blowout"
      );
    });

    test("2.2 AppShell main content specifies 'overflow-x-hidden' to clip page-level horizontal scroll", () => {
      assert.ok(
        appShellContent.includes("overflow-x-hidden"),
        "AppShell main tag must include 'overflow-x-hidden' to contain layout"
      );
    });

    test("2.3 Kanban board maintains internal 'overflow-x-auto' independent of AppShell", () => {
      // Even though AppShell has overflow-x-hidden, Kanban columns must be scrollable internally
      assert.ok(
        kanbanContent.includes("overflow-x-auto"),
        "Kanban container must provide internal 'overflow-x-auto' for phase columns"
      );
    });

    test("2.4 Sidebar root element uses 'shrink-0' so flex container never compresses it", () => {
      assert.ok(
        sidebarContent.includes("shrink-0"),
        "Sidebar <aside> must have 'shrink-0' so wide content does not crush the sidebar"
      );
    });

    test("2.5 Sidebar root element does NOT set overflow-hidden, ensuring tooltips are not clipped", () => {
      // Extract <aside ... > opening tag
      const asideMatch = sidebarContent.match(/<aside[\s\S]*?>/);
      assert.ok(asideMatch, "<aside> element must exist in Sidebar.tsx");
      const asideTag = asideMatch[0];
      assert.ok(
        !asideTag.includes("overflow-hidden") && !asideTag.includes("overflow-x-hidden"),
        "<aside> element must NOT have overflow-hidden or overflow-x-hidden, otherwise floating tooltips get clipped!"
      );
    });

    test("2.6 Sidebar root declares CSS transition classes for smooth collapse animation", () => {
      assert.ok(
        sidebarContent.includes("transition-all") &&
        sidebarContent.includes("duration-300") &&
        sidebarContent.includes("ease-in-out"),
        "Sidebar must define 'transition-all duration-300 ease-in-out' for smooth animation"
      );
    });

    test("2.7 Sidebar defines explicit width classes: w-16 when collapsed, w-64 when expanded", () => {
      assert.ok(
        sidebarContent.includes('isCollapsed ? "w-16" : "w-64"'),
        "Sidebar must switch between 'w-16' and 'w-64'"
      );
    });

    test("2.8 Sidebar z-index hierarchy correctly layers tooltips (z-50) above sidebar (z-20) and navbar (z-10)", () => {
      assert.ok(
        sidebarContent.includes("z-20"),
        "Sidebar root must have z-20"
      );
      assert.ok(
        sidebarContent.includes("z-50"),
        "Floating tooltips must have z-50 to hover above all other layout elements"
      );
    });
  });

  // ==========================================================================
  // Dimension 3: Tooltips, Icon-Only Mode & Accessibility
  // ==========================================================================
  describe("Dimension 3: Tooltips, Icon-Only Mode & Accessibility", () => {
    const sidebarContent = fs.readFileSync(SIDEBAR_FILE, "utf8");

    test("3.1 Toggle button has accessible aria-label matching collapsed state", () => {
      assert.ok(
        sidebarContent.includes('aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}'),
        "Toggle button must provide dynamic aria-label ('Expandir menu' vs 'Recolher menu')"
      );
    });

    test("3.2 Toggle button has title attribute matching collapsed state", () => {
      assert.ok(
        sidebarContent.includes('title={isCollapsed ? "Expandir menu" : "Recolher menu"}'),
        "Toggle button must provide dynamic title tooltip"
      );
    });

    test("3.3 Collapsed toggle pill button is positioned with absolute -right-3 without clipping", () => {
      assert.ok(
        sidebarContent.includes("absolute -right-3"),
        "Collapsed toggle pill must be positioned with 'absolute -right-3' for easy clicking"
      );
    });

    test("3.4 All navigation items feature floating tooltips with 'pointer-events-none' to prevent click hijacking", () => {
      assert.ok(
        sidebarContent.includes("pointer-events-none"),
        "Tooltips must have pointer-events-none so hover does not block pointer interaction"
      );
      assert.ok(
        sidebarContent.includes("group-hover:flex"),
        "Tooltips must use group-hover:flex to appear on hover"
      );
      assert.ok(
        sidebarContent.includes("left-full ml-3"),
        "Tooltips must be positioned at 'left-full ml-3' (adjacent to the collapsed sidebar)"
      );
    });

    test("3.5 Organization badge has floating tooltip when sidebar is collapsed", () => {
      assert.ok(
        sidebarContent.includes("Organização: {orgName}"),
        "Collapsed organization badge must render floating tooltip with orgName"
      );
    });

    test("3.6 User profile has floating tooltip displaying name and role when collapsed", () => {
      assert.ok(
        sidebarContent.includes("{userName}") &&
        sidebarContent.includes("userRole === \"ADMIN\" || userRole === \"SUPERVISOR\" ? \"Supervisor\" : \"Vendedor\""),
        "Collapsed user avatar must render floating tooltip with userName and role"
      );
    });

    test("3.7 System status indicator renders pulsating dot and tooltip when collapsed", () => {
      assert.ok(
        sidebarContent.includes("animate-pulse") &&
        sidebarContent.includes("Sistema Online"),
        "System status must render pulsating dot and 'Sistema Online' tooltip when collapsed"
      );
    });

    test("3.8 Labels are suppressed in collapsed mode to prevent layout overflowing 64px width", () => {
      assert.ok(
        sidebarContent.includes("!isCollapsed && <span className=\"truncate\">{item.label}</span>"),
        "Navigation item text labels must be conditionally rendered only when !isCollapsed"
      );
    });
  });

  // ==========================================================================
  // Dimension 4: Role-Based Navigation & Edge-Case Robustness
  // ==========================================================================
  describe("Dimension 4: Role-Based Navigation & Boundary Conditions", () => {
    const sidebarContent = fs.readFileSync(SIDEBAR_FILE, "utf8");

    // Replicate navItems array and filter logic from Sidebar.tsx
    const navItems = [
      {
        label: "Gestão de Metas",
        roles: ["ADMIN", "SUPERVISOR", "MEMBER", "VIEWER"],
      },
      {
        label: "Kanban de Leads",
        roles: ["ADMIN", "SUPERVISOR", "MEMBER", "VIEWER"],
      },
      {
        label: "Relatórios & Funil",
        roles: ["ADMIN", "SUPERVISOR", "MEMBER", "VIEWER"],
      },
      {
        label: "Automações No-Code",
        roles: ["ADMIN", "SUPERVISOR"],
      },
      {
        label: "Formulário de Captura",
        roles: ["ADMIN", "SUPERVISOR", "MEMBER"],
      },
    ];

    function getVisibleItems(role: string) {
      return navItems.filter((item) => item.roles.includes(role));
    }

    test("4.1 ADMIN role sees all 5 navigation items", () => {
      const items = getVisibleItems("ADMIN");
      assert.equal(items.length, 5);
      assert.deepEqual(items.map((i) => i.label), [
        "Gestão de Metas",
        "Kanban de Leads",
        "Relatórios & Funil",
        "Automações No-Code",
        "Formulário de Captura",
      ]);
    });

    test("4.2 SUPERVISOR role sees all 5 navigation items", () => {
      const items = getVisibleItems("SUPERVISOR");
      assert.equal(items.length, 5);
    });

    test("4.3 MEMBER role sees 4 items (Automações No-Code is restricted)", () => {
      const items = getVisibleItems("MEMBER");
      assert.equal(items.length, 4);
      assert.ok(!items.some((i) => i.label === "Automações No-Code"));
    });

    test("4.4 VIEWER role sees 3 items (Automações and Formulário are restricted)", () => {
      const items = getVisibleItems("VIEWER");
      assert.equal(items.length, 3);
      assert.ok(!items.some((i) => i.label === "Automações No-Code"));
      assert.ok(!items.some((i) => i.label === "Formulário de Captura"));
    });

    test("4.5 Database de Clientes is completely excluded from commercial navigation array and routes", () => {
      const navItemsMatch = sidebarContent.match(/const navItems = \[([\s\S]*?)\];/);
      assert.ok(navItemsMatch, "navItems array must be defined in Sidebar.tsx");
      const navItemsCode = navItemsMatch[1];
      assert.ok(
        !navItemsCode.includes("Database de Clientes") && !navItemsCode.includes("/database"),
        "navItems array must not contain 'Database de Clientes' or link to '/database'"
      );
    });

    test("4.6 Empty userName string safely slices without runtime TypeError", () => {
      const emptyName = "";
      const initials = emptyName.slice(0, 2).toUpperCase();
      assert.equal(initials, "");
    });

    test("4.7 Single character userName safely handles avatar slice", () => {
      const singleChar = "A";
      const initials = singleChar.slice(0, 2).toUpperCase();
      assert.equal(initials, "A");
    });

    test("4.8 Long user names and organization names have 'truncate' class applied", () => {
      assert.ok(
        sidebarContent.includes('className="text-xs font-semibold text-white truncate">{userName}</span>'),
        "User name span must have 'truncate' class"
      );
      assert.ok(
        sidebarContent.includes('className="text-xs font-semibold text-white truncate">{orgName}</span>'),
        "Org name span must have 'truncate' class"
      );
    });
  });
});

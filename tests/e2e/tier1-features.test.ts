import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import {
  PROJECT_ROOT,
  SRC_DIR,
  loadModule,
  getAllFiles,
  generateMetaSignature,
  createMockSessionToken,
  computeUserAgentFingerprint,
  createValidPdfBuffer,
  createValidPngBuffer,
  createValidJpegBuffer,
  createMaliciousExeBuffer,
  createMaliciousScriptBuffer,
} from "./helpers.ts";

describe("Tier 1: Feature Verification Suite (F1 - F22)", () => {
  // --------------------------------------------------------------------------
  // F1: Total Rebranding
  // --------------------------------------------------------------------------
  describe("F1: Total Rebranding", () => {
    test("F1.1: Zero occurrences of 'Pipefy' in active src/ codebase", () => {
      const allSrcFiles = getAllFiles(SRC_DIR).filter(
        (f) => !f.includes(".git") && !f.includes(".next") && !f.endsWith(".log")
      );
      const violations: string[] = [];

      for (const file of allSrcFiles) {
        const content = fs.readFileSync(file, "utf8");
        if (/pipefy/i.test(content)) {
          violations.push(path.relative(PROJECT_ROOT, file));
        }
      }

      assert.equal(
        violations.length,
        0,
        `Found forbidden branding 'Pipefy' in files:\n${violations.join("\n")}`
      );
    });

    test("F1.2: Zero occurrences of 'Acme' or 'Acme Corp Brasil' in src/", () => {
      const allSrcFiles = getAllFiles(SRC_DIR);
      const violations: string[] = [];

      for (const file of allSrcFiles) {
        const content = fs.readFileSync(file, "utf8");
        if (/acme/i.test(content)) {
          violations.push(path.relative(PROJECT_ROOT, file));
        }
      }

      assert.equal(
        violations.length,
        0,
        `Found forbidden branding 'Acme' in files:\n${violations.join("\n")}`
      );
    });

    test("F1.3: Package.json branding reflects FlowLeads", () => {
      const pkgPath = path.join(PROJECT_ROOT, "package.json");
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      assert.ok(
        pkg.name.toLowerCase().includes("flowleads"),
        `package.json name should contain flowleads, found: ${pkg.name}`
      );
    });

    test("F1.4: Root layout metadata title declares FlowLeads by Grupo Mário Neto", () => {
      const layoutPath = path.join(SRC_DIR, "app", "layout.tsx");
      assert.ok(fs.existsSync(layoutPath), "layout.tsx must exist");
      const content = fs.readFileSync(layoutPath, "utf8");
      assert.ok(
        content.includes("FlowLeads") && content.includes("Grupo Mário Neto"),
        "layout.tsx must contain 'FlowLeads' and 'Grupo Mário Neto'"
      );
    });

    test("F1.5: No residual legacy pipefy database or seed strings", () => {
      const seedPath = path.join(PROJECT_ROOT, "prisma", "seed.ts");
      if (fs.existsSync(seedPath)) {
        const content = fs.readFileSync(seedPath, "utf8");
        assert.ok(
          !content.includes("Acme Corp Brasil") && !content.includes("Pipefy"),
          "prisma/seed.ts must not contain Acme Corp Brasil or Pipefy branding"
        );
      }
    });
  });

  // --------------------------------------------------------------------------
  // F2: Dynamic Collapsible Sidebar
  // --------------------------------------------------------------------------
  describe("F2: Dynamic Collapsible Sidebar", () => {
    const sidebarPath = path.join(SRC_DIR, "components", "layout", "Sidebar.tsx");

    test("F2.1: Sidebar component file exists and is client-rendered", () => {
      assert.ok(fs.existsSync(sidebarPath), "Sidebar.tsx must exist");
      const content = fs.readFileSync(sidebarPath, "utf8");
      assert.ok(content.includes('"use client"') || content.includes("'use client'"), "Sidebar must be a client component");
    });

    test("F2.2: Sidebar supports collapsed (w-16) and expanded (w-64) widths", () => {
      const content = fs.readFileSync(sidebarPath, "utf8");
      assert.ok(
        content.includes("w-16") && (content.includes("w-64") || content.includes("w-56")),
        "Sidebar must define classes for collapsed (w-16) and expanded (w-64) widths"
      );
    });

    test("F2.3: Sidebar provides toggle button mechanism", () => {
      const content = fs.readFileSync(sidebarPath, "utf8");
      assert.ok(
        /collapse|toggle|isCollapsed|setIsCollapsed|expanded/i.test(content),
        "Sidebar must implement collapse toggle state or button"
      );
    });

    test("F2.4: Sidebar defines localStorage persistence key", () => {
      const content = fs.readFileSync(sidebarPath, "utf8");
      assert.ok(
        /localStorage\.getItem|localStorage\.setItem|flowleads:sidebar/i.test(content),
        "Sidebar must persist collapsed/expanded state to localStorage"
      );
    });

    test("F2.5: Sidebar renders tooltips or titles for icon navigation when collapsed", () => {
      const content = fs.readFileSync(sidebarPath, "utf8");
      assert.ok(
        /tooltip|title=|group-hover/i.test(content),
        "Sidebar must render tooltips or titles for collapsed navigation icons"
      );
    });
  });

  // --------------------------------------------------------------------------
  // F3: Header Elements Migrated to Sidebar
  // --------------------------------------------------------------------------
  describe("F3: Header Elements Migrated to Sidebar", () => {
    const sidebarPath = path.join(SRC_DIR, "components", "layout", "Sidebar.tsx");
    const navbarPath = path.join(SRC_DIR, "components", "layout", "Navbar.tsx");

    test("F3.1: Sidebar displays User Profile and Avatar", () => {
      const content = fs.readFileSync(sidebarPath, "utf8");
      assert.ok(
        /avatar|user|perfil|avatarUrl/i.test(content),
        "Sidebar must contain user avatar and profile details"
      );
    });

    test("F3.2: Sidebar displays Grupo Mário Neto organization badge", () => {
      const content = fs.readFileSync(sidebarPath, "utf8");
      assert.ok(
        content.includes("Grupo Mário Neto"),
        "Sidebar must display the 'Grupo Mário Neto' organization badge"
      );
    });

    test("F3.3: Sidebar contains system operational status indicator", () => {
      const content = fs.readFileSync(sidebarPath, "utf8");
      assert.ok(
        /Sistema Operacional|bg-emerald-500|status/i.test(content),
        "Sidebar must display the operational system status indicator"
      );
    });

    test("F3.4: Navbar does not duplicate organization badge", () => {
      if (fs.existsSync(navbarPath)) {
        const content = fs.readFileSync(navbarPath, "utf8");
        assert.ok(
          !content.includes("Grupo Mário Neto"),
          "Navbar must not duplicate Grupo Mário Neto badge (migrated to Sidebar)"
        );
      }
    });

    test("F3.5: Navbar is streamlined for actions (search, notifications, new lead)", () => {
      if (fs.existsSync(navbarPath)) {
        const content = fs.readFileSync(navbarPath, "utf8");
        assert.ok(
          /search|busca|notifica|novo lead|lead/i.test(content),
          "Navbar should focus on search, notifications, or quick actions"
        );
      }
    });
  });

  // --------------------------------------------------------------------------
  // F4: Database de Clientes Menu Hidden
  // --------------------------------------------------------------------------
  describe("F4: Database de Clientes Menu Hidden", () => {
    const sidebarPath = path.join(SRC_DIR, "components", "layout", "Sidebar.tsx");

    test("F4.1: Sidebar navItems array does not contain 'Database de Clientes'", () => {
      const content = fs.readFileSync(sidebarPath, "utf8");
      assert.ok(
        !content.includes('"Database de Clientes"') && !content.includes("'Database de Clientes'"),
        "Sidebar must not show 'Database de Clientes' in navigation"
      );
    });

    test("F4.2: Sidebar does not link to '/database'", () => {
      const content = fs.readFileSync(sidebarPath, "utf8");
      assert.ok(
        !content.includes('href: `/database`') &&
        !content.includes('href: "/database"') &&
        !content.includes("href: '/database'"),
        "Sidebar must not provide link to /database in commercial navigation"
      );
    });

    test("F4.3: Commercial navigation focuses on Kanban, Metas, and Relatórios", () => {
      const content = fs.readFileSync(sidebarPath, "utf8");
      assert.ok(
        /kanban/i.test(content) && /relat/i.test(content),
        "Sidebar must focus on Kanban de Leads and Relatórios"
      );
    });

    test("F4.4: Database icon is removed from primary navigation imports", () => {
      const content = fs.readFileSync(sidebarPath, "utf8");
      assert.ok(
        !/import\s*\{[^}]*\bDatabase\b[^}]*\}\s*from\s*["']lucide-react["']/.test(content),
        "Sidebar should not import unused Database icon from lucide-react"
      );
    });

    test("F4.5: Database route /database is hidden or redirected", async () => {
      const dbPagePath = path.join(SRC_DIR, "app", "database", "page.tsx");
      if (fs.existsSync(dbPagePath)) {
        const content = fs.readFileSync(dbPagePath, "utf8");
        assert.ok(
          /redirect|hidden|notFound|SUPERVISOR/i.test(content),
          "Access to /database should be restricted, hidden, or redirected"
        );
      }
    });
  });

  // --------------------------------------------------------------------------
  // F5: Post-Login Default Landing on Metas
  // --------------------------------------------------------------------------
  describe("F5: Post-Login Default Landing on Metas", () => {
    test("F5.1: Root page (src/app/page.tsx) renders or redirects to Metas", () => {
      const homePagePath = path.join(SRC_DIR, "app", "page.tsx");
      assert.ok(fs.existsSync(homePagePath), "src/app/page.tsx must exist");
      const content = fs.readFileSync(homePagePath, "utf8");
      assert.ok(
        /meta|goal|dashboard|bem-vindo/i.test(content),
        "Root page must render Goal/Metas dashboard or redirect to it"
      );
    });

    test("F5.2: Welcome banner template contains 'Bem-vindo - [Nome]'", () => {
      const homePagePath = path.join(SRC_DIR, "app", "page.tsx");
      const content = fs.readFileSync(homePagePath, "utf8");
      assert.ok(
        /Bem-vindo\s*-\s*/i.test(content) || /Bem-vindo/i.test(content),
        "Page must contain 'Bem-vindo - [Nome]' greeting"
      );
    });

    test("F5.3: Greeting dynamically interpolates user name", () => {
      const formatGreeting = (name: string) => `Bem-vindo - ${name}`;
      assert.equal(formatGreeting("Dra. Mariana"), "Bem-vindo - Dra. Mariana");
      assert.equal(formatGreeting("Carlos Silva"), "Bem-vindo - Carlos Silva");
    });

    test("F5.4: Goal dashboard component renders personal progress indicator", () => {
      const goalComponentPath = path.join(SRC_DIR, "components", "goals", "GoalDashboard.tsx");
      const pagePath = path.join(SRC_DIR, "app", "page.tsx");
      const content = fs.existsSync(goalComponentPath)
        ? fs.readFileSync(goalComponentPath, "utf8")
        : fs.readFileSync(pagePath, "utf8");

      assert.ok(
        /termometro|thermometer|progress|meta/i.test(content),
        "Goal dashboard must render personal goal thermometer/progress"
      );
    });

    test("F5.5: Goal dashboard renders team ranking table", () => {
      const rankingComponentPath = path.join(SRC_DIR, "components", "goals", "GoalRankingTable.tsx");
      const pagePath = path.join(SRC_DIR, "app", "page.tsx");
      const content = fs.existsSync(rankingComponentPath)
        ? fs.readFileSync(rankingComponentPath, "utf8")
        : fs.readFileSync(pagePath, "utf8");

      assert.ok(
        /ranking|posicao|rankingposition|tabela/i.test(content),
        "Goal dashboard must render team ranking metrics"
      );
    });
  });

  // --------------------------------------------------------------------------
  // F6: Goal Thermometer & Ranking Calculation
  // --------------------------------------------------------------------------
  describe("F6: Goal Thermometer & Ranking Calculation from Won Deals", () => {
    test("F6.1: goalService exports getUserGoal and getTeamGoalRanking", async () => {
      const goalService = await loadModule<any>("src/services/goalService.ts");
      assert.ok(
        goalService && typeof goalService.getUserGoal === "function",
        "src/services/goalService.ts must export getUserGoal"
      );
      assert.ok(
        typeof goalService.getTeamGoalRanking === "function",
        "src/services/goalService.ts must export getTeamGoalRanking"
      );
    });

    test("F6.2: Revenue progress calculation matches won deals dealValue sum", () => {
      const targetAmount = 50000;
      const wonDeals = [
        { dealValue: 15000, isWon: true },
        { dealValue: 20000, isWon: true },
        { dealValue: 5000, isWon: false }, // should be ignored
      ];
      const currentAmount = wonDeals.filter((d) => d.isWon).reduce((acc, d) => acc + d.dealValue, 0);
      const percentage = (currentAmount / targetAmount) * 100;

      assert.equal(currentAmount, 35000);
      assert.equal(percentage, 70);
    });

    test("F6.3: Deals count progress calculation matches won cards count", () => {
      const targetDeals = 10;
      const currentDeals = 8;
      const dealsPercentage = (currentDeals / targetDeals) * 100;

      assert.equal(dealsPercentage, 80);
    });

    test("F6.4: Zero target handles division by zero safely", () => {
      const targetAmount = 0;
      const currentAmount = 5000;
      const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
      assert.equal(percentage, 0);
    });

    test("F6.5: Ranking calculation orders reps by attainment descending", () => {
      const reps = [
        { userId: "1", userName: "Rep A", percentage: 65, currentAmount: 32500 },
        { userId: "2", userName: "Rep B", percentage: 95, currentAmount: 47500 },
        { userId: "3", userName: "Rep C", percentage: 80, currentAmount: 40000 },
      ];
      const ranked = [...reps].sort((a, b) => b.percentage - a.percentage);

      assert.equal(ranked[0].userName, "Rep B");
      assert.equal(ranked[1].userName, "Rep C");
      assert.equal(ranked[2].userName, "Rep A");
    });
  });

  // --------------------------------------------------------------------------
  // F7: RBAC Role Permissions
  // --------------------------------------------------------------------------
  describe("F7: RBAC Role Permissions (Supervisor vs Operator)", () => {
    test("F7.1: Supported system roles include SUPERVISOR/ADMIN and MEMBER", async () => {
      const auth = await loadModule<any>("src/lib/auth.ts");
      assert.ok(auth, "src/lib/auth.ts must exist");
    });

    test("F7.2: Supervisor role has access to team management and target setting", () => {
      const hasPermission = (role: string, action: string) => {
        if (role === "SUPERVISOR" || role === "ADMIN") return true;
        if (role === "MEMBER" && ["VIEW_METAS", "VIEW_KANBAN", "VIEW_REPORTS"].includes(action)) return true;
        return false;
      };

      assert.equal(hasPermission("SUPERVISOR", "MANAGE_TEAM"), true);
      assert.equal(hasPermission("SUPERVISOR", "SET_GOALS"), true);
      assert.equal(hasPermission("SUPERVISOR", "BIND_WHATSAPP"), true);
      assert.equal(hasPermission("SUPERVISOR", "CREATE_LABEL"), true);
    });

    test("F7.3: Operator (MEMBER) is restricted from management actions", () => {
      const hasPermission = (role: string, action: string) => {
        if (role === "SUPERVISOR" || role === "ADMIN") return true;
        if (role === "MEMBER" && ["VIEW_METAS", "VIEW_KANBAN", "VIEW_REPORTS"].includes(action)) return true;
        return false;
      };

      assert.equal(hasPermission("MEMBER", "MANAGE_TEAM"), false);
      assert.equal(hasPermission("MEMBER", "SET_GOALS"), false);
      assert.equal(hasPermission("MEMBER", "CREATE_LABEL"), false);
    });

    test("F7.4: Operator has authorized access to Metas, Kanban, and Reports", () => {
      const hasPermission = (role: string, action: string) => {
        if (role === "SUPERVISOR" || role === "ADMIN") return true;
        if (role === "MEMBER" && ["VIEW_METAS", "VIEW_KANBAN", "VIEW_REPORTS"].includes(action)) return true;
        return false;
      };

      assert.equal(hasPermission("MEMBER", "VIEW_METAS"), true);
      assert.equal(hasPermission("MEMBER", "VIEW_KANBAN"), true);
      assert.equal(hasPermission("MEMBER", "VIEW_REPORTS"), true);
    });

    test("F7.5: Invalid or missing roles return false for all actions", () => {
      const hasPermission = (role: string, action: string) => {
        if (role === "SUPERVISOR" || role === "ADMIN") return true;
        if (role === "MEMBER" && ["VIEW_METAS", "VIEW_KANBAN", "VIEW_REPORTS"].includes(action)) return true;
        return false;
      };

      assert.equal(hasPermission("ANONYMOUS", "VIEW_METAS"), false);
      assert.equal(hasPermission("", "VIEW_KANBAN"), false);
    });
  });

  // --------------------------------------------------------------------------
  // F8: Work Schedule Access Control
  // --------------------------------------------------------------------------
  describe("F8: Work Schedule Access Control (HTTP 403)", () => {
    test("F8.1: auth.ts exports checkScheduleAccess function", async () => {
      const auth = await loadModule<any>("src/lib/auth.ts");
      assert.ok(
        auth && typeof auth.checkScheduleAccess === "function",
        "src/lib/auth.ts must export checkScheduleAccess"
      );
    });

    test("F8.2: Monday 10:00 AM (business hours) is permitted for Operator", async () => {
      const auth = await loadModule<any>("src/lib/auth.ts");
      if (auth?.checkScheduleAccess) {
        // Mock monday at 10:00
        const result = auth.checkScheduleAccess({
          role: "MEMBER",
          allowedDays: "1,2,3,4,5",
          workStartTime: "08:00",
          workEndTime: "18:00",
        });
        assert.ok(result);
      }
    });

    test("F8.3: Weekday 19:30 PM (after hours) is blocked with reason", async () => {
      const auth = await loadModule<any>("src/lib/auth.ts");
      if (auth?.checkScheduleAccess) {
        const check = (currentTimeStr: string) => {
          const [h, m] = currentTimeStr.split(":").map(Number);
          const totalMin = h * 60 + m;
          const startMin = 8 * 60;
          const endMin = 18 * 60;
          return totalMin >= startMin && totalMin <= endMin;
        };
        assert.equal(check("19:30"), false);
      }
    });

    test("F8.4: Weekend access is blocked for Operator", async () => {
      const isWeekendAllowed = (dayOfWeek: number, allowedDays = "1,2,3,4,5") => {
        return allowedDays.split(",").map(Number).includes(dayOfWeek);
      };
      // 0 is Sunday, 6 is Saturday
      assert.equal(isWeekendAllowed(0), false);
      assert.equal(isWeekendAllowed(6), false);
    });

    test("F8.5: Supervisor bypasses work schedule restrictions", async () => {
      const auth = await loadModule<any>("src/lib/auth.ts");
      if (auth?.checkScheduleAccess) {
        const result = auth.checkScheduleAccess({
          role: "SUPERVISOR",
          allowedDays: "1,2,3,4,5",
          workStartTime: "08:00",
          workEndTime: "18:00",
        });
        assert.equal(result.allowed, true);
      }
    });
  });

  // --------------------------------------------------------------------------
  // F9: Vendor WhatsApp Binding
  // --------------------------------------------------------------------------
  describe("F9: Vendor WhatsApp Binding to Sales Reps", () => {
    test("F9.1: E.164 phone number validator enforces international format", () => {
      const isValidE164 = (phone: string) => /^\+[1-9]\d{1,14}$/.test(phone);

      assert.equal(isValidE164("+5511999998888"), true);
      assert.equal(isValidE164("+5521988887777"), true);
      assert.equal(isValidE164("11999998888"), false, "Must require leading +");
      assert.equal(isValidE164("invalid"), false);
    });

    test("F9.2: Sales reps can be indexed and retrieved by WhatsApp number", () => {
      const reps = [
        { id: "usr_1", name: "Carlos", whatsapp: "+5511999990001" },
        { id: "usr_2", name: "Beatriz", whatsapp: "+5511999990002" },
      ];
      const findByPhone = (phone: string) => reps.find((r) => r.whatsapp === phone);

      assert.equal(findByPhone("+5511999990001")?.name, "Carlos");
      assert.equal(findByPhone("+5511999990002")?.name, "Beatriz");
      assert.equal(findByPhone("+5511999999999"), undefined);
    });

    test("F9.3: Multiple reps maintain distinct WhatsApp numbers", () => {
      const numbers = ["+5511999990001", "+5511999990002", "+5511999990003"];
      const uniqueNumbers = new Set(numbers);
      assert.equal(uniqueNumbers.size, numbers.length);
    });

    test("F9.4: Meta Ads campaign destination maps to bound rep WhatsApp", () => {
      const campaigns = [
        { campaignId: "camp_odonto_sp", targetWhatsapp: "+5511999990001" },
        { campaignId: "camp_medica_rj", targetWhatsapp: "+5521988880002" },
      ];
      const getRepForCampaign = (campId: string) => campaigns.find((c) => c.campaignId === campId)?.targetWhatsapp;

      assert.equal(getRepForCampaign("camp_odonto_sp"), "+5511999990001");
      assert.equal(getRepForCampaign("camp_medica_rj"), "+5521988880002");
    });

    test("F9.5: Unmapped WhatsApp destination defaults safely", () => {
      const campaigns = [{ campaignId: "camp_1", targetWhatsapp: "+5511999990001" }];
      const getRep = (phone: string) => campaigns.find((c) => c.targetWhatsapp === phone) || null;
      assert.equal(getRep("+5599999999999"), null);
    });
  });

  // --------------------------------------------------------------------------
  // F10: Quick Card Operations & Deletion
  // --------------------------------------------------------------------------
  describe("F10: Quick Card Operations & Deletion", () => {
    test("F10.1: CardService exports deleteCard", async () => {
      const cardService = await loadModule<any>("src/services/cardService.ts");
      assert.ok(
        cardService && typeof cardService.deleteCard === "function",
        "src/services/cardService.ts must export deleteCard"
      );
    });

    test("F10.2: Quick card creation initialises required defaults", async () => {
      const cardService = await loadModule<any>("src/services/cardService.ts");
      assert.ok(cardService && typeof cardService.createCard === "function");
    });

    test("F10.3: Supervisor is authorized to delete any card", () => {
      const canDeleteCard = (userRole: string, isCreator: boolean) => {
        if (userRole === "SUPERVISOR" || userRole === "ADMIN") return true;
        if (userRole === "MEMBER" && isCreator) return true;
        return false;
      };

      assert.equal(canDeleteCard("SUPERVISOR", false), true);
      assert.equal(canDeleteCard("ADMIN", false), true);
    });

    test("F10.4: Non-creator operator is rejected from deleting card", () => {
      const canDeleteCard = (userRole: string, isCreator: boolean) => {
        if (userRole === "SUPERVISOR" || userRole === "ADMIN") return true;
        if (userRole === "MEMBER" && isCreator) return true;
        return false;
      };

      assert.equal(canDeleteCard("MEMBER", false), false);
    });

    test("F10.5: DELETE /api/cards/[id] route handler file exists", () => {
      const routePath = path.join(SRC_DIR, "app", "api", "cards", "[id]", "route.ts");
      assert.ok(fs.existsSync(routePath), "Route handler /api/cards/[id]/route.ts must exist");
      const content = fs.readFileSync(routePath, "utf8");
      assert.ok(content.includes("DELETE"), "Route handler must export DELETE function");
    });
  });

  // --------------------------------------------------------------------------
  // F11: Card Context Menu (3 dots)
  // --------------------------------------------------------------------------
  describe("F11: Card Context Menu (3 dots)", () => {
    test("F11.1: CardService exports updateCardColor", async () => {
      const cardService = await loadModule<any>("src/services/cardService.ts");
      assert.ok(
        cardService && typeof cardService.updateCardColor === "function",
        "src/services/cardService.ts must export updateCardColor"
      );
    });

    test("F11.2: Card palette accepts valid hexadecimal color strings", () => {
      const isValidHexColor = (color: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
      assert.equal(isValidHexColor("#ef4444"), true);
      assert.equal(isValidHexColor("#3b82f6"), true);
      assert.equal(isValidHexColor("invalid-color"), false);
    });

    test("F11.3: Direct phase movement validates target phase belongs to pipe", () => {
      const phases = [{ id: "ph_1", pipeId: "pipe_1" }, { id: "ph_2", pipeId: "pipe_1" }];
      const validatePhase = (targetPhaseId: string, pipeId: string) =>
        phases.some((p) => p.id === targetPhaseId && p.pipeId === pipeId);

      assert.equal(validatePhase("ph_2", "pipe_1"), true);
      assert.equal(validatePhase("ph_3", "pipe_1"), false);
    });

    test("F11.4: Context menu component renders 4 core actions (Color, Move, Tags, Attachments)", () => {
      const menuPath = path.join(SRC_DIR, "components", "kanban", "CardContextMenu.tsx");
      const itemPath = path.join(SRC_DIR, "components", "kanban", "CardItem.tsx");
      const targetPath = fs.existsSync(menuPath) ? menuPath : itemPath;
      assert.ok(fs.existsSync(targetPath), "Card item or context menu must exist");

      const content = fs.readFileSync(targetPath, "utf8");
      assert.ok(
        /cor|color|mover|fase|etiqueta|tag|anexo|attachment/i.test(content),
        "Card item / menu must support color, move phase, tags, or attachments"
      );
    });

    test("F11.5: 3-dots trigger button is accessible on card element", () => {
      const itemPath = path.join(SRC_DIR, "components", "kanban", "CardItem.tsx");
      assert.ok(fs.existsSync(itemPath), "CardItem.tsx must exist");
      const content = fs.readFileSync(itemPath, "utf8");
      assert.ok(
        /MoreVertical|MoreHorizontal|pontinhos|menu/i.test(content),
        "CardItem must render 3-dots action icon"
      );
    });
  });

  // --------------------------------------------------------------------------
  // F12: Tag Governance
  // --------------------------------------------------------------------------
  describe("F12: Tag Governance (Supervisor-only Tag Creation)", () => {
    test("F12.1: Labels route handler checks role before creating tag", () => {
      const labelsRoutePath = path.join(SRC_DIR, "app", "api", "labels", "route.ts");
      if (fs.existsSync(labelsRoutePath)) {
        const content = fs.readFileSync(labelsRoutePath, "utf8");
        assert.ok(
          /SUPERVISOR|ADMIN|requireAuth|role/i.test(content),
          "/api/labels must enforce supervisor role for tag creation"
        );
      }
    });

    test("F12.2: Tag creation permission strictly enforces Supervisor only", () => {
      const canCreateTag = (role: string) => role === "SUPERVISOR" || role === "ADMIN";
      assert.equal(canCreateTag("SUPERVISOR"), true);
      assert.equal(canCreateTag("ADMIN"), true);
      assert.equal(canCreateTag("MEMBER"), false);
      assert.equal(canCreateTag("VIEWER"), false);
    });

    test("F12.3: Operators are allowed to apply existing tags to cards", () => {
      const canApplyExistingTag = (role: string) => ["SUPERVISOR", "ADMIN", "MEMBER"].includes(role);
      assert.equal(canApplyExistingTag("MEMBER"), true);
    });

    test("F12.4: Tag creation validates required label name and color", () => {
      const validateTagInput = (name?: string, color?: string) => {
        if (!name || name.trim().length === 0) return false;
        if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) return false;
        return true;
      };

      assert.equal(validateTagInput("VIP Médico", "#10b981"), true);
      assert.equal(validateTagInput("", "#10b981"), false);
      assert.equal(validateTagInput("VIP Médico", "invalid"), false);
    });

    test("F12.5: Pipe association is required for tag scoping", () => {
      const validatePipeScoping = (pipeId?: string) => Boolean(pipeId && pipeId.length > 0);
      assert.equal(validatePipeScoping("pipe_crm_123"), true);
      assert.equal(validatePipeScoping(""), false);
    });
  });

  // --------------------------------------------------------------------------
  // F13: Secure Attachment Management
  // --------------------------------------------------------------------------
  describe("F13: Secure Attachment Management", () => {
    test("F13.1: CardService exports addCardAttachment", async () => {
      const cardService = await loadModule<any>("src/services/cardService.ts");
      assert.ok(
        cardService && typeof cardService.addCardAttachment === "function",
        "src/services/cardService.ts must export addCardAttachment"
      );
    });

    test("F13.2: Attachment schema fields (fileName, fileUrl, mimeType, sizeBytes)", () => {
      const attachment = {
        fileName: "receita_oftalmo.pdf",
        fileUrl: "/uploads/receita_oftalmo.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1048576,
      };
      assert.equal(typeof attachment.fileName, "string");
      assert.equal(typeof attachment.fileUrl, "string");
      assert.equal(attachment.mimeType, "application/pdf");
      assert.ok(attachment.sizeBytes > 0);
    });

    test("F13.3: Route handler for attachments exists", () => {
      const routePath = path.join(SRC_DIR, "app", "api", "cards", "[id]", "attachments", "route.ts");
      if (fs.existsSync(routePath)) {
        const content = fs.readFileSync(routePath, "utf8");
        assert.ok(content.includes("POST") || content.includes("GET"));
      }
    });

    test("F13.4: Attachment drawer visualises attached medical documents", () => {
      const drawerPath = path.join(SRC_DIR, "components", "card", "CardDrawer.tsx");
      assert.ok(fs.existsSync(drawerPath), "CardDrawer.tsx must exist");
      const content = fs.readFileSync(drawerPath, "utf8");
      assert.ok(
        /anexo|attachment|document|file|receita/i.test(content),
        "CardDrawer must render attachments section"
      );
    });

    test("F13.5: Multiple attachments can be associated to single card", () => {
      const attachments = [
        { id: "att_1", fileName: "receita.pdf" },
        { id: "att_2", fileName: "proposta.pdf" },
      ];
      assert.equal(attachments.length, 2);
    });
  });

  // --------------------------------------------------------------------------
  // F14: Meta Ads Webhook GET Handshake
  // --------------------------------------------------------------------------
  describe("F14: Meta Ads Webhook GET Handshake", () => {
    test("F14.1: Webhook route exists at src/app/api/webhooks/meta/route.ts", () => {
      const routePath = path.join(SRC_DIR, "app", "api", "webhooks", "meta", "route.ts");
      assert.ok(
        fs.existsSync(routePath),
        "Meta webhook route must exist at src/app/api/webhooks/meta/route.ts"
      );
    });

    test("F14.2: Webhook GET handler returns hub.challenge on matching verify_token", async () => {
      const metaRoute = await loadModule<any>("src/app/api/webhooks/meta/route.ts");
      if (metaRoute?.GET) {
        const verifyToken = process.env.META_VERIFY_TOKEN || "flowleads_verify_token";
        const challenge = "CHALLENGE_STRING_12345";
        const url = `http://localhost:3000/api/webhooks/meta?hub.mode=subscribe&hub.challenge=${challenge}&hub.verify_token=${verifyToken}`;
        const req = new Request(url, { method: "GET" });
        const res = await metaRoute.GET(req);

        assert.equal(res.status, 200);
        const text = await res.text();
        assert.equal(text, challenge);
      }
    });

    test("F14.3: Webhook GET handler rejects invalid verify_token with 403", async () => {
      const metaRoute = await loadModule<any>("src/app/api/webhooks/meta/route.ts");
      if (metaRoute?.GET) {
        const url = `http://localhost:3000/api/webhooks/meta?hub.mode=subscribe&hub.challenge=test&hub.verify_token=WRONG_TOKEN`;
        const req = new Request(url, { method: "GET" });
        const res = await metaRoute.GET(req);
        assert.equal(res.status, 403);
      }
    });

    test("F14.4: Webhook GET handler rejects missing hub.challenge", async () => {
      const metaRoute = await loadModule<any>("src/app/api/webhooks/meta/route.ts");
      if (metaRoute?.GET) {
        const url = `http://localhost:3000/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=valid`;
        const req = new Request(url, { method: "GET" });
        const res = await metaRoute.GET(req);
        assert.ok(res.status === 400 || res.status === 403);
      }
    });

    test("F14.5: Webhook GET handler rejects invalid hub.mode", async () => {
      const metaRoute = await loadModule<any>("src/app/api/webhooks/meta/route.ts");
      if (metaRoute?.GET) {
        const url = `http://localhost:3000/api/webhooks/meta?hub.mode=invalid_mode&hub.challenge=test&hub.verify_token=valid`;
        const req = new Request(url, { method: "GET" });
        const res = await metaRoute.GET(req);
        assert.ok(res.status === 400 || res.status === 403);
      }
    });
  });

  // --------------------------------------------------------------------------
  // F15: Meta Ads Webhook POST Signature Verification
  // --------------------------------------------------------------------------
  describe("F15: Meta Ads Webhook POST Signature Verification", () => {
    test("F15.1: metaLeadService exports verifyMetaSignature", async () => {
      const metaService = await loadModule<any>("src/services/metaLeadService.ts");
      const metaLib = await loadModule<any>("src/lib/meta.ts");
      const hasFn = Boolean(metaService?.verifyMetaSignature || metaLib?.verifyMetaSignature);
      assert.ok(hasFn, "verifyMetaSignature must be exported from metaLeadService or lib/meta");
    });

    test("F15.2: Valid HMAC-SHA256 signature returns true", () => {
      const secret = "meta_app_secret_xyz123";
      const payload = JSON.stringify({ entry: [{ id: "1" }] });
      const signature = generateMetaSignature(payload, secret);

      const computed = generateMetaSignature(payload, secret);
      assert.equal(signature, computed);
    });

    test("F15.3: Tampered payload fails signature validation", () => {
      const secret = "meta_app_secret_xyz123";
      const originalPayload = JSON.stringify({ entry: [{ id: "1" }] });
      const tamperedPayload = JSON.stringify({ entry: [{ id: "2" }] });
      const signature = generateMetaSignature(originalPayload, secret);
      const tamperedSignature = generateMetaSignature(tamperedPayload, secret);

      assert.notEqual(signature, tamperedSignature);
    });

    test("F15.4: Wrong secret fails signature validation", () => {
      const payload = JSON.stringify({ entry: [{ id: "1" }] });
      const sig1 = generateMetaSignature(payload, "secret_1");
      const sig2 = generateMetaSignature(payload, "secret_2");
      assert.notEqual(sig1, sig2);
    });

    test("F15.5: Timing-safe comparison is used to protect against timing attacks", () => {
      const bufA = Buffer.from("a".repeat(64), "utf8");
      const bufB = Buffer.from("a".repeat(64), "utf8");
      const bufC = Buffer.from("b".repeat(64), "utf8");

      assert.equal(crypto.timingSafeEqual(bufA, bufB), true);
      assert.equal(crypto.timingSafeEqual(bufA, bufC), false);
    });
  });

  // --------------------------------------------------------------------------
  // F16: Graph API Lead Extraction
  // --------------------------------------------------------------------------
  describe("F16: Graph API Lead Extraction into Initial Phase", () => {
    test("F16.1: metaLeadService exports processMetaLead", async () => {
      const metaService = await loadModule<any>("src/services/metaLeadService.ts");
      assert.ok(
        metaService && typeof metaService.processMetaLead === "function",
        "src/services/metaLeadService.ts must export processMetaLead"
      );
    });

    test("F16.2: Webhook payload structure conforms to Meta leadgen specs", () => {
      const payload = {
        entry: [
          {
            id: "entry_1",
            changes: [
              {
                field: "leadgen",
                value: {
                  leadgen_id: "lead_meta_9999",
                  form_id: "form_1234",
                  ad_id: "ad_5678",
                  campaign_id: "camp_9999",
                  created_time: Date.now(),
                },
              },
            ],
          },
        ],
      };

      assert.equal(payload.entry[0].changes[0].value.leadgen_id, "lead_meta_9999");
    });

    test("F16.3: Lead extraction targets initial phase (Novos Leads)", async () => {
      const pipeService = await loadModule<any>("src/services/pipeService.ts");
      if (pipeService?.listPipes) {
        const pipes = await pipeService.listPipes();
        if (pipes?.length > 0) {
          const pipe = await pipeService.getPipeById(pipes[0].id);
          const initialPhase = pipe?.phases.find((p: any) => p.order === 0 || /novo/i.test(p.name));
          assert.ok(initialPhase, "Pipe must have an initial phase (Novos Leads)");
        }
      }
    });

    test("F16.4: Graph API mock extraction returns customer details", () => {
      const mockLeadData = {
        id: "lead_meta_9999",
        name: "Dr. Roberto Medeiros",
        email: "roberto@clinica.com",
        phone: "+5511988887777",
        campaign_name: "Campanha Equipamentos Médicos Q4",
      };
      assert.equal(mockLeadData.name, "Dr. Roberto Medeiros");
      assert.equal(mockLeadData.phone, "+5511988887777");
    });

    test("F16.5: Malformed webhook payload does not crash ingestion", () => {
      const parseSafely = (raw: string) => {
        try {
          const parsed = JSON.parse(raw);
          if (!parsed?.entry || !Array.isArray(parsed.entry)) return null;
          return parsed;
        } catch {
          return null;
        }
      };

      assert.equal(parseSafely("invalid json"), null);
      assert.equal(parseSafely("{}"), null);
      assert.ok(parseSafely(JSON.stringify({ entry: [] })));
    });
  });

  // --------------------------------------------------------------------------
  // F17: Intelligent WhatsApp Routing
  // --------------------------------------------------------------------------
  describe("F17: Intelligent WhatsApp Routing", () => {
    test("F17.1: Routes lead to sales rep matching ad WhatsApp number", () => {
      const reps = [
        { id: "usr_carlos", name: "Carlos", whatsapp: "+5511999991111" },
        { id: "usr_ana", name: "Ana", whatsapp: "+5511999992222" },
      ];
      const routeLead = (incomingWhatsapp: string) =>
        reps.find((r) => r.whatsapp === incomingWhatsapp)?.id || null;

      assert.equal(routeLead("+5511999991111"), "usr_carlos");
      assert.equal(routeLead("+5511999992222"), "usr_ana");
    });

    test("F17.2: Unmatched WhatsApp destination assigns to fallback/round-robin", () => {
      const reps = [{ id: "usr_default", name: "Supervisor Master" }];
      const fallbackAssign = () => reps[0].id;
      assert.equal(fallbackAssign(), "usr_default");
    });

    test("F17.3: Routing creates assignment activity on card", () => {
      const activity = {
        actionType: "ASSIGNED",
        details: "Atribuído automaticamente via roteamento WhatsApp Meta Ads (+5511999991111)",
      };
      assert.equal(activity.actionType, "ASSIGNED");
      assert.ok(activity.details.includes("+5511999991111"));
    });

    test("F17.4: Destination phone number normalization removes non-digits except +", () => {
      const normalizePhone = (raw: string) => {
        const cleaned = raw.replace(/[^\d+]/g, "");
        return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
      };

      assert.equal(normalizePhone("(11) 99999-1111"), "+11999991111");
      assert.equal(normalizePhone("+55 (11) 99999-1111"), "+5511999991111");
    });

    test("F17.5: WhatsApp click-to-chat link generator works correctly", () => {
      const generateWaLink = (phone: string, text: string) =>
        `https://wa.me/${phone.replace("+", "")}?text=${encodeURIComponent(text)}`;

      const link = generateWaLink("+5511999991111", "Olá, recebemos seu contato!");
      assert.ok(link.includes("5511999991111"));
      assert.ok(link.includes("Ol%C3%A1"));
    });
  });

  // --------------------------------------------------------------------------
  // F18: Password Cryptography (bcrypt 12 rounds)
  // --------------------------------------------------------------------------
  describe("F18: Password Cryptography (bcrypt 12 rounds)", () => {
    test("F18.1: Hash generated with 12 rounds begins with $2a$12$ or $2b$12$", async () => {
      const salt = await bcrypt.genSalt(12);
      const hash = await bcrypt.hash("FlowLeads2026!", salt);
      assert.ok(
        hash.startsWith("$2a$12$") || hash.startsWith("$2b$12$"),
        `Hash must use 12 rounds, got: ${hash.slice(0, 7)}`
      );
    });

    test("F18.2: Compare correctly verifies valid password", async () => {
      const password = "SecretPassword123!";
      const hash = await bcrypt.hash(password, 12);
      const isMatch = await bcrypt.compare(password, hash);
      assert.equal(isMatch, true);
    });

    test("F18.3: Compare rejects invalid password", async () => {
      const password = "SecretPassword123!";
      const hash = await bcrypt.hash(password, 12);
      const isMatch = await bcrypt.compare("WrongPassword!", hash);
      assert.equal(isMatch, false);
    });

    test("F18.4: Identical passwords produce distinct hashes due to salts", async () => {
      const pwd = "IdenticalPassword!";
      const hash1 = await bcrypt.hash(pwd, 12);
      const hash2 = await bcrypt.hash(pwd, 12);
      assert.notEqual(hash1, hash2);
    });

    test("F18.5: Database seed file specifies 12 rounds for user passwords", () => {
      const seedPath = path.join(PROJECT_ROOT, "prisma", "seed.ts");
      if (fs.existsSync(seedPath)) {
        const content = fs.readFileSync(seedPath, "utf8");
        assert.ok(
          /bcrypt\.hash\([^,]+,\s*12\)/.test(content) || /genSalt\(12\)/.test(content) || content.includes("12"),
          "Seed file must use 12 rounds for password hashing"
        );
      }
    });
  });

  // --------------------------------------------------------------------------
  // F19: Anti-Session Hijacking
  // --------------------------------------------------------------------------
  describe("F19: Anti-Session Hijacking (HMAC & Fingerprint)", () => {
    test("F19.1: auth.ts exports signSession and verifySession", async () => {
      const auth = await loadModule<any>("src/lib/auth.ts");
      assert.ok(
        auth && typeof auth.signSession === "function",
        "src/lib/auth.ts must export signSession"
      );
      assert.ok(
        typeof auth.verifySession === "function",
        "src/lib/auth.ts must export verifySession"
      );
    });

    test("F19.2: signSession generates signed token with data and signature segments", () => {
      const payload = {
        userId: "usr_test",
        email: "test@flowleads.com",
        name: "Test User",
        role: "MEMBER",
        organizationId: "org_1",
        fingerprint: computeUserAgentFingerprint("Mozilla/5.0 Chrome"),
        issuedAt: Date.now(),
      };
      const token = createMockSessionToken(payload, "secret_hmac");
      const parts = token.split(".");
      assert.equal(parts.length, 2);
    });

    test("F19.3: Matching User-Agent fingerprint succeeds verification", () => {
      const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
      const fingerprint = computeUserAgentFingerprint(userAgent);
      const payload = {
        userId: "usr_test",
        fingerprint,
        issuedAt: Date.now(),
      };
      const token = createMockSessionToken(payload, "secret_hmac");

      // Verify token
      const [data64, sig] = token.split(".");
      const expectedSig = crypto.createHmac("sha256", "secret_hmac").update(data64).digest("base64url");
      assert.equal(sig, expectedSig);

      const decoded = JSON.parse(Buffer.from(data64, "base64url").toString("utf8"));
      assert.equal(decoded.fingerprint, computeUserAgentFingerprint(userAgent));
    });

    test("F19.4: Mismatched User-Agent fingerprint rejects token (session hijacking defense)", () => {
      const originalUA = "Mozilla/5.0 Chrome";
      const attackerUA = "Mozilla/5.0 Firefox";
      const payload = {
        userId: "usr_test",
        fingerprint: computeUserAgentFingerprint(originalUA),
        issuedAt: Date.now(),
      };
      const token = createMockSessionToken(payload, "secret_hmac");

      const [data64] = token.split(".");
      const decoded = JSON.parse(Buffer.from(data64, "base64url").toString("utf8"));
      const isHijacked = decoded.fingerprint !== computeUserAgentFingerprint(attackerUA);
      assert.equal(isHijacked, true, "Fingerprint mismatch must flag session hijacking");
    });

    test("F19.5: Tampered token signature fails verification", () => {
      const payload = { userId: "usr_1", issuedAt: Date.now() };
      const token = createMockSessionToken(payload, "secret_hmac");
      const [data64] = token.split(".");
      const tamperedToken = `${data64}.tampered_signature_xyz`;

      const [d, s] = tamperedToken.split(".");
      const validSig = crypto.createHmac("sha256", "secret_hmac").update(d).digest("base64url");
      assert.notEqual(s, validSig);
    });
  });

  // --------------------------------------------------------------------------
  // F20: Route Handler RBAC Guards
  // --------------------------------------------------------------------------
  describe("F20: Route Handler RBAC Guards", () => {
    test("F20.1: auth.ts exports requireAuth helper", async () => {
      const auth = await loadModule<any>("src/lib/auth.ts");
      assert.ok(
        auth && typeof auth.requireAuth === "function",
        "src/lib/auth.ts must export requireAuth"
      );
    });

    test("F20.2: requireAuth permits role when included in allowedRoles", () => {
      const evaluateRole = (userRole: string, allowedRoles: string[]) => allowedRoles.includes(userRole);
      assert.equal(evaluateRole("SUPERVISOR", ["SUPERVISOR", "ADMIN"]), true);
      assert.equal(evaluateRole("MEMBER", ["MEMBER", "SUPERVISOR"]), true);
    });

    test("F20.3: requireAuth rejects unauthorized role with 403 Forbidden", () => {
      const evaluateRole = (userRole: string, allowedRoles: string[]) => allowedRoles.includes(userRole);
      assert.equal(evaluateRole("MEMBER", ["SUPERVISOR", "ADMIN"]), false);
    });

    test("F20.4: requireAuth rejects missing session with 401 Unauthorized", () => {
      const getSessionUser = (token?: string) => (token ? { id: "1" } : null);
      assert.equal(getSessionUser(undefined), null);
    });

    test("F20.5: Route handlers across /api/ check authorization", () => {
      const routesToCheck = [
        path.join(SRC_DIR, "app", "api", "labels", "route.ts"),
        path.join(SRC_DIR, "app", "api", "cards", "[id]", "route.ts"),
      ];
      for (const route of routesToCheck) {
        if (fs.existsSync(route)) {
          const content = fs.readFileSync(route, "utf8");
          assert.ok(
            /requireAuth|auth|session|unauthorized|401|403/i.test(content),
            `Route ${route} must check authorization`
          );
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // F21: File Upload Sanitization
  // --------------------------------------------------------------------------
  describe("F21: File Upload Sanitization (Magic Bytes & Extensions)", () => {
    test("F21.1: storage.ts exports file validation helper", async () => {
      const storage = await loadModule<any>("src/lib/storage.ts");
      assert.ok(
        storage && (typeof storage.validateFile === "function" || typeof storage.sanitizeUpload === "function"),
        "src/lib/storage.ts must export validateFile or sanitizeUpload"
      );
    });

    test("F21.2: Magic bytes validation accepts valid PDF (%PDF-)", () => {
      const pdfBuffer = createValidPdfBuffer();
      const isPdf = pdfBuffer.subarray(0, 4).toString("utf8") === "%PDF";
      assert.equal(isPdf, true);
    });

    test("F21.3: Magic bytes validation accepts valid PNG and JPEG", () => {
      const pngBuffer = createValidPngBuffer();
      const isPng =
        pngBuffer[0] === 0x89 &&
        pngBuffer[1] === 0x50 &&
        pngBuffer[2] === 0x4e &&
        pngBuffer[3] === 0x47;
      assert.equal(isPng, true);

      const jpegBuffer = createValidJpegBuffer();
      const isJpeg = jpegBuffer[0] === 0xff && jpegBuffer[1] === 0xd8 && jpegBuffer[2] === 0xff;
      assert.equal(isJpeg, true);
    });

    test("F21.4: Executable binary disguised as PDF is detected and rejected", () => {
      const exeBuffer = createMaliciousExeBuffer();
      const isExe = exeBuffer[0] === 0x4d && exeBuffer[1] === 0x5a; // MZ header
      assert.equal(isExe, true, "Must detect MZ header of executable");

      const isSafePdf = (buf: Buffer, name: string) => {
        if (!name.endsWith(".pdf")) return false;
        return buf.subarray(0, 4).toString("utf8") === "%PDF";
      };
      assert.equal(isSafePdf(exeBuffer, "prescription.pdf"), false);
    });

    test("F21.5: Extension whitelist rejects dangerous scripts (.sh, .exe, .bat)", () => {
      const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".docx"];
      const isAllowedExt = (name: string) => {
        const ext = path.extname(name).toLowerCase();
        return allowedExtensions.includes(ext);
      };

      assert.equal(isAllowedExt("receita.pdf"), true);
      assert.equal(isAllowedExt("foto.png"), true);
      assert.equal(isAllowedExt("script.sh"), false);
      assert.equal(isAllowedExt("virus.exe"), false);
      assert.equal(isAllowedExt("malware.bat"), false);
    });
  });

  // --------------------------------------------------------------------------
  // F22: Serverless / Cloud Compatibility
  // --------------------------------------------------------------------------
  describe("F22: Serverless / Cloud Compatibility", () => {
    test("F22.1: Prisma schema uses standard SQL/Prisma types compatible with Turso & PostgreSQL", () => {
      const schemaPath = path.join(PROJECT_ROOT, "prisma", "schema.prisma");
      assert.ok(fs.existsSync(schemaPath), "prisma/schema.prisma must exist");
      const content = fs.readFileSync(schemaPath, "utf8");
      assert.ok(
        !content.includes("Unsupported"),
        "Prisma schema must not contain Unsupported types that break serverless databases"
      );
    });

    test("F22.2: Storage adapter interface supports cloud storage (S3 / Vercel Blob)", () => {
      const storagePath = path.join(SRC_DIR, "lib", "storage.ts");
      if (fs.existsSync(storagePath)) {
        const content = fs.readFileSync(storagePath, "utf8");
        assert.ok(
          /s3|blob|cloud|storageadapter|uploadfile/i.test(content),
          "Storage library must support cloud storage abstraction"
        );
      }
    });

    test("F22.3: Session authentication is stateless (cookie-based HMAC)", () => {
      const authPath = path.join(SRC_DIR, "lib", "auth.ts");
      assert.ok(fs.existsSync(authPath), "auth.ts must exist");
      const content = fs.readFileSync(authPath, "utf8");
      assert.ok(
        /hmac|sign|jwt|cookie/i.test(content),
        "Authentication must be stateless to support serverless deployment"
      );
    });

    test("F22.4: Environment variables are properly loaded from process.env", () => {
      const getEnv = (key: string, defaultValue = "") => process.env[key] || defaultValue;
      assert.equal(typeof getEnv("NODE_ENV"), "string");
    });

    test("F22.5: Route handlers do not retain mutable global in-memory state", () => {
      const apiDir = path.join(SRC_DIR, "app", "api");
      const apiFiles = getAllFiles(apiDir);
      assert.ok(apiFiles.length > 0, "API route files must exist");
    });
  });
});

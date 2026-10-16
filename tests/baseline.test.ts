import test from "node:test";
import assert from "node:assert/strict";
import { cn, formatCurrency } from "../src/lib/utils.ts";

test("cn merges tailwind classes properly", () => {
  const res = cn("px-2 py-1", "px-4", { "bg-blue-500": true, "bg-red-500": false });
  assert.equal(res, "py-1 px-4 bg-blue-500");
});

test("formatCurrency formats BRL currency properly", () => {
  const res = formatCurrency(1250.5);
  assert.ok(res.includes("1.250,50"));
});

import { describe, expect, it } from "vitest";

import { issueFormSchema, projectFormSchema, suggestProjectKey } from "./schemas";

describe("projectFormSchema", () => {
  it("upper-cases and validates the project key", () => {
    const base = { name: "Zenith", key: " zen ", description: "", color: "blue", priority: "medium", target_date: null };
    expect(projectFormSchema.parse(base).key).toBe("ZEN");
    expect(projectFormSchema.safeParse({ ...base, key: "1AB" }).success).toBe(false);
  });

  it("accepts an optional target date and a known priority", () => {
    const base = { name: "Zenith", key: "ZEN", description: "", color: "blue", priority: "high", target_date: "2026-12-01" };
    expect(projectFormSchema.safeParse(base).success).toBe(true);
    expect(projectFormSchema.safeParse({ ...base, target_date: "next week" }).success).toBe(false);
    expect(projectFormSchema.safeParse({ ...base, priority: "urgent" }).success).toBe(false);
  });
});

describe("issueFormSchema", () => {
  it("requires a project and a known enum value", () => {
    const base = {
      project_id: "3f0e7a3e-8a8b-4c1a-9a63-0c6d3a6f1b2c",
      title: "Crash on save",
      description_md: "",
      type: "bug",
      priority: "critical",
      status: "todo",
    };
    expect(issueFormSchema.safeParse(base).success).toBe(true);
    expect(issueFormSchema.safeParse({ ...base, type: "epic" }).success).toBe(false);
    expect(issueFormSchema.safeParse({ ...base, project_id: "" }).success).toBe(false);
  });
});

describe("suggestProjectKey", () => {
  it("derives a key from the project name", () => {
    expect(suggestProjectKey("Zenith")).toBe("ZEN");
    expect(suggestProjectKey("Zenith Mobile App")).toBe("ZMA");
    expect(suggestProjectKey("")).toBe("");
  });
});

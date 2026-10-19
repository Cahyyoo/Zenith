import { describe, expect, it } from "vitest";

import { issueFormSchema, projectFormSchema, suggestProjectKey } from "./schemas";

describe("projectFormSchema", () => {
  it("upper-cases and validates the project key", () => {
    const parsed = projectFormSchema.parse({ name: "Zenith", key: " zen ", description: "", color: "blue" });
    expect(parsed.key).toBe("ZEN");
    expect(projectFormSchema.safeParse({ name: "Z", key: "1AB", description: "", color: "blue" }).success).toBe(false);
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

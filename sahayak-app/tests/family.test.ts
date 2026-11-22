import { describe, it, expect, beforeEach } from "vitest";
import { matchSchemes } from "../lib/engine";
import schemesData from "../seed/schemes.json";
import type { Scheme, Profile } from "../lib/types";
import { getDb } from "../lib/db";

const schemes = schemesData as unknown as Scheme[];

describe("Family Member Persistence and Matching Engine", () => {
  beforeEach(async () => {
    const db = await getDb();
    await db.execute("DELETE FROM family_members WHERE session_id = 'test_session_family'");
  });

  it("adds 2 members, persists them in database, and reloads them with independent data", async () => {
    const db = await getDb();
    const sessionId = "test_session_family";

    // Member 1: Ramesh (Son) - 25, student, single, income 300000
    const member1Profile: Profile = {
      age: 25,
      gender: "M",
      marital: "single",
      state: "Rajasthan",
      district: "Jaipur",
      annual_family_income: 300000,
      land_bigha: 0,
      occupation: "student",
      disability: false,
      children_count: 0,
      is_bpl: false,
    };

    // Member 2: Kamla (Mother) - 65, widow, income 40000
    const member2Profile: Profile = {
      age: 65,
      gender: "F",
      marital: "widow",
      state: "Rajasthan",
      district: "Jaipur",
      annual_family_income: 40000,
      land_bigha: 2,
      occupation: "other",
      disability: false,
      children_count: 2,
      is_bpl: true,
    };

    // Save Member 1
    const now1 = new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO family_members (id, session_id, relation, display_name, profile_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: ["mem_1", sessionId, "Son", "Ramesh (Son)", JSON.stringify(member1Profile), now1, now1],
    });

    // Save Member 2
    const now2 = new Date(Date.now() + 100).toISOString();
    await db.execute({
      sql: `INSERT INTO family_members (id, session_id, relation, display_name, profile_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: ["mem_2", sessionId, "Mother", "Kamla (Mother)", JSON.stringify(member2Profile), now2, now2],
    });

    // Simulate page reload: query DB for this session
    const reloadResult = await db.execute({
      sql: "SELECT id, relation, display_name, profile_json FROM family_members WHERE session_id = ? ORDER BY created_at ASC",
      args: [sessionId],
    });

    expect(reloadResult.rows.length).toBe(2);
    expect(reloadResult.rows[0].display_name).toBe("Ramesh (Son)");
    expect(reloadResult.rows[1].display_name).toBe("Kamla (Mother)");

    // Run matching for Member 1 (Ramesh)
    const mem1LoadedProfile: Profile = JSON.parse(String(reloadResult.rows[0].profile_json));
    const mem1Matches = matchSchemes(mem1LoadedProfile, schemes);
    const mem1Likely = mem1Matches.filter((m) => m.status === "LIKELY_ELIGIBLE");
    const mem1NeedInfo = mem1Matches.filter((m) => m.status === "NEED_MORE_INFO");
    const mem1NotEligible = mem1Matches.filter((m) => m.status === "NOT_ELIGIBLE");

    // All evaluated schemes are grouped
    const evaluatedSchemes = schemes.filter((s) => s.active && s.rules.length > 0);
    expect(mem1Likely.length + mem1NeedInfo.length + mem1NotEligible.length).toBe(evaluatedSchemes.length);

    // Run matching for Member 2 (Kamla - 65, widow)
    const mem2LoadedProfile: Profile = JSON.parse(String(reloadResult.rows[1].profile_json));
    const mem2Matches = matchSchemes(mem2LoadedProfile, schemes);
    const mem2Likely = mem2Matches.filter((m) => m.status === "LIKELY_ELIGIBLE");

    // Kamla qualifies for pension schemes that Ramesh does not
    const kamlaPension = mem2Likely.find(
      (m) => m.scheme.id === "old_age_pension" || m.scheme.id === "widow_pension"
    );
    expect(kamlaPension).toBeDefined();

    const rameshPension = mem1Likely.find(
      (m) => m.scheme.id === "old_age_pension" || m.scheme.id === "widow_pension"
    );
    expect(rameshPension).toBeUndefined();

    // Deleting Member 1 does not affect Member 2
    await db.execute({
      sql: "DELETE FROM family_members WHERE id = ?",
      args: ["mem_1"],
    });

    const afterDelete = await db.execute({
      sql: "SELECT id, display_name FROM family_members WHERE session_id = ?",
      args: [sessionId],
    });

    expect(afterDelete.rows.length).toBe(1);
    expect(afterDelete.rows[0].display_name).toBe("Kamla (Mother)");
  });

  it("correctly numbers duplicate relations when name is not provided", () => {
    function computeDisplayName(
      relationText: string,
      nameInput: string,
      existing: { relation: string; display_name: string }[]
    ): string {
      const cleanName = nameInput.trim();
      if (cleanName.length > 1) {
        return `${cleanName} (${relationText})`;
      }
      const sameRel = existing.filter((m) => m.relation === relationText);
      if (sameRel.length === 0) {
        return relationText;
      }
      return `${relationText} ${sameRel.length + 1}`;
    }

    const list: { relation: string; display_name: string }[] = [];

    // First son with no name
    const son1 = computeDisplayName("Son", "", list);
    expect(son1).toBe("Son");
    list.push({ relation: "Son", display_name: son1 });

    // Second son with no name
    const son2 = computeDisplayName("Son", "", list);
    expect(son2).toBe("Son 2");
    list.push({ relation: "Son", display_name: son2 });

    // Third son with a single stray character "a" (must be ignored)
    const son3 = computeDisplayName("Son", "a", list);
    expect(son3).toBe("Son 3");
    list.push({ relation: "Son", display_name: son3 });

    // Fourth son with custom name "Ramesh"
    const son4 = computeDisplayName("Son", "Ramesh", list);
    expect(son4).toBe("Ramesh (Son)");
  });
});

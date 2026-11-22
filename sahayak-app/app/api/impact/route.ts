import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { Scheme } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ApplicationRow {
  id: string;
  scheme_id: string;
  status: string;
  [key: string]: unknown;
}

export async function GET() {
  const db = getDb();

  const appRes = await db.execute("SELECT * FROM applications");
  const applications = appRes.rows as unknown as ApplicationRow[];
  const schemeRes = await db.execute("SELECT json FROM schemes");
  const schemeRows = schemeRes.rows as unknown as { json: string }[];

  const schemes = new Map<string, Scheme>();
  for (const row of schemeRows) {
    const scheme = JSON.parse(row.json) as Scheme;
    schemes.set(scheme.id, scheme);
  }

  // "saved" means the user only bookmarked it; anything else counts as started.
  const started = applications.filter((app) => app.status !== "saved");

  let estimatedYearlyBenefit = 0;
  let unverifiedAmountCount = 0;

  for (const app of started) {
    const scheme = schemes.get(app.scheme_id);
    if (!scheme) continue;
    if (scheme.benefit_type !== "cash_monthly") continue;

    const estimate = scheme.benefit_monthly_estimate;
    if (typeof estimate === "number" && Number.isFinite(estimate)) {
      estimatedYearlyBenefit += estimate * 12;
    } else if (estimate === null) {
      unverifiedAmountCount += 1;
    }
  }

  return NextResponse.json({
    sample: true,
    profiles_screened: 0,
    applications_started: started.length,
    estimated_yearly_benefit: estimatedYearlyBenefit,
    unverified_amount_count: unverifiedAmountCount,
    formula: "estimated yearly benefit = sum over started applications of (monthly cash benefit x 12)",
    assumptions: [
      "Sample data: this dashboard shows sample figures only, not real program totals. / यह नमूना डेटा है, असली कुल आंकड़े नहीं।",
      "Amounts come only from verified scheme data. / राशि केवल सत्यापित योजना डेटा से ली जाती है।",
      "Health cover is not cash and is excluded from the benefit total. / स्वास्थ्य बीमा नकद नहीं है, इसलिए इसे कुल में नहीं जोड़ा गया।",
      "Null amounts count as 0 and are shown in the unverified count. / जिन योजनाओं की राशि अज्ञात है, वे 0 गिनी गई हैं।",
      "profiles_screened is 0 because no profile table is stored. / कोई प्रोफ़ाइल तालिका सुरक्षित नहीं है, इसलिए प्रोफ़ाइल संख्या 0 है।",
    ],
  });
}

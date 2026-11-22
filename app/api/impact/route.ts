import { NextResponse } from "next/server";
import { loadSchemes } from "@/lib/schemes-store";
import { listApplications } from "@/lib/store-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const schemes = loadSchemes();
  const started = listApplications().filter((a) => a.status !== "saved");

  const estimated_yearly_benefit = started.reduce((sum, app) => {
    const scheme = schemes.find((s) => s.id === app.scheme_id);
    return sum + (scheme?.benefit_monthly_estimate ?? 0) * 12;
  }, 0);

  return NextResponse.json({
    sample: true,
    profiles_screened: 0,
    applications_started: started.length,
    estimated_yearly_benefit,
    formula: "estimated yearly benefit = sum over started applications of (monthly amount x 12)",
    assumptions: [
      "All numbers are SAMPLE data.",
      "Monthly amounts come only from verified scheme data; placeholders are null and count as 0.",
    ],
  });
}

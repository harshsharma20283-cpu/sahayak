import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export const APPLICATION_STATUSES = [
  "saved",
  "documents_ready",
  "applied",
  "under_review",
  "approved",
  "rejected",
] as const;

export interface ApplicationRecord {
  id: string;
  profile_id: string | null;
  scheme_id: string;
  status: string;
  updated_at: string;
  next_reminder_date: string | null;
}

export interface ReportRecord {
  id: string;
  scheme_id: string;
  district: string | null;
  note: string | null;
  created_at: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const APPLICATIONS_FILE = path.join(DATA_DIR, "applications.json");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");
const REMINDER_DAYS = 3;

function readList<T>(file: string): T[] {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf8");
  if (!raw.trim()) return [];
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function writeList<T>(file: string, list: T[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(list, null, 2), "utf8");
}

function reminderFor(status: string, now: Date): string | null {
  if (status !== "documents_ready") return null;
  return new Date(now.getTime() + REMINDER_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function sanitizeNote(note: string | null): string | null {
  if (typeof note !== "string") return null;
  const cleaned = note.replace(/\d{10,}/g, "[removed]").slice(0, 300).trim();
  return cleaned === "" ? null : cleaned;
}

export function addApplication(
  scheme_id: string,
  profile_id: string | null,
  status: string,
): ApplicationRecord {
  const now = new Date();
  const record: ApplicationRecord = {
    id: randomUUID(),
    profile_id,
    scheme_id,
    status,
    updated_at: now.toISOString(),
    next_reminder_date: reminderFor(status, now),
  };
  const list = readList<ApplicationRecord>(APPLICATIONS_FILE);
  list.push(record);
  writeList(APPLICATIONS_FILE, list);
  return record;
}

export function listApplications(): ApplicationRecord[] {
  return readList<ApplicationRecord>(APPLICATIONS_FILE);
}

export function updateApplicationStatus(id: string, status: string): ApplicationRecord | null {
  const list = readList<ApplicationRecord>(APPLICATIONS_FILE);
  const index = list.findIndex((a) => a.id === id);
  if (index === -1) return null;
  const now = new Date();
  const updated: ApplicationRecord = {
    ...list[index],
    status,
    updated_at: now.toISOString(),
    next_reminder_date: reminderFor(status, now),
  };
  list[index] = updated;
  writeList(APPLICATIONS_FILE, list);
  return updated;
}

export function addReport(
  scheme_id: string,
  district: string | null,
  note: string | null,
): ReportRecord {
  const record: ReportRecord = {
    id: randomUUID(),
    scheme_id,
    district: typeof district === "string" && district.trim() !== "" ? district.trim() : null,
    note: sanitizeNote(note),
    created_at: new Date().toISOString(),
  };
  const list = readList<ReportRecord>(REPORTS_FILE);
  list.push(record);
  writeList(REPORTS_FILE, list);
  return record;
}

export function listReports(): ReportRecord[] {
  return readList<ReportRecord>(REPORTS_FILE);
}

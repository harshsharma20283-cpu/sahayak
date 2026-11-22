"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LangProvider";
import FollowUp from "@/components/FollowUp";
import ProfileChips, { type ChipField } from "@/components/ProfileChips";
import ResultCard from "@/components/ResultCard";
import type { SchemeMatch } from "@/lib/engine";
import { questionFor } from "@/lib/questions";
import type { Gender, Marital, Occupation, Profile } from "@/lib/types";

const MAX_MEMBERS = 6;
const MAX_LABEL_LENGTH = 30;
const FAMILY_LOCAL_KEY = "sahayak_family_members";
const SESSION_ID_KEY = "sahayak_session_id";

export interface MemberRecord {
  id: string;
  relation: string;
  display_name: string;
  profile: Profile;
  matches: SchemeMatch[];
  activeQuestion?: string | null;
}

const GENDERS: { value: Gender; hi: string; en: string }[] = [
  { value: "F", hi: "महिला", en: "Female" },
  { value: "M", hi: "पुरुष", en: "Male" },
  { value: "Other", hi: "अन्य", en: "Other" },
];

const MARITAL_STATUSES: { value: Marital; hi: string; en: string }[] = [
  { value: "single", hi: "अविवाहित", en: "Single" },
  { value: "married", hi: "शादीशुदा", en: "Married" },
  { value: "widow", hi: "विधवा", en: "Widow" },
  { value: "divorced", hi: "तलाकशुदा", en: "Divorced" },
  { value: "separated", hi: "अलग", en: "Separated" },
];

const OCCUPATIONS: { value: Occupation; hi: string; en: string }[] = [
  { value: "farmer", hi: "किसान", en: "Farmer" },
  { value: "labour", hi: "मज़दूर", en: "Labour" },
  { value: "student", hi: "विद्यार्थी", en: "Student" },
  { value: "unemployed", hi: "बेरोज़गार", en: "Unemployed" },
  { value: "other", hi: "अन्य", en: "Other" },
];

const INCOME_BANDS = [
  { value: 50000, key: "family.income_band_low" },
  { value: 150000, key: "family.income_band_mid" },
  { value: 300000, key: "family.income_band_high" },
];

const RELATION_OPTIONS = [
  { key: "family.label_self", avatar: "👤", defaultEn: "Self", defaultHi: "खुद" },
  { key: "family.label_spouse", avatar: "💍", defaultEn: "Spouse", defaultHi: "जीवनसाथी" },
  { key: "family.label_son", avatar: "👦", defaultEn: "Son", defaultHi: "बेटा" },
  { key: "family.label_daughter", avatar: "👧", defaultEn: "Daughter", defaultHi: "बेटी" },
  { key: "family.label_mother", avatar: "👵", defaultEn: "Mother", defaultHi: "माता" },
  { key: "family.label_father", avatar: "👴", defaultEn: "Father", defaultHi: "पिता" },
  { key: "family.label_grandchild", avatar: "👶", defaultEn: "Grandchild", defaultHi: "पोता-पोती" },
];

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server_session";
  try {
    let sid = window.localStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = "ses_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now().toString(36);
      window.localStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  } catch {
    return "fallback_session";
  }
}

function emptyProfile(): Profile {
  return {
    age: null,
    gender: null,
    marital: null,
    state: null, // do not auto-fill state or district
    district: null,
    annual_family_income: null,
    land_bigha: null,
    occupation: null,
    disability: null,
    children_count: null,
    is_bpl: null,
  };
}

async function postJson(url: string, body: unknown): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default function FamilyPage() {
  const { lang, t } = useLang();
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("add");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form input state
  const [selectedRelationKey, setSelectedRelationKey] = useState<string>("family.label_son");
  const [customName, setCustomName] = useState("");
  const [desc, setDesc] = useState("");
  const [quickAge, setQuickAge] = useState<string>("");
  const [quickGender, setQuickGender] = useState<Gender | null>(null);
  const [quickMarital, setQuickMarital] = useState<Marital | null>(null);
  const [quickOccupation, setQuickOccupation] = useState<Occupation | null>(null);
  const [quickIncome, setQuickIncome] = useState<number | null>(null);

  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function fetchMatchesForProfile(p: Profile): Promise<SchemeMatch[]> {
    // Rajasthan default context for rule evaluation if not specified
    const queryProfile: Profile = {
      ...p,
      state: p.state || "Rajasthan",
    };
    const res = await postJson("/api/match", { profile: queryProfile });
    const data = res as { matches?: SchemeMatch[] } | null;
    return Array.isArray(data?.matches) ? data.matches : [];
  }

  // Load members on mount from localStorage first, then sync from server DB
  useEffect(() => {
    const sid = getOrCreateSessionId();

    // 1. Initial hydrate from localStorage
    try {
      const cached = window.localStorage.getItem(FAMILY_LOCAL_KEY);
      if (cached) {
        const parsed: MemberRecord[] = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMembers(parsed);
          setActiveTabId(parsed[0].id);

          // If any member has 0 matches (e.g. added before schemes were seeded), recalculate immediately
          (async () => {
            let neededUpdate = false;
            const updated = await Promise.all(
              parsed.map(async (m) => {
                if (!m.matches || m.matches.length === 0) {
                  neededUpdate = true;
                  const freshMatches = await fetchMatchesForProfile(m.profile);
                  return { ...m, matches: freshMatches };
                }
                return m;
              })
            );
            if (neededUpdate) {
              setMembers(updated);
              persistLocal(updated);
            }
          })();
        }
      }
    } catch {}

    // 2. Sync from server
    fetch(`/api/family?session_id=${encodeURIComponent(sid)}`)
      .then((r) => r.json())
      .then(async (data) => {
        if (data?.ok && Array.isArray(data.members)) {
          const loaded: MemberRecord[] = [];
          for (const item of data.members) {
            const matches = await fetchMatchesForProfile(item.profile);
            loaded.push({
              id: item.id,
              relation: item.relation,
              display_name: item.display_name,
              profile: item.profile,
              matches,
            });
          }
          if (loaded.length > 0) {
            setMembers(loaded);
            setActiveTabId(loaded[0].id);
            try {
              window.localStorage.setItem(FAMILY_LOCAL_KEY, JSON.stringify(loaded));
            } catch {}
          }
        }
      })
      .catch(() => {});
  }, []);

  // Save to localStorage whenever members change
  function persistLocal(updated: MemberRecord[]) {
    try {
      window.localStorage.setItem(FAMILY_LOCAL_KEY, JSON.stringify(updated));
    } catch {}
  }

  function computeDisplayName(relationText: string, nameInput: string, existing: MemberRecord[]): string {
    const cleanName = nameInput.trim();
    // Never allow a single stray character
    if (cleanName.length > 1) {
      return `${cleanName} (${relationText})`;
    }
    // Number if duplicate relation
    const sameRel = existing.filter((m) => m.relation === relationText);
    if (sameRel.length === 0) {
      return relationText;
    }
    return `${relationText} ${sameRel.length + 1}`;
  }

  async function addMember() {
    setAddError(null);
    setAdding(true);

    const relOption = RELATION_OPTIONS.find((r) => r.key === selectedRelationKey) || RELATION_OPTIONS[2];
    const relationName = t(relOption.key);
    const displayName = computeDisplayName(relationName, customName, members);

    try {
      // 1. Extract from description if provided
      let profile: Profile = emptyProfile();
      if (desc.trim() !== "") {
        const extractRes = await postJson("/api/profile/extract", { text: desc, lang });
        const p = (extractRes as { profile?: Profile } | null)?.profile;
        if (p) {
          profile = { ...emptyProfile(), ...p };
        }
      }

      // 2. Quick fields override text
      const ageNum = Number(quickAge.trim());
      if (Number.isFinite(ageNum) && ageNum > 0 && ageNum <= 120) {
        profile.age = Math.round(ageNum);
      }
      if (quickGender !== null) profile.gender = quickGender;
      if (quickMarital !== null) profile.marital = quickMarital;
      if (quickOccupation !== null) profile.occupation = quickOccupation;
      if (quickIncome !== null) profile.annual_family_income = quickIncome;

      // 3. Compute matches
      const matches = await fetchMatchesForProfile(profile);

      // 4. Save to DB
      const sid = getOrCreateSessionId();
      const newId = "mem_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);

      const dbRes = await postJson("/api/family", {
        session_id: sid,
        id: newId,
        relation: relationName,
        display_name: displayName,
        profile,
      });

      const resData = dbRes as { ok?: boolean } | null;
      if (!resData || resData.ok === false) {
        throw new Error("Failed to save to database");
      }

      const newRecord: MemberRecord = {
        id: newId,
        relation: relationName,
        display_name: displayName,
        profile,
        matches,
      };

      const updated = [...members, newRecord];
      setMembers(updated);
      persistLocal(updated);
      setActiveTabId(newId);

      // Clear form ONLY after successful save
      setCustomName("");
      setDesc("");
      setQuickAge("");
      setQuickGender(null);
      setQuickMarital(null);
      setQuickOccupation(null);
      setQuickIncome(null);
    } catch {
      // Keep entered data and show error
      setAddError(t("error.something_went_wrong"));
    } finally {
      setAdding(false);
    }
  }

  async function updateMemberField(memberId: string, field: ChipField, value: unknown) {
    const current = members.find((m) => m.id === memberId);
    if (!current) return;

    const updatedProfile: Profile = {
      ...current.profile,
      [field]: value,
    };

    const newMatches = await fetchMatchesForProfile(updatedProfile);
    const updated = members.map((m) =>
      m.id === memberId ? { ...m, profile: updatedProfile, matches: newMatches, activeQuestion: null } : m
    );
    setMembers(updated);
    persistLocal(updated);

    // Sync to DB
    const sid = getOrCreateSessionId();
    void postJson("/api/family", {
      session_id: sid,
      id: current.id,
      relation: current.relation,
      display_name: current.display_name,
      profile: updatedProfile,
    });
  }

  async function handleQuestionAnswer(memberId: string, field: string, value: unknown) {
    await updateMemberField(memberId, field as ChipField, value);
  }

  async function deleteMember(id: string) {
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    persistLocal(updated);
    setConfirmDeleteId(null);
    if (activeTabId === id) {
      setActiveTabId(updated.length > 0 ? updated[0].id : "add");
    }

    try {
      await fetch(`/api/family?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {}
  }

  const selectedMember = members.find((m) => m.id === activeTabId);
  const deleteTarget = members.find((m) => m.id === confirmDeleteId);

  return (
    <section className="mx-auto w-full max-w-3xl space-y-8 py-4 animate-fade-in">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="heading-1">{t("family.title")}</h1>
        <p className="text-base sm:text-lg text-ink-secondary">{t("family.subtitle")}</p>
      </div>

      {/* Horizontal Member Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {members.map((m) => {
          const isSelected = activeTabId === m.id;
          const likelyCount = m.matches.filter((x) => x.status === "LIKELY_ELIGIBLE").length;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setActiveTabId(m.id);
                setEditingMemberId(null);
              }}
              className={`btn-press flex items-center gap-2.5 shrink-0 rounded-2xl px-4 py-3 text-sm sm:text-base font-bold transition-all shadow-sm ${
                isSelected
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "glass-card border border-white/80 text-ink hover:border-primary/40"
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/20 text-xs">
                👤
              </span>
              <span className="truncate max-w-[130px]">{m.display_name}</span>
              {likelyCount > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
                  isSelected ? "bg-white text-primary" : "bg-primary/10 text-primary"
                }`}>
                  {likelyCount}
                </span>
              )}
            </button>
          );
        })}

        {/* "+ Add member" Tab */}
        {members.length < MAX_MEMBERS && (
          <button
            type="button"
            onClick={() => setActiveTabId("add")}
            className={`btn-press flex items-center gap-2 shrink-0 rounded-2xl px-4 py-3 text-sm sm:text-base font-bold transition-all border ${
              activeTabId === "add"
                ? "bg-primary text-white shadow-md shadow-primary/30"
                : "border-primary/40 bg-white/70 text-primary hover:bg-white shadow-sm"
            }`}
          >
            <span>+</span>
            <span>{t("family.add_member")}</span>
          </button>
        )}
      </div>

      {/* CONFIRM REMOVE MODAL */}
      {confirmDeleteId && deleteTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="glass-card rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 border border-white shadow-glass-strong bg-white/95">
            <h3 className="heading-2 text-danger">{t("family.confirm_remove_title")}</h3>
            <p className="text-base text-ink-secondary leading-relaxed">
              {t("family.confirm_remove_desc")} ({deleteTarget.display_name})
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="btn-press min-h-[48px] rounded-2xl border border-neutral/30 px-5 py-2.5 font-bold text-ink hover:bg-neutral/10"
              >
                {t("family.confirm_remove_cancel")}
              </button>
              <button
                type="button"
                onClick={() => void deleteMember(confirmDeleteId)}
                className="btn-press min-h-[48px] rounded-2xl bg-danger px-6 py-2.5 font-bold text-white shadow-md shadow-danger/30 hover:bg-red-700"
              >
                {t("family.confirm_remove_yes")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEMBER PANEL FOR SELECTED TAB */}
      {selectedMember && activeTabId !== "add" && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Line at Top */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 shadow-glass border border-white/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-4">
              <div>
                <h2 className="heading-2">{selectedMember.display_name}</h2>
                <p className="text-base sm:text-lg font-bold text-primary mt-1">
                  {selectedMember.matches.filter((m) => m.status === "LIKELY_ELIGIBLE").length} {t("results.likely")},{" "}
                  {selectedMember.matches.filter((m) => m.status === "NEED_MORE_INFO").length} {t("results.need_info")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingMemberId(editingMemberId === selectedMember.id ? null : selectedMember.id)}
                  className="btn-press rounded-full border border-primary/30 bg-white/80 px-4 py-2 text-sm font-bold text-primary hover:bg-white shadow-sm"
                >
                  {editingMemberId === selectedMember.id ? t("common.close") : t("family.edit_profile")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(selectedMember.id)}
                  className="btn-press rounded-full border border-danger/30 bg-white/80 px-4 py-2 text-sm font-bold text-danger hover:bg-red-50 shadow-sm"
                >
                  {t("family.remove")}
                </button>
              </div>
            </div>

            {/* Profile chips with State assumed notice */}
            {editingMemberId === selectedMember.id ? (
              <ProfileChips
                profile={selectedMember.profile}
                onChange={(f, val) => void updateMemberField(selectedMember.id, f, val)}
              />
            ) : (
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap gap-2">
                  {/* State badge: show Rajasthan (assumed) if state not explicitly given */}
                  <span className="glass-pill px-3.5 py-1.5 text-xs sm:text-sm font-bold text-ink shadow-xs">
                    {t("fields.state")}:{" "}
                    <span className="text-primary">
                      {selectedMember.profile.state ? selectedMember.profile.state : t("family.state_assumed")}
                    </span>
                  </span>

                  {Object.entries(selectedMember.profile).map(([k, val]) => {
                    if (val === null || val === undefined || k === "state") return null;
                    const fieldName = t(`fields.${k}`) || k;
                    let displayVal = String(val);
                    if (typeof val === "boolean") displayVal = val ? t("yesno.yes") : t("yesno.no");
                    else if (k === "gender") displayVal = t(`gender.${val}`) || String(val);
                    else if (k === "marital") displayVal = t(`marital.${val}`) || String(val);
                    else if (k === "occupation") displayVal = t(`occupation.${val}`) || String(val);

                    return (
                      <span
                        key={k}
                        className="glass-pill px-3.5 py-1.5 text-xs sm:text-sm font-bold text-ink shadow-xs"
                      >
                        {fieldName}: <span className="text-primary">{displayVal}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active Question if user clicked "Ask this" */}
          {selectedMember.activeQuestion && questionFor(selectedMember.activeQuestion) && (
            <div className="glass-card rounded-3xl border border-warning/40 bg-amber-50/70 p-6 space-y-4 shadow-glass animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                  {t("family.followup_prefix")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const updated = members.map((m) =>
                      m.id === selectedMember.id ? { ...m, activeQuestion: null } : m
                    );
                    setMembers(updated);
                  }}
                  className="text-xs font-bold text-ink-secondary underline"
                >
                  {t("common.close")}
                </button>
              </div>
              <FollowUp
                field={selectedMember.activeQuestion}
                onAnswer={(val) => void handleQuestionAnswer(selectedMember.id, selectedMember.activeQuestion!, val)}
              />
            </div>
          )}

          {/* ALL SCHEMES FOR THIS MEMBER IN 3 GROUPS */}
          <div className="space-y-6 pt-2">
            {/* Group 1: Likely Eligible */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-success" />
                <h3 className="heading-3 text-success">
                  {t("results.likely")} (
                  {selectedMember.matches.filter((m) => m.status === "LIKELY_ELIGIBLE").length})
                </h3>
              </div>
              {selectedMember.matches.filter((m) => m.status === "LIKELY_ELIGIBLE").length === 0 ? (
                <p className="text-sm text-ink-secondary italic">{t("family.no_schemes")}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedMember.matches
                    .filter((m) => m.status === "LIKELY_ELIGIBLE")
                    .map((m) => (
                      <ResultCard key={m.scheme.id} match={m} />
                    ))}
                </div>
              )}
            </div>

            {/* Group 2: Need More Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-warning" />
                <h3 className="heading-3 text-warning">
                  {t("results.need_info")} (
                  {selectedMember.matches.filter((m) => m.status === "NEED_MORE_INFO").length})
                </h3>
              </div>
              {selectedMember.matches.filter((m) => m.status === "NEED_MORE_INFO").length === 0 ? (
                <p className="text-sm text-ink-secondary italic">{t("family.no_schemes")}</p>
              ) : (
                <div className="space-y-4">
                  {selectedMember.matches
                    .filter((m) => m.status === "NEED_MORE_INFO")
                    .map((m) => {
                      const schemeName = lang === "hi" ? m.scheme.name_hi : m.scheme.name_en;
                      const missingField = m.missing_fields[0];
                      const fieldLabel = missingField ? t(`fields.${missingField}`) || missingField : "";

                      return (
                        <div
                          key={m.scheme.id}
                          className="glass-card rounded-2xl p-5 border border-warning/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <Link href={`/scheme/${m.scheme.id}`} className="font-bold text-lg text-ink hover:text-primary">
                              {schemeName}
                            </Link>
                            {m.missing_fields.length > 0 && (
                              <p className="text-sm font-semibold text-amber-900">
                                {t("results.needed")}:{" "}
                                {m.missing_fields.map((f) => t(`fields.${f}`) || f).join(", ")}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {missingField && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = members.map((mem) =>
                                    mem.id === selectedMember.id ? { ...mem, activeQuestion: missingField } : mem
                                  );
                                  setMembers(updated);
                                }}
                                className="btn-press rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow-xs"
                              >
                                {t("family.ask_this")} ({fieldLabel})
                              </button>
                            )}
                            <Link
                              href={`/scheme/${m.scheme.id}`}
                              className="btn-press rounded-xl border border-neutral/30 bg-white/80 px-4 py-2 text-sm font-bold text-primary hover:bg-white"
                            >
                              {t("results.view_details")} →
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Group 3: Not Eligible */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-neutral" />
                <h3 className="heading-3 text-neutral">
                  {t("results.not_eligible")} (
                  {selectedMember.matches.filter((m) => m.status === "NOT_ELIGIBLE").length})
                </h3>
              </div>
              {selectedMember.matches.filter((m) => m.status === "NOT_ELIGIBLE").length === 0 ? (
                <p className="text-sm text-ink-secondary italic">{t("family.no_schemes")}</p>
              ) : (
                <div className="space-y-3">
                  {selectedMember.matches
                    .filter((m) => m.status === "NOT_ELIGIBLE")
                    .map((m) => {
                      const schemeName = lang === "hi" ? m.scheme.name_hi : m.scheme.name_en;
                      const failing = m.rule_results.find((r) => r.result === "not_met");
                      const failReason = failing
                        ? lang === "hi"
                          ? failing.rule.label_hi
                          : failing.rule.label_en
                        : t("results.not_met");

                      return (
                        <div
                          key={m.scheme.id}
                          className="glass-subtle rounded-2xl p-4 border border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5">
                            <Link href={`/scheme/${m.scheme.id}`} className="font-bold text-base text-ink hover:text-primary">
                              {schemeName}
                            </Link>
                            <p className="text-xs sm:text-sm text-danger font-medium">
                              {t("results.not_met")}: {failReason}
                            </p>
                          </div>
                          <Link
                            href={`/scheme/${m.scheme.id}`}
                            className="btn-press rounded-xl border border-neutral/30 bg-white/70 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-ink-secondary hover:text-ink shrink-0"
                          >
                            {t("results.view_details")} →
                          </Link>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD MEMBER FORM (When active tab is "add" or no members exist) */}
      {(activeTabId === "add" || members.length === 0) && members.length < MAX_MEMBERS && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-glass border border-white/80 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="heading-2">{t("family.add_member")}</h2>
            <span className="text-xs sm:text-sm font-bold text-ink-secondary bg-white/70 px-3 py-1 rounded-full border border-neutral/20">
              {t("family.member_limit", { max: MAX_MEMBERS })}
            </span>
          </div>

          {/* Relation Selection Chips */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-ink-secondary">
              {t("family.relation_label")}
            </label>
            <div className="flex flex-wrap gap-2">
              {RELATION_OPTIONS.map((opt) => {
                const optText = t(opt.key);
                const isSelected = selectedRelationKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSelectedRelationKey(opt.key)}
                    className={`btn-press rounded-full px-4 py-2 text-sm font-bold transition shadow-xs flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-primary text-white shadow-primary/25"
                        : "glass-subtle border border-neutral/20 text-ink hover:border-primary"
                    }`}
                  >
                    <span>{opt.avatar}</span>
                    <span>{optText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Name field */}
          <div className="space-y-1">
            <label htmlFor="custom-member-name" className="block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-ink-secondary">
              {t("family.name_input_label")}
            </label>
            <input
              id="custom-member-name"
              type="text"
              value={customName}
              maxLength={MAX_LABEL_LENGTH}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={t("family.label_input")}
              className="w-full rounded-2xl border border-black/10 bg-white/90 p-3.5 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20 shadow-inner"
            />
          </div>

          {/* Quick Fields */}
          <div className="space-y-4 rounded-2xl glass-subtle p-5 border border-white/60">
            <p className="text-sm font-extrabold uppercase tracking-wider text-ink">
              {t("family.quick_fields")}
            </p>

            {/* Age */}
            <div>
              <label htmlFor="quick-age-input" className="block text-xs font-bold text-ink-secondary mb-1">
                {t("family.age_label")}
              </label>
              <input
                id="quick-age-input"
                type="number"
                min={0}
                max={120}
                value={quickAge}
                onChange={(e) => setQuickAge(e.target.value)}
                placeholder={t("family.age_placeholder")}
                className="w-full rounded-xl border border-black/10 bg-white/90 p-3 text-base text-ink focus:border-primary focus:outline-none shadow-inner"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1">
                {t("family.gender_label")}
              </label>
              <div className="flex flex-wrap gap-2">
                {GENDERS.map((g) => {
                  const gLabel = lang === "hi" ? g.hi : g.en;
                  const active = quickGender === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setQuickGender(active ? null : g.value)}
                      className={`btn-press rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-primary text-white shadow-sm"
                          : "glass-subtle border border-neutral/20 text-ink hover:border-primary"
                      }`}
                    >
                      {gLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Marital */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1">
                {t("family.marital_label")}
              </label>
              <div className="flex flex-wrap gap-2">
                {MARITAL_STATUSES.map((m) => {
                  const mLabel = lang === "hi" ? m.hi : m.en;
                  const active = quickMarital === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setQuickMarital(active ? null : m.value)}
                      className={`btn-press rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-primary text-white shadow-sm"
                          : "glass-subtle border border-neutral/20 text-ink hover:border-primary"
                      }`}
                    >
                      {mLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1">
                {t("family.occupation_label")}
              </label>
              <div className="flex flex-wrap gap-2">
                {OCCUPATIONS.map((o) => {
                  const oLabel = lang === "hi" ? o.hi : o.en;
                  const active = quickOccupation === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setQuickOccupation(active ? null : o.value)}
                      className={`btn-press rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-primary text-white shadow-sm"
                          : "glass-subtle border border-neutral/20 text-ink hover:border-primary"
                      }`}
                    >
                      {oLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Income */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary mb-1">
                {t("family.income_label")}
              </label>
              <div className="flex flex-wrap gap-2">
                {INCOME_BANDS.map((b) => {
                  const bLabel = t(b.key);
                  const active = quickIncome === b.value;
                  return (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => setQuickIncome(active ? null : b.value)}
                      className={`btn-press rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-primary text-white shadow-sm"
                          : "glass-subtle border border-neutral/20 text-ink hover:border-primary"
                      }`}
                    >
                      {bLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hint */}
          <p className="text-xs sm:text-sm text-ink-secondary italic">
            {t("family.hint_example")}
          </p>

          {/* Free-text input */}
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder={t("family.desc_input")}
            aria-label={t("family.desc_input")}
            rows={3}
            className="w-full rounded-2xl border border-black/10 bg-white/90 p-4 text-base text-ink focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20 shadow-inner resize-none"
          />

          {addError && (
            <p role="alert" className="text-sm font-bold text-danger bg-red-50 p-3 rounded-2xl border border-danger/30">
              {addError}
            </p>
          )}

          <button
            type="button"
            onClick={() => void addMember()}
            disabled={adding}
            className="btn-press min-h-[56px] w-full rounded-2xl bg-gradient-to-r from-primary to-emerald-700 px-6 py-4 text-base sm:text-lg font-bold text-white shadow-md shadow-primary/30 hover:opacity-95 disabled:opacity-50 transition"
          >
            {adding ? t("family.btn_adding") : t("family.btn_add")}
          </button>
        </div>
      )}

      <div>
        <Link
          href="/"
          className="btn-press inline-flex min-h-[46px] items-center gap-2 rounded-full border border-primary/30 bg-white/70 px-5 py-2 text-base font-bold text-primary hover:bg-white shadow-sm"
        >
          ← {t("scheme.back")}
        </Link>
      </div>
    </section>
  );
}

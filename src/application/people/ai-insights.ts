import type {
  AiInsights,
  MemberAnalytics,
  MemberEntity,
} from "@/domain/entities/member";
import { MemberStatus } from "@/domain/enums/member";

type InsightInput = {
  member: Pick<
    MemberEntity,
    | "firstName"
    | "lastName"
    | "status"
    | "lifecycle"
    | "joinedAt"
    | "baptismDate"
    | "ministryRole"
    | "campus"
  >;
  analytics: MemberAnalytics;
  tagNames: string[];
  openPrayers: number;
  lastActivityAt: Date | null;
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/**
 * Deterministic insight engine — production-ready heuristics that can later
 * be swapped for an LLM provider without changing the CRM contract.
 */
export function generateMemberInsights(input: InsightInput): AiInsights {
  const { member, analytics, tagNames, openPrayers, lastActivityAt } = input;
  const name = `${member.firstName} ${member.lastName}`.trim();

  const daysSinceActivity = lastActivityAt
    ? Math.floor((Date.now() - lastActivityAt.getTime()) / 86_400_000)
    : 999;
  const daysSinceJoin = member.joinedAt
    ? Math.floor((Date.now() - member.joinedAt.getTime()) / 86_400_000)
    : null;

  let risk = 20;
  if (analytics.attendanceCount90d === 0) risk += 35;
  else if (analytics.attendanceCount90d < 3) risk += 20;
  if (daysSinceActivity > 45) risk += 25;
  else if (daysSinceActivity > 21) risk += 12;
  if (member.status === MemberStatus.INACTIVE) risk += 20;
  if (member.status === MemberStatus.VISITOR && analytics.attendanceCount90d >= 2)
    risk -= 10;
  if (openPrayers > 0) risk += 5;
  risk = clamp(risk);

  const engagement = clamp(
    analytics.attendanceCount90d * 12 +
      (analytics.givingTotalCents90d > 0 ? 15 : 0) +
      analytics.activeVolunteerRoles * 18 +
      (tagNames.includes("Leader") ? 10 : 0) -
      (daysSinceActivity > 30 ? 20 : 0)
  );

  const growth = clamp(
    (member.baptismDate ? 25 : 0) +
      (daysSinceJoin !== null && daysSinceJoin < 90 ? 20 : 10) +
      analytics.activeVolunteerRoles * 15 +
      (analytics.attendanceCount90d >= 6 ? 25 : analytics.attendanceCount90d * 4) +
      (tagNames.includes("New Member") ? 10 : 0)
  );

  const followUps: string[] = [];
  const nextActions: string[] = [];

  if (member.status === MemberStatus.VISITOR) {
    followUps.push(`Schedule a welcome visit with ${name} within 7 days.`);
    nextActions.push("Assign a host family or campus greeter.");
  }
  if (analytics.attendanceCount90d === 0) {
    followUps.push("Re-engage with a pastoral check-in call.");
    nextActions.push("Log a visit or invite to the next Sunday service.");
  } else if (analytics.attendanceCount90d < 4) {
    followUps.push("Encourage connection into a small group or cell.");
  }
  if (openPrayers > 0) {
    followUps.push(`Follow up on ${openPrayers} open prayer request(s).`);
    nextActions.push("Update prayer status after pastoral care.");
  }
  if (!member.baptismDate && member.status === MemberStatus.ACTIVE) {
    nextActions.push("Invite to the next baptism / foundation course.");
  }
  if (analytics.activeVolunteerRoles === 0 && engagement > 40) {
    nextActions.push("Explore volunteer interests matching their gifts.");
  }
  if (daysSinceActivity > 30) {
    followUps.push("Send a personal WhatsApp or email check-in.");
  }
  if (followUps.length === 0) {
    followUps.push("Maintain regular pastoral presence and celebrate wins.");
  }
  if (nextActions.length === 0) {
    nextActions.push("Capture a note after the next meaningful interaction.");
  }

  const riskReason =
    risk >= 70
      ? "High disengagement signals — low recent attendance and sparse activity."
      : risk >= 40
        ? "Moderate risk — attendance or follow-up cadence needs attention."
        : "Healthy engagement trajectory with manageable care needs.";

  const engagementAnalysis = [
    `${name} scored ${engagement}/100 on engagement over the last 90 days`,
    `with ${analytics.attendanceCount90d} recorded attendance event(s)`,
    analytics.givingTotalCents90d > 0
      ? `and active giving participation.`
      : `and no recorded giving in that window.`,
    analytics.activeVolunteerRoles > 0
      ? `They currently serve in ${analytics.activeVolunteerRoles} volunteer role(s).`
      : `They are not currently assigned to a volunteer role.`,
  ].join(" ");

  const campusBit = member.campus ? ` at ${member.campus}` : "";
  const roleBit = member.ministryRole ? ` (${member.ministryRole})` : "";
  const tagBit =
    tagNames.length > 0 ? ` Tags: ${tagNames.slice(0, 5).join(", ")}.` : "";

  const summary = `${name} is a ${member.status.replaceAll("_", " ").toLowerCase()} congregant${campusBit}${roleBit} in the ${member.lifecycle.toLowerCase()} lifecycle. Growth score ${growth}/100; risk ${risk}/100. ${riskReason}${tagBit}`;

  return {
    summary,
    engagementAnalysis,
    riskScore: risk,
    riskReason,
    followUps: followUps.slice(0, 5),
    nextActions: nextActions.slice(0, 5),
    generatedAt: new Date().toISOString(),
  };
}

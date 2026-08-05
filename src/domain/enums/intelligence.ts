export enum InsightSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
  SUCCESS = "SUCCESS",
}

export enum InsightCategory {
  ATTENDANCE = "ATTENDANCE",
  VISITORS = "VISITORS",
  VOLUNTEERS = "VOLUNTEERS",
  EVENTS = "EVENTS",
  COMMUNICATION = "COMMUNICATION",
  PRAYER = "PRAYER",
  HOUSEHOLDS = "HOUSEHOLDS",
  MEMBERSHIP = "MEMBERSHIP",
  CARE = "CARE",
}

export enum HealthFactorKey {
  ATTENDANCE = "attendance",
  VISITOR_CONVERSION = "visitorConversion",
  VOLUNTEER_PARTICIPATION = "volunteerParticipation",
  PRAYER_RESPONSE = "prayerResponse",
  COMMUNICATION_ENGAGEMENT = "communicationEngagement",
  EVENT_READINESS = "eventReadiness",
  MEMBERSHIP_GROWTH = "membershipGrowth",
  HOUSEHOLD_ENGAGEMENT = "householdEngagement",
}

export enum TaskCenterKind {
  FOLLOW_UP = "FOLLOW_UP",
  VOLUNTEER_GAP = "VOLUNTEER_GAP",
  BIRTHDAY = "BIRTHDAY",
  ANNIVERSARY = "ANNIVERSARY",
  PRAYER = "PRAYER",
  EVENT_PREP = "EVENT_PREP",
  COMMUNICATION = "COMMUNICATION",
}

export const HEALTH_FACTOR_LABELS: Record<HealthFactorKey, string> = {
  [HealthFactorKey.ATTENDANCE]: "Attendance",
  [HealthFactorKey.VISITOR_CONVERSION]: "Visitor conversion",
  [HealthFactorKey.VOLUNTEER_PARTICIPATION]: "Volunteer participation",
  [HealthFactorKey.PRAYER_RESPONSE]: "Prayer response",
  [HealthFactorKey.COMMUNICATION_ENGAGEMENT]: "Communication engagement",
  [HealthFactorKey.EVENT_READINESS]: "Event readiness",
  [HealthFactorKey.MEMBERSHIP_GROWTH]: "Membership growth",
  [HealthFactorKey.HOUSEHOLD_ENGAGEMENT]: "Household engagement",
};

export const INSIGHT_SEVERITY_LABELS: Record<InsightSeverity, string> = {
  [InsightSeverity.INFO]: "Info",
  [InsightSeverity.WARNING]: "Attention",
  [InsightSeverity.CRITICAL]: "Urgent",
  [InsightSeverity.SUCCESS]: "Healthy",
};

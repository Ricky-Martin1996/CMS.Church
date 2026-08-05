-- Performance indexes for dashboard filters, care signals, and list sorts.

CREATE INDEX IF NOT EXISTS "members_organizationId_lifecycle_idx" ON "members"("organizationId", "lifecycle");
CREATE INDEX IF NOT EXISTS "members_organizationId_createdAt_idx" ON "members"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "members_organizationId_campus_idx" ON "members"("organizationId", "campus");

CREATE INDEX IF NOT EXISTS "households_organizationId_cellGroup_idx" ON "households"("organizationId", "cellGroup");
CREATE INDEX IF NOT EXISTS "households_organizationId_engagementScore_idx" ON "households"("organizationId", "engagementScore");
CREATE INDEX IF NOT EXISTS "households_assignedCellLeaderId_idx" ON "households"("assignedCellLeaderId");

CREATE INDEX IF NOT EXISTS "attendance_records_organizationId_householdId_attendedAt_idx" ON "attendance_records"("organizationId", "householdId", "attendedAt");

CREATE INDEX IF NOT EXISTS "visitors_organizationId_stageEnteredAt_idx" ON "visitors"("organizationId", "stageEnteredAt");
CREATE INDEX IF NOT EXISTS "visitors_organizationId_createdAt_idx" ON "visitors"("organizationId", "createdAt");

CREATE INDEX IF NOT EXISTS "prayer_requests_organizationId_status_idx" ON "prayer_requests"("organizationId", "status");

CREATE INDEX IF NOT EXISTS "church_events_organizationId_deletedAt_startsAt_idx" ON "church_events"("organizationId", "deletedAt", "startsAt");

CREATE INDEX IF NOT EXISTS "volunteer_ministry_preferences_organizationId_ministryId_idx" ON "volunteer_ministry_preferences"("organizationId", "ministryId");

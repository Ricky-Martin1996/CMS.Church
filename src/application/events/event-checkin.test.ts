import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { checkInToChurchEvent } from "@/application/events/event-service";
import {
  ChurchEventStatus,
  ChurchEventType,
  EventVisibility,
  RegistrationStatus,
} from "@/domain/enums/event";
import { prisma } from "@/infrastructure/db/prisma";
import { AppError } from "@/server/errors";

describe("BUG-011 event check-in requires published event", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("rejects check-in for DRAFT events", async () => {
    const suffix = Date.now().toString(36);
    const org = await prisma.organization.create({
      data: { name: "BUG011 Org", slug: `bug011-${suffix}` },
    });
    const event = await prisma.churchEvent.create({
      data: {
        organizationId: org.id,
        title: "Draft Event",
        slug: `draft-${suffix}`,
        eventType: ChurchEventType.CUSTOM,
        status: ChurchEventStatus.DRAFT,
        visibility: EventVisibility.MEMBERS,
        startsAt: new Date(),
      },
    });
    const registration = await prisma.eventRegistration.create({
      data: {
        organizationId: org.id,
        eventId: event.id,
        guestName: "Guest One",
        status: RegistrationStatus.REGISTERED,
      },
    });

    await assert.rejects(
      () =>
        checkInToChurchEvent({
          organizationId: org.id,
          eventId: event.id,
          registrationId: registration.id,
          method: "MANUAL",
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, "CONFLICT");
        assert.match(error.message, /published/i);
        return true;
      }
    );
  });

  it("rejects waitlisted guests even when event is published", async () => {
    const suffix = Date.now().toString(36);
    const org = await prisma.organization.create({
      data: { name: "BUG011 Wait Org", slug: `bug011-w-${suffix}` },
    });
    const event = await prisma.churchEvent.create({
      data: {
        organizationId: org.id,
        title: "Published Event",
        slug: `pub-${suffix}`,
        eventType: ChurchEventType.CUSTOM,
        status: ChurchEventStatus.PUBLISHED,
        visibility: EventVisibility.MEMBERS,
        startsAt: new Date(),
        publishedAt: new Date(),
      },
    });
    const registration = await prisma.eventRegistration.create({
      data: {
        organizationId: org.id,
        eventId: event.id,
        guestName: "Waitlisted Guest",
        status: RegistrationStatus.WAITLISTED,
      },
    });

    await assert.rejects(
      () =>
        checkInToChurchEvent({
          organizationId: org.id,
          eventId: event.id,
          registrationId: registration.id,
          method: "MANUAL",
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, "CONFLICT");
        assert.match(error.message, /waitlist/i);
        return true;
      }
    );
  });
});

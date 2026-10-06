import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HubChannel, HubProviderKind } from "@/domain/enums/communication";
import { providerForChannel } from "@/infrastructure/communications/providers";

describe("BUG-008 communications provider stubs do not claim SENT", () => {
  it("Resend without API key returns not-ok queued result", async () => {
    const prev = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    try {
      const provider = providerForChannel(HubChannel.EMAIL);
      assert.equal(provider.kind, HubProviderKind.RESEND);
      const result = await provider.send({
        organizationId: "org_test",
        channel: HubChannel.EMAIL,
        toEmail: "a@example.com",
        body: "Hello",
      });
      assert.equal(result.ok, false);
      assert.equal(result.queued, true);
      assert.ok(result.error);
      assert.match(result.error!, /not (configured|sent)/i);
    } finally {
      if (prev !== undefined) process.env.RESEND_API_KEY = prev;
      else delete process.env.RESEND_API_KEY;
    }
  });

  it("Twilio without credentials returns not-ok queued result", async () => {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    try {
      const result = await providerForChannel(HubChannel.SMS).send({
        organizationId: "org_test",
        channel: HubChannel.SMS,
        toPhone: "+15551212",
        body: "Hello",
      });
      assert.equal(result.ok, false);
      assert.equal(result.queued, true);
    } finally {
      if (sid !== undefined) process.env.TWILIO_ACCOUNT_SID = sid;
      else delete process.env.TWILIO_ACCOUNT_SID;
      if (token !== undefined) process.env.TWILIO_AUTH_TOKEN = token;
      else delete process.env.TWILIO_AUTH_TOKEN;
    }
  });

  it("Internal channel still delivers successfully", async () => {
    const result = await providerForChannel(HubChannel.INTERNAL).send({
      organizationId: "org_test",
      channel: HubChannel.INTERNAL,
      body: "In-app note",
    });
    assert.equal(result.ok, true);
    assert.equal(result.queued, false);
    assert.ok(result.externalId);
  });
});

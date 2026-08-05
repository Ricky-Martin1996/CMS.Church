import { z } from "zod";

/** Accept only http(s) absolute URLs or empty — blocks javascript: and data: URLs. */
export const httpUrlSchema = z
  .string()
  .max(2048)
  .refine(
    (value) =>
      value === "" ||
      (() => {
        try {
          const url = new URL(value);
          return url.protocol === "http:" || url.protocol === "https:";
        } catch {
          return false;
        }
      })(),
    { message: "URL must be http(s)" }
  );

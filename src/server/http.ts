import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/server/errors";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonCreated<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION",
          message: "Invalid request",
          details: error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  console.error("[churchos] Unhandled route error", error);
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "Internal server error" } },
    { status: 500 }
  );
}

import { handle } from "hono/vercel";
import { createApp } from "@mediation-rooms/api/app";

const app = createApp("/api");

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);

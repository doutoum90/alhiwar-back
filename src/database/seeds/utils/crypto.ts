import { randomBytes } from "crypto";

export function randomHex(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}

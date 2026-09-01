import { File } from "node:buffer";
import { vi } from "vitest";

vi.mock("server-only", () => ({}));

if (!("File" in globalThis)) {
  Object.defineProperty(globalThis, "File", { value: File, configurable: true });
}

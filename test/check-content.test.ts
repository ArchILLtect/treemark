import {
  describe,
  expect,
  it,
} from "vitest";
import {
  checkContent,
} from "../src/check/check-content.js";

describe("checkContent", () => {
  it("returns current when content matches exactly", () => {
    expect(
      checkContent(
        "same content\n",
        "same content\n",
      ),
    ).toBe("current");
  });

  it("returns stale when content differs", () => {
    expect(
      checkContent(
        "old content\n",
        "new content\n",
      ),
    ).toBe("stale");
  });
});
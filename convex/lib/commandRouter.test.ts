/**
 * Command Router Tests
 * 
 * Tests for Story 1.4 AC1: Help Command Recognition
 */

import { describe, it, expect } from "vitest";
import { detectCommand, extractCommandParams } from "./commandRouter";

describe("detectCommand", () => {
  describe("/help command detection (Story 1.4 AC1)", () => {
    it('should detect /help command', () => {
      expect(detectCommand("/help")).toBe("help");
    });

    it('should detect /help with uppercase', () => {
      expect(detectCommand("/HELP")).toBe("help");
    });

    it('should detect /help with mixed case', () => {
      expect(detectCommand("/Help")).toBe("help");
    });

    it('should detect /help with trailing spaces', () => {
      expect(detectCommand("/help ")).toBe("help");
    });

    it('should detect /help with leading spaces', () => {
      expect(detectCommand(" /help")).toBe("help");
    });

    it('should detect /help with parameters', () => {
      expect(detectCommand("/help something")).toBe("help");
    });
  });

  describe("/start command detection (Story 1.3)", () => {
    it('should detect /start command', () => {
      expect(detectCommand("/start")).toBe("start");
    });

    it('should detect /start with uppercase', () => {
      expect(detectCommand("/START")).toBe("start");
    });

    it('should detect /start with mixed case', () => {
      expect(detectCommand("/Start")).toBe("start");
    });
  });

  describe("non-command text", () => {
    it('should return null for regular text', () => {
      expect(detectCommand("hello")).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(detectCommand(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(detectCommand("")).toBeNull();
    });

    it('should return null for text without slash', () => {
      expect(detectCommand("help")).toBeNull();
    });

    it('should return null for unknown command', () => {
      expect(detectCommand("/unknown")).toBeNull();
    });
  });
});

describe("extractCommandParams", () => {
  it("should extract parameters from command", () => {
    expect(extractCommandParams("/start referral123")).toEqual(["referral123"]);
  });

  it("should extract multiple parameters", () => {
    expect(extractCommandParams("/start param1 param2")).toEqual(["param1", "param2"]);
  });

  it("should return empty array for command without parameters", () => {
    expect(extractCommandParams("/start")).toEqual([]);
  });

  it("should handle extra spaces", () => {
    expect(extractCommandParams("/start  param1  param2")).toEqual(["param1", "param2"]);
  });
});

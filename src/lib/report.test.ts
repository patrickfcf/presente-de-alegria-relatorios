import { describe, expect, it } from "vitest";
import {
  attendanceTotal,
  parseCount,
  validCpf,
  validVisitTimes,
} from "./report";

describe("attendance", () => {
  it("keeps unknown distinct from zero", () => {
    expect(parseCount("")).toBeNull();
    expect(parseCount("0")).toBe(0);
    expect(attendanceTotal([null, null, null])).toEqual({
      value: null,
      complete: false,
    });
  });
  it("calculates complete and partial totals explicitly", () => {
    expect(attendanceTotal([12, 3, 5])).toEqual({ value: 20, complete: true });
    expect(attendanceTotal([12, null, 5])).toEqual({
      value: 17,
      complete: false,
    });
  });
  it.each(["-1", "1.5", "NaN", "1e3", "1000001"])(
    "rejects invalid quantity %s",
    (value) => {
      expect(() => parseCount(value)).toThrow();
    },
  );
});
it("rejects invalid CPF shape, repeated digits and text", () => {
  expect(validCpf("000.000.000-00")).toBe(false);
  expect(validCpf("123")).toBe(false);
  expect(validCpf("abcdefghijk")).toBe(false);
});
it("rejects reversed, equal and impossible visit times", () => {
  expect(validVisitTimes("10:00", "12:00")).toBe(true);
  expect(validVisitTimes("12:00", "10:00")).toBe(false);
  expect(validVisitTimes("12:00", "12:00")).toBe(false);
  expect(validVisitTimes("10:60", "12:00")).toBe(false);
});

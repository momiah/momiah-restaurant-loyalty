import { nextReward, pointsForAmount, pointsPerPound } from "../lib/points";

jest.mock("../config/firebase", () => ({ db: {} }));

it("uses the restaurant's earn rate, defaulting to 1 per £1", () => {
  expect(pointsForAmount(12.99, {})).toBe(12);
  expect(pointsForAmount(10, { loyalty: { pointsPerPound: 2 } })).toBe(20);
  expect(pointsPerPound({ loyalty: { enabled: false } })).toBe(0);
  expect(pointsForAmount("x", null)).toBe(0);
});

it("finds the next reward", () => {
  expect(nextReward(120).points).toBe(500);
  expect(nextReward(5000)).toBeNull();
});

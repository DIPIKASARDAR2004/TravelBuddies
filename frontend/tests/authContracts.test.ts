import { expect, it } from "vitest";
import {
  readCredentials,
  readSignupInput,
  readProviderOutcome,
} from "@/lib/auth/contracts";

const valid = {
  email: "person@example.invalid",
  password: "fixture-password",
  fullName: "Test Person",
};
it.each([
  null,
  [],
  {},
  { ...valid, email: 123 },
  { ...valid, email: "a@" },
  { ...valid, email: "a b@example.invalid" },
  { ...valid, email: "a\u0000@example.invalid" },
  { ...valid, email: "x".repeat(255) + "@example.invalid" },
  { ...valid, password: 123 },
  { ...valid, password: "" },
  { ...valid, password: "x".repeat(1025) },
])("rejects malformed credential input %#", (value) => {
  expect(() => readCredentials(value)).toThrow();
});
it.each(["", "  ", "ab", "x".repeat(121), "Bad\nName", null, 4])(
  "rejects invalid signup names %#",
  (fullName) => {
    expect(() => readSignupInput({ ...valid, fullName })).toThrow();
  },
);
it("preserves passwords exactly and keeps the signup minimum separate from login", () => {
  expect(readCredentials({ ...valid, password: " p " }).password).toBe(" p ");
  expect(() => readSignupInput({ ...valid, password: "short" })).toThrow(
    "at least 6",
  );
  expect(
    readSignupInput({
      ...valid,
      fullName: "  Test Person  ",
      password: "  secret  ",
    }),
  ).toEqual({ ...valid, password: "  secret  " });
});
it.each([
  undefined,
  {},
  { error: undefined },
  { error: false },
  { error: null, data: null },
  { error: null, data: { user: { id: "bad" }, session: null } },
])("fails closed on malformed provider success %#", (value) => {
  expect(() => readProviderOutcome("login", value)).toThrow();
  expect(() => readProviderOutcome("signup", value)).toThrow();
});
it("rejects mismatched session identity and missing tokens", () => {
  const id = "12345678-1234-4234-8234-123456789abc";
  const base = {
    error: null,
    data: {
      user: { id },
      session: {
        user: { id },
        access_token: "fixture",
        refresh_token: "fixture",
      },
    },
  };
  for (const session of [
    {
      ...base.data.session,
      user: { id: "12345678-1234-4234-8234-123456789abd" },
    },
    { ...base.data.session, access_token: "" },
    { ...base.data.session, refresh_token: null },
  ])
    expect(() =>
      readProviderOutcome("login", {
        ...base,
        data: { ...base.data, session },
      }),
    ).toThrow();
});

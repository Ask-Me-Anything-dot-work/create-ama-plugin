import { expect, test, describe } from "bun:test";
import { CreateUserSchema, UserSchema, type User, type CreateUser } from "../src/lib/validation/example";

describe("Validation", () => {
  test("UserSchema validates correct payload", () => {
    const user: User = {
      id: crypto.randomUUID(),
      name: "John Doe",
      email: "john@example.com",
      age: 30,
    };
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(true);
  });

  test("CreateUserSchema validates correct payload", () => {
    const payload: CreateUser = {
      name: "John Doe",
      email: "john@example.com",
      age: 30,
    };
    const result = CreateUserSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  test("CreateUserSchema rejects invalid email", () => {
    const payload = {
      name: "John Doe",
      email: "invalid-email",
    };
    const result = CreateUserSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  test("CreateUserSchema rejects short name", () => {
    const payload = {
      name: "J",
      email: "john@example.com",
    };
    const result = CreateUserSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});

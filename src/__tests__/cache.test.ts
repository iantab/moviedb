import { getCached, setCached } from "../utils/cache";

describe("getCached / setCached", () => {
  it("returns undefined for a key that has not been set", () => {
    expect(getCached("cache-test:nonexistent")).toBeUndefined();
  });

  it("stores and retrieves a string", () => {
    setCached("cache-test:string", "hello");
    expect(getCached("cache-test:string")).toBe("hello");
  });

  it("stores and retrieves an object", () => {
    const obj = { id: 1, name: "test" };
    setCached("cache-test:object", obj);
    expect(getCached("cache-test:object")).toEqual({ id: 1, name: "test" });
  });

  it("stores and retrieves an array", () => {
    const arr = [1, 2, 3];
    setCached("cache-test:array", arr);
    expect(getCached("cache-test:array")).toEqual([1, 2, 3]);
  });

  it("stores and retrieves a number", () => {
    setCached("cache-test:number", 42);
    expect(getCached<number>("cache-test:number")).toBe(42);
  });

  it("stores and retrieves null", () => {
    setCached("cache-test:null", null);
    expect(getCached("cache-test:null")).toBeNull();
  });

  it("stores and retrieves a boolean", () => {
    setCached("cache-test:bool", true);
    expect(getCached("cache-test:bool")).toBe(true);
  });

  it("overwrites an existing value", () => {
    setCached("cache-test:overwrite", "first");
    setCached("cache-test:overwrite", "second");
    expect(getCached("cache-test:overwrite")).toBe("second");
  });

  it("keys are independent of each other", () => {
    setCached("cache-test:key-a", "alpha");
    setCached("cache-test:key-b", "beta");
    expect(getCached("cache-test:key-a")).toBe("alpha");
    expect(getCached("cache-test:key-b")).toBe("beta");
  });

  it("stored reference is the same object reference", () => {
    const obj = { id: 99 };
    setCached("cache-test:ref", obj);
    expect(getCached("cache-test:ref")).toBe(obj);
  });
});

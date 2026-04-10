// localStorage mock for Node/Jest environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    _store: store,
    _getStore: () => store,
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

let getCached: typeof import("../utils/cache").getCached;
let setCached: typeof import("../utils/cache").setCached;
let clearCache: typeof import("../utils/cache").clearCache;

beforeEach(() => {
  jest.restoreAllMocks();
  localStorageMock.clear();
  jest.isolateModules(() => {
    const mod = require("../utils/cache");
    getCached = mod.getCached;
    setCached = mod.setCached;
    clearCache = mod.clearCache;
  });
});

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

  it("stored reference is the same object reference (within session)", () => {
    const obj = { id: 99 };
    setCached("cache-test:ref", obj);
    expect(getCached("cache-test:ref")).toBe(obj);
  });
});

describe("TTL expiration", () => {
  it("returns undefined after TTL expires", () => {
    setCached("search:test", [1, 2, 3]);
    expect(getCached("search:test")).toEqual([1, 2, 3]);

    // Advance past 30-minute search TTL
    jest.spyOn(Date, "now").mockReturnValue(Date.now() + 31 * 60 * 1000);
    expect(getCached("search:test")).toBeUndefined();
  });

  it("applies different TTLs for different key prefixes", () => {
    const baseNow = Date.now();
    setCached("trending:movie:week", ["a"]);
    setCached("providers:movie:1", { results: {} });

    // After 2 hours: trending expired, providers still valid
    jest.spyOn(Date, "now").mockReturnValue(baseNow + 2 * 60 * 60 * 1000);
    expect(getCached("trending:movie:week")).toBeUndefined();
    expect(getCached("providers:movie:1")).toEqual({ results: {} });
  });

  it("cleans expired entry from localStorage on read", () => {
    setCached("search:expire", "data");
    expect(localStorageMock.getItem("moviedb:search:expire")).not.toBeNull();

    jest.spyOn(Date, "now").mockReturnValue(Date.now() + 31 * 60 * 1000);
    getCached("search:expire");
    expect(localStorageMock.getItem("moviedb:search:expire")).toBeNull();
  });
});

describe("localStorage persistence", () => {
  it("persists data to localStorage", () => {
    setCached("cache-test:persist", { x: 1 });
    const stored = JSON.parse(
      localStorageMock.getItem("moviedb:cache-test:persist")!,
    );
    expect(stored.value).toEqual({ x: 1 });
    expect(stored.expiresAt).toBeGreaterThan(Date.now());
  });

  it("hydrates from localStorage on module reload", () => {
    setCached("cache-test:hydrate", "hello");

    // Re-import the module to simulate page reload
    let getCached2: typeof getCached;
    jest.isolateModules(() => {
      const mod = require("../utils/cache");
      getCached2 = mod.getCached;
    });

    expect(getCached2!("cache-test:hydrate")).toBe("hello");
  });

  it("does not hydrate expired entries from localStorage", () => {
    setCached("search:old", "stale");

    jest.spyOn(Date, "now").mockReturnValue(Date.now() + 31 * 60 * 1000);

    let getCached2: typeof getCached;
    jest.isolateModules(() => {
      const mod = require("../utils/cache");
      getCached2 = mod.getCached;
    });

    expect(getCached2!("search:old")).toBeUndefined();
  });

  it("falls back to L2 on L1 miss", () => {
    // Write directly to localStorage to simulate data from a previous session
    const entry = { value: "from-storage", expiresAt: Date.now() + 100000 };
    localStorageMock.setItem("moviedb:cache-test:l2", JSON.stringify(entry));

    // Fresh module won't have this in L1 initially (hydration covers it),
    // but let's test the getCached L2 fallback path directly
    let getCached2: typeof getCached;
    jest.isolateModules(() => {
      const mod = require("../utils/cache");
      getCached2 = mod.getCached;
    });

    expect(getCached2!("cache-test:l2")).toBe("from-storage");
  });
});

describe("graceful degradation", () => {
  it("works when localStorage.setItem throws", () => {
    jest.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    // Should not throw
    setCached("cache-test:nols", "data");
    expect(getCached("cache-test:nols")).toBe("data");
  });

  it("works when localStorage.getItem throws", () => {
    setCached("cache-test:noread", "data");

    jest.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    // L1 cache still works
    expect(getCached("cache-test:noread")).toBe("data");
  });
});

describe("clearCache", () => {
  it("clears all cached entries from memory and localStorage", () => {
    setCached("cache-test:a", 1);
    setCached("cache-test:b", 2);

    // Add a non-moviedb localStorage entry to verify it's preserved
    localStorageMock.setItem("other-app:key", "preserve-me");

    clearCache();

    expect(getCached("cache-test:a")).toBeUndefined();
    expect(getCached("cache-test:b")).toBeUndefined();
    expect(localStorageMock.getItem("moviedb:cache-test:a")).toBeNull();
    expect(localStorageMock.getItem("moviedb:cache-test:b")).toBeNull();
    expect(localStorageMock.getItem("other-app:key")).toBe("preserve-me");
  });
});

import { detectCountry } from "../utils/detectCountry";

const originalNavigator = globalThis.navigator;

function mockLanguage(value: string) {
  Object.defineProperty(globalThis, "navigator", {
    value: { language: value },
    writable: true,
    configurable: true,
  });
}

afterEach(() => {
  Object.defineProperty(globalThis, "navigator", {
    value: originalNavigator,
    writable: true,
    configurable: true,
  });
});

describe("detectCountry", () => {
  it('extracts "US" from "en-US"', () => {
    mockLanguage("en-US");
    expect(detectCountry()).toBe("US");
  });

  it('extracts "FR" from "fr-FR"', () => {
    mockLanguage("fr-FR");
    expect(detectCountry()).toBe("FR");
  });

  it('extracts "BR" from "pt-BR"', () => {
    mockLanguage("pt-BR");
    expect(detectCountry()).toBe("BR");
  });

  it('falls back to "US" when no region subtag (e.g. "en")', () => {
    mockLanguage("en");
    expect(detectCountry()).toBe("US");
  });

  it('falls back to "US" when navigator is unavailable', () => {
    Object.defineProperty(globalThis, "navigator", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    expect(detectCountry()).toBe("US");
  });
});

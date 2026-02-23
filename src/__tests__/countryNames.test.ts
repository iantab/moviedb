import { COUNTRY_NAMES } from "../utils/countryNames";

describe("COUNTRY_NAMES", () => {
  describe("key mappings", () => {
    it.each([
      ["US", "United States"],
      ["GB", "United Kingdom"],
      ["JP", "Japan"],
      ["FR", "France"],
      ["AU", "Australia"],
      ["CA", "Canada"],
      ["DE", "Germany"],
      ["KR", "South Korea"],
      ["IN", "India"],
      ["BR", "Brazil"],
      ["MX", "Mexico"],
      ["IT", "Italy"],
      ["ES", "Spain"],
      ["NL", "Netherlands"],
      ["SE", "Sweden"],
    ])('COUNTRY_NAMES["%s"] === "%s"', (code, name) => {
      expect(COUNTRY_NAMES[code]).toBe(name);
    });
  });

  describe("entry count", () => {
    it("has approximately 254 entries", () => {
      expect(Object.keys(COUNTRY_NAMES).length).toBe(254);
    });
  });

  describe("historical codes", () => {
    it("includes Yugoslavia (YU)", () => {
      expect(COUNTRY_NAMES["YU"]).toBe("Yugoslavia");
    });

    it("includes Czechoslovakia (XC)", () => {
      expect(COUNTRY_NAMES["XC"]).toBe("Czechoslovakia");
    });

    it("includes Zaire (ZR)", () => {
      expect(COUNTRY_NAMES["ZR"]).toBe("Zaire");
    });
  });

  describe("unknown codes", () => {
    it("returns undefined for an unknown code", () => {
      expect(COUNTRY_NAMES["ZZ"]).toBeUndefined();
    });

    it("returns undefined for an empty string", () => {
      expect(COUNTRY_NAMES[""]).toBeUndefined();
    });
  });
});

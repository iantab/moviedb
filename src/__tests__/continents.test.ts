import {
  getContinent,
  CONTINENT_NAMES,
  CONTINENT_ORDER,
  COUNTRY_CONTINENT,
} from "../utils/continents";

describe("getContinent", () => {
  it("returns NA for US", () => {
    expect(getContinent("US")).toBe("NA");
  });

  it("returns NA for CA (Canada)", () => {
    expect(getContinent("CA")).toBe("NA");
  });

  it("returns NA for MX", () => {
    expect(getContinent("MX")).toBe("NA");
  });

  it("returns EU for GB", () => {
    expect(getContinent("GB")).toBe("EU");
  });

  it("returns EU for DE", () => {
    expect(getContinent("DE")).toBe("EU");
  });

  it("returns EU for FR", () => {
    expect(getContinent("FR")).toBe("EU");
  });

  it("returns AS for JP", () => {
    expect(getContinent("JP")).toBe("AS");
  });

  it("returns AS for CN", () => {
    expect(getContinent("CN")).toBe("AS");
  });

  it("returns AS for IN", () => {
    expect(getContinent("IN")).toBe("AS");
  });

  it("returns SA for BR", () => {
    expect(getContinent("BR")).toBe("SA");
  });

  it("returns SA for AR", () => {
    expect(getContinent("AR")).toBe("SA");
  });

  it("returns AF for ZA", () => {
    expect(getContinent("ZA")).toBe("AF");
  });

  it("returns AF for NG", () => {
    expect(getContinent("NG")).toBe("AF");
  });

  it("returns OC for AU", () => {
    expect(getContinent("AU")).toBe("OC");
  });

  it("returns OC for NZ", () => {
    expect(getContinent("NZ")).toBe("OC");
  });

  it("returns CA for MX... wait, JM (Jamaica)", () => {
    expect(getContinent("JM")).toBe("CA");
  });

  it("returns CA for CR (Costa Rica)", () => {
    expect(getContinent("CR")).toBe("CA");
  });

  it('returns "OTHER" for an unrecognised code', () => {
    expect(getContinent("XX")).toBe("OTHER");
  });

  it('returns "OTHER" for an empty string', () => {
    expect(getContinent("")).toBe("OTHER");
  });

  it('returns "OTHER" for a random unknown code', () => {
    expect(getContinent("ZZ")).toBe("OTHER");
  });
});

describe("CONTINENT_NAMES", () => {
  it.each([
    ["NA", "North America"],
    ["AF", "Africa"],
    ["AS", "Asia"],
    ["CA", "Central America & Caribbean"],
    ["EU", "Europe"],
    ["OC", "Oceania"],
    ["SA", "South America"],
    ["OTHER", "Other"],
  ])("maps %s to %s", (code, name) => {
    expect(CONTINENT_NAMES[code]).toBe(name);
  });

  it("contains exactly 8 entries", () => {
    expect(Object.keys(CONTINENT_NAMES)).toHaveLength(8);
  });
});

describe("CONTINENT_ORDER", () => {
  it("NA has order 0 (highest priority)", () => {
    expect(CONTINENT_ORDER["NA"]).toBe(0);
  });

  it("EU has order 1", () => {
    expect(CONTINENT_ORDER["EU"]).toBe(1);
  });

  it("OTHER has order 99 (lowest priority)", () => {
    expect(CONTINENT_ORDER["OTHER"]).toBe(99);
  });

  it("NA sorts before EU", () => {
    expect(CONTINENT_ORDER["NA"]).toBeLessThan(CONTINENT_ORDER["EU"]);
  });

  it("EU sorts before AS", () => {
    expect(CONTINENT_ORDER["EU"]).toBeLessThan(CONTINENT_ORDER["AS"]);
  });

  it("AS sorts before SA", () => {
    expect(CONTINENT_ORDER["AS"]).toBeLessThan(CONTINENT_ORDER["SA"]);
  });

  it("SA sorts before CA", () => {
    expect(CONTINENT_ORDER["SA"]).toBeLessThan(CONTINENT_ORDER["CA"]);
  });

  it("CA sorts before AF", () => {
    expect(CONTINENT_ORDER["CA"]).toBeLessThan(CONTINENT_ORDER["AF"]);
  });

  it("AF sorts before OC", () => {
    expect(CONTINENT_ORDER["AF"]).toBeLessThan(CONTINENT_ORDER["OC"]);
  });

  it("OC sorts before OTHER", () => {
    expect(CONTINENT_ORDER["OC"]).toBeLessThan(CONTINENT_ORDER["OTHER"]);
  });
});

describe("COUNTRY_CONTINENT", () => {
  it("contains mappings for all major regions", () => {
    expect(COUNTRY_CONTINENT["US"]).toBe("NA");
    expect(COUNTRY_CONTINENT["GB"]).toBe("EU");
    expect(COUNTRY_CONTINENT["JP"]).toBe("AS");
    expect(COUNTRY_CONTINENT["BR"]).toBe("SA");
    expect(COUNTRY_CONTINENT["AU"]).toBe("OC");
    expect(COUNTRY_CONTINENT["ZA"]).toBe("AF");
    expect(COUNTRY_CONTINENT["JM"]).toBe("CA");
  });

  it("does not contain an entry for an unknown code", () => {
    expect(COUNTRY_CONTINENT["XX"]).toBeUndefined();
  });
});

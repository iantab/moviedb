/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { CountrySelector } from "../../components/CountrySelector";

// Uses real continent/country utils (pure functions — no import.meta.env).

describe("CountrySelector", () => {
  const naCountries = ["US", "CA", "MX"]; // North America
  const euCountries = ["FR", "DE"]; // Europe
  const allCountries = [...naCountries, ...euCountries];

  it("groups countries by continent (NA and EU groups visible after expand all)", () => {
    render(
      <CountrySelector
        availableCountries={allCountries}
        selected={null}
        onSelect={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Expand all"));
    expect(screen.getByText("North America")).toBeInTheDocument();
    expect(screen.getByText("Europe")).toBeInTheDocument();
  });

  it("continent headers appear in CONTINENT_ORDER (NA before EU)", () => {
    render(
      <CountrySelector
        availableCountries={allCountries}
        selected={null}
        onSelect={jest.fn()}
      />,
    );
    const headers = screen.getAllByRole("button", { name: /countries/ });
    const names = headers.map((h) => h.textContent ?? "");
    const naIndex = names.findIndex((n) => n.includes("North America"));
    const euIndex = names.findIndex((n) => n.includes("Europe"));
    expect(naIndex).toBeLessThan(euIndex);
  });

  it("countries within a continent are sorted alphabetically", () => {
    render(
      <CountrySelector
        availableCountries={naCountries}
        selected="US" // keeps NA open
        onSelect={jest.fn()}
      />,
    );
    const countryBtns = screen.getAllByRole("button", {
      name: /Canada|Mexico|United States/,
    });
    const names = countryBtns.map((b) => b.textContent?.trim() ?? "");
    expect(names).toEqual(["Canada", "Mexico", "United States"]);
  });

  it("clicking a closed continent header opens it", () => {
    render(
      <CountrySelector
        availableCountries={naCountries}
        selected={null}
        onSelect={jest.fn()}
      />,
    );
    // Initially closed
    expect(screen.queryByText("United States")).toBeNull();
    fireEvent.click(screen.getByText("North America"));
    expect(screen.getByText("United States")).toBeInTheDocument();
  });

  it("clicking an open continent header closes it", () => {
    render(
      <CountrySelector
        availableCountries={naCountries}
        selected={null}
        onSelect={jest.fn()}
      />,
    );
    const header = screen.getByText("North America");
    fireEvent.click(header); // open
    expect(screen.getByText("United States")).toBeInTheDocument();
    fireEvent.click(header); // close
    expect(screen.queryByText("United States")).toBeNull();
  });

  it("selected country's continent is open even without explicit toggle", () => {
    render(
      <CountrySelector
        availableCountries={allCountries}
        selected="US"
        onSelect={jest.fn()}
      />,
    );
    // US is in NA — its continent should be open by default
    expect(screen.getByText("United States")).toBeInTheDocument();
    // EU should be closed
    expect(screen.queryByText("France")).toBeNull();
  });

  it("Expand all opens all continent groups", () => {
    render(
      <CountrySelector
        availableCountries={allCountries}
        selected={null}
        onSelect={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Expand all"));
    expect(screen.getByText("United States")).toBeInTheDocument();
    expect(screen.getByText("France")).toBeInTheDocument();
  });

  it("Collapse all closes all groups (selected continent still open via effectiveOpen)", () => {
    render(
      <CountrySelector
        availableCountries={allCountries}
        selected="US"
        onSelect={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Expand all")); // open everything
    expect(screen.getByText("France")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Collapse all"));
    // EU (France, Germany) should be hidden
    expect(screen.queryByText("France")).toBeNull();
    // US (NA) still open because selected country is US
    expect(screen.getByText("United States")).toBeInTheDocument();
  });

  it("clicking a country calls onSelect with its code", () => {
    const onSelect = jest.fn();
    render(
      <CountrySelector
        availableCountries={naCountries}
        selected="US"
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByText("Canada"));
    expect(onSelect).toHaveBeenCalledWith("CA");
  });

  it("selected country button has selected class", () => {
    render(
      <CountrySelector
        availableCountries={naCountries}
        selected="US"
        onSelect={jest.fn()}
      />,
    );
    const usBtn = screen.getByText("United States").closest("button")!;
    expect(usBtn.className).toContain("country-btn--selected");
  });

  it("non-selected country button does not have selected class", () => {
    render(
      <CountrySelector
        availableCountries={naCountries}
        selected="US"
        onSelect={jest.fn()}
      />,
    );
    const caBtn = screen.getByText("Canada").closest("button")!;
    expect(caBtn.className).not.toContain("country-btn--selected");
  });

  it("Netflix countries get netflix class on their button", () => {
    render(
      <CountrySelector
        availableCountries={naCountries}
        selected="US"
        onSelect={jest.fn()}
        netflixCountries={["US"]}
      />,
    );
    const usBtn = screen.getByText("United States").closest("button")!;
    expect(usBtn.className).toContain("country-btn--netflix");
  });

  it("shows Netflix count in the continent header", () => {
    render(
      <CountrySelector
        availableCountries={naCountries}
        selected={null}
        onSelect={jest.fn()}
        netflixCountries={["US", "CA"]}
      />,
    );
    // The header badge element should contain "2"
    const naHeader = screen.getByText("North America").closest("button")!;
    expect(naHeader.textContent).toContain("2");
  });

  it('shows "1 country" (singular) when a group has one country', () => {
    render(
      <CountrySelector
        availableCountries={["US"]}
        selected={null}
        onSelect={jest.fn()}
      />,
    );
    // The text appears in both the global header and the continent badge
    const matches = screen.getAllByText(/1 country\b/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    // Confirm "countries" (plural) is NOT present
    expect(screen.queryByText(/countries/)).toBeNull();
  });

  it('shows "N countries" (plural) when a group has multiple countries', () => {
    render(
      <CountrySelector
        availableCountries={naCountries}
        selected={null}
        onSelect={jest.fn()}
      />,
    );
    // The text appears in both the global header and the continent badge
    const matches = screen.getAllByText(/3 countries/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("falls back to the country code if not in COUNTRY_NAMES", () => {
    render(
      <CountrySelector
        availableCountries={["XX"]} // unknown code
        selected={null}
        onSelect={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Expand all"));
    expect(screen.getByText("XX")).toBeInTheDocument();
  });
});

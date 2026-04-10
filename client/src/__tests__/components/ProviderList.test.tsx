/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { ProviderList } from "../../components/ProviderList";
import type { CountryProviders } from "../../types/tmdb";

jest.mock("../../services/tmdb", () => ({
  IMAGE_BASE_URL: "https://img.tmdb.org",
}));

const makeProvider = (id: number, name: string, logo: string) => ({
  provider_id: id,
  provider_name: name,
  logo_path: logo,
  display_priority: id,
});

const netflix = makeProvider(8, "Netflix", "/netflix.png");
const prime = makeProvider(9, "Amazon Prime", "/prime.png");
const tubi = makeProvider(207, "Tubi", "/tubi.png");

const allProviders: CountryProviders = {
  link: "https://www.themoviedb.org/movie/1/watch?locale=US",
  flatrate: [netflix],
  free: [tubi],
  ads: [makeProvider(300, "Peacock", "/peacock.png")],
};

describe("ProviderList", () => {
  it("renders the TMDB link with the country code and correct href", () => {
    render(<ProviderList countryCode="US" providers={allProviders} />);
    const link = screen.getByRole("link", { name: /View on TMDB \(US\)/ });
    expect(link).toHaveAttribute(
      "href",
      "https://www.themoviedb.org/movie/1/watch?locale=US",
    );
  });

  it("renders Stream section with flatrate providers", () => {
    render(<ProviderList countryCode="US" providers={allProviders} />);
    expect(screen.getByText("Stream")).toBeInTheDocument();
    expect(screen.getByText("Netflix")).toBeInTheDocument();
  });

  it("renders Free section with free providers", () => {
    render(<ProviderList countryCode="US" providers={allProviders} />);
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Tubi")).toBeInTheDocument();
  });

  it("renders Free with Ads section with ads providers", () => {
    render(<ProviderList countryCode="US" providers={allProviders} />);
    expect(screen.getByText("Free with Ads")).toBeInTheDocument();
    expect(screen.getByText("Peacock")).toBeInTheDocument();
  });

  it("shows all three sections when all populated — no empty message", () => {
    render(<ProviderList countryCode="US" providers={allProviders} />);
    expect(
      screen.queryByText(/No streaming data available/),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Stream")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Free with Ads")).toBeInTheDocument();
  });

  it("shows empty message when no flatrate/free/ads providers", () => {
    const noProviders: CountryProviders = {
      link: "https://www.themoviedb.org/movie/1/watch?locale=DE",
    };
    render(<ProviderList countryCode="DE" providers={noProviders} />);
    expect(screen.getByText(/No streaming data available/)).toBeInTheDocument();
  });

  it("shows empty message when only rent/buy providers exist (not counted in hasAny)", () => {
    const rentOnly: CountryProviders = {
      link: "https://www.themoviedb.org/movie/1/watch?locale=GB",
      rent: [netflix],
      buy: [prime],
    };
    render(<ProviderList countryCode="GB" providers={rentOnly} />);
    expect(screen.getByText(/No streaming data available/)).toBeInTheDocument();
  });

  it("renders provider logo with correct src", () => {
    render(
      <ProviderList
        countryCode="US"
        providers={{ ...allProviders, free: undefined, ads: undefined }}
      />,
    );
    const logo = screen.getByAltText("Netflix");
    expect(logo).toHaveAttribute("src", "https://img.tmdb.org/w45/netflix.png");
  });

  it("renders provider with title attribute equal to provider_name", () => {
    render(
      <ProviderList
        countryCode="US"
        providers={{ ...allProviders, free: undefined, ads: undefined }}
      />,
    );
    const chip = screen.getByTitle("Netflix");
    expect(chip).toBeInTheDocument();
  });
});

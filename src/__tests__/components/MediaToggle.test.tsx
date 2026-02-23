/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { MediaToggle } from "../../components/MediaToggle";

describe("MediaToggle", () => {
  it("renders both buttons", () => {
    render(<MediaToggle value="movie" onChange={jest.fn()} />);
    expect(screen.getByText(/Movies/)).toBeInTheDocument();
    expect(screen.getByText(/TV Shows/)).toBeInTheDocument();
  });

  it('value="movie" → Movies button has active class, TV does not', () => {
    render(<MediaToggle value="movie" onChange={jest.fn()} />);
    const [moviesBtn, tvBtn] = screen.getAllByRole("button");
    expect(moviesBtn.className).toContain("media-toggle__btn--active");
    expect(tvBtn.className).not.toContain("media-toggle__btn--active");
  });

  it('value="tv" → TV button has active class, Movies does not', () => {
    render(<MediaToggle value="tv" onChange={jest.fn()} />);
    const [moviesBtn, tvBtn] = screen.getAllByRole("button");
    expect(tvBtn.className).toContain("media-toggle__btn--active");
    expect(moviesBtn.className).not.toContain("media-toggle__btn--active");
  });

  it('clicking Movies button calls onChange("movie")', () => {
    const onChange = jest.fn();
    render(<MediaToggle value="tv" onChange={onChange} />);
    fireEvent.click(screen.getByText(/Movies/));
    expect(onChange).toHaveBeenCalledWith("movie");
  });

  it('clicking TV Shows button calls onChange("tv")', () => {
    const onChange = jest.fn();
    render(<MediaToggle value="movie" onChange={onChange} />);
    fireEvent.click(screen.getByText(/TV Shows/));
    expect(onChange).toHaveBeenCalledWith("tv");
  });
});

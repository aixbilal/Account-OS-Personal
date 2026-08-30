import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Account OS shell", () => {
  it("renders the synthetic vault dataset without exposing passwords", () => {
    render(<App />);

    expect(screen.getByText("Google Personal TEST")).toBeInTheDocument();
    expect(screen.getByText("6 accounts")).toBeInTheDocument();
    expect(screen.queryByText("FAKE-PASSWORD-ONLY")).not.toBeInTheDocument();
  });

  it("navigates to the map and reports synthetic relationships", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Map" }));

    expect(screen.getByRole("heading", { name: "Map" })).toBeInTheDocument();
    expect(screen.getByText("5 synthetic links ready")).toBeInTheDocument();
  });
});

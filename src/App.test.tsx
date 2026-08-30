import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

  it("adds, edits, and deletes a synthetic account in preview mode", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Add account" }));
    await user.type(screen.getByLabelText("Service"), "Example Service TEST");
    await user.type(screen.getByLabelText("Account title"), "Example Account TEST");
    await user.type(screen.getByLabelText("Email"), "example@test.invalid");
    await user.click(screen.getByRole("button", { name: "Save account" }));

    expect(screen.getByText("Example Account TEST")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Example Account TEST/ }));
    const title = screen.getByLabelText("Account title");
    await user.clear(title);
    await user.type(title, "Updated Account TEST");
    await user.click(screen.getByRole("button", { name: "Save account" }));
    expect(screen.getByText("Updated Account TEST")).toBeInTheDocument();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: /Updated Account TEST/ }));
    await user.click(screen.getByRole("button", { name: "Delete account" }));
    expect(screen.queryByText("Updated Account TEST")).not.toBeInTheDocument();
  });
});

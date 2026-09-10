import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { resolveServiceIdentity, ServiceIdentityMark } from "./ServiceIdentity";

describe("ServiceIdentity local priority services", () => {
  it.each([
    ["Google", "google", "simple-icons"],
    ["Spotify", "spotify", "simple-icons"],
    ["GitHub", "github", "simple-icons"],
    ["Instagram", "instagram", "simple-icons"],
    ["Microsoft", "microsoft", "local"],
    ["Apple", "apple", "simple-icons"],
    ["YouTube", "youtube", "simple-icons"],
    ["LinkedIn", "linkedin", "local"],
    ["Discord", "discord", "simple-icons"],
    ["Facebook", "facebook", "simple-icons"],
  ])("resolves %s to the expected bundled identity", (serviceName, id, iconSource) => {
    expect(resolveServiceIdentity(serviceName)).toMatchObject({ id, iconSource });
  });

  it("prefers a real website domain and keeps unknown services intentional", () => {
    expect(resolveServiceIdentity("Personal mail", "https://accounts.google.com/login")).toMatchObject({ id: "google" });
    expect(resolveServiceIdentity("Northern Star Archive")).toMatchObject({ id: "custom", monogram: "NS", iconSource: "monogram" });
  });

  it("renders a local SVG without fetching a remote favicon", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    render(<ServiceIdentityMark account={{ serviceName: "Spotify", website: "https://spotify.com" }} />);
    expect(screen.getByLabelText("Spotify local identity").querySelector("svg path")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataSourceBadge } from "@/components/ui/status-badge";

describe("DataSourceBadge", () => {
  it.each(["LIVE", "DEMO", "STALE", "UNAVAILABLE"] as const)("renders %s explicitly", (source) => {
    render(<DataSourceBadge source={source} />);
    expect(screen.getByText(source)).toBeVisible();
  });
});

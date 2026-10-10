import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import GoogleTripMap from "@/app/map/GoogleTripMap";
import { buildPlannerResponse } from "@/lib/planner/buildResponse";
import { catalog, planInput } from "./support/plannerFixture";

afterEach(() => vi.unstubAllEnvs());

it("renders missing map configuration without mounting the external provider", () => {
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");
  const plan = buildPlannerResponse(planInput, catalog).withinBudget[0];
  Object.assign(plan.selectedHotel!, { latitude: 27, longitude: 88 });
  const html = renderToStaticMarkup(
    createElement(GoogleTripMap, { plan, days: 2 }),
  );
  expect(html).toContain("The map is not configured.");
  expect(html).not.toContain("maps.googleapis.com");
});

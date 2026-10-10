import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 2,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4182",
    timezoneId: "Asia/Kolkata",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "npm run build && npm run start -- --hostname 127.0.0.1 --port 4182",
    url: "http://127.0.0.1:4182",
    reuseExistingServer: false,
    timeout: 180000,
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_PUBLIC_SUPABASE_URL: "https://travel-test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "browser-test-placeholder",
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "browser-test-placeholder",
      NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_placeholder",
      AI_CHATBOT_API_KEY: "",
      RAZORPAY_KEY_ID: "rzp_test_placeholder",
      RAZORPAY_KEY_SECRET: "browser-test-placeholder",
      PAYMENTS_TEST_MODE_ENABLED: "false",
      HOTEL_SIMULATOR_ENABLED: "false",
      SUPABASE_SERVICE_ROLE_KEY: "",
    },
  },
});

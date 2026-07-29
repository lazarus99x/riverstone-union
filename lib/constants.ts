export const APP_NAME = "StateBank";
export const APP_DESCRIPTION =
  "Premium digital banking with military-grade security. Secure accounts, intelligent transfers, multi-currency support, and 24/7 dedicated support.";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const ROUTES = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  DASHBOARD: "/dashboard",
  ADMIN: {
    ROOT: "/admin",
    SIGN_IN: "/admin/sign-in",
    DASHBOARD: "/admin/dashboard",
  },
} as const;

export const COMPANY = {
  NAME: APP_NAME,
  LEGAL_NAME: "StateBank Financial Services, Inc.",
  SUPPORT_EMAIL: "support@statebank.com",
  SUPPORT_PHONE: "+1 (800) 555-BANK",
  ADDRESS: "100 Financial District Blvd, New York, NY 10004",
} as const;

export const LIMITS = {
  MAX_FILE_UPLOAD_MB: 10,
  SESSION_TIMEOUT_MINUTES: 60,
} as const;

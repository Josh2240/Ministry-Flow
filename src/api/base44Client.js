export const base44 = {
  app: {
    getPublicSettings: async () => ({ id: "local", public_settings: {} })
  },
  auth: {
    me: async () => ({ id: "local", full_name: "Local User", email: "local@example.com" }),
    logout: () => { window.location.href = "/login"; },
    redirectToLogin: (returnUrl) => { window.location.href = `/login?returnTo=${encodeURIComponent(returnUrl || "/")}`; }
  },
  entities: {},
  functions: {}
};

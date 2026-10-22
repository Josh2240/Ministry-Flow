export const base44 = {
  app: {
    getPublicSettings: async () => ({ id: "local", public_settings: {} }),
  },
  auth: {
    me: async () => ({ id: "local-user", full_name: "Local User", email: "user@example.com" }),
    /** @param {string} [returnUrl] */
    logout: (returnUrl) => {},
    /** @param {string} [returnUrl] */
    redirectToLogin: (returnUrl) => {},
  },
  entities: {},
};
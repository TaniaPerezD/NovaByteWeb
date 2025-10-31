const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
      SUPABASE_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY,
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
  },
});

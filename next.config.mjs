const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  /* config options here */
  i18n: undefined,
};

module.exports = withPWA(nextConfig);

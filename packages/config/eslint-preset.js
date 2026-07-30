// Legacy-format (.eslintrc-style) preset — kept for any tsconfig-only
// consumer that hasn't migrated to flat config yet. packages/ui and
// packages/core use their own eslint.config.js (flat config) directly instead.
module.exports = {
  extends: ["next/core-web-vitals"],
};

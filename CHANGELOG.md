# Changelog

## [v0.3]

### ESLint Migration
- Migrated from ESLint 8 legacy config (`.eslintrc.js`) to ESLint 9 flat config (`eslint.config.js`).
- Replaced `eslint-config-airbnb-base` and `eslint-plugin-import` with `@eslint/js`, `eslint-plugin-import-x`, and `globals` for ESLint 9 compatibility.
- Fixed all lint errors across source and test files (unused variables, import ordering, destructuring, etc.).

### Security
- Removed `csurf` — archived/deprecated dependency with a known `cookie` vulnerability (GHSA-pxg6-pf52-xh8x). The package was not used in the codebase.
- Patched `diff` (DoS via `parsePatch`/`applyPatch`, GHSA-73rr-hh4g-fpgx) and `serialize-javascript` (RCE via `RegExp.flags`, GHSA-5c6j-r48x-rmvq) vulnerabilities in mocha's dependency tree via npm overrides.
- Resolved all `npm audit` findings — 0 vulnerabilities.

### Dependencies
- **ESLint**: `8.57.1` -> `9.39.4`
- **Added**: `@eslint/eslintrc`, `@eslint/js`, `eslint-plugin-import-x`, `globals`
- **Removed**: `eslint-config-airbnb-base`, `eslint-plugin-import`, `csurf`

## [v0.2]

### Admin Interface
- **OAuth Provider Management**: Admins can enable/disable Facebook, Microsoft, and GitHub OAuth providers from the Settings page. Disabled providers are hidden from the login page and reject authentication attempts.
- **Email Verification Toggle**: Admins can enable/disable email verification for new accounts. When disabled, new users are auto-verified on registration.
- **Bulk Question Upload**: Admins can import questions in bulk via CSV or JSON file upload. Supports all question fields including tags. Validation errors are reported per-row; valid rows are imported while invalid rows are skipped.
- **User Password Reset**: Admins can reset any user's password either by setting a new password directly or by sending a reset link to the user's registered email address.
- **Admin Dashboard**: Updated with quick-access cards linking to Settings, User Management, and Bulk Upload pages.

### Question Management
- **Individual Answer Text Boxes**: Multiple choice options are now entered via separate text boxes instead of a JSON array. Options can be dynamically added and removed in the form UI.
- **Question Tagging**: Questions can be tagged with multiple tags. Tags are case insensitive and can contain spaces. A reusable autocomplete component shows matching tags as the user types; new tags are created on enter.

### Quiz Management
- **Quiz Tagging**: Quizzes can be tagged with multiple tags using the same autocomplete component as question tagging.
- **Question Search**: When adding questions to a quiz, quizmasters can search the question bank by tags and/or question text content. Search does not include answers.

### Database
- Added `tags` table with case-insensitive uniqueness via `normalized_name` column.
- Added `question_tags` junction table linking questions to tags.
- Added `quiz_tags` junction table linking quizzes to tags.
- Added `app_settings` key-value table for application configuration, seeded with default OAuth and email verification settings.

### New Files
- **Models**: `Tag.js`, `AppSettings.js`
- **Services**: `tagService.js`, `adminService.js`
- **Controllers**: `tagController.js`, `adminController.js`
- **Routes**: `tagRoutes.js` (`/api/tags`), `adminRoutes.js` (`/admin/settings`, `/admin/users`, `/admin/bulk-upload`)
- **Views**: `admin/settings.pug`, `admin/userManagement.pug`, `admin/bulkUpload.pug`, `partials/tagInput.pug`
- **Client JS**: `tag-input.js` (tag autocomplete component), `bulk-upload.js` (upload validation)
- **Migrations**: `012_create_tags`, `013_create_question_tags`, `014_create_quiz_tags`, `015_create_app_settings`
- **Tests**: 92 new tests across 6 test files covering all new models, services, and controllers

### Modified Files
- `passport.js` — OAuth strategies check `app_settings` before authenticating.
- `authService.js` — Registration conditionally sends verification email based on `app_settings`.
- `authController.js` — Login page receives OAuth enabled/disabled state.
- `questionController.js` — Parses individual option fields, manages question tags.
- `quizController.js` — Manages quiz tags on create/edit.
- `login.pug` — OAuth buttons conditionally rendered.
- `question/form.pug` — Individual option text boxes, tag input, dynamic add/remove.
- `question/bank.pug` — Tags column added to question list.
- `quiz/create.pug` — Quiz tag input, question search UI with tag and text filters.
- `admin/dashboard.pug` — Quick-access cards for new admin pages.
- `styles.css` — Tag input component styles.
- `authService.test.js` — Updated to mock `AppSettings` dependency.

### Dependencies
- Added `csv-parse` for bulk upload CSV parsing.

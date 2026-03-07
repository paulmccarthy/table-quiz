# Table Quiz Management App - Implementation Plan

## 1. Project Setup

### 1.1 Initialize Project
- `npm init` with project metadata
- Create directory structure:
  ```
  table-quiz/
  ├── src/
  │   ├── app.js                  # Express app setup
  │   ├── server.js               # Server entry point
  │   ├── config/
  │   │   ├── database.js         # MySQL connection/pool config
  │   │   ├── session.js          # Session store config
  │   │   ├── storage.js          # Media storage backend config
  │   │   ├── passport.js         # Passport strategies (local, OAuth, passkey)
  │   │   └── rateLimiter.js      # Rate limiting config (HTTP + WebSocket)
  │   ├── controllers/
  │   │   ├── authController.js
  │   │   ├── userController.js
  │   │   ├── quizController.js
  │   │   ├── questionController.js
  │   │   ├── teamController.js
  │   │   ├── roundController.js
  │   │   ├── answerController.js
  │   │   ├── leaderboardController.js
  │   │   └── exportController.js
  │   ├── models/
  │   │   ├── User.js
  │   │   ├── Quiz.js
  │   │   ├── Question.js
  │   │   ├── Round.js
  │   │   ├── Team.js
  │   │   ├── Answer.js
  │   │   └── QuizResult.js
  │   ├── middleware/
  │   │   ├── auth.js             # Authentication check
  │   │   ├── roles.js            # Role-based authorization (admin bypass)
  │   │   ├── rateLimiter.js      # Rate limiting middleware
  │   │   └── validation.js       # Request validation
  │   ├── routes/
  │   │   ├── authRoutes.js
  │   │   ├── userRoutes.js
  │   │   ├── quizRoutes.js
  │   │   ├── questionRoutes.js
  │   │   ├── teamRoutes.js
  │   │   ├── answerRoutes.js
  │   │   └── exportRoutes.js
  │   ├── websockets/
  │   │   ├── index.js            # Socket.io setup + auth middleware
  │   │   ├── quizSocket.js       # Quiz session events
  │   │   ├── leaderboardSocket.js
  │   │   └── socketRateLimiter.js # WebSocket message throttling
  │   ├── services/
  │   │   ├── authService.js
  │   │   ├── quizService.js
  │   │   ├── quizRuntimeService.js # In-memory quiz state manager
  │   │   ├── questionService.js
  │   │   ├── teamService.js
  │   │   ├── scoreService.js
  │   │   ├── storageService.js   # Abstraction over storage backends
  │   │   ├── emailService.js     # Email verification & invitations
  │   │   └── exportService.js    # CSV/PDF generation
  │   ├── storage/
  │   │   ├── localAdapter.js     # Local filesystem storage
  │   │   └── storageFactory.js   # Factory for swapping backends
  │   └── views/
  │       ├── layouts/
  │       │   └── main.pug
  │       ├── auth/
  │       │   ├── login.pug
  │       │   ├── register.pug
  │       │   ├── resetPassword.pug
  │       │   └── verifyEmail.pug
  │       ├── quiz/
  │       │   ├── create.pug
  │       │   ├── lobby.pug
  │       │   ├── play.pug
  │       │   ├── manage.pug
  │       │   ├── invite.pug
  │       │   └── quizLogin.pug   # Per-quiz login/entry page
  │       ├── question/
  │       │   ├── bank.pug
  │       │   └── form.pug
  │       ├── team/
  │       │   └── manage.pug
  │       ├── leaderboard/
  │       │   └── board.pug
  │       ├── history/
  │       │   ├── list.pug
  │       │   └── detail.pug
  │       ├── admin/
  │       │   └── dashboard.pug
  │       └── partials/
  │           ├── navbar.pug
  │           ├── drawingCanvas.pug
  │           ├── drawingReview.pug  # Quizmaster drawing review panel
  │           └── flash.pug
  ├── public/
  │   ├── css/
  │   ├── js/
  │   │   ├── socket-client.js
  │   │   ├── drawing.js          # Canvas drawing tool
  │   │   ├── quiz-player.js      # Player-side quiz logic
  │   │   └── quiz-master.js      # Quizmaster-side quiz logic
  │   └── uploads/                # Default local media storage
  ├── migrations/                 # Database migration scripts
  ├── test/
  │   ├── unit/
  │   ├── integration/
  │   └── helpers/
  ├── .eslintrc.js
  ├── .env.example
  ├── .gitignore
  └── package.json
  ```

### 1.2 Install Dependencies
- **Core:** express, mysql2, express-session, express-mysql-session, socket.io, pug
- **Auth:** passport, passport-local, passport-facebook, passport-microsoft, passport-github2, @simplewebauthn/server (passkeys), bcryptjs
- **Validation & Security:** express-rate-limit, helmet, express-validator, csurf, cors
- **Media & Export:** multer (file uploads), pdfkit (PDF export), csv-stringify (CSV export)
- **Email:** nodemailer
- **Utilities:** dotenv, uuid, crypto
- **Dev:** mocha, chai, sinon, nyc (coverage), eslint, eslint-config-airbnb-base, supertest, socket.io-client

### 1.3 Configuration
- `.env` file for database credentials, session secret, OAuth client IDs/secrets, email SMTP settings, storage backend selection
- `.env.example` with placeholder values

---

## 2. Database Schema (MySQL)

### 2.1 Migration Scripts
Create migration scripts executed in order. Key tables:

#### users
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | Nullable (OAuth users) |
| role | ENUM('admin','quizmaster','player') | NOT NULL |
| email_verified | BOOLEAN | DEFAULT false |
| verification_token | VARCHAR(255) | Nullable |
| oauth_provider | VARCHAR(50) | Nullable |
| oauth_id | VARCHAR(255) | Nullable |
| passkey_credential | JSON | Nullable |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### quizzes
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT | PK |
| title | VARCHAR(255) | NOT NULL |
| access_code | VARCHAR(20) | UNIQUE |
| invite_token | VARCHAR(255) | UNIQUE, for shareable links |
| invite_token_expires_at | TIMESTAMP | Nullable, optional expiry |
| quizmaster_id | INT | FK -> users.id |
| is_public | BOOLEAN | DEFAULT false |
| status | ENUM('draft','lobby','active','paused','completed') | |
| num_rounds | INT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Indexes:**
- `idx_quizzes_quizmaster_status` on (quizmaster_id, status) — enforce one active quiz per quizmaster
- `idx_quizzes_access_code` on (access_code)
- `idx_quizzes_invite_token` on (invite_token)

#### rounds
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT | PK |
| quiz_id | INT | FK -> quizzes.id |
| round_number | INT | |
| num_questions | INT | |

**Indexes:**
- `idx_rounds_quiz_id` on (quiz_id)

#### questions
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT | PK |
| text | TEXT | NOT NULL |
| content_type | ENUM('text','image','audio','video') | Type of question media |
| answer_type | ENUM('multiple_choice','freeform_text','drawing') | How players answer |
| difficulty | ENUM('easy','medium','hard') | |
| media_path | VARCHAR(500) | Nullable, path for image/audio/video |
| correct_answer | TEXT | Expected answer (text or selected choice) |
| options | JSON | For multiple choice (array of choices) |
| time_limit | INT | Seconds, nullable (0 or NULL = manual advance) |
| created_by | INT | FK -> users.id |
| created_at | TIMESTAMP | |

#### round_questions
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT | PK |
| round_id | INT | FK -> rounds.id |
| question_id | INT | FK -> questions.id |
| question_order | INT | Fixed display order |

**Indexes:**
- `idx_round_questions_round_id` on (round_id)
- `UNIQUE(round_id, question_order)` — enforce ordering uniqueness

#### teams
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT | PK |
| quiz_id | INT | FK -> quizzes.id |
| name | VARCHAR(100) | |
| created_at | TIMESTAMP | |

#### team_members
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT | PK |
| team_id | INT | FK -> teams.id |
| user_id | INT | FK -> users.id |
| UNIQUE(team_id, user_id) | | |

**Indexes:**
- `idx_team_members_team_id` on (team_id)
- `idx_team_members_user_id` on (user_id)

#### quiz_participants
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT | PK |
| quiz_id | INT | FK -> quizzes.id |
| user_id | INT | FK -> users.id |
| admitted | BOOLEAN | DEFAULT false (private quizzes) |
| is_individual | BOOLEAN | DEFAULT false |
| UNIQUE(quiz_id, user_id) | | |

**Indexes:**
- `idx_quiz_participants_quiz_id` on (quiz_id)
- `idx_quiz_participants_user_id` on (user_id)

#### answers
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT | PK |
| round_question_id | INT | FK -> round_questions.id |
| user_id | INT | FK -> users.id |
| team_id | INT | FK -> teams.id, nullable |
| answer_type | ENUM('choice','text','drawing') | |
| answer_value | TEXT | Text/choice value, nullable |
| drawing_path | VARCHAR(500) | Nullable, file path to saved drawing image |
| is_correct | BOOLEAN | Nullable |
| marked_by | ENUM('auto','quizmaster') | |
| submitted_at | TIMESTAMP | |
| UNIQUE(round_question_id, user_id) | | One answer per player per question |

**Indexes:**
- `idx_answers_round_question_id` on (round_question_id)
- `idx_answers_user_id` on (user_id)
- `idx_answers_team_id` on (team_id)

**Note:** The UNIQUE constraint on (round_question_id, user_id) ensures one answer per player per question. Answer changes are handled via UPDATE (upsert pattern), not INSERT.

#### scores
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT | PK |
| quiz_id | INT | FK -> quizzes.id |
| round_id | INT | FK -> rounds.id |
| team_id | INT | FK -> teams.id, nullable |
| user_id | INT | FK -> users.id, nullable |
| score | INT | |
| override | BOOLEAN | DEFAULT false |
| overridden_by | INT | FK -> users.id, nullable |

**Indexes:**
- `idx_scores_quiz_round` on (quiz_id, round_id)
- `idx_scores_team_id` on (team_id)
- `idx_scores_user_id` on (user_id)

#### quiz_results
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT | PK |
| quiz_id | INT | FK -> quizzes.id |
| quiz_title | VARCHAR(255) | Snapshot of title at completion |
| quizmaster_id | INT | FK -> users.id |
| completed_at | TIMESTAMP | |
| total_rounds | INT | |
| total_questions | INT | |
| result_data | JSON | Full results snapshot (rankings, scores per round, per team/player) |

**Indexes:**
- `idx_quiz_results_quiz_id` on (quiz_id)
- `idx_quiz_results_quizmaster_id` on (quizmaster_id)

#### sessions (managed by express-mysql-session)

---

## 3. Implementation Phases

### Phase 1: Foundation
**Goal:** Runnable app with auth, basic CRUD, and database.

1. **Express app setup** - app.js with middleware stack (helmet, session, pug, static files, CSRF)
2. **Database connection** - mysql2 pool with config from .env
3. **Migration runner** - Script to execute migration files in order
4. **Session store** - express-mysql-session configured
5. **Rate limiter** - express-rate-limit on auth and API endpoints
6. **User model & auth**
   - Registration with email verification (nodemailer)
   - Local login with bcrypt password hashing
   - Password reset flow (token-based)
   - Passport strategies: local, Facebook, Microsoft, GitHub
   - Passkey registration and authentication (@simplewebauthn)
   - Role-based middleware (admin, quizmaster, player)
   - Admin bypass: roles middleware grants admins access to all resources
7. **Auth views** - login, register, reset password, verify email pages
8. **Tests** - Unit tests for all auth logic, middleware, models

### Phase 2: Quiz & Question Management
**Goal:** Quizmasters can create and configure quizzes with questions.

1. **Question bank CRUD**
   - Create/edit/delete questions with difficulty levels (easy, medium, hard)
   - Separate `content_type` (text/image/audio/video) from `answer_type` (multiple_choice/freeform_text/drawing)
   - Media upload via multer routed through storageService (local adapter by default)
   - Support all content types: text-only, picture, audio, video
   - Support all answer types: multiple choice (with options JSON), freeform text, drawing
   - Questions reusable across quizzes
2. **Quiz CRUD**
   - Create/edit/delete quizzes (quizmasters own quizzes only, admins access all)
   - Configure rounds and questions per round
   - Set public/private, generate access codes
   - **Invite token lifecycle:**
     - Generate unique invite_token on quiz creation (uuid v4)
     - Quizmaster can regenerate token (invalidates old links)
     - Optional expiration via invite_token_expires_at
     - Tokens invalidated when quiz moves to 'completed' status
   - Email invitations via emailService (sends invite link)
   - **One active quiz enforcement:** quizService checks that quizmaster has no quiz with status 'active' or 'paused' before allowing activation
3. **Quiz access routes**
   - `GET /quiz/:invite_token` — dedicated per-quiz login/entry page (quizLogin.pug)
   - `POST /quiz/join` — join via access code from the general join page
   - Both routes validate token/code, check expiry, and redirect to lobby
4. **Round configuration**
   - Add/remove/reorder rounds
   - Assign questions to rounds with fixed ordering (question_order column)
5. **Views** - Question bank, quiz creation/management forms, per-quiz login page
6. **Tests** - Unit tests for all quiz/question/round logic, invite token lifecycle

### Phase 3: Team & Player Management
**Goal:** Players can join quizzes and form teams.

1. **Quiz joining**
   - Join via access code, invite link, or email invitation
   - Private quiz: player enters lobby, quizmaster admits
   - Public quiz: auto-admitted on join
2. **Team management**
   - Players create teams
   - **Maximum 6 players per team** — enforced in teamService on join/assign; reject with error if team is full
   - Quizmaster assigns teams manually or randomly
   - Players choose/rename team name after random assignment
   - Individual player mode (no team, is_individual = true)
3. **Quiz lobby** - Real-time lobby view showing connected players and teams (WebSocket)
4. **Views** - Lobby, team management
5. **Tests** - Unit tests for team logic (including max size enforcement), joining, admission

### Phase 4: Live Quiz Engine
**Goal:** Full real-time quiz gameplay.

1. **WebSocket setup**
   - Socket.io server with session-based authentication middleware
   - **WebSocket rate limiting** (socketRateLimiter.js):
     - Throttle answer submissions (max 10/sec per client)
     - Throttle join attempts (max 3/min per IP)
     - Throttle access code attempts (max 5/15 min per IP)
     - Disconnect clients exceeding thresholds
2. **Quiz Runtime Service** (quizRuntimeService.js)
   - In-memory state manager per active quiz, tracking:
     - `quizId` — active quiz identifier
     - `currentRound` — current round number
     - `currentQuestion` — current question index within round
     - `timerState` — { startedAt, duration, remaining, isPaused }
     - `connectedPlayers` — Map of userId -> socketId
     - `status` — mirrors DB status (active/paused)
   - Methods:
     - `startQuiz(quizId)` — validate quizmaster has no other active quiz, initialize state, set status to 'active'
     - `pauseQuiz(quizId)` — freeze timer, record remaining time, set status to 'paused'
     - `resumeQuiz(quizId)` — restart timer from remaining time, set status to 'active'
     - `advanceQuestion(quizId)` — move to next question or trigger round completion
     - `completeRound(quizId)` — trigger scoring and leaderboard broadcast
     - `getState(quizId)` — return full current state for reconnecting players
     - `registerPlayer(quizId, userId, socketId)` — track connection
     - `removePlayer(quizId, userId)` — track disconnection
   - State persisted to DB on key transitions (round complete, quiz pause, quiz complete)
3. **Quiz state machine**
   - States: draft -> lobby -> active <-> paused -> completed
   - Quizmaster starts quiz manually
   - Pause/resume support with timer preservation
4. **Question flow**
   - Server emits question to all connected clients in fixed order (by question_order)
   - Timed questions: server-side countdown via quizRuntimeService, broadcast remaining time every second
   - Manual advance: quizmaster triggers next question
   - Players submit answers (choice, text, or drawing via canvas)
   - **Answer upsert:** `INSERT ... ON DUPLICATE KEY UPDATE` on (round_question_id, user_id) — players can change answers unlimited times before cutoff
   - Server rejects answer submissions after timer expires or quizmaster advances
5. **Drawing tool**
   - Canvas-based drawing in browser (public/js/drawing.js)
   - Brush size, color, eraser, clear
   - Submit drawing as PNG image data (base64 -> buffer)
   - **Drawing storage:** saved as image file via storageService (localAdapter writes to uploads/drawings/), only the file path stored in answers.drawing_path
   - On answer update, old drawing file deleted before saving new one
6. **Answer processing**
   - Auto-score multiple choice (exact match against correct_answer)
   - Auto-score freeform text (case-insensitive trim match against correct_answer)
   - Drawing answers: is_correct left NULL, marked_by left NULL — flagged for quizmaster review
7. **Drawing review interface**
   - Quizmaster view (drawingReview.pug partial) shows pending drawing answers after each question or at end of round
   - Displays saved drawing image alongside the question
   - Quizmaster marks each drawing correct or incorrect
   - Updates answer record: is_correct = true/false, marked_by = 'quizmaster'
   - Score recalculated after marking
8. **Scoring**
   - Automatic score calculation per question (1 point per correct answer, configurable)
   - Quizmaster can override any score
   - Scores aggregated by team or individual
9. **Round completion and leaderboard**
   - When last question in a round is completed (timer expires or quizmaster advances past it):
     - quizRuntimeService calls `completeRound(quizId)`
     - scoreService calculates round scores for all teams/individuals
     - Emit `round:complete` WebSocket event with round number
     - Emit `leaderboard:update` WebSocket event with ranked scores
     - Leaderboard displayed to all players (board.pug)
     - Quizmaster can review pending drawing answers before confirming round scores
     - After quizmaster confirms (or all drawings are marked), final leaderboard broadcast
10. **Disconnection and reconnection handling**
    - quizRuntimeService tracks connection state per player in connectedPlayers map
    - On disconnect: mark player as disconnected, do NOT remove from quiz
    - On reconnect:
      1. Socket re-authenticates via session middleware (same session cookie)
      2. Server calls `quizRuntimeService.getState(quizId)` to get current state
      3. Player rejoins Socket.io quiz room
      4. Server emits `quiz:sync` event with: current round, current question, timer remaining, leaderboard, player's existing answer (if any)
      5. Player client restores UI to current state
11. **Tests** - Unit tests for quizRuntimeService (state transitions, timer, reconnection), scoring, answer upsert logic, drawing storage, WebSocket events

### Phase 5: Leaderboard, History & Export
**Goal:** Leaderboard display, quiz history, and data export.

1. **Leaderboard**
   - Calculate rankings at end of each round (triggered by quizRuntimeService.completeRound)
   - Broadcast leaderboard via WebSocket (`leaderboard:update` event)
   - Display team/individual scores and positions
   - Cumulative scores across rounds
2. **Quiz history**
   - On quiz completion, snapshot results into quiz_results table:
     - Quiz title, quizmaster, completion timestamp
     - result_data JSON contains: final rankings, per-round scores, per-question answers
   - **Player view:** list of past quizzes they participated in, with scores and ranking
   - **Quizmaster view:** list of quizzes they hosted, with full results detail
   - **Admin view:** all quiz history, filterable by quizmaster or date
   - Views: history list (list.pug) and detail (detail.pug)
3. **Export**
   - CSV export via csv-stringify:
     - Columns: quiz_title, round_number, question_number, question_text, player_email, team_name, answer_value, is_correct, score
     - One row per player per question
   - PDF export via pdfkit:
     - Header: quiz title, date, quizmaster
     - Per-round section: question list, team/player scores
     - Final rankings table
   - Export routes: `GET /quiz/:id/export/csv`, `GET /quiz/:id/export/pdf`
   - Access: quizmaster who owns the quiz, or admin
4. **Tests** - Unit tests for leaderboard calculation, quiz result snapshots, export generation (CSV content, PDF structure)

### Phase 6: Admin Dashboard
**Goal:** Admin oversight and management.

1. **Admin dashboard**
   - View all users, quizzes, and active sessions
   - Manage users: change roles, reset passwords, disable accounts
   - Access and manage any quiz (admin bypass in roles middleware)
   - **Admin privilege enforcement:**
     - roles middleware: if user.role === 'admin', skip ownership checks
     - Admin can view/edit/delete any quiz regardless of quizmaster_id
     - Admin can view all quiz history and export any quiz results
     - Admin can force-end or pause any active quiz
2. **Views** - Admin dashboard
3. **Tests** - Unit tests for admin operations, ownership bypass

---

## 4. Cross-Cutting Concerns

### Security
- Helmet.js for HTTP headers
- CSRF protection on all forms
- bcrypt for password hashing (cost factor 12)
- **HTTP rate limiting** (express-rate-limit):
  - Login: 5 attempts / 15 min per IP
  - Access code entry: 10 attempts / 15 min per IP
  - General API: 100 req / min per IP
  - Password reset: 3 attempts / hour per IP
- **WebSocket rate limiting** (socketRateLimiter.js):
  - Answer submissions: 10 / sec per client
  - Join/reconnect attempts: 3 / min per IP
  - General messages: 30 / sec per client
  - Exceeding limits triggers warning, then disconnect
- Input validation on all endpoints (express-validator)
- Parameterized queries (mysql2 prepared statements) to prevent SQL injection
- XSS prevention via pug auto-escaping and input sanitization
- Invite tokens validated for expiry and quiz status before granting access

### Testing Strategy
- **Unit tests:** All models, services, middleware, controllers (mocha + chai + sinon)
- **Integration tests:** API routes with supertest, WebSocket events with socket.io-client
- **Coverage:** nyc configured with 95% threshold on lines, branches, functions, statements
- **TDD:** Write failing tests first, then implement

### Linting
- eslint-config-airbnb-base for Node.js (no React rules)
- npm script: `npm run lint`

### npm Scripts
```json
{
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "test": "nyc mocha --recursive test/**/*.test.js",
  "lint": "eslint src/ test/",
  "migrate": "node migrations/run.js",
  "migrate:rollback": "node migrations/rollback.js"
}
```

---

## 5. Implementation Order Summary

| Phase | Deliverable | Dependencies |
|-------|------------|-------------|
| 1 | Auth, DB, sessions, rate limiting | None |
| 2 | Quiz & question CRUD, media upload, invite system | Phase 1 |
| 3 | Team & player management, lobby | Phase 2 |
| 4 | Live quiz engine, drawing, scoring, reconnection | Phase 3 |
| 5 | Leaderboard, history, export | Phase 4 |
| 6 | Admin dashboard | Phase 1 |

Phases 5 and 6 can be developed in parallel once Phase 4 is complete.

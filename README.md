# Table Quiz Management App

A web-based application for running table quizzes across multiple locations simultaneously. Supports real-time quiz gameplay, team management, multiple question types, and live leaderboards.

## Features

### User Management
- **Three roles:** Admin, Quizmaster, and Player
- **Multiple login methods:** Email/password, Facebook OAuth, GitHub OAuth, and passkey support
- **Email verification** required for new accounts
- **Self-service password reset** via email, or admin-initiated reset
- **Admin dashboard** for managing all users, roles, and quizzes

### Quiz Management
- **Create and configure quizzes** with customizable rounds and questions per round
- **Public and private quizzes** — private quizzes require quizmaster admission of each player
- **Unique access codes** and **shareable invite links** for each quiz
- **Email invitations** to send quiz links directly to players
- **Invite token lifecycle** — tokens can be regenerated and optionally expire
- **One active quiz per quizmaster** — enforced at the service level
- **Quiz state machine:** Draft → Lobby → Active ↔ Paused → Completed

### Question Bank
- **Reusable questions** across multiple quizzes
- **Content types:** Text, Image, Audio, Video
- **Answer types:** Multiple Choice, Freeform Text, Drawing
- **Difficulty levels:** Easy, Medium, Hard
- **Configurable time limits** per question (or manual advance by quizmaster)
- **Media uploads** stored on local filesystem (configurable storage backend)

### Live Quiz Engine
- **Real-time gameplay** via WebSockets (Socket.io)
- **Server-side timers** for timed questions (prevents client-side cheating)
- **Answer upsert** — players can change answers unlimited times before cutoff
- **Canvas-based drawing tool** with brush, eraser, color picker, and size control
- **Quizmaster controls:** Start, pause, resume, advance questions
- **Automatic scoring** for multiple choice and text answers
- **Manual drawing review** — quizmasters mark drawings correct/incorrect
- **Quizmaster score override** for any answer

### Teams
- **Player-created teams** or quizmaster-assigned teams
- **Random team assignment** by quizmaster
- **Team name editing** after random assignment
- **Maximum 6 players per team** (enforced)
- **Individual play mode** (no team)

### Leaderboard & History
- **Live leaderboard** displayed at the end of each round via WebSocket
- **Cumulative scoring** across rounds
- **Quiz history** — players and quizmasters can view past results
- **Admin access** to all quiz history

### Export
- **CSV export** — quiz title, round, question, player, team, answer, score
- **PDF export** — formatted results with rankings

### Security
- **Helmet.js** HTTP security headers
- **bcrypt** password hashing (cost factor 12)
- **Rate limiting** on login (5/15min), access codes (10/15min), password reset (3/hr), general API (100/min)
- **WebSocket rate limiting** — answer submissions, join attempts, general messages
- **Input validation** via express-validator on all endpoints
- **Parameterized SQL queries** (mysql2 prepared statements)
- **XSS prevention** via Pug auto-escaping
- **CSRF protection** on forms

### Reconnection
- If a player disconnects during a quiz, they can reconnect
- On reconnect: re-authenticated via session, rejoined to quiz room, synced to current question/timer state, existing answer restored

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js 5 |
| Database | MySQL |
| Session Store | MySQL-backed (express-mysql-session) |
| Templating | Pug |
| CSS Framework | Bootstrap 5 |
| Real-time | Socket.io |
| Authentication | Passport.js (Local, Facebook, GitHub, Passkeys) |
| File Storage | Local filesystem (configurable via adapter pattern) |
| Testing | Mocha + Chai + Sinon |
| Coverage | nyc (Istanbul) — 95% threshold |
| Linting | ESLint with Airbnb base config |

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MySQL** >= 8.0

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/paulmccarthy/table-quiz.git
cd table-quiz
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=table_quiz
SESSION_SECRET=your-random-secret-string
```

### 4. Create the database

```sql
CREATE DATABASE table_quiz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Run migrations

```bash
npm run migrate
```

### 6. Start the application

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The app will be available at `http://localhost:3000`.

## Running Tests

```bash
# Run all tests with coverage
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

Coverage reports are generated in the `coverage/` directory. The project enforces a minimum **95% coverage** threshold on lines, branches, functions, and statements.

## Linting

```bash
# Check for lint errors
npm run lint

# Auto-fix lint errors
npm run lint:fix
```

## Database Migrations

```bash
# Run pending migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback
```

## Project Structure

```
table-quiz/
├── src/
│   ├── app.js                    # Express app setup & middleware
│   ├── server.js                 # HTTP server entry point
│   ├── config/                   # Database, session, storage, passport, rate limiter
│   ├── controllers/              # Route handlers
│   ├── middleware/               # Auth, roles, validation, rate limiting
│   ├── models/                   # Data access layer (User, Quiz, Question, etc.)
│   ├── routes/                   # Express route definitions
│   ├── services/                 # Business logic layer
│   ├── storage/                  # Storage abstraction (local adapter + factory)
│   ├── views/                    # Pug templates
│   └── websockets/               # Socket.io setup & event handlers
├── public/
│   ├── css/                      # Stylesheets
│   ├── js/                       # Client-side JavaScript
│   └── uploads/                  # Media & drawing file storage
├── migrations/                   # Database migration scripts
├── test/                         # Test suites
│   ├── unit/                     # Unit tests (models, services, middleware)
│   ├── integration/              # Integration tests
│   └── helpers/                  # Test utilities
├── .env.example                  # Environment variables template
├── .eslintrc.js                  # ESLint configuration
├── .nycrc.json                   # Coverage configuration
└── package.json
```

## API Routes

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/login` | Login page |
| POST | `/auth/login` | Authenticate user |
| GET | `/auth/register` | Registration page |
| POST | `/auth/register` | Create account |
| GET | `/auth/logout` | Logout |
| GET | `/auth/reset-password` | Password reset request page |
| POST | `/auth/reset-password` | Send reset email |
| GET | `/auth/reset-password/:token` | Reset form |
| POST | `/auth/reset-password/:token` | Set new password |
| GET | `/auth/verify-email/:token` | Verify email address |
| GET | `/auth/facebook` | Facebook OAuth login |
| GET | `/auth/github` | GitHub OAuth login |

### Quizzes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/quiz` | List quizzes |
| GET | `/quiz/create` | Create quiz form |
| POST | `/quiz/create` | Create quiz |
| GET | `/quiz/:id/edit` | Edit quiz |
| POST | `/quiz/:id/edit` | Update quiz |
| POST | `/quiz/:id/delete` | Delete quiz |
| POST | `/quiz/:id/activate` | Move to lobby |
| GET | `/quiz/:id/lobby` | Quiz lobby |
| GET | `/quiz/:id/play` | Quiz play page |
| POST | `/quiz/join` | Join by access code |
| GET | `/quiz/join/:inviteToken` | Per-quiz login page |
| POST | `/quiz/join/:inviteToken` | Join via invite link |

### Questions
| Method | Path | Description |
|--------|------|-------------|
| GET | `/questions` | Question bank |
| GET | `/questions/create` | Create question form |
| POST | `/questions/create` | Create question |
| GET | `/questions/:id/edit` | Edit question |
| POST | `/questions/:id/edit` | Update question |
| POST | `/questions/:id/delete` | Delete question |

### Teams
| Method | Path | Description |
|--------|------|-------------|
| POST | `/teams/:quizId/create` | Create team |
| POST | `/teams/:quizId/:teamId/join` | Join team |
| POST | `/teams/:quizId/:teamId/leave` | Leave team |
| POST | `/teams/:quizId/:teamId/rename` | Rename team |
| POST | `/teams/:quizId/random-assign` | Random team assignment |
| POST | `/teams/:quizId/individual` | Play as individual |

### Export
| Method | Path | Description |
|--------|------|-------------|
| GET | `/export/:id/csv` | Export results as CSV |
| GET | `/export/:id/pdf` | Export results as PDF |

### Admin
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin` | Admin dashboard |
| POST | `/admin/:id/role` | Change user role |
| POST | `/admin/:id/reset-password` | Reset user password |
| POST | `/admin/:id/delete` | Delete user |

## WebSocket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `quiz:join` | `{ quizId }` | Join quiz room |
| `quiz:start` | `{ quizId }` | Start quiz (quizmaster) |
| `quiz:pause` | `{ quizId }` | Pause quiz |
| `quiz:resume` | `{ quizId }` | Resume quiz |
| `quiz:nextQuestion` | `{ quizId }` | Advance to next question |
| `answer:submit` | `{ quizId, answerType, answerValue, drawingData }` | Submit/update answer |
| `drawing:mark` | `{ answerId, isCorrect }` | Mark drawing (quizmaster) |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `quiz:sync` | State + question data | Full state sync on reconnect |
| `quiz:started` | `{ state }` | Quiz has started |
| `quiz:paused` | `{ state }` | Quiz paused |
| `quiz:resumed` | `{ state }` | Quiz resumed |
| `question:show` | Question data | New question displayed |
| `timer:tick` | `{ remaining }` | Timer countdown |
| `round:complete` | Leaderboard data | Round finished |
| `round:start` | `{ roundNumber }` | New round starting |
| `quiz:completed` | `{ leaderboard }` | Quiz finished |
| `player:joined` | `{ userId, displayName }` | Player connected |
| `player:disconnected` | `{ userId, displayName }` | Player disconnected |
| `answer:received` | `{ success }` | Answer confirmation |

## License

ISC

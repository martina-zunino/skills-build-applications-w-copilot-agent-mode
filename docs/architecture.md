# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- **Presentation tier decision**: React components (Activities, Teams, Leaderboard, Workouts) fetch data via the API client and use CapabilityCard for consistent UI. All components handle loading, empty, and error states. Tests mock the fetch API to verify correct endpoints and rendering.

- **Logic tier decision**: Express routes delegate to octofitService functions. Input validation and error handling occur in service functions with explicit 4xx responses for validation failures (never 500 from cast errors).

- **Data tier decision**: Mongoose schemas enforce required fields via schema validation. The seed script uses `upsert` with `$addToSet` to maintain idempotent demo data without deleting application-owned records.

- **Activity tracking approach**: `createActivity()` validates that `userId` and `teamId` are valid ObjectIds and exist in the database. Points are computed based on minutes (1 point per minute baseline, adjustable by activity type). `occurredAt` defaults to the current timestamp. Activities link users, teams, type, minutes, points, and date.

- **Team management approach**: `createTeam()` requires a `name` and optional `mascot` and `members` array. Validation rejects missing name with HTTP 400. Teams store name, mascot, and member IDs; `GET /api/teams` returns all teams with their members.

- **Leaderboard approach**: `getLeaderboard()` aggregates activities by team using MongoDB aggregation or by-hand sum. Teams are ordered by total points descending. Each entry includes teamName, totalPoints, and 1-based rank. Empty leaderboard returns empty array.

- **Workout suggestions approach**: `suggestWorkouts(userEmail)` finds the user by email, then matches the first workout by checking if its `focus` matches the user's `fitnessGoal` or their most recent activity type. The suggestion includes a `reason` string explaining the match (e.g., "Matches your recent run activity" or "Aligns with your endurance goal"). Unknown email returns 404.

## Test plan

Record the commands you run and what each failure means.

- **Data-tier command**: `npm run test:data --prefix octofit-tracker/backend`
  - Validates Mongoose schema requirements (User name/email/fitnessGoal, Team name/mascot/members, Activity type/user/team/minutes/points/occurredAt, Workout focus/minutes/difficulty).
  - Verifies seed script runs idempotently: creates demo users (Mona, Hubot), teams (Octocats, Robocats), activities, and workouts without deleting pre-existing records.
  - Failure: Schema missing required fields or seed does not preserve unrelated documents.

- **API command**: `npm run test:api --prefix octofit-tracker/backend`
  - Tests four capabilities: (1) Activity POST validates input and rejects malformed IDs with 4xx, lists created activities; (2) Team POST rejects missing name with 400, creates teams with members; (3) Leaderboard GET orders teams by total points with rank; (4) Workout suggestions GET matches user's goal/activity and includes reason, rejects unknown email with 4xx.
  - Failure: Service functions throw 501, return empty results, or return 500 on validation errors instead of 4xx.

- **Frontend command**: `npm test --prefix octofit-tracker/frontend`
  - Verifies React components render data, load states, empty states, error alerts, and request correct API endpoints.
  - Depends on backend API working correctly; uses mocked fetch, so passes/fails independently of backend.
  - Failure: Components don't render, don't fetch from the right endpoints, or lack accessible UI elements (headings, status roles, alerts).

- **Backend build command**: `npm run build --prefix octofit-tracker/backend`
  - Runs TypeScript type checking on all backend code.
  - Failure: Type errors in service functions, models, or routes (e.g., missing error handling types, incorrect MongoDB aggregation pipeline).

- **Frontend build command**: `npm run build --prefix octofit-tracker/frontend`
  - Builds the Vite app to a production bundle.
  - Failure: Component or dependency errors (e.g., missing imports, type mismatches in React props).

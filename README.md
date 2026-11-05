# SeatAlert BD

A small backend demo that watches train and bus ticket availability in Bangladesh and alerts users when seats open, so they can **buy the ticket themselves**. Built for the Credosis Backend Engineer Intern (CRM) Phase 02.

- **GitHub:** https://github.com/niiazmorshed/seatalert-credosis
- **Live demo:** _add Vercel URL_
- **API docs (Scalar):** _add Vercel URL_/docs

## The problem

Government ticket sites in Bangladesh are slow and unreliable. During Eid, thousands of people refresh Bangladesh Railway and bus sites at the same time. Tickets sell out in minutes, cancelled seats reappear at random times, and many people end up paying brokers.

## The solution

A bot that runs 24/7 and watches seat availability.

1. A user picks a source (Railway or Shohoz), a route, a travel date and a seat class.
2. A background checker compares current availability with the last snapshot it saved.
3. When seats open, the user gets an alert and buys the ticket on the official site.

The bot never buys tickets. It removes the middleman instead of becoming one.

## Features

**Core: seat-opening detection and alerts** (`POST /api/checker/run`)

- Checks each watched route once, no matter how many users watch it.
- Saves a `seat_snapshots` record per route on every run.
- "Opened" means the previous count was 0 (or there was no previous snapshot) and the current count is above 0. This decision lives in a small pure function, `seatsOpened()`, with unit tests.
- Creates one `notifications` record per matching active watch.
- A unique database index on `(watchId, snapshotId)` makes duplicate alerts impossible, not just unlikely.

**Supporting**

- **Users:** create a user. Duplicate email returns 409.
- **Watches:** create, list with latest seat status, and soft delete. The same active watch twice returns 409.
- **Notifications:** list a user's alerts, newest first.
- **Demo helper:** an admin endpoint that "releases" seats in the mock ticket source.
- **Reference data and health:** allowed stations and seat classes, plus API and database status.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript, route handlers under `app/api` |
| Database | MongoDB with Mongoose |
| Validation | Zod |
| API docs | OpenAPI 3 generated from the Zod schemas with `@asteasolutions/zod-to-openapi`, rendered by Scalar at `/docs` |
| Landing page | Tailwind CSS |
| Tests | Node's built-in test runner |
| Hosting | Vercel and MongoDB Atlas |

## Architecture

```mermaid
flowchart LR
    U[Client or Scalar /docs] -->|JSON over HTTP| R[Route handlers<br/>app/api/*]
    R -->|validate| Z[Zod schemas<br/>lib/schemas.ts]
    R --> DB[(MongoDB)]
    Z -->|same schemas| O[OpenAPI spec<br/>/api/openapi.json]
    O --> S[Scalar UI /docs]

    A[Admin or cron] -->|POST /api/checker/run| C[Checker<br/>lib/checker.ts]
    C -->|1. read seats| INV[(mock_inventory)]
    C -->|2. compare + save| SNAP[(seat_snapshots)]
    C -->|3. alert| N[(notifications)]
    SIM[POST /api/simulate/release] -->|set seats| INV
```

Every route handler is wrapped in one shared helper, `handle()` in `lib/api.ts`. It connects to the database, runs the handler, and turns any thrown error into the standard error response. Route handlers stay around ten lines each.

```
app/
  page.tsx                     landing page
  docs/route.ts                Scalar UI
  api/
    openapi.json/route.ts      generated OpenAPI spec
    users/route.ts             POST
    watches/route.ts           POST, GET
    watches/[id]/route.ts      DELETE
    notifications/route.ts     GET
    simulate/release/route.ts  POST (admin)
    checker/run/route.ts       POST (admin)
    stations/route.ts          GET
    health/route.ts            GET
lib/
  api.ts          response shape, error handling, admin check, body/query parsing
  db.ts           cached Mongoose connection
  schemas.ts      all Zod schemas
  openapi.ts      builds the spec from the schemas
  checker.ts      checker logic and seatsOpened()
  checker.test.ts unit tests
  constants.ts    stations, seat classes, sources
models/           User, Watch, SeatSnapshot, Notification, MockInventory
scripts/seed.ts   demo data
```

## Endpoints

| Method | Path | Auth | Description | Success | Errors |
|---|---|---|---|---|---|
| POST | `/api/users` | none | Create a user | 201 | 400, 409 |
| POST | `/api/watches` | none | Start watching a route | 201 | 400, 404, 409 |
| GET | `/api/watches?userId=` | none | User's watches with latest seat status | 200 | 400 |
| DELETE | `/api/watches/:id` | none | Stop a watch (soft delete) | 200 | 400, 404 |
| GET | `/api/notifications?userId=` | none | User's alerts, newest first | 200 | 400 |
| POST | `/api/simulate/release` | `x-admin-key` | Set seats in the mock ticket source | 200 | 400, 401 |
| POST | `/api/checker/run` | `x-admin-key` | Run the checker once | 200 | 401 |
| GET | `/api/stations` | none | Allowed stations, seat classes, sources | 200 | |
| GET | `/api/health` | none | API and database status | 200 | |

Any endpoint that needs the database returns 503 if it is unreachable, and 500 for unexpected errors.

**Response shape**

```json
{ "success": true, "data": { } }
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "path": "travelDate", "message": "Travel date cannot be in the past" }]
  }
}
```

Error codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `NOT_FOUND` (404), `CONFLICT` (409), `INTERNAL_ERROR` (500), `SERVICE_UNAVAILABLE` (503). Stack traces and secrets are only logged on the server, never returned.

**Validation rules**

- Email must be a valid format. Phone is optional, 10 to 15 digits with an optional leading `+`.
- `source`, `from`, `to` and `seatClass` must come from the allowed lists in `/api/stations`.
- `from` and `to` must be different.
- `travelDate` must be a real `YYYY-MM-DD` date, not in the past in Asia/Dhaka time, and at most 30 days ahead.
- All ids must be valid MongoDB ObjectIds.

## Data model

Field names follow the Phase 01 design, written in camelCase for JavaScript.

| Collection | Fields | Indexes |
|---|---|---|
| `users` | id, name, email, phone, telegramId, createdAt | unique `email` |
| `watches` | id, userId, source, from, to, travelDate, seatClass, active, createdAt | unique on user + route + date + class, **only while `active: true`** |
| `seat_snapshots` | id, source, from, to, travelDate, seatClass, trainOrBus, availableSeats, checkedAt | route key + `checkedAt` for "latest snapshot" lookups |
| `notifications` | id, userId, watchId, snapshotId, channel, status, message, sentAt | unique `(watchId, snapshotId)` |
| `mock_inventory` | id, source, from, to, travelDate, seatClass, trainOrBus, availableSeats | unique route key |

Two changes from the Phase 01 sketch, both needed by the checker:

- `seat_snapshots.route` is stored as its parts (`source`, `from`, `to`, `seatClass`) so snapshots can be matched to watches exactly.
- `notifications.snapshotId` was added so the database can enforce "one alert per watch per snapshot".

`mock_inventory` is new. It stands in for the real ticket site (see below).

## Why a mock ticket source

This demo does **not** scrape Bangladesh Railway or Shohoz. Scraping a government service without permission is not something I want to build on, and in Phase 01 I proposed asking for a partnership or official access instead.

So `mock_inventory` plays the role of the ticket site. The checker reads seat counts from it exactly as it would read from a real source. The admin endpoint `POST /api/simulate/release` changes those counts, which simulates new tickets being published or cancelled seats coming back. Swapping in a real source later only means changing where the checker reads `availableSeats` from.

## Run locally

Requirements: Node.js 20 or newer and a MongoDB Atlas cluster. The free M0 tier is enough. Allow your IP address under Network Access in Atlas.

```bash
npm install
cp .env.example .env      # then edit the values
npm run seed              # demo data; prints a demo userId and a route with 0 seats
npm run dev               # http://localhost:3000
npm test                  # unit tests for seatsOpened()
```

Open http://localhost:3000/docs to try every endpoint in Scalar.

## Environment variables

| Name | Required | Description |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB Atlas connection string, e.g. `mongodb+srv://USER:PASSWORD@CLUSTER_HOST/seatalert` |
| `ADMIN_KEY` | yes | Secret for the admin endpoints, sent as the `x-admin-key` header |

## Demo flow

Run `npm run seed` first. It prints a travel date 7 days from today, which is used as `<DATE>` below. In Scalar, set the `x-admin-key` value under Authentication for the admin calls.

1. **Create a user**

   ```bash
   curl -X POST localhost:3000/api/users -H 'content-type: application/json' \
     -d '{"name":"Niaz Morshed","email":"niaz@example.com"}'
   ```

   Copy `data.id` as `<USER_ID>`.

2. **Create a watch** for a route the seed left at 0 seats

   ```bash
   curl -X POST localhost:3000/api/watches -H 'content-type: application/json' \
     -d '{"userId":"<USER_ID>","source":"Railway","from":"Dhaka","to":"Chattogram","travelDate":"<DATE>","seatClass":"SNIGDHA"}'
   ```

3. **See the watch with 0 seats**

   ```bash
   curl 'localhost:3000/api/watches?userId=<USER_ID>'
   ```

   `latestStatus.availableSeats` is `0`.

4. **Simulate a seat release** on the mock ticket site

   ```bash
   curl -X POST localhost:3000/api/simulate/release -H 'content-type: application/json' \
     -H 'x-admin-key: <ADMIN_KEY>' \
     -d '{"source":"Railway","from":"Dhaka","to":"Chattogram","travelDate":"<DATE>","seatClass":"SNIGDHA","availableSeats":12}'
   ```

5. **Run the checker**

   ```bash
   curl -X POST localhost:3000/api/checker/run -H 'x-admin-key: <ADMIN_KEY>'
   ```

   Returns `{"routesChecked":1,"routesOpened":1,"notificationsCreated":1}`.

6. **See the notification**

   ```bash
   curl 'localhost:3000/api/notifications?userId=<USER_ID>'
   ```

7. **Run the checker again.** It returns `"notificationsCreated":0`, and the notifications list still has one item. Seats went from 12 to 12, so nothing "opened".

8. **Errors**
   - Validation: create a watch with `"from":"Dhaka","to":"Dhaka"` or a past date and get 400 with field details.
   - Not found: `DELETE /api/watches/665f1c2e8b3a4d001c9f1a2b` returns 404.
   - Unauthorized: call `/api/checker/run` without the header and get 401.

## Known limitations

- **Mock ticket source.** No real Railway or Shohoz data, on purpose (see above).
- **No login.** Users are created by an endpoint and identified by `userId` in each request. Anyone who knows a `userId` can read that user's watches.
- **Checker runs on request.** In this demo the admin triggers it. Two runs started at the same moment could each save a snapshot and alert twice. A scheduler that runs one checker at a time avoids this.
- **Alerts are stored, not sent.** Notifications are saved with `channel: "log"`. No email, SMS or Telegram yet.
- **Admin key is a single shared secret.** Good enough for a demo, not for production.

## Future work

- Real integration with Bangladesh Railway and Shohoz, with their permission, kept to a low request rate.
- Scheduled checker (Vercel Cron or a worker), with an error alert when the source layout changes.
- Delivery over email, SMS and Telegram, using the `telegramId` field already in `users`.
- User authentication, so users can only see their own watches and alerts.

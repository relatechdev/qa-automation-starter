# Project: the demo application

What the tests in this repository run against. In the starter that is the small application in `demo-app/`; `/new-project` replaces this file with the facts of a real project.

## Application

A list of items with a priority. It has a sign-in page, a dashboard with two totals, and an Items page with a search field, a form to add an item and a delete button per row. A JSON API under `/api` serves the pages. Everything is kept in memory and starts again from three items when the application restarts.

## Environments

| Name | URL | API | Tests may change data |
|---|---|---|---|
| `local` | http://localhost:3210 | http://localhost:3210/api | yes |

The default for a run is `local` (`TEST_ENV` in `.env`). The application starts by itself when tests run; `npm run demo` starts it by hand.

## Signing in

A form with an email and a password. One role, `user`, whose account is in `.env.example` because it is not a secret.

## API

Signed in by the session cookie the sign-in sets. `POST /api/login`, `POST /api/logout`, `GET /api/summary`, `GET /api/items?q=`, `POST /api/items`, `DELETE /api/items/:id`.

## Test data

Tests add items freely. Each name starts with `qa-auto-`, and the cleanup after a run removes those older than two hours.

## Locators

Fields have labels and buttons have names, so roles and labels find almost everything. The two totals on the dashboard carry `data-testid`.

## Cases

`cases/inventory.csv`. TC-014 is left without a test on purpose, as a first exercise.

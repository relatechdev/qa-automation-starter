# Project: {{name}}

What the tests in this repository run against. Keep it current: Claude reads it at the start of every session.

## Application

<!-- What the product does, in two or three sentences, and its main areas. -->

## Environments

| Name | URL | API | Tests may change data |
|---|---|---|---|
{{environments}}

The default for a run is `{{defaultEnvironment}}` (`TEST_ENV` in `.env`).

## Signing in

<!-- How people sign in (form, single sign-on, a second factor), and the roles the tests use. -->

Roles: {{roles}}. Each has an account per environment in `.env`.

## API

<!-- Where the API is documented (OpenAPI, Postman), and how a call is authorised. -->

## Test data

<!-- What tests may create, where it shows up for other people, and what must never be touched. -->

## Locators

<!-- The test id attribute the developers use, and who to ask for a new one. -->

## Cases

<!-- Where the manual cases come from, and who owns them. The inventory is cases/inventory.csv. -->

## People and tracker

<!-- Who answers questions about the product, and where bugs are reported. -->

## Open questions

<!-- What is still missing from docs/03-project-intake.md. Remove a line when it is answered. -->

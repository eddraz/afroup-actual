# Admin Chrome Specification

`/cuenta` is permission-gated. `/admin` is an open shell. Menu items and pages appear only with the matching module permission. English and Spanish stay in lockstep.

## Purpose

A registered person can open their account when they have `users.update`. Anyone can open `/admin`. Nobody sees a module they cannot use. Server HTML and APIs enforce those rules; client JavaScript is not the lock.

| Topic | Must be true |
| --- | --- |
| `/cuenta` | Session and `users.update` |
| Header account link | Same `users.update` rule |
| `/admin` | Open, including anonymous visitors |
| Menu and pages | Shown only with module permission |
| New registrant | Sees Users, self-scoped |
| Locales | `src/pages/en/**` matches the Spanish surfaces |

## Requirements

### Requirement: Account Page Requires Users Update

`/cuenta` and `/en/cuenta` MUST require a session and `users.update`. A session without that permission MUST NOT open the account page.

#### Scenario: Default registrant opens cuenta

- GIVEN a signed-in person with `users.update`
- WHEN they request `/cuenta` or `/en/cuenta`
- THEN the account page is shown

#### Scenario: Session without update is blocked

- GIVEN a signed-in person without `users.update`
- WHEN they request `/cuenta` or `/en/cuenta`
- THEN the account page is not shown

### Requirement: Header Account Link Follows Users Update

The public header account link MUST appear only when the actor has `users.update`. A signed-in person without that permission MUST NOT be offered the account link.

#### Scenario: Account link for a default registrant

- GIVEN a signed-in person with `users.update`
- WHEN the public header is rendered
- THEN the account link is present

#### Scenario: No account link without update

- GIVEN a signed-in person without `users.update`
- WHEN the public header is rendered
- THEN the account link is absent

### Requirement: Admin Shell Is Open

`/admin` and `/en/admin` MUST render for everyone, including anonymous visitors. The system MUST NOT redirect a visitor away from `/admin` because they lack an admin identity or an `admin` boolean.

#### Scenario: Anonymous visitor opens admin

- GIVEN a visitor with no session
- WHEN they request `/admin` or `/en/admin`
- THEN the admin shell is rendered
- AND they are not redirected to login for lacking an admin identity

#### Scenario: Default registrant is not bounced from admin

- GIVEN a signed-in person with only `users.read` and `users.update`
- WHEN they request `/admin` or `/en/admin`
- THEN the admin shell is rendered
- AND they are not redirected to login

### Requirement: Admin Menu Filtered By Module Permission

The admin menu MUST include a module item only when the actor has permission on that module. An anonymous visitor MUST see no module items they cannot use. A newly registered person MUST see Users and MUST NOT see other modules.

#### Scenario: New registrant sees only Users

- GIVEN a newly registered person with only `users.read` and `users.update`
- WHEN they open `/admin` or `/en/admin`
- THEN the admin menu includes Users
- AND the admin menu does not include modules they cannot use

#### Scenario: Anonymous menu has no privileged modules

- GIVEN a visitor with no session
- WHEN they open `/admin` or `/en/admin`
- THEN the admin menu does not include module items that require permission

#### Scenario: Elevated actor sees permitted modules

- GIVEN a signed-in person with permission on additional modules
- WHEN they open `/admin` or `/en/admin`
- THEN the admin menu includes those permitted modules
- AND it excludes modules they cannot use

### Requirement: Admin Pages And Apis Are Server Gated

Each admin page and mutating admin API MUST be server-gated with `hasPermission` for the matching module and action. Client JavaScript MUST NOT be the authorization lock. The dashboard MUST NOT leak privileged data to anonymous visitors or default registrants.

#### Scenario: Page without permission is denied on the server

- GIVEN a signed-in person without permission on a module
- WHEN they request that module's admin page without executing client JavaScript
- THEN the page is not shown as an authorized view

#### Scenario: Mutating API without permission is denied

- GIVEN a signed-in person without the matching module action
- WHEN they call that module's mutating API
- THEN the request is denied

#### Scenario: Dashboard hides privileged data

- GIVEN an anonymous visitor or a default registrant
- WHEN they open the admin dashboard
- THEN privileged data is not included in the response

### Requirement: Users Page Is Visible To Default Registrants And Self Scoped

A newly registered person MUST be able to open the Users admin page. That page MUST list only themselves unless they have parent, quota, or `users.create`.

#### Scenario: New registrant opens Users and sees self

- GIVEN a newly registered person with only `users.read` and `users.update`
- WHEN they open the Users admin page in either locale
- THEN the page is shown
- AND the list contains only their own row

### Requirement: English And Spanish Surfaces Stay In Lockstep

Every Spanish public or admin identity surface MUST have the same permission and visibility rules on the matching English route under `src/pages/en/**`.

#### Scenario: Cuenta gates match across locales

- GIVEN a person without `users.update`
- WHEN they request `/cuenta` and `/en/cuenta`
- THEN both locales refuse the account page

#### Scenario: Admin openness matches across locales

- GIVEN an anonymous visitor
- WHEN they request `/admin` and `/en/admin`
- THEN both locales render the open shell
- AND both locales hide modules the visitor cannot use

#### Scenario: Users page scope matches across locales

- GIVEN a newly registered person
- WHEN they open the Users page in Spanish and in English
- THEN both locales show only that person

# Authentication Specification

One register, one login, one session, one invite/accept path. Email and password only.

## Purpose

Registration, invite, accept-invite, login, password change, and password reset all read and write the same `users` row. The live session cookie resolves to `users.id`. There is no second admin login and no third-party identity provider.

| Topic | Must be true |
| --- | --- |
| Register | Creates one `users` row and assigns no role |
| Invite | Upserts that same row; may add role, extra grants, and `created_by` |
| Accept | Sets password, sets `verified_at`, clears `invite_pending` |
| Login | `/api/login` against `users` is the only live login |
| Session | The existing public session cookie resolves to `users.id` |
| Providers | Email + password only |

## Requirements

### Requirement: Registration Creates One Users Row Without A Role

When a person registers, the system MUST create one `users` row for that email and MUST NOT assign a role.

#### Scenario: Register writes the shared table

- GIVEN an unused email
- WHEN that person registers with email and password
- THEN one `users` row exists for that email
- AND that row has no role

### Requirement: Single Live Login Against Users

The system MUST authenticate sign-in against `users` through `/api/login`. `/api/login` MUST be the only live login. Before creating a session the system MUST refuse login when the account is unverified, invite-pending, or inactive.

#### Scenario: Verified active user signs in

- GIVEN a `users` row with a verified email, no pending invite, and an active account
- WHEN they submit a valid email and password to `/api/login`
- THEN the system creates a session for that `users.id`

#### Scenario: Unverified user cannot establish a session

- GIVEN a `users` row whose email is not verified
- WHEN they submit valid credentials to `/api/login`
- THEN the system MUST NOT create a session

#### Scenario: Pending invite cannot use password login until accepted

- GIVEN a `users` row with a pending invite
- WHEN they submit credentials to `/api/login` without accepting the invite
- THEN the system MUST NOT create a session

#### Scenario: Inactive user cannot sign in

- GIVEN a `users` row that is not active
- WHEN they submit valid credentials to `/api/login`
- THEN the system MUST NOT create a session

#### Scenario: Unused admin login is not a second live login

- GIVEN a client calls `/api/admin/login`
- WHEN the change is applied
- THEN that endpoint MUST NOT authenticate a separate admin identity
- AND `/api/login` remains the only live login

### Requirement: Invite Upserts The Same Users Row

When an authorized actor invites an email, the system MUST upsert the same `users` row used by registration. An invite MAY attach a role, extra grants, and `created_by`.

#### Scenario: Invite existing registrant

- GIVEN a registered person with only default grants
- WHEN an authorized actor invites that email with a role or extra grants
- THEN no second `users` row is created
- AND the existing row receives the invited role, extra grants, and `created_by` when those values are supplied

#### Scenario: Invite unknown email

- GIVEN an email with no `users` row
- WHEN an authorized actor invites that email
- THEN one `users` row is created for that email
- AND that row MAY carry a role, extra grants, and `created_by`

### Requirement: Accept Invite Proves Email And Sets Password

When a person accepts an invite, the system MUST set their password, MUST set `verified_at`, and MUST clear `invite_pending`.

#### Scenario: Accept makes the person login-ready

- GIVEN a `users` row with a pending invite
- WHEN they accept the invite with a password
- THEN `invite_pending` is cleared
- AND `verified_at` is set
- AND they can sign in through `/api/login` with that password

### Requirement: Password Change And Reset Update The Login Hash

Password change and password reset MUST update the same `users` password hash that `/api/login` authenticates.

#### Scenario: Password change updates the login hash

- GIVEN a signed-in person
- WHEN they change their password
- THEN `/api/login` accepts the new password
- AND the previous password no longer authenticates

#### Scenario: Password reset updates the login hash

- GIVEN a person with a valid reset token
- WHEN they reset their password
- THEN `/api/login` accepts the new password

### Requirement: One Session Resolves To Users

The system MUST resolve the existing public session cookie to `users.id`. The system MUST NOT require a second session cookie for admin surfaces. The live cookie name MAY stay `afroup_session`.

#### Scenario: Same cookie works on public and admin surfaces

- GIVEN a person with a valid session
- WHEN they request a public account surface and an admin surface
- THEN both surfaces resolve the same `users.id` from the same cookie

### Requirement: Current Actor Is The Session User

The system MUST treat the signed-in `users` row as the current actor. The system MUST NOT look up a second identity by email to decide who the actor is.

#### Scenario: Session id is the actor id

- GIVEN a valid session for `users.id` X
- WHEN any gated surface asks who the actor is
- THEN the actor is user X
- AND no second identity is loaded by matching email

### Requirement: Me Payload Returns Effective Actions

`/api/me` MUST return the current user and that user's effective module actions. `/api/me` MUST NOT use an `admin` boolean that means “has a separate admin row” as the authorization signal.

#### Scenario: Default registrant me payload

- GIVEN a newly registered person with only `users.read` and `users.update`
- WHEN they request `/api/me`
- THEN the response identifies that user
- AND the effective actions include `users.read` and `users.update`
- AND the response does not use a boolean `admin` flag as the authorization signal

### Requirement: Email And Password Only

The system MUST authenticate people with email and password only. The system MUST NOT add OAuth, Passkeys, magic-link-only authentication, or a third-party identity provider.

#### Scenario: No third-party sign-in

- GIVEN the change is applied
- WHEN a person signs in
- THEN the only supported credentials are email and password

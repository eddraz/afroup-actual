# Identity Specification

One person is one `users` row. After this change, public and admin identity no longer exist as two people joined by email.

## Purpose

Collapse `afroup_users` and `admin_users` into a single `users` table. Preserve public ids so live sessions still resolve. Remap every former admin foreign key onto `users.id`. Deleting an account removes that one person and their owned records.

| Topic | Must be true |
| --- | --- |
| Table | Exactly one people table, named `users` |
| Email | At most one row per email |
| Public ids | Former public-account ids stay as `users.id` |
| Admin ids | Grants, invites, parent grants, and `created_by` remap through `admin_id → users.id` |
| Delete | One row gone; no orphan identity |

## Requirements

### Requirement: Single Users Table

The system MUST persist every person in exactly one table named `users`. After the change the system MUST NOT persist people in `afroup_users` or `admin_users`.

#### Scenario: Dual tables are gone

- GIVEN the change has been applied
- WHEN the identity schema is inspected
- THEN a `users` table exists
- AND `afroup_users` does not exist
- AND `admin_users` does not exist

### Requirement: One Person Per Email

The system MUST represent each email as at most one `users` row. Roles and permission grants MUST hang off that `users.id`.

#### Scenario: Matching public and admin emails become one row

- GIVEN an email that existed in both former public and admin identities
- WHEN the identity merge completes
- THEN exactly one `users` row exists for that email
- AND that row is the only identity for that person's name, password, role, activity, and invite state

#### Scenario: Roles and grants use the merged id

- GIVEN a merged person who had a role or grants on the former admin identity
- WHEN those records are read after the merge
- THEN every role and grant reference uses that person's `users.id`
- AND none of those records still point at a former admin identity id

### Requirement: Users Row Holds Both Identities' Fields

Each `users` row MUST be able to hold the union of the former public and admin identity fields for that person: name, email, password, verification time, bio, avatar, role, active flag, invite-pending flag, and created-by.

#### Scenario: A merged person keeps both public and admin fields

- GIVEN a person who had a public profile and an admin role
- WHEN that `users` row is read after the merge
- THEN the public profile fields and the admin role, active flag, invite-pending flag, and created-by value are all on that same row

### Requirement: Public Id Preservation

The system MUST preserve every former public-account id as the `users.id` for that person.

#### Scenario: Existing public session still resolves

- GIVEN a live session that referenced a former public-account id
- WHEN the identity merge completes
- THEN that session still resolves to the same person
- AND that person's `users.id` equals the former public-account id

### Requirement: Admin Foreign Key Remap

The system MUST remap every former admin-user foreign key and `created_by` value through an `admin_id → users.id` mapping. The system MUST NOT leave grants, invitations, parent grants, or `created_by` pointing at an unmapped former admin id.

#### Scenario: Admin-owned records follow the merged person

- GIVEN a grant, invitation, parent grant, or `created_by` value that referenced a former admin id
- WHEN the identity merge completes
- THEN that reference points at the matching `users.id`

#### Scenario: Invite-only admin becomes a new users row

- GIVEN a former admin identity whose email had no public account
- WHEN the identity merge completes
- THEN a new `users` row exists for that email
- AND former admin foreign keys for that person point at that new `users.id`

### Requirement: Single Password Hash After Merge

The system MUST keep a single password hash per `users` row. When both a former public hash and a former admin hash exist for the same email, the system MUST keep the former public hash. When only an invite-only admin hash exists, the system MUST keep that hash.

#### Scenario: Dual-hash email keeps the public password

- GIVEN a person who had both a public password and an admin password
- WHEN they authenticate with the former public password after the merge
- THEN authentication succeeds
- AND the discarded admin password is not the surviving hash

#### Scenario: Invite-only person keeps the admin password

- GIVEN an invite-only person who had only an admin password
- WHEN that person later authenticates or accepts the invite against the surviving hash
- THEN the system uses the former admin password hash

### Requirement: Account Delete Removes The Whole Person

When a person deletes their account, the system MUST remove that single `users` row and MUST remove that person's grants, sessions, bios, and invitations. The system MUST NOT leave an orphan identity row for that email.

#### Scenario: Delete cascades the single person

- GIVEN a signed-in person who has grants, a session, a bio, and an invitation record
- WHEN they delete their account
- THEN no `users` row remains for that email
- AND no grants, sessions, bios, or invitations remain owned by that former `users.id`

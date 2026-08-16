# Authorization Specification

Default grants make a registered person able to read and update themselves. Module permission is the first gate. List scope stays self unless parent, quota, or `users.create`.

## Purpose

Rename the people module to `users`. Seed `users.read` and `users.update` for every existing person and for every new registrant. `hasPermission` becomes the real gate. Default `users.update` MUST NOT let a person mutate other people.

| Topic | Must be true |
| --- | --- |
| Module slug | `usuarios` becomes `users` |
| Register grants | Only `users.read` + `users.update` |
| Existing people | Seeded with those same two grants |
| Gate | `hasPermission(module, action)` before list or mutate |
| List | Self unless parent / quota / `users.create` |
| Manage others | Default `users.update` is not enough |

## Requirements

### Requirement: Users Module Slug

The permission catalog MUST use the module slug `users` in place of `usuarios`. Default grants, menu checks, page gates, and APIs MUST use `users.read`, `users.update`, `users.create`, and `users.delete` against that slug.

#### Scenario: Former usuarios permission is users

- GIVEN the change is applied
- WHEN the catalog is read
- THEN the people module slug is `users`
- AND no live grant or gate still keys off `usuarios`

### Requirement: Registration Grants Only Users Read And Update

When a person registers, the system MUST grant only `users.read` and `users.update` on that `users` row. Registration MUST NOT grant `users.create`, `users.delete`, parent, quota, translate flags, or any other module permission.

#### Scenario: New registrant has only the two default grants

- GIVEN an unused email
- WHEN that person registers
- THEN they have `users.read`
- AND they have `users.update`
- AND they have no other module permission

### Requirement: Existing People Receive Default Grants

The system MUST seed `users.read` and `users.update` for every existing person after the identity merge.

#### Scenario: Former public account can self-update

- GIVEN a former public account that had no admin grants
- WHEN the change is applied
- THEN that person has `users.read` and `users.update`

#### Scenario: Former admin keeps extra grants plus defaults

- GIVEN a former admin who already had extra module grants
- WHEN the change is applied
- THEN that person still has those extra grants
- AND they also have `users.read` and `users.update` if they did not already

### Requirement: Permission Check Is The First Gate

Every gated admin page, mutating admin API, users-list helper, and user-management action MUST require `hasPermission` for the matching module and action before applying self, created-by, parent, or quota scope. The system MUST NOT treat “has a session” or “used to have an admin row” as sufficient authorization.

#### Scenario: Session without module permission is denied

- GIVEN a signed-in person without permission on a module
- WHEN they request that module's page or mutating API
- THEN the request is denied

#### Scenario: List helpers check module permission first

- GIVEN a signed-in person without `users.read`
- WHEN a users-list helper runs
- THEN the helper MUST NOT return other people
- AND the helper MUST NOT treat missing permission as an empty-but-allowed directory

### Requirement: Users List Is Self Unless Elevated

A person with only default `users.read` MUST see only themselves in the Users list. The system MUST expand that list only when the actor has parent, quota, or `users.create`.

#### Scenario: Default registrant sees only self

- GIVEN a newly registered person with only `users.read` and `users.update`
- WHEN they open the Users list
- THEN the list contains only their own row

#### Scenario: Parent, quota, or create expands the list

- GIVEN an actor with parent, quota, or `users.create`
- WHEN they open the Users list
- THEN the list MAY include people in that actor's existing self / created-by / parent / quota scope

### Requirement: Default Update Cannot Mutate Other People

`users.update` MUST allow a person to update themselves. The system MUST NOT allow a person who has only default `users.update` to update or delete another person. After the module-permission check, user-management MUST still apply self / child scope.

#### Scenario: Self update is allowed

- GIVEN a person with `users.update`
- WHEN they update their own account
- THEN the update succeeds

#### Scenario: Default update cannot change another person

- GIVEN person A with only default `users.read` and `users.update`
- AND person B is a different `users` row
- WHEN A attempts to update or delete B
- THEN the attempt is denied

### Requirement: Grants And Scope Use Users Id

Effective grants, permission checks, list scope, and user-management MUST key off `users.id`. They MUST NOT join a second identity by email.

#### Scenario: Permission lookup uses the session user id

- GIVEN a session for `users.id` X
- WHEN `hasPermission` or an effective-grant lookup runs
- THEN the lookup uses X
- AND it does not resolve a second id by email

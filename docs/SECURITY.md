# Security Notes

- Use strong JWT secrets in production.
- Store passwords using `bcrypt` or `argon2`.
- Rotate refresh tokens.
- Store only hashed refresh tokens.
- Enforce tenant data isolation in every business service.
- Add rate limiting before public launch.
- Add audit logs for sensitive actions.
- Never store secrets in Git.
- Seed the first Super Admin from environment variables only.

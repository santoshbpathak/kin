# Security Policy

KIN handles information about people's families, income and insurance cover.
We take reports seriously and we would rather hear about a problem from you
than from an attacker.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security problems.**

Use GitHub's private vulnerability reporting on this repository
("Security" tab → "Report a vulnerability"). If that is not available to
you, open an issue that says only "security report, please contact me" and
a maintainer will reach out privately.

Please include:

- the affected component (API route, web module, script),
- steps to reproduce or a proof of concept,
- the impact you believe it has,
- whether you have already shared it anywhere else.

We aim to acknowledge reports within 5 working days and to agree a
disclosure timeline with you before any public write-up. Coordinated
disclosure is appreciated; we will credit you if you wish.

## Scope

In scope: everything in this repository — the NestJS API under `apps/api`,
the React PWA under `apps/web`, the financial calculation engines, helper
scripts and documentation that could lead someone into an insecure
deployment.

Out of scope: third-party services KIN integrates with (Supabase, Vercel,
OpenAI, Meta WhatsApp). Report those to the respective vendor. Denial of
service by volume alone, and findings that require a compromised developer
machine, are also out of scope.

## Supported versions

Only the `main` branch is supported. There are no tagged releases yet.

## What we already know

The current security posture, open risks and the design decisions behind
them are documented in [`docs/security/`](docs/security/)
and the files under [`docs/security/`](docs/security/). Please read the
"Unresolved risks" section before reporting a known limitation.

## Safe harbour

Good-faith research that respects user privacy, does not touch production
data belonging to others, and does not degrade the service will not be the
subject of legal action by the maintainers.

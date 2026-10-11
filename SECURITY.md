# Security policy

## Report a vulnerability

Email <developers@usequeek.com> with what you found, how to reproduce it, and
the impact you see. Please do not open a public issue, discussion or pull
request for a vulnerability, so that it can be fixed before it is disclosed.

This policy covers the code in this repository and the Queek APIs it calls. If
you find a Queek API key in this repository, report it the same way and do not
use it.

## Keys in examples

Examples in this repository read keys from environment variables and ship none.
Use a dev store key (`sk_test_`) while you build, keep secret keys on the server,
and never commit a `.env` file.

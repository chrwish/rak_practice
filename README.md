# Node.js 2FA Example

- Install: `npm install`
- Run dev: `npm run dev`

Endpoints:
- POST /register { email, password }
- POST /login { email, password } -> if 2FA enabled returns { status: OK_2FA_REQUIRED, tempToken }, else { status: OK_AUTHENTICATED, accessToken }
- POST /2fa/verify?tempToken=... { code } -> returns { accessToken }
- POST /2fa/start (Authorization: Bearer accessToken)
- POST /2fa/confirm { code } (Authorization: Bearer accessToken)
- POST /2fa/disable (Authorization: Bearer accessToken)
- GET /me (Authorization: Bearer accessToken)

Create `.env` from `.env.example`.
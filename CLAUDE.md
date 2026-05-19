# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server with hot reload
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the built `dist/` for local verification

There is no test runner or linter configured. Node `^20.19.0 || >=22.12.0` is required.

## Architecture

Vue 3 + Vite single-page app using Element Plus as the global UI library (registered in `src/main.js`). The path alias `@/*` resolves to `src/*` (configured in both `vite.config.js` and `jsconfig.json` — keep them in sync).

### API layer (`src/api/`)

The API layer is the only non-trivial piece of architecture. Layout:

- `config.js` — `API_BASE_URL` (overridable via `VITE_API_BASE_URL`, defaults to `/api`), `API_TIMEOUT`, and `SUCCESS_CODES`.
- `request.js` — the shared axios instance. **Read this before adding new endpoints**, because the response interceptor changes how callers consume responses.
- `token.js` — `access_token` in `localStorage`, attached as `Authorization: Bearer <token>` on every request.
- `modules/*.js` — one file per domain (e.g. `user.js`). Each exports a plain object of methods that call `request.<verb>(...)`.
- `index.js` — barrel re-exporting `request`, the token helpers, and every module API. Import from `@/api`, not from internal paths.

When adding an endpoint group, create `src/api/modules/<domain>.js` and add a re-export line to `src/api/index.js`.

### Response interceptor contract (important)

`request.js` does two unusual things that callers must understand:

1. **Business-code unwrapping.** The response interceptor returns `response.data` (not the axios response). If `data.code` exists and is not in `SUCCESS_CODES` (`[0, 200, '0', '200']`), the request is *rejected* with an `Error` carrying `.response` and `.data`, even though the HTTP status was 2xx. So `await userApi.getProfile()` resolves to the unwrapped payload, never to an axios response object.

2. **Auto error toast via Element Plus.** Both rejection paths call `ElMessage.error(...)` by default. To suppress the toast on a specific call (e.g. login, where the caller wants to render the error inline), pass `{ showErrorMessage: false }` as the axios config — see `userApi.login` in `modules/user.js` for the canonical example. HTTP error messages fall back to a Chinese status-code map in `getErrorMessage`.

A `401` response automatically clears the token via `removeToken()`; the interceptor does not redirect, so any router-level redirect must be wired up by the caller.

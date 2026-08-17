# Frontend Integration Guide

This document is for frontend developers connecting to Pulse Chat API. It covers authentication, REST usage, and every WebSocket event.

**Base URL (default):** `http://localhost:3000`

---

## Table of Contents

1. [Authentication](#authentication)
2. [REST API](#rest-api)
3. [WebSocket Connection](#websocket-connection)
4. [Client → Server Events](#client--server-events)
5. [Server → Client Events](#server--client-events)
6. [Recommended Flows](#recommended-flows)
7. [Types Reference](#types-reference)
8. [Errors & Edge Cases](#errors--edge-cases)

---

## Authentication

Auth uses **HTTP-only cookies**. You do not store tokens in `localStorage`.

### Setup fetch / axios

Always send credentials:

```ts
// fetch
fetch('http://localhost:3000/auth/me', { credentials: 'include' });

// axios
axios.defaults.withCredentials = true;
```

### Signup

```http
POST /auth/signup
Content-Type: application/json

{
  "name": "Ali",
  "email": "ali@example.com",
  "password": "password123"
}
```

**Response:** `200` + sets `access-token` and `refresh-token` cookies.

```json
{ "message": "کاربر با موفقیت ثبت نام کرد" }
```

### Signin

```http
POST /auth/signin
Content-Type: application/json

{
  "email": "ali@example.com",
  "password": "password123"
}
```

**Response:** same cookie behavior as signup.

### Current user

```http
GET /auth/me
```

**Response:**

```json
{
  "id": "uuid",
  "email": "ali@example.com",
  "name": "Ali"
}
```

Requires valid `access-token` cookie. Returns `401` if missing or expired.

### Refresh token

```http
POST /auth/refresh-token
```

Requires valid `refresh-token` cookie. Issues new access + refresh cookies.

### Logout

```http
POST /auth/logout
```

Clears both auth cookies.

```json
{ "message": "با موفقیت خارج شدید" }
```

### Token refresh strategy (recommended)

When any request returns `401`:

1. Call `POST /auth/refresh-token`
2. Retry the original request
3. If refresh fails → redirect to login

---

## REST API

All `/room/*` routes require a valid `access-token` cookie.

### List rooms

```http
GET /room
```

**Response:** array of rooms

```json
[
  { "id": "uuid", "name": "General" },
  { "id": "uuid", "name": "Random" }
]
```

### Create room

```http
POST /room
Content-Type: application/json

{ "name": "My Room" }
```

**Response:**

```json
{ "id": "uuid", "name": "My Room" }
```

Creator becomes **owner** and **member**. A `room_created` WebSocket event is broadcast to all connected clients.

### Delete room

```http
DELETE /room/:id
```

Owner only. **Response:**

```json
{ "id": "uuid", "name": "My Room" }
```

Broadcasts `room_deleted` to all clients.

### Message history

```http
GET /room/:id/messages
```

Members only. **Response:** array (newest first)

```json
[
  {
    "id": "uuid",
    "text": "Hello!",
    "user": { "id": "uuid", "name": "Ali" },
    "createdAt": "2026-08-17T12:00:00.000Z"
  }
]
```

---

## WebSocket Connection

Socket.IO on the same origin as the API.

```ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  withCredentials: true,
});
```

### Important

- Cookies are sent automatically with `withCredentials: true`
- Auth is validated on each WebSocket **message** (not necessarily on initial connect)
- After connecting, send any authenticated event (e.g. `joined_room`) to establish `client.data.user`
- CORS in development allows `http://localhost:3000` — align your frontend origin or update server CORS config

---

## Client → Server Events

Emit these with `socket.emit(event, payload)`.

### `joined_room`

Enter a room (socket room + DB membership if not already a member).

```ts
socket.emit('joined_room', { roomId: 'uuid' });
```

**Side effects:**

- Joins the Socket.IO room
- Sets your status to `online` in Redis
- You receive `room_statuses` (current statuses in the room)
- Others in the room receive `joined_room`
- Others receive `user_status` with `online`

### `left_room`

Leave a room.

```ts
socket.emit('left_room', { roomId: 'uuid' });
```

**Side effects:**

- Leaves the Socket.IO room
- Removes DB membership (owner **cannot** leave — server returns error)
- Sets status to `offline`
- Others receive `left_room` and `user_status` with `offline`

### `typing`

User started typing.

```ts
socket.emit('typing', { roomId: 'uuid' });
```

Others in the room receive `user_status` with `typing` (not sent back to you).

### `stop_typing`

User stopped typing.

```ts
socket.emit('stop_typing', { roomId: 'uuid' });
```

Others receive `user_status` with `online`.

### `send_message`

Send a chat message.

```ts
socket.emit('send_message', {
  roomId: 'uuid',
  message: 'Hello everyone!',
});
```

**Requirements:** user must be a **member** of the room.

**Side effects:**

- Message saved to DB
- Everyone in the room receives `message`
- Others receive `user_status` with `online` (typing cleared)

---

## Server → Client Events

Listen with `socket.on(event, handler)`.

### `room_created`

New room was created (global — all connected clients).

```ts
socket.on('room_created', (data) => {
  // data: { id: string, name: string }
});
```

### `room_deleted`

Room was deleted (global).

```ts
socket.on('room_deleted', (data) => {
  // data: { id: string, name: string }
});
```

### `joined_room`

Someone joined the room (you are excluded from this when you join).

```ts
socket.on('joined_room', (data) => {
  // data: { roomId: string, user: JwtPayload }
});
```

### `left_room`

Someone left the room (you are excluded when you leave).

```ts
socket.on('left_room', (data) => {
  // data: { roomId: string, user: JwtPayload }
});
```

### `room_statuses`

Sent **only to you** when you call `joined_room`. Snapshot of who's in the room and their status.

```ts
socket.on('room_statuses', (data) => {
  // data: {
  //   roomId: string,
  //   statuses: Record<string, 'online' | 'typing'>  // userId → status
  // }
});
```

Note: `offline` users are not included in the map.

### `user_status`

A member's presence changed.

```ts
socket.on('user_status', (data) => {
  // data: {
  //   roomId: string,
  //   user: { id: string, name: string, email: string },
  //   status: 'online' | 'offline' | 'typing'
  // }
});
```

Triggered on join, leave, disconnect, typing, stop typing, and after someone sends a message.

### `message`

New chat message in a room.

```ts
socket.on('message', (data) => {
  // data: {
  //   id: string,
  //   text: string,
  //   user: { id: string, name: string },
  //   createdAt: string  // ISO date
  // }
});
```

---

## Recommended Flows

### App bootstrap (logged-in check)

```
1. GET /auth/me
   → 200: user is logged in, store user in state
   → 401: try POST /auth/refresh-token
     → success: retry GET /auth/me
     → fail: show login page
```

### Room list page

```
1. GET /room                          → render room list
2. socket.on('room_created')          → add room to list
3. socket.on('room_deleted')          → remove room from list
4. Connect socket with withCredentials
```

### Enter a chat room

```
1. GET /room/:id/messages             → load history
2. socket.emit('joined_room', { roomId })
3. socket.on('room_statuses')         → build presence UI
4. socket.on('message')               → append live messages
5. socket.on('user_status')           → update member badges
6. socket.on('joined_room')           → "X joined" notification
7. socket.on('left_room')               → "X left" notification
```

### Typing indicator

```
On input change (debounced):
  if has text → socket.emit('typing', { roomId })
  if empty    → socket.emit('stop_typing', { roomId })

On send:
  socket.emit('send_message', { roomId, message })
  // server also sets you back to 'online'
```

### Leave room (navigate away)

```
1. socket.emit('left_room', { roomId })
2. Remove room-specific listeners or navigate
```

### Logout

```
1. POST /auth/logout
2. socket.disconnect()
3. Clear client state → redirect to login
```

---

## Types Reference

```ts
interface JwtPayload {
  id: string;
  email: string;
  name: string;
}

type UserRoomStatus = 'online' | 'offline' | 'typing';

interface Room {
  id: string;
  name: string;
}

interface Message {
  id: string;
  text: string;
  user: { id: string; name: string };
  createdAt: string;
}
```

---

## Errors & Edge Cases

| Situation | Behavior |
|-----------|----------|
| Expired access token | REST returns `401` — refresh or re-login |
| Invalid WebSocket auth | Event rejected with `UnauthorizedException` |
| Non-member sends message | `404` — room not found / not a member |
| Non-member reads messages | `404` |
| Owner calls `left_room` | `409 Conflict` — owner cannot leave |
| User disconnects | Status set to `offline` for all joined socket rooms |
| Delete room | All clients get `room_deleted`; messages and memberships are removed (DB cascade) |
| Validation errors | `400` with Persian error messages |

### CORS

Development CORS targets `http://localhost:3000`. If your dev server uses another port (e.g. Vite `5173`), ask the backend team to update CORS in:

- `src/main.ts` (REST)
- `src/modules/room/room.gateway.ts` (WebSocket)
- `src/modules/chat/chat.gateway.ts` (WebSocket)

### Displaying messages

`GET /room/:id/messages` returns **newest first**. Reverse for chat UI if you want oldest at the top.

---

## Quick Event Cheat Sheet

| Direction | Event | Payload |
|-----------|-------|---------|
| emit | `joined_room` | `{ roomId }` |
| emit | `left_room` | `{ roomId }` |
| emit | `typing` | `{ roomId }` |
| emit | `stop_typing` | `{ roomId }` |
| emit | `send_message` | `{ roomId, message }` |
| on | `room_created` | `{ id, name }` |
| on | `room_deleted` | `{ id, name }` |
| on | `joined_room` | `{ roomId, user }` |
| on | `left_room` | `{ roomId, user }` |
| on | `room_statuses` | `{ roomId, statuses }` |
| on | `user_status` | `{ roomId, user, status }` |
| on | `message` | `{ id, text, user, createdAt }` |

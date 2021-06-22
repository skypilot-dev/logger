# @skypilot/logger

A utility for flexibly tracking & displaying events

---

[![npm stable](https://img.shields.io/npm/v/@skypilot/logger?label=stable)](https://www.npmjs.com/package/@skypilot/logger)
![stable build](https://img.shields.io/github/workflow/status/skypilot-dev/logger/Stable%20release?label=stable%20build)
[![npm next](https://img.shields.io/npm/v/@skypilot/logger/next?label=next)](https://www.npmjs.com/package/@skypilot/logger)
![next build](https://img.shields.io/github/workflow/status/skypilot-dev/logger/Prerelease?branch=next&label=next%20build)
![downloads](https://img.shields.io/npm/dm/@skypilot/logger)
[![license: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## How to install

```console
yarn add @skypilot/logger
```

## How to use

Add events:

```typescript
const log = new EventLog()
log.debug('A debug event')
log.info('An info event')
log.warn('Something you should know')
log.error('Uh-oh')
```

List event messages:

```typescript
log.getMessages()
```

```text
Debug: A debug event
Info: An info event
Warn: Something you should know
Error: Uh-oh
```

List one level of messages:

```typescript
log.getMessages('error')
```

```text
Error: Uh-oh
```

Or access the messages directly:

```typescript
console.log(log.messages.error)
```
```text
Uh-oh
```

Check for errors:

```typescript
console.log(log.hasErrors)
```

```text
true
```

Add data to every event:

```typescript
const log = new EventLog({ initialData: { key: 'Always added' } })
log.info('Event with data', { newKey: 'Added for one event' })
log.getEvents()
```

```json
[
  {
    "level": "info",
    "message": "Event with data",
    "data": { "key": "Always added", "newKey":  "Added for one event" }
  }
]
```

---

More to be added

# Repo Agent Instructions

This repository contains a sample Teams AI Library bot located in the `codex-agent` folder.
The following guidelines help future contributors add new features to the bot.

## Development tips
- All bot code lives in `codex-agent/src/index.ts`. Extend this file to add new functions or modify conversation logic.
- When installing new npm packages, update `codex-agent/package.json` and run `npm install` from the `codex-agent` directory.
- Use `npm run dev` in `codex-agent` to run the bot with live reload during development.
- Use `npm run build` to compile TypeScript into the `dist` folder. Commit built files only if needed for deployment.
- To test locally, run `npm start` after building.

## Implementing features
- Use the `ChatPrompt` class to manage interactions. Add functions via `prompt.function(name, description, schema, handler)` as shown in `src/index.ts`.
- Store conversation state with `LocalMemory` and persistent data with `LocalStorage`.
- Build Adaptive Cards with the `AdaptiveCard` helper when you need to show rich content.
- Keep messages concise and focus on the user's request.

These instructions are provided to help Codex agents and developers extend the pizza-ordering example or build new Teams AI bots.

## Teams AI Library quick reference

The following notes summarize key concepts from the official Teams AI Library documentation:

- **Quickstart**
  - Requires Node.js 20 or higher.
  - Install the Teams CLI: `npm install -g @microsoft/teams.cli@preview`.
  - Create a new agent template: `teams new typescript <agent-name> --template echo`.
  - Run `npm install` then `npm run dev` inside the new folder to start a development server with DevTools at `http://localhost:3979/devtools`.
- **Code basics**
  - Project structure includes an `appPackage/` folder for the Teams manifest and a `src/` folder with `index.ts` as the entry point.
  - Your agent is driven by the `App` class which hosts plugins like `DevtoolsPlugin`.
  - Register handlers using `app.on('message', handler)` or `app.event('error', handler)`.
  - Plugins can hook into server and activity lifecycles.
- **Running in Teams**
  - Use `npx @microsoft/teams.cli config add atk.basic` to add Microsoft 365 Agents Toolkit configuration.
  - Install the Agents Toolkit IDE extension, sign in, and run Debug to sideload your app in Teams.
- **API Client**
  - Access Teams APIs through `app.api`. Example: `api.conversations.members(activity.conversation.id).get()` fetches conversation members.
  - For proactive scenarios you can call `app.api.graph.chats.getAllMessages.get()` from outside handlers.
- **Graph Client**
  - Use `app.graph` (app token) or the `userGraph` parameter (user token) inside handlers to call Microsoft Graph APIs.
  - Example: `const me = await userGraph.me.get();` retrieves the signed-in user's profile.

Refer to the [Teams AI Library docs](https://microsoft.github.io/teams-ai/typescript/getting-started/) for more details and advanced guides.
### Adaptive Cards and actions
- Build cards using helpers from `@microsoft/teams.cards`.
- Attach cards with `cardAttachment('adaptive', card)` when sending messages.
- Handle user actions with `app.on('card.action', handler)`.
- `Action.Execute` sends data back to your bot for server-side processing.
- See `codex-agent/src/index.ts` for a basic example.

### Message extensions quick guide
- Define commands in the `composeExtensions` section of your manifest.
- **Action commands** trigger dialogs: handle with `app.on('message.ext.open', handler)`.
- **Search commands**: implement `app.on('message.ext.query', handler)` and return a list of adaptive card attachments.
- **Link unfurling**: handle pasted URLs via `app.on('message.ext.query-link', handler)` and return preview cards.
- **Settings**: respond to `message.ext.query-settings-url` with the settings page URL and process `message.ext.setting` to save options.
- Use `createCard()` style helpers to generate cards for these replies.


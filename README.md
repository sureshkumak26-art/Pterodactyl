# Pterodactyl Discord Bot

Discord.js v14 administration bot for Pterodactyl Panel using the Application API.

## Features

- `/createuser`
- `/deleteuser`
- `/user`
- `/users`
- `/create-server`
- `/delete-server`
- `/server`
- `/servers`
- `/suspend`
- `/unsuspend`
- `/nodes`
- `/locations`
- `/nests`
- `/eggs`
- `/allocations`

## Setup

Requires Node.js 18.17+.

```bash
npm install
cp .env.example .env
nano .env
npm start
```

Set `PTERO_URL` to your panel URL and `PTERO_API_KEY` to a Pterodactyl Application API key. Keep `.env` private; it is ignored by Git.

The bot registers commands to the guild specified by `GUILD_ID`.

## Permissions

Commands are limited to Discord members with Administrator permission or the role configured in `ADMIN_ROLE_ID`.

## Notes

Server creation uses the selected egg's Docker image and startup command. Eggs can require environment variables, so for eggs with mandatory variables you may need to extend the create-server command to collect those values.

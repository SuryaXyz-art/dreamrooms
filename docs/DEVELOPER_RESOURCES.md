# DreamDEX developer resources

These are the official public resources used to review and build against DreamDEX Event Contracts. Links were checked on 2026-09-11. The documentation host returned a server error to an automated HEAD request, so this project does not infer undocumented API behavior from that response.

## Start here

| Resource                                                                                          | Use it for                                                                |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [Event Contract documentation](https://docs.dreamdex.io/developers/event-contracts)               | Protocol lifecycle, market structure, order flow and settlement reference |
| [Event Contract starter template](https://github.com/IronicDeGawd/ec-dreamdex-hackathon-template) | Minimal TypeScript and Solidity lifecycle examples for the hackathon      |
| [`@somnia-chain/markets-sdk`](https://www.npmjs.com/package/@somnia-chain/markets-sdk)            | Typed client integration used by DreamRooms                               |

## Automation resources

| Resource                                                             | Use it for                                                                             |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [DreamDEX Bot Kit](https://github.com/somnia-chain/dreamdex-bot-kit) | Official bot clients, example strategies, dry-run operations and bot-specific guidance |
| [DreamDEX Bot Builder](https://dreambot-builder.vercel.app/)         | Guided bot configuration and generation                                                |

DreamRooms is a user-facing social application. Its browser flow keeps wallet approvals and order signatures manual. The Bot Kit and Bot Builder are documented as developer resources; they are not silently introduced as an automated trading service in this application.

## Network safety

- Use Somnia Shannon testnet for development: chain ID `50312`.
- Keep testnet-only credentials and endpoints in local environment configuration.
- Never place a private key in the browser bundle or a `NEXT_PUBLIC_*` variable.
- Do not use a bot or generated workflow with funds until its code, network and dry-run behavior have been reviewed.

## DreamRooms integration boundary

DreamRooms currently uses the official SDK for dynamic BTC/ETH discovery, on-chain status verification, order-book reads and typed wallet transaction preparation. The public app does not claim a successful order or settlement without a mined receipt and authoritative position readback.

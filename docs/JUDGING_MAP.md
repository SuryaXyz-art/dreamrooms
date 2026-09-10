# Judging map

This map is honest to the current repository state. “Implemented but unverified” items require external Supabase reachability, a wallet signature, deployment or public evidence.

| Criterion                    | Evidence                                                                                                                                     | Status                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Product usefulness           | Mobile-first room and market shell; live structured market context; explicit risk language                                                   | Implemented locally; public journey pending            |
| Technical implementation     | Typed Next.js architecture, official SDK adapter, Shannon chain guard, raw tick/lot-safe order preparation and receipt/position verification | Local checks pass; real write/remote DB unverified     |
| DreamDEX/Somnia integration  | `src/lib/dreamdex`, SDK `0.29.0`, chain ID `50312`, dynamic BTC/ETH discovery, on-chain status reads                                         | Read-only smoke verified; order evidence pending       |
| Innovation / differentiation | Shareable social prediction-room concept and book-vs-community comparison                                                                    | Social code implemented; two-session proof pending     |
| Completeness / demo quality  | README, runbook, release checklist, audit, submission copy and demo script                                                                   | Public URL, screenshots, video and transaction pending |

Supporting files:

- [Architecture](ARCHITECTURE.md)
- [Build status](BUILD_STATUS.md)
- [Deployment evidence](DEPLOYMENT_EVIDENCE.md)
- [Known limitations](KNOWN_LIMITATIONS.md)
- [Demo script](DEMO_SCRIPT.md)

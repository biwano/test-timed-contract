## Local Graph Node

Spin up IPFS, Postgres, and Graph Node locally.

Requirements: Docker and Docker Compose.

Start services:

```bash
docker compose up -d
```

Default endpoints:
- GraphQL: http://localhost:8000
- Admin: http://localhost:8020
- IPFS API: http://localhost:5001

By default, Graph Node expects an Ethereum RPC at `http://localhost:8545` (Anvil).



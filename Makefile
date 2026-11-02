# MedraLink: local development commands
#
#   make            show this help
#   make setup      install dependencies (first time)
#   make dev        API + web app with a local SQLite database and demo accounts
#
# Every target runs from a fresh clone; nothing outside this folder is needed.
# Local runs always use SQLite, even if server/.env points at a hosted PostgreSQL
# database, so development never touches live data.

SHELL := /bin/bash
.DEFAULT_GOAL := help

# Override on the command line, e.g.  make dev API_PORT=5050 WEB_PORT=5174
API_PORT ?= 5000
WEB_PORT ?= 5173
DB       ?= data/dev.sqlite
DEMO     ?= true

SERVER := server
CLIENT := client
SERVER_ENV := DB_DIALECT=sqlite SQLITE_PATH=$(DB) AUTO_SEED=true PORT=$(API_PORT) NODE_ENV=development
CLIENT_ENV := API_PROXY_TARGET=http://localhost:$(API_PORT) VITE_DEMO_MODE=$(DEMO)

.PHONY: help setup dev server client test test-server test-client coverage check build reset-db ports

help: ## Show the available commands
	@echo "MedraLink local development"
	@echo
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-12s %s\n", $$1, $$2}'
	@echo
	@echo "Settings: API_PORT=$(API_PORT) WEB_PORT=$(WEB_PORT) DB=$(SERVER)/$(DB) DEMO=$(DEMO)"
	@echo "Example:  make dev API_PORT=5050"

setup: ## Install server and client dependencies
	npm ci --prefix $(SERVER)
	npm ci --prefix $(CLIENT)

dev: ports ## Run API and web app together (Ctrl+C stops both)
	@echo "API  http://localhost:$(API_PORT)/api/health   database $(SERVER)/$(DB)"
	@echo "App  http://localhost:$(WEB_PORT)   demo accounts on the sign-in page: $(DEMO)"
	@trap 'kill 0' INT TERM EXIT; \
	  (cd $(SERVER) && $(SERVER_ENV) npx tsx watch src/server.ts 2>&1 | sed -u 's/^/[api] /') & \
	  (cd $(CLIENT) && $(CLIENT_ENV) npx vite --port $(WEB_PORT) --strictPort 2>&1 | sed -u 's/^/[web] /') & \
	  wait

server: ## Run only the API
	cd $(SERVER) && $(SERVER_ENV) npx tsx watch src/server.ts

client: ## Run only the web app (expects the API on API_PORT)
	cd $(CLIENT) && $(CLIENT_ENV) npx vite --port $(WEB_PORT) --strictPort

test: test-server test-client ## Run every automated test

test-server: ## Server tests (Jest, in-memory SQLite)
	npm test --prefix $(SERVER)

test-client: ## Client tests (Vitest)
	npm test --prefix $(CLIENT)

coverage: ## Server tests with the coverage report and 80% gate
	cd $(SERVER) && npx jest --coverage

check: ## Type-check server and client
	cd $(SERVER) && npx tsc --noEmit -p .
	cd $(CLIENT) && npx tsc --noEmit -p .

build: ## Production build of client and server
	npm run build --prefix $(CLIENT)
	npm run build --prefix $(SERVER)

reset-db: ## Start over with fresh demo data (the old file is kept as a .bak copy)
	@if [ -f "$(SERVER)/$(DB)" ]; then \
	  stamp=$$(date +%Y%m%d-%H%M%S); \
	  for f in "$(SERVER)/$(DB)" "$(SERVER)/$(DB)-wal" "$(SERVER)/$(DB)-shm"; do \
	    [ -f "$$f" ] && mv "$$f" "$$f.$$stamp.bak"; \
	  done; \
	  echo "Moved the old database aside ($$stamp.bak). The next 'make dev' seeds a fresh one."; \
	else \
	  echo "No database at $(SERVER)/$(DB) yet; 'make dev' will create it."; \
	fi

ports: # Fail early, with a hint, when a port is taken
	@for p in $(API_PORT) $(WEB_PORT); do \
	  if (exec 3<>/dev/tcp/127.0.0.1/$$p) 2>/dev/null; then \
	    echo "Port $$p is already in use. Choose free ports, e.g.  make dev API_PORT=$$(( $(API_PORT) + 1 )) WEB_PORT=$$(( $(WEB_PORT) + 1 ))"; exit 1; \
	  fi; \
	done

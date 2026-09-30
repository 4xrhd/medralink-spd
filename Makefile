# ==============================================================================
# 🏥 MedraLink Prototype — Local Makefile (prototype directory)
# ==============================================================================

SHELL := /bin/bash
.DEFAULT_GOAL := run

.PHONY: help run dev start server client install seed test build clean status stop docker-up docker-down

help:
	@../run.sh help

run dev start:
	@../run.sh run

server:
	@../run.sh server

client:
	@../run.sh client

install:
	@../run.sh install

seed:
	@../run.sh seed

test:
	@../run.sh test

build:
	@../run.sh build

clean:
	@../run.sh clean

status:
	@../run.sh status

stop:
	@../run.sh stop

docker-up:
	@docker compose up -d

docker-down:
	@docker compose down

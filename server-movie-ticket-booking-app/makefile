.DEFAULT_GOAL := help

# ========== BASE COMMANDS ==========
run:
	npm run server

# ========== CLI COMMANDS ==========

# Inspect DLQ: make cli-inspect queue=noti_queue.dlq count=5
cli-inspect:
	@if [ -z "$(queue)" ]; then echo "❌ Missing 'queue' param. Usage: make cli-inspect queue=<queue_name> count=<number>"; exit 1; fi
	@node cli/dlq-cli.js inspect $(queue) $(count)

# Show all queues
cli-all:
	node cli/dlq-cli.js all-queues

# Retry messages: make cli-retry queue=noti_queue.dlq count=3
cli-retry:
	@if [ -z "$(queue)" ]; then echo "❌ Missing 'queue' param. Usage: make cli-retry queue=<queue_name> count=<number>"; exit 1; fi
	@node cli/dlq-cli.js retry $(queue) $(count)

# Auto retry: make cli-auto-retry queue=payment_queue.dlq count=5
cli-auto-retry:
	@if [ -z "$(queue)" ]; then echo "❌ Missing 'queue' param. Usage: make cli-auto-retry queue=<queue_name> count=<number>"; exit 1; fi
	@node cli/dlq-cli.js auto-retry $(queue) $(count)

# Queue detail: make cli-queue-detail queue=payment_queue
cli-queue-detail:
	@if [ -z "$(queue)" ]; then echo "❌ Missing 'queue' param. Usage: make cli-queue-detail queue=<queue_name>"; exit 1; fi
	@node cli/dlq-cli.js queue-detail $(queue)

# Show statistics
cli-stats:
	node cli/dlq-cli.js stats

help:
	@echo "Usage:"
	@echo "  make run                       - Run server"
	@echo "  make cli-all                   - Show all queues"
	@echo "  make cli-inspect queue=<q> count=<n>"
	@echo "  make cli-retry queue=<q> count=<n>"
	@echo "  make cli-auto-retry queue=<q> count=<n>"
	@echo "  make cli-queue-detail queue=<q>"
	@echo "  make cli-stats                 - Show queue stats"

.PHONY: run cli-inspect cli-all cli-retry cli-auto-retry cli-queue-detail cli-stats help

.DEFAULT_GOAL := help

.PHONY: build-wasm
build-wasm: ## Build the WebAssembly module
	GOOS=wasip1 GOARCH=wasm go build -o ./wasm/module.wasm cmd/cron/main.go

.PHONY: test
test: ## Run unit tests
	@go test -v -race ./...

.PHONY: help
help: ## Display this help screen
	@grep -h -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

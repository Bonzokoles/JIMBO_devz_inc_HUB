# Security Rules

- Nigdy nie wystawiaj workerów publicznie.
- Workery przyjmują tylko ruch z control-plane (service tokens).
- Allowlist narzędzi jest obowiązkowa na Windows.
- Każde wywołanie execution ma timeout i limit zasobów.

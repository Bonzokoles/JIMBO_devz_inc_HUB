import logging
import os
from pythonjsonlogger import jsonlogger
from opentelemetry.instrumentation.logging import LoggingInstrumentor

def setup_logging(service_name: str):
    level = os.getenv("LOG_LEVEL", "INFO").upper()
    log_format = os.getenv("LOG_FORMAT", "json")

    root = logging.getLogger()
    root.setLevel(level)

    # wyczyść default handlers (ważne w uvicorn/celery)
    for h in list(root.handlers):
        root.removeHandler(h)

    handler = logging.StreamHandler()

    if log_format == "json":
        fmt = jsonlogger.JsonFormatter(
            "%(asctime)s %(levelname)s %(name)s %(message)s "
            "%(otelTraceID)s %(otelSpanID)s %(otelServiceName)s"
        )
        handler.setFormatter(fmt)
    else:
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))

    root.addHandler(handler)

    # LoggingInstrumentor dokłada:
    # otelTraceID, otelSpanID, otelServiceName do recordów
    LoggingInstrumentor().instrument(set_logging_format=True, log_level=level)

    # ułatwiamy filtrowanie w Loki:
    logging.getLogger().info("logging_ready", extra={"service": service_name})

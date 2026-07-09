import logging
import sys

import structlog

from core.config import get_settings


def configure_logging() -> None:
    """Configure structlog-backed logging once at application startup.

    Renders human-friendly console output for the local environment and
    JSON everywhere else so logs can be ingested by aggregation tooling.
    """
    settings = get_settings()
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Route stdlib loggers (uvicorn, sqlalchemy, ...) through the same stream.
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=level)

    renderer: structlog.typing.Processor
    if settings.ENVIRONMENT == "local":
        renderer = structlog.dev.ConsoleRenderer()
    else:
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            renderer,
        ],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)

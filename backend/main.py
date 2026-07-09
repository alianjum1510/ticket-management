from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.auth import router as auth_router
from api.routes.tickets import router as tickets_router
from core.config import get_settings
from core.exceptions import register_exception_handlers
from core.logging import configure_logging, get_logger
from db.session import close_db_engine

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    configure_logging()
    logger = get_logger(__name__)

    logger.info("application_started", environment=settings.ENVIRONMENT)

    yield

    await close_db_engine()
    logger.info("application_stopped")


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)
    app.include_router(auth_router, prefix=settings.API_PREFIX)
    app.include_router(tickets_router, prefix=settings.API_PREFIX)

    return app


app = create_app()

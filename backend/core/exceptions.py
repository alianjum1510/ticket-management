from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from core.logging import get_logger

logger = get_logger(__name__)


class AppError(Exception):
    """Base class for domain errors translated into HTTP responses."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR

    def __init__(self, detail: str) -> None:
        self.detail = detail
        super().__init__(detail)


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND


class UnauthorizedError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED


class ForbiddenError(AppError):
    status_code = status.HTTP_403_FORBIDDEN


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT


class TicketNotFoundError(NotFoundError):
    def __init__(self, ticket_id: int) -> None:
        super().__init__(f"Ticket with id {ticket_id} was not found")


class InvalidCredentialsError(UnauthorizedError):
    def __init__(self) -> None:
        super().__init__("Incorrect email or password")


class EmailAlreadyRegisteredError(ConflictError):
    def __init__(self, email: str) -> None:
        super().__init__(f"A user with email {email} is already registered")


def _format_validation_errors(exc: RequestValidationError) -> str:
    """Flatten pydantic validation errors into one human-readable sentence.

    Turns the default list-of-dicts payload into e.g.
    "email: value is not a valid email address; password: String should
    have at least 8 characters".
    """
    messages = []
    for error in exc.errors():
        location = ".".join(str(part) for part in error["loc"] if part != "body")
        messages.append(f"{location}: {error['msg']}" if location else error["msg"])
    return "; ".join(messages)


def register_exception_handlers(app: FastAPI) -> None:
    """Attach handlers so every error response uses the {"detail": str} shape."""

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        detail = _format_validation_errors(exc)
        logger.info(
            "request_validation_failed",
            path=request.url.path,
            detail=detail,
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content={"detail": detail},
        )

    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        logger.info(
            "request_failed",
            path=request.url.path,
            status_code=exc.status_code,
            detail=exc.detail,
        )
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled_error", path=request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An unexpected error occurred"},
        )

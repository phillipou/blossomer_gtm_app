from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

async def run_service(service_func, **kwargs):
    """
    Runs a service function with standardized error handling.

    This helper encapsulates the try/except block for all AI generation
    services, ensuring consistent error responses.

    Args:
        service_func: The asynchronous service function to execute.
        **kwargs: Arguments to be passed to the service function.

    Returns:
        The result of the service function call.

    Raises:
        HTTPException: Forwards known HTTP exceptions or wraps value/general
                       errors in a standardized format.
    """
    try:
        return await service_func(**kwargs)
    except ValueError as e:
        logger.warning(f"Validation error in service {service_func.__name__}: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except HTTPException:
        # Re-raise exceptions that are already HTTPExceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error in service {service_func.__name__}: {e}", exc_info=True)
        # TODO: In production, we might not want to expose the raw error string.
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}") 
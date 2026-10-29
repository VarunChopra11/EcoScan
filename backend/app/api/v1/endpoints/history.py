from fastapi import APIRouter, status
from app.models.schemas import UserHistoryResponse
from app.storage.memory_store import memory_store

router = APIRouter()


@router.get("", response_model=UserHistoryResponse, status_code=status.HTTP_200_OK)
def get_user_history():
    """
    Returns the user's aggregate lifetime sustainability metrics,
    historical scans, and redeemed partner vouchers.
    """
    return memory_store.get_history()


@router.delete("", status_code=status.HTTP_200_OK)
def reset_user_history():
    """
    Resets the session state and history back to default welcome balance.
    Useful for interactive demoing and test suites.
    """
    memory_store.reset()
    return {"message": "Session history and points reset successfully."}

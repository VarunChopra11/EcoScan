from typing import List
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import Offer, OfferRedemptionResponse
from app.storage.memory_store import memory_store

router = APIRouter()


@router.get("", response_model=List[Offer], status_code=status.HTTP_200_OK)
def get_offers():
    """
    Retrieves all available sustainable brand partner offers,
    annotated with the user's unlock eligibility based on current EcoPoints.
    """
    return memory_store.get_offers()


@router.post("/{offer_id}/redeem", response_model=OfferRedemptionResponse, status_code=status.HTTP_200_OK)
def redeem_offer(offer_id: str):
    """
    Redeems a partner discount voucher:
    - Validates points balance against offer cost.
    - Deducts required EcoPoints from the in-memory session.
    - Generates a unique claimable voucher promo code.
    """
    try:
        redemption = memory_store.redeem_offer(offer_id)
        return redemption
    except ValueError as err:
        err_msg = str(err)
        if "not found" in err_msg.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err_msg)
        elif "already been redeemed" in err_msg.lower():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=err_msg)
        elif "insufficient" in err_msg.lower():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

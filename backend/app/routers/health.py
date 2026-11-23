from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict[str, str]:
    """サーバーが起動しているかを確認するためのエンドポイント。"""
    return {"status": "ok"}

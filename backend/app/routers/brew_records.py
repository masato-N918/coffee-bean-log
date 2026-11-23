from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BrewRecord
from app.routers.beans import get_bean_or_404
from app.schemas.brew_record import BrewRecordCreate, BrewRecordRead, BrewRecordUpdate

# 一覧・登録は豆にぶら下げ（/beans/{bean_id}/brew-records）、1件の操作は記録の id で行う
router = APIRouter(tags=["brew-records"])

DbSession = Annotated[Session, Depends(get_db)]


def get_brew_record_or_404(db: Session, record_id: int) -> BrewRecord:
    record = db.get(BrewRecord, record_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="抽出記録が見つかりません"
        )
    return record


@router.get("/beans/{bean_id}/brew-records", response_model=list[BrewRecordRead])
def list_brew_records(bean_id: int, db: DbSession) -> list[BrewRecord]:
    """その豆の抽出記録の一覧（抽出日の新しい順。同じ日は後から登録した順）。"""
    get_bean_or_404(db, bean_id)
    stmt = (
        select(BrewRecord)
        .where(BrewRecord.bean_id == bean_id)
        .order_by(BrewRecord.brewed_on.desc(), BrewRecord.created_at.desc(), BrewRecord.id.desc())
    )
    return list(db.scalars(stmt))


@router.post(
    "/beans/{bean_id}/brew-records",
    response_model=BrewRecordRead,
    status_code=status.HTTP_201_CREATED,
)
def create_brew_record(bean_id: int, payload: BrewRecordCreate, db: DbSession) -> BrewRecord:
    """豆に紐づけて抽出記録を登録する。"""
    get_bean_or_404(db, bean_id)
    record = BrewRecord(bean_id=bean_id, **payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/brew-records/{record_id}", response_model=BrewRecordRead)
def get_brew_record(record_id: int, db: DbSession) -> BrewRecord:
    """抽出記録を1件取得する。"""
    return get_brew_record_or_404(db, record_id)


@router.put("/brew-records/{record_id}", response_model=BrewRecordRead)
def update_brew_record(record_id: int, payload: BrewRecordUpdate, db: DbSession) -> BrewRecord:
    """抽出記録を編集する（全項目を置き換える）。"""
    record = get_brew_record_or_404(db, record_id)
    for key, value in payload.model_dump().items():
        setattr(record, key, value)
    db.commit()
    db.refresh(record)  # DB が更新した updated_at を取り直す
    return record


@router.delete("/brew-records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brew_record(record_id: int, db: DbSession) -> Response:
    """抽出記録を削除する。"""
    record = get_brew_record_or_404(db, record_id)
    db.delete(record)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

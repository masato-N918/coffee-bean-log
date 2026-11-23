from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Bean
from app.schemas.bean import BeanCreate, BeanRead, BeanUpdate

router = APIRouter(prefix="/beans", tags=["beans"])

DbSession = Annotated[Session, Depends(get_db)]


def get_bean_or_404(db: Session, bean_id: int) -> Bean:
    bean = db.get(Bean, bean_id)
    if bean is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="豆が見つかりません")
    return bean


@router.get("", response_model=list[BeanRead])
def list_beans(db: DbSession) -> list[Bean]:
    """豆の一覧（新しい順）。"""
    stmt = select(Bean).order_by(Bean.created_at.desc(), Bean.id.desc())
    return list(db.scalars(stmt))


@router.post("", response_model=BeanRead, status_code=status.HTTP_201_CREATED)
def create_bean(payload: BeanCreate, db: DbSession) -> Bean:
    """豆を登録する。"""
    bean = Bean(**payload.model_dump())
    db.add(bean)
    db.commit()
    db.refresh(bean)
    return bean


@router.get("/{bean_id}", response_model=BeanRead)
def get_bean(bean_id: int, db: DbSession) -> Bean:
    """豆の詳細。"""
    return get_bean_or_404(db, bean_id)


@router.put("/{bean_id}", response_model=BeanRead)
def update_bean(bean_id: int, payload: BeanUpdate, db: DbSession) -> Bean:
    """豆を編集する（全項目を置き換える）。"""
    bean = get_bean_or_404(db, bean_id)
    for key, value in payload.model_dump().items():
        setattr(bean, key, value)
    db.commit()
    db.refresh(bean)  # DB が更新した updated_at を取り直す
    return bean


@router.delete("/{bean_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bean(bean_id: int, db: DbSession) -> Response:
    """豆を削除する。その豆の抽出記録は DB の ON DELETE CASCADE で一緒に消える。"""
    bean = get_bean_or_404(db, bean_id)
    db.delete(bean)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

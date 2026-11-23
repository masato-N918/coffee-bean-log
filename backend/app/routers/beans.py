from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Bean
from app.schemas.bean import (
    BeanCreate,
    BeanRead,
    BeanSort,
    BeanUpdate,
    RoastGroup,
    RoastLevel,
)

router = APIRouter(prefix="/beans", tags=["beans"])

DbSession = Annotated[Session, Depends(get_db)]


def get_bean_or_404(db: Session, bean_id: int) -> Bean:
    bean = db.get(Bean, bean_id)
    if bean is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="豆が見つかりません")
    return bean


@router.get("", response_model=list[BeanRead])
def list_beans(
    db: DbSession,
    origin: Annotated[str | None, Query(max_length=100, description="産地（部分一致）")] = None,
    roast_group: Annotated[
        list[RoastGroup] | None, Query(description="焙煎度の呼び方（複数可）")
    ] = None,
    roast_level: Annotated[
        list[RoastLevel] | None, Query(description="焙煎度 8段階（複数可）")
    ] = None,
    min_rating: Annotated[int | None, Query(ge=1, le=5, description="評価がこの値以上")] = None,
    sort: Annotated[
        BeanSort, Query(description="並び順（newest: 新しい順 / rating: 評価順）")
    ] = "newest",
) -> list[Bean]:
    """豆の一覧。産地・焙煎度・評価で絞り込み、新しい順・評価順で並べ替えられる。

    条件同士は AND。焙煎度は呼び方と 8段階を合わせて複数選べるので OR でつなぐ。
    """
    stmt = select(Bean)

    keyword = origin.strip() if origin else ""
    if keyword:
        # autoescape: 入力の % や _ をワイルドカードではなく文字として扱う
        stmt = stmt.where(Bean.origin.contains(keyword, autoescape=True))

    # 呼び方は 8段階で登録したときも自動で入るので、roast_group で選べば両方が対象になる
    roast_conditions = []
    if roast_group:
        roast_conditions.append(Bean.roast_group.in_(roast_group))
    if roast_level:
        roast_conditions.append(Bean.roast_level.in_(roast_level))
    if roast_conditions:
        stmt = stmt.where(or_(*roast_conditions))

    if min_rating is not None:
        stmt = stmt.where(Bean.rating >= min_rating)  # 未評価（NULL）は含まれない

    if sort == "rating":
        # 評価の高い順。未評価は最後、同じ評価は新しい順
        stmt = stmt.order_by(Bean.rating.is_(None), Bean.rating.desc())
    stmt = stmt.order_by(Bean.created_at.desc(), Bean.id.desc())

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

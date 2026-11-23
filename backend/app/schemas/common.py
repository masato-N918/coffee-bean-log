"""複数のスキーマで使う型と設定。"""

from typing import Annotated

from pydantic import BeforeValidator, ConfigDict, Field

# 入力の文字列は前後の空白を取ってからチェックする（"   " は空文字になり、必須チェックで弾かれる）
INPUT_CONFIG = ConfigDict(str_strip_whitespace=True)


def blank_to_none(value: object) -> object:
    """空文字・空白だけの文字列を None にする（未入力として保存する）。"""
    if isinstance(value, str) and value.strip() == "":
        return None
    return value


# 任意の文字列項目。前後の空白を取り、空なら None にする
# （max_length は str の側に付ける。str | None 全体に付けると None のときにエラーになる）
Text100 = Annotated[Annotated[str, Field(max_length=100)] | None, BeforeValidator(blank_to_none)]
Text1000 = Annotated[Annotated[str, Field(max_length=1000)] | None, BeforeValidator(blank_to_none)]

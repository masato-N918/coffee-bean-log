from app.models.choices import ROAST_GROUPS, ROAST_LEVEL_TO_GROUP, ROAST_LEVELS, in_check


def test_roast_level_to_group_matches_choices() -> None:
    assert set(ROAST_LEVEL_TO_GROUP) == set(ROAST_LEVELS)
    assert set(ROAST_LEVEL_TO_GROUP.values()) == set(ROAST_GROUPS)


def test_in_check() -> None:
    assert in_check("process", ("washed", "natural")) == "process IN ('washed', 'natural')"

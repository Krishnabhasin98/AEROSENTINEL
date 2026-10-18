import datetime

def get_utc_now() -> datetime.datetime:
    """Returns current timezone-aware UTC datetime."""
    return datetime.datetime.now(datetime.timezone.utc)

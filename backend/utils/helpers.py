from datetime import datetime

def format_date(date_str, format_in="%Y-%m-%d", format_out="%d-%b-%Y"):
    """Helper to convert YYYY-MM-DD to a user-friendly format like 27-Jul-2026."""
    try:
        dt = datetime.strptime(date_str, format_in)
        return dt.strftime(format_out)
    except Exception:
        return date_str

def parse_float(val, default=0.0):
    """Safely parse floats from request parameters."""
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

def parse_int(val, default=0):
    """Safely parse integers from request parameters."""
    if val is None:
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default

"""Observable movement and perimeter geometry helpers for SentryX."""

from math import hypot


def centroid(box):
    x1, y1, x2, y2 = box
    return ((x1 + x2) / 2.0, (y1 + y2) / 2.0)


def movement_features(previous, current, fps):
    if not previous or not current:
        return {"center": current, "speed_px_s": 0.0, "direction": None}
    dx = current[0] - previous[0]
    dy = current[1] - previous[1]
    return {
        "center": current,
        "speed_px_s": round(hypot(dx, dy) * max(fps, 0), 3),
        "direction": round(__import__("math").degrees(__import__("math").atan2(dy, dx)), 2),
    }


def point_in_polygon(point, polygon):
    if len(polygon) < 3:
        return False
    x, y = point
    inside = False
    j = len(polygon) - 1
    for i, (xi, yi) in enumerate(polygon):
        xj, yj = polygon[j]
        intersects = ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-9) + xi)
        if intersects:
            inside = not inside
        j = i
    return inside


def orientation(a, b, c):
    value = (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1])
    return (value > 0) - (value < 0)


def tripwire_crossed(previous, current, line):
    if not previous or not current or len(line) != 2:
        return False
    a, b = line
    return orientation(previous, current, a) != orientation(previous, current, b) and orientation(a, b, previous) != orientation(a, b, current)

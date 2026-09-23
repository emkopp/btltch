#!/usr/bin/env python3
"""Validate a BattleTech ship technical-diagram output directory."""

from __future__ import annotations

import argparse
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def validate_svg(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        root = ET.parse(path).getroot()
    except ET.ParseError as error:
        return [f"{path.name}: invalid XML: {error}"]

    local_name = root.tag.rsplit("}", 1)[-1]
    if local_name != "svg":
        errors.append(f"{path.name}: root element must be svg")
    if not root.get("viewBox"):
        errors.append(f"{path.name}: missing viewBox")

    descendants = list(root.iter())
    names = [element.tag.rsplit("}", 1)[-1] for element in descendants]
    if "title" not in names:
        errors.append(f"{path.name}: missing accessible title")
    if "desc" not in names:
        errors.append(f"{path.name}: missing accessible description")
    if "image" in names:
        errors.append(f"{path.name}: embedded raster images are not allowed")

    text = " ".join((element.text or "") for element in descendants)
    if not re.search(r"concept|not (?:a )?construction", text, re.IGNORECASE):
        errors.append(f"{path.name}: missing conceptual-status disclaimer")
    return errors


def validate_markdown(path: Path, svg_names: set[str]) -> list[str]:
    errors: list[str] = []
    text = path.read_text(encoding="utf-8")
    linked_svgs = set(re.findall(r"\[[^]]+\]\(([^)]+\.svg)\)", text, re.IGNORECASE))
    linked_names = {Path(link).name for link in linked_svgs}
    if not linked_names & svg_names:
        errors.append(f"{path.name}: must link to a generated SVG")
    if "TBD" not in text:
        errors.append(f"{path.name}: must identify unresolved values with TBD")
    if not re.search(r"confirmed|basis|inferred", text, re.IGNORECASE):
        errors.append(f"{path.name}: must distinguish evidence confidence")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("output_directory", type=Path)
    args = parser.parse_args()

    directory = args.output_directory.resolve()
    if not directory.is_dir():
        print(f"ERROR: directory does not exist: {directory}", file=sys.stderr)
        return 1

    svg_files = sorted(directory.glob("*.svg"))
    markdown_files = sorted(directory.glob("*.md"))
    errors: list[str] = []
    if not svg_files:
        errors.append("no SVG technical drawing found")

    for path in svg_files:
        errors.extend(validate_svg(path))
    svg_names = {path.name for path in svg_files}
    for path in markdown_files:
        errors.extend(validate_markdown(path, svg_names))

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print(
        f"Validated {len(svg_files)} SVG file(s) and "
        f"{len(markdown_files)} Markdown file(s) in {directory}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
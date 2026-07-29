from __future__ import annotations

import re
import sys
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph


def iter_blocks(document: Document):
    for child in document.element.body.iterchildren():
        if child.tag == qn("w:p"):
            yield Paragraph(child, document)
        elif child.tag == qn("w:tbl"):
            yield Table(child, document)


def safe_cell_text(text: str) -> str:
    text = " ".join(line.strip() for line in text.splitlines() if line.strip())
    return text.replace("|", "\\|")


def markdown_for_table(table: Table) -> list[str]:
    rows = []
    for row in table.rows:
        cells = [safe_cell_text(cell.text) for cell in row.cells]
        if any(cells):
            rows.append(cells)

    if not rows:
        return []

    width = max(len(row) for row in rows)
    normalized = [row + [""] * (width - len(row)) for row in rows]
    lines = ["| " + " | ".join(normalized[0]) + " |"]
    lines.append("| " + " | ".join(["---"] * width) + " |")
    for row in normalized[1:]:
        lines.append("| " + " | ".join(row) + " |")
    return lines


def image_extension(content_type: str) -> str:
    mapping = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/bmp": ".bmp",
        "image/tiff": ".tiff",
        "image/x-emf": ".emf",
        "image/x-wmf": ".wmf",
    }
    return mapping.get(content_type, ".bin")


def paragraph_image_lines(document: Document, paragraph: Paragraph, assets_dir: Path, image_seen: dict[str, str]) -> list[str]:
    lines = []
    blips = paragraph._element.xpath(".//a:blip")
    for blip in blips:
        rid = blip.get(qn("r:embed"))
        if not rid:
            continue
        if rid not in image_seen:
            part = document.part.related_parts[rid]
            ext = image_extension(part.content_type)
            filename = f"image-{len(image_seen) + 1}{ext}"
            (assets_dir / filename).write_bytes(part.blob)
            image_seen[rid] = filename
        lines.append(f"![内嵌图片]({assets_dir.name}/{image_seen[rid]})")
    return lines


def paragraph_to_markdown(paragraph: Paragraph) -> str:
    text = re.sub(r"\s+", " ", paragraph.text).strip()
    if not text:
        return ""

    style = paragraph.style.name if paragraph.style is not None else ""
    heading_match = re.match(r"Heading ([1-6])", style)
    if heading_match:
        level = int(heading_match.group(1))
        return f"{'#' * min(level + 1, 6)} {text}"

    if "List Bullet" in style:
        return f"- {text}"
    if "List Number" in style:
        return f"1. {text}"
    return text


def main() -> int:
    if len(sys.argv) != 4:
        print("Usage: extract_docx_to_markdown.py input.docx output.md assets_dir", file=sys.stderr)
        return 2

    input_path = Path(sys.argv[1]).expanduser().resolve()
    output_path = Path(sys.argv[2]).expanduser().resolve()
    assets_dir = Path(sys.argv[3]).expanduser().resolve()
    assets_dir.mkdir(parents=True, exist_ok=True)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    document = Document(str(input_path))
    image_seen: dict[str, str] = {}
    lines = [
        "# Ana Tilim 项目完整想法总结 - 原始提取",
        "",
        f"来源文件：`{input_path.name}`",
        "",
    ]

    for block in iter_blocks(document):
        if isinstance(block, Paragraph):
            para = paragraph_to_markdown(block)
            if para:
                lines.append(para)
                lines.append("")
            images = paragraph_image_lines(document, block, assets_dir, image_seen)
            if images:
                lines.extend(images)
                lines.append("")
        elif isinstance(block, Table):
            table_lines = markdown_for_table(block)
            if table_lines:
                lines.extend(table_lines)
                lines.append("")

    output_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    print(f"Wrote {output_path}")
    print(f"Extracted {len(image_seen)} images to {assets_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

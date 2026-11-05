from pathlib import Path

from docx import Document
from docx.document import Document as DocumentObject
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from docx.table import Table
from docx.text.paragraph import Paragraph


ROOT = Path(".")
OUTPUT_DIR = Path("docx_md_변환본")


def iter_block_items(parent):
    if isinstance(parent, DocumentObject):
        parent_elm = parent.element.body
    else:
        parent_elm = parent._tc

    for child in parent_elm.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)


def escape_md_cell(text: str) -> str:
    return text.replace("\\", "\\\\").replace("|", "\\|").replace("\n", "<br>")


def paragraph_to_markdown(paragraph: Paragraph) -> str:
    text = paragraph.text.strip()
    if not text:
        return ""

    style_name = paragraph.style.name if paragraph.style is not None else ""
    if style_name.startswith("Heading"):
        level_text = style_name.replace("Heading", "").strip()
        try:
            level = max(1, min(6, int(level_text)))
        except ValueError:
            level = 2
        return f"{'#' * level} {text}"

    if style_name == "Title":
        return f"# {text}"

    if style_name in {"Subtitle", "Quote", "Intense Quote"}:
        return f"> {text}"

    return text


def table_to_markdown(table: Table) -> list[str]:
    rows = []
    for row in table.rows:
        cells = [escape_md_cell(cell.text.strip()) for cell in row.cells]
        rows.append(cells)

    if not rows:
        return []

    width = max(len(row) for row in rows)
    normalized = [row + [""] * (width - len(row)) for row in rows]

    lines = []
    header = normalized[0]
    lines.append("| " + " | ".join(header) + " |")
    lines.append("| " + " | ".join(["---"] * width) + " |")
    for row in normalized[1:]:
        lines.append("| " + " | ".join(row) + " |")
    return lines


def docx_to_markdown(path: Path) -> str:
    doc = Document(path)
    lines: list[str] = []

    for block in iter_block_items(doc):
        if isinstance(block, Paragraph):
            md = paragraph_to_markdown(block)
            if md:
                lines.append(md)
                lines.append("")
        elif isinstance(block, Table):
            table_lines = table_to_markdown(block)
            if table_lines:
                lines.extend(table_lines)
                lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)
    converted = []

    for docx_path in sorted(ROOT.glob("*.docx"), key=lambda p: p.name.casefold()):
        md_text = docx_to_markdown(docx_path)
        md_path = OUTPUT_DIR / f"{docx_path.stem}.md"
        # UTF-8 with BOM helps Windows editors detect Korean text correctly.
        md_path.write_text(md_text, encoding="utf-8-sig", newline="\n")
        converted.append(md_path)

    print(f"converted {len(converted)} files")
    for path in converted:
        print(path)


if __name__ == "__main__":
    main()

import sys
import os
from io import BytesIO

from PIL import Image, ImageOps
from rembg import remove


def prepare_image(image_bytes):
    max_edge = int(os.getenv("REMBG_MAX_EDGE", "1024"))
    image = Image.open(BytesIO(image_bytes))
    image = ImageOps.exif_transpose(image).convert("RGBA")

    width, height = image.size
    largest_edge = max(width, height)
    if largest_edge > max_edge:
        scale = max_edge / largest_edge
        image = image.resize(
            (int(width * scale), int(height * scale)),
            Image.Resampling.LANCZOS,
        )

    output = BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


def main():
    image_bytes = sys.stdin.buffer.read()
    if not image_bytes:
        raise ValueError("No image bytes received")

    # TEMPORARY TEST: Direct rembg remove without custom session
    input_data = prepare_image(image_bytes)
    output = remove(input_data)
    sys.stdout.buffer.write(output)


if __name__ == "__main__":
    main()

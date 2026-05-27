import sys

from rembg import new_session, remove


def main():
    image_bytes = sys.stdin.buffer.read()
    if not image_bytes:
        raise ValueError("No image bytes received")

    session = new_session("u2net")
    output = remove(image_bytes, session=session)
    sys.stdout.buffer.write(output)


if __name__ == "__main__":
    main()

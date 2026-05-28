import sys
from rembg import remove

input_data = sys.stdin.buffer.read()

output = remove(input_data)

sys.stdout.buffer.write(output)

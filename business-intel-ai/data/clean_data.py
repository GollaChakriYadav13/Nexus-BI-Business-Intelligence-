import pandas as pd
import re

# This script will attempt to find the CSV table inside that weird bplist/html file
input_file = 'data/BMW Vehicle Inventory.csv'
output_file = 'data/BMW_Cleaned.csv'

with open(input_file, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Use regex to find everything between the <pre> tags (where the actual data lives)
match = re.search(r'<pre[^>]*>(.*?)</pre>', content, re.DOTALL)
if match:
    csv_data = match.group(1).strip()
    with open(output_file, 'w') as f:
        f.write(csv_data)
    print(f"Success! Cleaned data saved to {output_file}")
else:
    print("Could not find data tags. Make sure the file contains <pre>...</pre>")
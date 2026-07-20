#!/usr/bin/env python3
import os, sys, json, subprocess, requests
ROOT = os.path.dirname(os.path.dirname(__file__))
node_script = os.path.join(ROOT, 'scripts', 'convert_products_to_json.js')
if not os.path.exists(node_script):
    print('Missing node helper script:', node_script)
    sys.exit(1)

try:
    proc = subprocess.run(['node', node_script], capture_output=True, text=True, check=True)
except Exception as e:
    print('Failed to run node to convert products:', e)
    sys.exit(1)

products = json.loads(proc.stdout)
print(f'Loaded {len(products)} products from JS')

API = os.environ.get('API_URL', 'http://127.0.0.1:7788/products')

for p in products:
    payload = {
        'ProductName': p.get('name'),
        'Description': p.get('description'),
        'Category': p.get('category'),
        'ImageUrl': p.get('image'),
        'Price': p.get('price'),
        'StockQuantity': 100 if p.get('available') else 0,
        'Weight': p.get('weight') or 0
    }
    try:
        r = requests.post(API, json=payload, timeout=10)
        if r.status_code >= 400:
            print('Failed to POST product', p.get('name'), r.status_code, r.text)
        else:
            print('Created:', p.get('name'))
    except Exception as e:
        print('Request failed for', p.get('name'), str(e))

print('Done')

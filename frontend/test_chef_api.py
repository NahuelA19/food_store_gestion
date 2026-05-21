"""Quick test: login as chef, get orders, try to update status."""
import urllib.request
import urllib.parse
import json

BASE = "http://localhost:8000/api/v1"

def post(url, data, headers=None):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers=headers or {})
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

def patch(url, data, headers=None):
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers=headers or {}, method="PATCH")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

# 1. Login as chef
print("=== 1. Login as chef ===")
status, data = post(f"{BASE}/auth/login", {"email": "cocina@foodstore.com", "password": "CocinaPass123"})
print(f"Status: {status}")
if status != 200:
    print("Login failed, trying chef@foodstore.com")
    status, data = post(f"{BASE}/auth/login", {"email": "chef@foodstore.com", "password": "ChefPass123"})
    print(f"Status: {status}")
if status != 200:
    print(f"ERROR: {data}")
    exit(1)

token = data.get("access_token")
print(f"Token: {token[:30]}...")
auth = {"Authorization": f"Bearer {token}"}

# 2. Get kitchen orders
print("\n=== 2. Get kitchen orders ===")
status, data = get(f"{BASE}/cocina/pedidos", auth)
print(f"Status: {status}")
if status == 200:
    print(f"Orders: {len(data.get('items', []))} found")
    for order in data.get('items', [])[:3]:
        print(f"  Order #{order['id']}: estado={order['estado_codigo']}")
else:
    print(f"ERROR: {data}")

# 3. Try to update first CONFIRMADO order to en_prep
orders = data.get('items', []) if status == 200 else []
confirmado = next((o for o in orders if o['estado_codigo'] == 'CONFIRMADO'), None)

if confirmado:
    print(f"\n=== 3. Start Prep on order #{confirmado['id']} ===")
    status, result = patch(f"{BASE}/orders/{confirmado['id']}/status", {"status": "en_prep"}, auth)
    print(f"Status: {status}")
    print(f"Result: {json.dumps(result, indent=2)[:500]}")
else:
    print("\nNo CONFIRMADO orders to test with")

# 4. Try LISTO
en_prep = next((o for o in orders if o['estado_codigo'] == 'EN_PREP'), None)
if en_prep:
    print(f"\n=== 4. Mark Ready on order #{en_prep['id']} ===")
    status, result = patch(f"{BASE}/orders/{en_prep['id']}/status", {"status": "listo"}, auth)
    print(f"Status: {status}")
    print(f"Result: {json.dumps(result, indent=2)[:500]}")
else:
    print("\nNo EN_PREP orders to test with")

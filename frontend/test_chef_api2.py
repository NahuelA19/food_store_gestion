import urllib.request, json, sys

BASE = "http://localhost:8000/api/v1"

def req(method, url, data=None, hdrs=None):
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(url, data=body, headers=hdrs or {}, method=method)
    if body:
        r.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(r, timeout=10) as res:
            return res.status, json.loads(res.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {"error": str(e)}

# Login
s, d = req("POST", BASE + "/auth/login", {"email": "chef@foodstore.com", "password": "chef123"})
print("Login chef@foodstore.com:", s)
if s != 200:
    print("  error:", d)
    s, d = req("POST", BASE + "/auth/login", {"email": "cocina@foodstore.com", "password": "chef123"})
    print("Login cocina@foodstore.com:", s)
    if s != 200:
        print("  error:", d)
        sys.exit(1)

token = d["access_token"]
print("  user_role:", d.get("user", {}).get("role", "?"))
auth = {"Authorization": "Bearer " + token}

# Get kitchen orders
s, d = req("GET", BASE + "/cocina/pedidos", hdrs=auth)
print("GET /cocina/pedidos:", s)
if s != 200:
    print("  error:", d)
    sys.exit(1)

orders = d.get("items", [])
print("  Found", len(orders), "orders:")
for o in orders:
    oid = o["id"]
    estado = o["estado_codigo"]
    print("   ", oid, estado)

conf = next((o for o in orders if o["estado_codigo"] == "CONFIRMADO"), None)
prep = next((o for o in orders if o["estado_codigo"] == "EN_PREP"), None)

if conf:
    oid = conf["id"]
    print("PATCH /orders/" + str(oid) + "/status -> en_prep")
    s2, d2 = req("PATCH", BASE + "/orders/" + str(oid) + "/status", {"status": "en_prep"}, auth)
    print("  Result:", s2)
    if s2 != 200:
        print("  ERROR:", json.dumps(d2, indent=2))
    else:
        print("  SUCCESS!")

elif prep:
    oid = prep["id"]
    print("PATCH /orders/" + str(oid) + "/status -> listo")
    s2, d2 = req("PATCH", BASE + "/orders/" + str(oid) + "/status", {"status": "listo"}, auth)
    print("  Result:", s2)
    if s2 != 200:
        print("  ERROR:", json.dumps(d2, indent=2))
    else:
        print("  SUCCESS!")
else:
    print("No CONFIRMADO or EN_PREP orders to test")

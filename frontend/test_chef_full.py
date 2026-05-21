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
print("Login:", s)
token = d["access_token"]
auth = {"Authorization": "Bearer " + token}

# Get kitchen orders
s, d = req("GET", BASE + "/cocina/pedidos", hdrs=auth)
print("Kitchen orders:", s, len(d.get("items", [])))
orders = d.get("items", [])
for o in orders:
    print("  #" + str(o["id"]) + " " + o["estado_codigo"])

# Test all transitions
conf = next((o for o in orders if o["estado_codigo"] == "CONFIRMADO"), None)
prep = next((o for o in orders if o["estado_codigo"] == "EN_PREP"), None)

if conf:
    oid = conf["id"]
    print("\nTest 1: CONFIRMADO -> en_prep (order #" + str(oid) + ")")
    s2, d2 = req("PATCH", BASE + "/orders/" + str(oid) + "/status", {"status": "en_prep"}, auth)
    print("  Result:", s2, "SUCCESS" if s2 == 200 else "FAIL: " + str(d2))

if prep:
    oid = prep["id"]
    print("\nTest 2: EN_PREP -> listo (order #" + str(oid) + ")")
    s2, d2 = req("PATCH", BASE + "/orders/" + str(oid) + "/status", {"status": "listo"}, auth)
    print("  Result:", s2, "SUCCESS" if s2 == 200 else "FAIL: " + str(d2))

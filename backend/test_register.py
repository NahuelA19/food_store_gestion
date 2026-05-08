import requests
import json

response = requests.post(
    "http://localhost:8000/api/auth/register",
    json={
        "email": "test@example.com",
        "password": "TestPassword123"
    }
)

print(f"Status: {response.status_code}")
print(f"Raw Response: {response.text}")
try:
    print(f"Response JSON:\n{json.dumps(response.json(), indent=2)}")
except:
    print("No JSON in response")


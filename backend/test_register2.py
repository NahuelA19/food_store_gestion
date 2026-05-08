import requests
import json

response = requests.post(
    "http://localhost:8000/api/auth/register",
    json={
        "email": "test2@example.com",
        "password": "TestPassword123"
    }
)

print(f"Status: {response.status_code}")
print(f"Headers: {dict(response.headers)}")
print(f"Raw Response: {response.text[:500]}")

from app.config import settings
from database.client import get_database_url

print("=== Settings loaded ===")
print(f"Environment: {settings.environment}")
print(f"Database URL: {settings.database_url}")
print(f"Secret Key: {settings.secret_key}")
print(f"Algorithm: {settings.algorithm}")
print(f"Access Token Expire Minutes: {settings.access_token_expire_minutes}")

# Now test get_database_url()
db_url = get_database_url()
print(f"\nget_database_url() returned: {db_url}")
print(f"Match: {db_url == settings.database_url}")

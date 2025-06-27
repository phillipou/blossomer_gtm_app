from blossomer_gtm_api.database import SessionLocal
from blossomer_gtm_api.auth import AuthService


def main():
    db = SessionLocal()
    user, api_key = AuthService.create_user_with_api_key(
        db,
        email="test@example.com",
        name="Test User",
        key_name="Test Key",
        role="user",
        rate_limit_exempt=False,
    )
    print(f"Created user: {user.email}")
    print(f"API Key: {api_key}")


if __name__ == "__main__":
    main()

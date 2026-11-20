
import pytest

from backend.app.models import User


# TEST 1: USER REGISTRATION
def test_register_user(client):

    response = client.post(
        "/register",
        json={
            "full_name": "Test User",
            "email": "test@example.com",
            "password": "TestPassword123!"
        }
    )

    assert response.status_code == 201

    data = response.json()

    assert data["full_name"] == "Test User"
    assert data["email"] == "test@example.com"
    assert data["role"] == "member"

    # Password must never be returned
    assert "password" not in data
    assert "password_hash" not in data


# TEST 2: PREVENT DUPLICATE REGISTRATION
def test_duplicate_registration(client):

    user_data = {
        "full_name": "Test User",
        "email": "duplicate@example.com",
        "password": "TestPassword123!"
    }

    first_response = client.post(
        "/register",
        json=user_data
    )

    second_response = client.post(
        "/register",
        json=user_data
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409


# TEST 3: SUCCESSFUL LOGIN
def test_login_success(client):

    user_data = {
        "full_name": "Login User",
        "email": "login@example.com",
        "password": "TestPassword123!"
    }

    client.post("/register", json=user_data)

    response = client.post(
        "/login",
        json={
            "email": user_data["email"],
            "password": user_data["password"]
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


# TEST 4: LOGIN WITH WRONG PASSWORD
def test_login_wrong_password(client):

    user_data = {
        "full_name": "Wrong Password User",
        "email": "wrong@example.com",
        "password": "CorrectPassword123!"
    }

    client.post("/register", json=user_data)

    response = client.post(
        "/login",
        json={
            "email": user_data["email"],
            "password": "IncorrectPassword123!"
        }
    )

    assert response.status_code == 401


# TEST 5: ACCESS PROFILE WITHOUT TOKEN
def test_profile_without_token(client):

    response = client.get("/me")

    assert response.status_code == 401


# TEST 6: ACCESS PROFILE WITH VALID TOKEN
def test_profile_with_token(client):

    user_data = {
        "full_name": "Profile User",
        "email": "profile@example.com",
        "password": "TestPassword123!"
    }

    client.post("/register", json=user_data)

    login_response = client.post(
        "/login",
        json={
            "email": user_data["email"],
            "password": user_data["password"]
        }
    )

    token = login_response.json()["access_token"]

    response = client.get(
        "/me",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200
    assert response.json()["email"] == user_data["email"]


# TEST 7: MEMBER CANNOT ACCESS ADMIN DASHBOARD
def test_member_cannot_access_admin_dashboard(client):

    user_data = {
        "full_name": "Member User",
        "email": "member@example.com",
        "password": "TestPassword123!"
    }

    client.post("/register", json=user_data)

    login_response = client.post(
        "/login",
        json={
            "email": user_data["email"],
            "password": user_data["password"]
        }
    )

    token = login_response.json()["access_token"]

    response = client.get(
        "/admin/dashboard",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Admin access required"


# TEST 8: ADMIN CAN ACCESS ADMIN DASHBOARD
def test_admin_can_access_admin_dashboard(client, test_db):

    user_data = {
        "full_name": "Admin User",
        "email": "admin@example.com",
        "password": "TestPassword123!"
    }

    client.post("/register", json=user_data)

    # Promote this test user to admin
    admin_user = test_db.query(User).filter(
        User.email == user_data["email"]
    ).first()

    admin_user.role = "admin"
    test_db.commit()

    login_response = client.post(
        "/login",
        json={
            "email": user_data["email"],
            "password": user_data["password"]
        }
    )

    token = login_response.json()["access_token"]

    response = client.get(
        "/admin/dashboard",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["role"] == "admin"
    assert data["admin"] == "Admin User"

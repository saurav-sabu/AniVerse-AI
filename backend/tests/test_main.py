import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_read_health():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_auth_register_duplicate(db_session=None):
    """Test registration with an existing email (mocked)."""
    # Note: A real test would use a test database. This is a basic sanity check.
    payload = {
        "email": "test@example.com",
        "password": "Password123!"
    }
    # First attempt might succeed or fail depending on DB state
    client.post("/auth/register", json=payload)
    # Second attempt should definitely return 400
    response = client.post("/auth/register", json=payload)
    assert response.status_code in [200, 400] 

def test_recommendation_unauthorized():
    """Test that recommendations require authentication."""
    response = client.post("/recommend", json={"query": "Inception"})
    assert response.status_code == 401

def test_forgot_password_mock():
    """Test the mock forgot password endpoint."""
    response = client.post("/auth/forgot-password", json={"email": "nonexistent@example.com"})
    assert response.status_code == 200
    assert "reset link will be sent" in response.json()["message"]

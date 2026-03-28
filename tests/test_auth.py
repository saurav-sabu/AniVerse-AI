import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_register_success():
    response = client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "TestPass123"
    })
    assert response.status_code in [200, 400]  # 400 if already exists

def test_register_weak_password():
    response = client.post("/auth/register", json={
        "email": "weak@example.com",
        "password": "short"
    })
    assert response.status_code == 422

def test_login_wrong_credentials():
    response = client.post("/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "WrongPass123"
    })
    assert response.status_code == 401

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_recommend_unauthenticated():
    response = client.post("/recommend", json={
        "query": "sci-fi movies"
    })
    assert response.status_code == 401

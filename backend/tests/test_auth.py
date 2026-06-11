def test_login_success(client):
    response = client.post("/api/auth/login", json={"username": "testuser", "password": "password123"})
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password(client):
    response = client.post("/api/auth/login", json={"username": "testuser", "password": "wrong"})
    assert response.status_code == 401


def test_me(client):
    login = client.post("/api/auth/login", json={"username": "testuser", "password": "password123"})
    token = login.json()["access_token"]
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"

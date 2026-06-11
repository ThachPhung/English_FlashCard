def _auth_headers(client):
    login = client.post("/api/auth/login", json={"username": "testuser", "password": "password123"})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_and_list_deck(client):
    headers = _auth_headers(client)
    create = client.post(
        "/api/decks",
        json={"name": "IELTS Vocabulary", "visibility": "private"},
        headers=headers,
    )
    assert create.status_code == 201
    assert create.json()["name"] == "IELTS Vocabulary"

    listing = client.get("/api/decks", headers=headers)
    assert listing.status_code == 200
    assert len(listing.json()) >= 1

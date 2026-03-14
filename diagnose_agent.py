import requests
import json

BASE_URL = "http://localhost:8000"

def test_recommendation():
    # 1. Register/Login to get token
    email = "test_diagnose@example.com"
    password = "password123"
    
    # Try register first
    requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
    
    # Login
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
    
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Query recommendation
    query = "Joker"
    print(f"Querying for: {query}")
    resp = requests.post(
        f"{BASE_URL}/recommend", 
        json={"query": query, "history": []},
        headers=headers
    )
    
    if resp.status_code != 200:
        print(f"Recommend failed: {resp.text}")
        return
    
    data = resp.json()
    content = data["response"]
    
    # Save to file to avoid console encoding issues
    with open("agent_response.txt", "w", encoding="utf-8") as f:
        f.write(content)
    
    print("\n--- AGENT RESPONSE SAVED TO agent_response.txt ---")
    
    # Check for metadata
    import re
    metadata_regex = r"\[METADATA: (\{[\s\S]*?\})\]"
    matches = re.findall(metadata_regex, content)
    print(f"Found {len(matches)} metadata blocks.")
    for i, m in enumerate(matches):
        try:
            parsed = json.loads(m)
            print(f"Block {i+1} poster: {parsed.get('poster')}")
        except Exception as e:
            print(f"Block {i+1} FAILED TO PARSE: {e}")
            print(f"Raw block: {m}")

if __name__ == "__main__":
    test_recommendation()

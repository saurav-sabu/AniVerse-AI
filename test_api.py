import requests
import json

import os
email = os.getenv("TEST_EMAIL", "testuser123@example.com")
password = os.getenv("TEST_PASSWORD", "Password123")

session = requests.Session()
login_res = session.post('http://127.0.0.1:8000/auth/login', json={'email': email, 'password': password})
print("Login status:", login_res.status_code)

req_data = {
    'query': 'Recommend a sci-fi movie about time travel',
    'history': [
        {'role': 'user', 'content': 'hello'}
    ]
}

rec_res = session.post('http://127.0.0.1:8000/recommend', json=req_data)
print("Recommend status:", rec_res.status_code)
print("Recommend response:", rec_res.text)

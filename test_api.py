import requests
import json

session = requests.Session()
login_res = session.post('http://127.0.0.1:8000/auth/login', json={'email': 'testuser123@example.com', 'password': 'Password123'})
print("Login status:", login_res.status_code)

req_data = {
    'query': 'Recommend a sci-fi movie about time travel',
    'history': [
        {'id': '123', 'role': 'user', 'content': 'hello'}
    ]
}
rec_res = session.post('http://127.0.0.1:8000/recommend', json=req_data)
print("Recommend status:", rec_res.status_code)
print("Recommend response:", rec_res.text)

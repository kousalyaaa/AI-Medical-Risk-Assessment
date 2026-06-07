import requests
import json

BASE_URL = "http://localhost:8081"

def test_register():
    print("Testing registration...")
    data = {
        "email": "test@example.com",
        "password": "password123",
        "fullName": "Test User"
    }
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code == 201:
            return response.json()
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_login():
    print("\nTesting login...")
    data = {
        "email": "test@example.com",
        "password": "password123"
    }
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_me(token):
    print("\nTesting /me endpoint...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    # Test login (user already exists)
    login_result = test_login()
    if login_result:
        token = login_result.get('access_token')
        # Test /me
        test_me(token)
    else:
        print("Login failed")

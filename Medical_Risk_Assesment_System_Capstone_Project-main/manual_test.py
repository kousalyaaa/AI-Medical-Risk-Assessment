import requests
import json
import time
import sys
import os
import random

BASE_URL = "http://localhost:5000"
TEST_EMAIL = f"testuser{random.randint(10000, 99999)}@gmail.com"
TEST_PASSWORD = "password123"

print(f"Testing against {BASE_URL}")

print("\n" + "=" * 60)
print("TEST 1: REGISTER USER")
print("=" * 60)
try:
    resp = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "fullName": "Test User"}
    )
    print(f"Status: {resp.status_code}")
    if resp.status_code == 201:
        data = resp.json()
        print(f"✓ User registered! ID: {data['user_id']}")
        token = data['access_token']
    else:
        print(f"✗ Registration failed: {resp.text}")
        sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

print("\n" + "=" * 60)
print("TEST 2: VERIFY AUTH (/api/auth/me)")
print("=" * 60)
try:
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"✓ Auth verified!")
    else:
        print(f"✗ Auth check failed: {resp.text}")
except Exception as e:
    print(f"✗ Error: {e}")

print("\nTests completed.")

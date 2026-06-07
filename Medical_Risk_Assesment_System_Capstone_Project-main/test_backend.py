#!/usr/bin/env python3
"""
Comprehensive backend testing script
Tests all endpoints for diet plan and lifestyle generation
"""
import requests
import json
import time
import subprocess
import sys
import os

# Start backend in background
print("=" * 60)
print("STARTING BACKEND SERVER...")
print("=" * 60)
backend_proc = subprocess.Popen(
    [sys.executable, "backend/app.py"],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL
)

# Wait for server to start
time.sleep(3)

BASE_URL = "http://localhost:5000"
import random
TEST_EMAIL = f"testuser{random.randint(10000, 99999)}@gmail.com"
TEST_PASSWORD = "password123"

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
print("TEST 2: LOGIN USER")
print("=" * 60)
try:
    resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"✓ Login successful!")
        print(f"  User ID: {data['user_id']}")
        print(f"  Token: {data['access_token'][:50]}...")
        token = data['access_token']
    else:
        print(f"✗ Login failed: {resp.text}")
        sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)

print("\n" + "=" * 60)
print("TEST 3: VERIFY AUTH (/api/auth/me)")
print("=" * 60)
try:
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"✓ Auth verified!")
        print(f"  Response: {json.dumps(data, indent=2)}")
    else:
        print(f"✗ Auth check failed: {resp.text}")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 60)
print("TEST 4: CREATE ASSESSMENT")
print("=" * 60)
try:
    headers = {"Authorization": f"Bearer {token}"}
    assessment_data = {
        "assessment_type": "heart",
        "risk_level": "low",
        "risk_score": 25,
        "input_data": {
            "age": "45",
            "sex": "male",
            "cp": "typical",
            "trestbps": "120",
            "chol": "200",
            "fbs": "no",
            "restecg": "normal",
            "thalach": "150",
            "exang": "no",
            "oldpeak": "0.0",
            "slope": "upsloping",
            "ca": "0",
            "thal": "normal"
        }
    }
    resp = requests.post(
        f"{BASE_URL}/api/assessments",
        json=assessment_data,
        headers=headers
    )
    print(f"Status: {resp.status_code}")
    if resp.status_code == 201:
        data = resp.json()
        print(f"✓ Assessment created!")
        print(f"  Assessment ID: {data['id']}")
        assessment_id = data['id']
    else:
        print(f"✗ Assessment creation failed: {resp.text}")
        assessment_id = None
except Exception as e:
    print(f"✗ Error: {e}")
    assessment_id = None

print("\n" + "=" * 60)
print("TEST 5: GENERATE DIET PLAN")
print("=" * 60)
print("⏳ This may take 10-20 seconds (GROQ API is slow)...")
try:
    headers = {"Authorization": f"Bearer {token}"}
    diet_data = {}
    if assessment_id:
        diet_data["assessmentId"] = assessment_id
    
    print(f"\nRequest payload: {json.dumps(diet_data, indent=2)}")
    print("Sending request...")
    
    start_time = time.time()
    resp = requests.post(
        f"{BASE_URL}/api/diet-plans/generate",
        json=diet_data,
        headers=headers,
        timeout=30
    )
    elapsed = time.time() - start_time
    
    print(f"Status: {resp.status_code} (took {elapsed:.2f}s)")
    print(f"Response headers: {dict(resp.headers)}")
    
    if resp.status_code == 201:
        data = resp.json()
        print(f"✓ Diet plan generated!")
        print(f"  Plan ID: {data.get('id', 'N/A')}")
        print(f"  Plan preview: {data.get('plan_content', 'N/A')[:200]}...")
    else:
        print(f"✗ Diet plan generation failed!")
        print(f"   Status Code: {resp.status_code}")
        print(f"   Response: {resp.text}")
        try:
            print(f"   JSON: {json.dumps(resp.json(), indent=2)}")
        except:
            pass
except requests.exceptions.Timeout:
    print(f"✗ Request timeout (GROQ API took too long)")
except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {e}")

print("\n" + "=" * 60)
print("TEST 6: GENERATE LIFESTYLE ANALYSIS")
print("=" * 60)
print("⏳ This may take 10-20 seconds (GROQ API is slow)...")
try:
    headers = {"Authorization": f"Bearer {token}"}
    lifestyle_data = {}
    if assessment_id:
        lifestyle_data["assessmentId"] = assessment_id
    
    print(f"\nRequest payload: {json.dumps(lifestyle_data, indent=2)}")
    print("Sending request...")
    
    start_time = time.time()
    resp = requests.post(
        f"{BASE_URL}/api/lifestyle-analyses/generate",
        json=lifestyle_data,
        headers=headers,
        timeout=30
    )
    elapsed = time.time() - start_time
    
    print(f"Status: {resp.status_code} (took {elapsed:.2f}s)")
    print(f"Response headers: {dict(resp.headers)}")
    
    if resp.status_code == 201:
        data = resp.json()
        print(f"✓ Lifestyle analysis generated!")
        print(f"  Analysis ID: {data.get('id', 'N/A')}")
        print(f"  Analysis preview: {data.get('analysis_content', 'N/A')[:200]}...")
    else:
        print(f"✗ Lifestyle analysis generation failed!")
        print(f"   Status Code: {resp.status_code}")
        print(f"   Response: {resp.text}")
        try:
            print(f"   JSON: {json.dumps(resp.json(), indent=2)}")
        except:
            pass
except requests.exceptions.Timeout:
    print(f"✗ Request timeout (GROQ API took too long)")
except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {e}")

print("\n" + "=" * 60)
print("CLEANUP")
print("=" * 60)
backend_proc.terminate()
print("✓ Backend stopped")
print("=" * 60)

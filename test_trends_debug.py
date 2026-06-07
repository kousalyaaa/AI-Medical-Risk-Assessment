#!/usr/bin/env python3
"""
Script to test the trends API and debug the assessment/trends data flow
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000"

# Test user credentials
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpass123"

def sign_up(email, password):
    """Register a test user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": email, "password": password}
    )
    print(f"\n[SIGNUP] Status: {response.status_code}")
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        return data.get('access_token')
    except:
        print(f"Response text: {response.text}")
        return None

def sign_in(email, password):
    """Sign in a user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password}
    )
    print(f"\n[SIGNIN] Status: {response.status_code}")
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        return data.get('access_token')
    except:
        print(f"Response text: {response.text}")
        return None

def create_assessment(token, assessment_data):
    """Create a test assessment"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/api/assessments",
        json=assessment_data,
        headers=headers
    )
    print(f"\n[CREATE_ASSESSMENT] Status: {response.status_code}")
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        return data.get('_id')
    except:
        print(f"Response text: {response.text}")
        return None

def get_trends(token):
    """Fetch trends data"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{BASE_URL}/api/trends",
        headers=headers
    )
    print(f"\n[GET_TRENDS] Status: {response.status_code}")
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        return data
    except:
        print(f"Response text: {response.text}")
        return None

def debug_assessments_count(token):
    """Check the debug endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{BASE_URL}/api/debug/assessments-count",
        headers=headers
    )
    print(f"\n[DEBUG_ASSESSMENTS_COUNT] Status: {response.status_code}")
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        return data
    except:
        print(f"Response text: {response.text}")
        return None

def main():
    print("=" * 80)
    print("TESTING TRENDS API DATA FLOW")
    print("=" * 80)
    
    # Try to sign in first (in case user exists)
    print("\n[STEP 1] Attempting to sign in...")
    token = sign_in(TEST_USER_EMAIL, TEST_USER_PASSWORD)
    
    # If sign in fails, try to sign up
    if not token:
        print("\n[STEP 2] Sign in failed, attempting to sign up...")
        token = sign_up(TEST_USER_EMAIL, TEST_USER_PASSWORD)
    
    if not token:
        print("\n❌ Failed to get authentication token!")
        return
    
    print(f"\n✅ Got token: {token[:20]}...")
    
    # Check initial assessment count
    print("\n[STEP 3] Checking initial assessment count...")
    debug_data = debug_assessments_count(token)
    
    # Create a test assessment
    print("\n[STEP 4] Creating a test assessment...")
    assessment_data = {
        "age": 45,
        "gender": "male",
        "height": 180,
        "weight": 80,
        "glucose": 110,
        "blood_pressure": "130/85",
        "cholesterol": 200,
        "smoking_status": "never",
        "exercise_frequency": "3-4 times a week",
        "family_history": "diabetes",
        "assessment_type": "stroke"  
    }
    assessment_id = create_assessment(token, assessment_data)
    
    # Check assessment count after creation
    print("\n[STEP 5] Checking assessment count after creation...")
    debug_data = debug_assessments_count(token)
    
    # Fetch trends
    print("\n[STEP 6] Fetching trends data...")
    trends_data = get_trends(token)
    
    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)
    
    # Summary
    if trends_data and trends_data.get('timeline'):
        print(f"\n✅ SUCCESS: Got {len(trends_data['timeline'])} assessment records in trends!")
    else:
        print("\n❌ FAILURE: Trends endpoint returned no data!")

if __name__ == "__main__":
    main()

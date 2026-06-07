#!/usr/bin/env python3
"""Test GROQ API directly to debug the issue"""
import requests
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

print(f"GROQ API Key: {GROQ_API_KEY[:20]}..." if GROQ_API_KEY else "NO KEY FOUND")
print(f"GROQ URL: {GROQ_API_URL}")

if not GROQ_API_KEY:
    print("ERROR: GROQ_API_KEY not found in .env!")
    exit(1)

print("\n" + "=" * 60)
print("Testing GROQ API Models...")
print("=" * 60)

models_to_test = [
    'llama-3.1-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
    'gemma-7b-it',
]

test_prompt = "Hello, how are you?"

for model in models_to_test:
    print(f"\nTesting model: {model}")
    try:
        response = requests.post(
            GROQ_API_URL,
            headers={
                'Authorization': f'Bearer {GROQ_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': model,
                'messages': [{'role': 'user', 'content': test_prompt}],
                'temperature': 0.7,
                'max_tokens': 100,
                'stream': False
            },
            timeout=10
        )
        
        print(f"  Status: {response.status_code}")
        print(f"  Response: {response.text[:200]}")
        
        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content'].strip()
            print(f"  ✓ SUCCESS! Response: {content[:100]}")
            break
        elif response.status_code == 400:
            print(f"  ✗ Bad Request - Model might not exist or invalid request")
        elif response.status_code == 401:
            print(f"  ✗ Unauthorized - Invalid API key")
        else:
            print(f"  ✗ Error")
            
    except Exception as e:
        print(f"  ✗ Exception: {e}")

print("\n" + "=" * 60)
print("Testing with longer prompt...")
print("=" * 60)

long_prompt = """Generate a simple diet plan. Include breakfast, lunch, and dinner suggestions."""

try:
    response = requests.post(
        GROQ_API_URL,
        headers={
            'Authorization': f'Bearer {GROQ_API_KEY}',
            'Content-Type': 'application/json'
        },
        json={
            'model': 'llama-3.1-70b-versatile',
            'messages': [{'role': 'user', 'content': long_prompt}],
            'temperature': 0.7,
            'max_tokens': 500,
            'stream': False
        },
        timeout=20
    )
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ SUCCESS!")
        print(f"Response: {data['choices'][0]['message']['content'][:300]}")
    else:
        print(f"✗ Failed: {response.text}")
        
except Exception as e:
    print(f"✗ Exception: {e}")

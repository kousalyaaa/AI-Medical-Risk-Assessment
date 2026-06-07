import requests
import json

f = 'C:/Windows/Web/Wallpaper/Windows/img0.jpg'
try:
    with open(f, 'rb') as file:
        r = requests.post(
            'http://localhost:5000/api/ocr/parse',
            files={'file': file},
            timeout=10
        )
    print('Status:', r.status_code)
    print('Response:')
    print(json.dumps(r.json(), indent=2))
except Exception as e:
    print('ERROR:', e)

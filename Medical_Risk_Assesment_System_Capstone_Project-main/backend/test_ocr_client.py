from PIL import Image, ImageDraw, ImageFont
import tempfile
import requests
import os

# Create a simple image with lab values
img = Image.new('RGB', (800, 200), color=(255, 255, 255))
d = ImageDraw.Draw(img)
text = "Glucose: 150 mg/dL\nHbA1c: 6.5%\nTotal Cholesterol: 190 mg/dL"
# Use default font
try:
    font = ImageFont.truetype('arial.ttf', 24)
except Exception:
    font = ImageFont.load_default()

d.text((10, 10), text, fill=(0, 0, 0), font=font)

with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp:
    img_path = tmp.name
    img.save(img_path)

print('Saved test image to', img_path)

# Post to OCR endpoint
url = 'http://127.0.0.1:5000/api/ocr/parse'
files = {'file': open(img_path, 'rb')}
try:
    resp = requests.post(url, files=files, timeout=30)
    print('Status:', resp.status_code)
    try:
        print('JSON:', resp.json())
    except Exception:
        print('Text:', resp.text)
except Exception as e:
    print('Request failed:', str(e))
finally:
    try:
        files['file'].close()
    except Exception:
        pass
    try:
        os.remove(img_path)
    except Exception:
        pass

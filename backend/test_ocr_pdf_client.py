from PIL import Image, ImageDraw, ImageFont
import tempfile
import requests
import os

# Create an image and save as PDF
img = Image.new('RGB', (800, 200), color=(255, 255, 255))
d = ImageDraw.Draw(img)
text = "Glucose: 140 mg/dL\nHbA1c: 6.2%\nTotal Cholesterol: 185 mg/dL"
try:
    font = ImageFont.truetype('arial.ttf', 24)
except Exception:
    font = ImageFont.load_default()

d.text((10, 10), text, fill=(0, 0, 0), font=font)

with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
    pdf_path = tmp.name
    img.save(pdf_path, "PDF", resolution=100.0)

print('Saved test PDF to', pdf_path)

url = 'http://127.0.0.1:5000/api/ocr/parse'
files = {'file': open(pdf_path, 'rb')}
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
        os.remove(pdf_path)
    except Exception:
        pass

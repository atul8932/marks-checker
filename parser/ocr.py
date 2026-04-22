from PIL import Image
import pytesseract
import sys

def ocr_img(path):
    print("Reading:", path)
    text = pytesseract.image_to_string(Image.open(path))
    print(text)
    print("="*40)

ocr_img("/home/neo/.gemini/antigravity/brain/a577ef72-8dea-4700-9020-ed2418a778b5/media__1776848088597.png")
ocr_img("/home/neo/.gemini/antigravity/brain/a577ef72-8dea-4700-9020-ed2418a778b5/media__1776848103991.png")

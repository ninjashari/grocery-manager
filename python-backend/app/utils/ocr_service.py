import pytesseract
import cv2
import numpy as np
from PIL import Image
import base64
import io
from typing import Optional, Tuple

class OCRService:
    
    def __init__(self):
        # Configure tesseract if needed
        # pytesseract.pytesseract.tesseract_cmd = r'/usr/bin/tesseract'  # Uncomment and adjust path if needed
        pass
    
    def extract_text_from_base64(self, base64_image: str) -> Tuple[str, float]:
        """Extract text from base64 encoded image"""
        try:
            # Remove data URL prefix if present
            if ',' in base64_image:
                base64_image = base64_image.split(',')[1]
            
            # Decode base64 to bytes
            image_bytes = base64.b64decode(base64_image)
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Preprocess image for better OCR
            processed_image = self._preprocess_image(image)
            
            # Extract text using tesseract
            text = pytesseract.image_to_string(processed_image, lang='eng', config='--psm 6')
            
            # Get confidence score
            confidence = self._get_confidence(processed_image)
            
            return text, confidence
            
        except Exception as e:
            print(f"OCR Error: {e}")
            return "", 0.0
    
    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """Preprocess image to improve OCR accuracy"""
        try:
            # Convert to RGB if not already
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to numpy array
            img_array = np.array(image)
            
            # Convert to grayscale
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (1, 1), 0)
            
            # Apply threshold to get better contrast
            _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Morphological operations to clean up
            kernel = np.ones((1, 1), np.uint8)
            processed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            processed = cv2.morphologyEx(processed, cv2.MORPH_OPEN, kernel)
            
            # Convert back to PIL Image
            return Image.fromarray(processed)
            
        except Exception as e:
            print(f"Image preprocessing error: {e}")
            return image
    
    def _get_confidence(self, image: Image.Image) -> float:
        """Get OCR confidence score"""
        try:
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            
            if confidences:
                return sum(confidences) / len(confidences) / 100.0  # Normalize to 0-1
            else:
                return 0.0
                
        except Exception as e:
            print(f"Confidence calculation error: {e}")
            return 0.0
    
    def extract_text_enhanced(self, base64_image: str) -> Tuple[str, float]:
        """Enhanced text extraction with multiple OCR configurations"""
        try:
            # Remove data URL prefix if present
            if ',' in base64_image:
                base64_image = base64_image.split(',')[1]
            
            # Decode base64 to bytes
            image_bytes = base64.b64decode(base64_image)
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Try different OCR configurations
            configs = [
                '--psm 6',  # Uniform block of text
                '--psm 4',  # Single column of text
                '--psm 3',  # Fully automatic page segmentation
                '--psm 8',  # Single word
            ]
            
            best_text = ""
            best_confidence = 0.0
            
            for config in configs:
                try:
                    processed_image = self._preprocess_image(image)
                    text = pytesseract.image_to_string(processed_image, lang='eng', config=config)
                    confidence = self._get_confidence(processed_image)
                    
                    # Choose the result with highest confidence and reasonable length
                    if confidence > best_confidence and len(text.strip()) > len(best_text.strip()):
                        best_text = text
                        best_confidence = confidence
                        
                except Exception as e:
                    print(f"OCR config {config} failed: {e}")
                    continue
            
            return best_text if best_text else "", best_confidence
            
        except Exception as e:
            print(f"Enhanced OCR Error: {e}")
            return "", 0.0
import google.generativeai as genai
import json
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

model = genai.GenerativeModel('gemini-2.5-flash')

def clean_json(text):
    """Helper to strip markdown from JSON response"""
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)

async def generate_syllabus(topic: str):
    prompt = f"""
    Create a short, intensive micro-course syllabus for: "{topic}".
    Generate exactly 4 distinct Modules (Chapters).
    
    Return ONLY valid JSON in this format:
    [
      {{"title": "Module 1: Name", "description": "Short summary"}},
      {{"title": "Module 2: Name", "description": "Short summary"}}
    ]
    """
    response = model.generate_content(prompt)
    return clean_json(response.text)

async def generate_chapter(topic: str, chapter_title: str):
    prompt = f"""
    You are an expert tutor teaching "{topic}". 
    Write a specific lesson for the chapter: "{chapter_title}".
    
    1. Content: Engaging, concise (approx 300 words). Use Markdown formatting.
    2. Quiz: 2 multiple choice questions to test understanding.
    3. Adaptive Explanation: For every question, provide an explanation of WHY the answer is correct.
    
    Return ONLY valid JSON:
    {{
      "content": "markdown string here...",
      "quiz": [
        {{
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C"],
          "correct_index": 0,
          "explanation": "It is A because..."
        }}
      ]
    }}
    """
    response = model.generate_content(prompt)
    return clean_json(response.text)
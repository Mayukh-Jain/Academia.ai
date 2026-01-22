import edge_tts
import json
import google.generativeai as genai
import os

# Generate the Script
async def generate_script(text_content: str):
    model = genai.GenerativeModel('deep-research-pro-preview-12-2025')
    
    # Strict prompt to force JSON output
    prompt = f"""
    Turn the following academic text into a 2-person podcast script between 'Host' (enthusiastic) and 'Expert' (calm).
    Return the output STRICTLY as a JSON list of objects. No markdown formatting.
    Format: [{{"speaker": "Host", "text": "..."}}, {{"speaker": "Expert", "text": "..."}}]
    
    Text: {text_content[:5000]} 
    """
    
    response = model.generate_content(prompt)
    clean_text = response.text.replace("```json", "").replace("```", "")
    return json.loads(clean_text)

# Generate the Audio
async def create_podcast_audio(script, output_file="podcast.mp3"):
    voices = {
        "Host": "en-US-GuyNeural",
        "Expert": "en-US-AriaNeural"
    }
    
    final_audio = b""
    
    for line in script:
        speaker = line.get("speaker", "Host")
        text = line.get("text", "")
        voice = voices.get(speaker, voices["Host"])
        
        # Generate audio segment
        communicate = edge_tts.Communicate(text, voice)
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                final_audio += chunk["data"]
                
    # Save to file
    with open(output_file, "wb") as f:
        f.write(final_audio)
    
    return output_file
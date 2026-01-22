import uuid
import os
import shutil
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from pypdf import PdfReader
import io
import uvicorn
from supabase import create_client, Client
from dotenv import load_dotenv
from fastapi import Form

import rag
import podcast
import coursegen

load_dotenv()
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
API_URL = "http://localhost:8000"

# ENSURE DIRECTORIES EXIST
os.makedirs("static/uploads", exist_ok=True)
os.makedirs("static", exist_ok=True)

app = FastAPI(title="Academia.AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REQUEST MODELS ---
class ChatRequest(BaseModel):
    query: str
    selected_files: list[str] = []

class PodcastRequest(BaseModel):
    topic: str
    user_id: str

class CourseRequest(BaseModel):
    topic: str

class ChapterRequest(BaseModel):
    topic: str
    chapter_title: str

class DeleteRequest(BaseModel):
    filename: str
    user_id: str

# --- ENDPOINTS ---

@app.get("/")
def home():
    return {"message": "Academia.AI Brain is Active"}

# 1. Upload PDF (UPDATED: Saves file to disk now)
# ... inside main.py ...

# Add Form to imports if missing: from fastapi import Form

@app.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...), 
    user_id: str = Form(...) # <--- NEW: Accept User ID
):
    # 1. Read & Save File
    content = await file.read()
    file_path = f"static/uploads/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(content)

    # 2. Extract Text
    pdf_reader = PdfReader(io.BytesIO(content))
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() or ""
    
    if not text.strip():
        return {"status": "warning", "message": "File saved, but no text found."}
    
    # 3. Store in DB with the User ID immediately
    # We pass the real user_id now, so it's never NULL
    rag.store_document(text, file.filename, user_id) 
    
    return {"status": "success", "filename": file.filename}

# 2. Delete PDF (NEW)
@app.post("/delete-pdf")
def delete_pdf(request: DeleteRequest):
    try:
        # A. Delete from Supabase
        # Note: We need to match metadata->>filename. 
        # Since Supabase Python client is basic, we use raw SQL or specific filter
        response = supabase.table("documents").delete().eq("user_id", request.user_id).contains("metadata", {"filename": request.filename}).execute()
        
        # B. Delete from Disk
        file_path = f"static/uploads/{request.filename}"
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return {"message": f"Deleted {request.filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ... (Keep Chat, Podcast, Course endpoints exactly as they were) ...
@app.post("/chat")
def chat(request: ChatRequest):
    answer = rag.ask_gemini(request.query, request.selected_files)
    return {"response": answer}

@app.post("/generate-podcast")
async def generate_podcast(request: PodcastRequest, background_tasks: BackgroundTasks):
    file_id = str(uuid.uuid4())
    filename = f"podcast_{file_id}.mp3"
    file_path = f"static/{filename}"
    async def task_wrapper():
        try:
            context = rag.ask_gemini(f"Explain this topic in depth: {request.topic}")
            script = await podcast.generate_script(context)
            await podcast.create_podcast_audio(script, file_path)
            supabase.table("podcasts").insert({
                "user_id": request.user_id, "topic": request.topic, "file_url": f"{API_URL}/static/{filename}"
            }).execute()
        except Exception as e: print(f"Podcast failed: {e}")
    background_tasks.add_task(task_wrapper)
    return {"status": "started"}

@app.post("/create-course")
async def create_course(request: CourseRequest):
    return {"syllabus": await coursegen.generate_syllabus(request.topic)}

@app.post("/get-chapter")
async def get_chapter(request: ChapterRequest):
    return await coursegen.generate_chapter(request.topic, request.chapter_title)
# --- STATIC FILES ---
# Serves both the generated podcasts AND the uploaded PDFs
app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
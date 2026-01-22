import os
import json
import time
import random
import google.generativeai as genai
from google.api_core import exceptions
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# USE STABLE MODEL
model = genai.GenerativeModel('deep-research-pro-preview-12-2025')

# --- HELPER: AUTO-RETRY (Crucial for stability) ---
def generate_with_retry(prompt, retries=3):
    """
    Tries to generate content. If rate limit is hit, waits and tries again.
    """
    for i in range(retries):
        try:
            return model.generate_content(prompt)
        except exceptions.ResourceExhausted:
            wait_time = 2 ** (i + 1) + random.random() # Exponential backoff: 2s, 4s, 8s
            print(f"⚠️ Quota hit. Sleeping for {wait_time:.2f}s...")
            time.sleep(wait_time)
        except Exception as e:
            print(f"Error during generation: {e}")
            return None
    print("❌ Failed to generate after retries.")
    return None

# --- HELPER: Extract Entities (Graph Builder) ---
def extract_graph_entities(text: str):
    """Asks LLM to find concepts and relationships"""
    prompt = f"""
    Analyze this text and extract key concepts and their relationships.
    Return JSON ONLY: {{ "entities": ["ConceptA", "ConceptB"], "relationships": [{{"source": "ConceptA", "target": "ConceptB", "relation": "implies"}}] }}
    Text: {text[:2000]}
    """
    try:
        # Use retry logic here to prevent upload crashes
        response = generate_with_retry(prompt)
        if not response: return {"entities": [], "relationships": []}
        
        clean_json = response.text.replace("```json", "").replace("```", "")
        return json.loads(clean_json)
    except:
        return {"entities": [], "relationships": []}

# --- 1. INGESTION (Builds Graph + Vector) ---
def store_document(text: str, filename: str, user_id: str = None):
    # A. Standard Vector Store
    try:
        vector = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document"
        )['embedding']
        
        doc_res = supabase.table("documents").insert({
            "content": text,
            "metadata": {"filename": filename},
            "embedding": vector,
            "user_id": user_id # This sends NULL if user_id is None
        }).execute()
        
        print(f"✅ Stored document: {filename}")
        
        # B. Graph Construction (The "Resume Flex")
        # We allow this to fail silently to keep upload speed high
        try:
            graph_data = extract_graph_entities(text)
            
            # Insert Nodes (Concepts)
            for entity in graph_data.get("entities", []):
                # Simple check to avoid duplicates
                # (In production, use upsert. Here we catch errors if it exists)
                try:
                    supabase.table("graph_nodes").insert({"name": entity}).execute()
                except:
                    pass 
        except Exception as e:
            print(f"Graph build skipped: {e}")

    except Exception as e:
        print(f"❌ Error storing document: {e}")
        # We don't raise here to avoid crashing the whole upload endpoint

# --- 2. SEARCH (Multi-PDF + Graph Query Expansion) ---
def ask_gemini(query: str, selected_files: list[str] = []):
    # A. Vector Search with Filter
    query_vector = genai.embed_content(
        model="models/text-embedding-004",
        content=query,
        task_type="retrieval_query"
    )['embedding']

    # Call the SQL function with the file list
    response = supabase.rpc(
        "match_documents",
        {
            "query_embedding": query_vector,
            "match_threshold": 0.5,
            "match_count": 5,
            "filter_filenames": selected_files 
        }
    ).execute()
    
    # Handle empty results
    if not response.data:
        return "I couldn't find any relevant information in your documents."

    context_text = "\n\n".join([doc['content'] for doc in response.data])
    
    # C. Final Answer
    prompt = f"""
    You are an intelligent research assistant. 
    User selected these files to focus on: {selected_files if selected_files else "All Library"}.
    Answer based ONLY on the context provided.
    
    Context:
    {context_text}
    
    Question: {query}
    """
    
    # Use retry logic for the final answer
    answer = generate_with_retry(prompt)
    
    return answer.text if answer else "I'm having trouble connecting to the AI brain right now. Please try again."
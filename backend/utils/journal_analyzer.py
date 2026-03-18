import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

def generate_journal_summary(history_entries):
    if not history_entries:
        return "Your cinematic journal is empty. Start watching and reviewing movies to see your journey!"

    api_key = os.getenv("GROQ_API_KEY")
    llm = ChatGroq(
        model="qwen/qwen3-32b",
        api_key=api_key,
        temperature=0.7
    )

    # Format the history for the prompt
    history_text = ""
    for entry in history_entries[:10]: # Analyze last 10 entries
        # Robustly handle both SQLAlchemy objects and dictionaries
        title = getattr(entry, 'title', entry.get('title') if isinstance(entry, dict) else 'Unknown')
        rating = getattr(entry, 'rating', entry.get('rating', None) if isinstance(entry, dict) else None)
        notes = getattr(entry, 'notes', entry.get('notes', None) if isinstance(entry, dict) else None)
        
        rating_str = f"Rated {rating}/5" if rating else "No rating"
        note_str = f"Notes: {notes}" if notes else "No notes"
        history_text += f"- {title} ({rating_str}). {note_str}\n"

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a poetic and deeply insightful film critic and therapist. 
        Analyze the user's recent movie watching history and their notes.
        Generate a 'Cinematic Emotional Wrap-up' that summarizes their 'phase' or mood.
        Be atmospheric, use cinematic metaphors, and keep it under 100 words.
        If they have ratings, mention the overall quality of their journey.
        Format with a title like 'YOUR CURRENT VIBE: [VIBE NAME]' followed by the summary.
        DO NOT include any internal thought processes or <think> tags in your output. Output ONLY the summary."""),
        ("user", f"Here is my recent watch history:\n{history_text}")
    ])

    chain = prompt | llm
    response = chain.invoke({})
    content = response.content

    # Clean up <think> tags if the model still includes them
    if "<think>" in content and "</think>" in content:
        content = content.split("</think>")[-1].strip()
    elif "</think>" in content:
        content = content.split("</think>")[-1].strip()

    return content

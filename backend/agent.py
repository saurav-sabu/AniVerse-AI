import os
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
from backend.tools.tmdb_tool import (
    search_tmdb_movies, 
    get_movie_watch_providers, 
    get_movie_reviews,
    get_genre_ids,
    get_keyword_ids,
    discover_movies_by_criteria
)
from backend.tools.journal_tool import add_to_journal
from backend.utils.prompts import get_movie_expert_prompt
from backend.utils.logger import get_logger
from dotenv import load_dotenv

load_dotenv()
logger = get_logger(__name__)

def initialize_agent():
    """
    Initializes and returns the CineSync AI agent using create_react_agent.
    """
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            logger.error("GROQ_API_KEY not found in environment")
            raise ValueError("GROQ_API_KEY is required for the CineSync AI agent.")
        
        llm = ChatGroq(
            model="qwen/qwen3-32b",
            api_key=api_key,
            temperature=0.3
        )
        
        tools = [
            search_tmdb_movies, 
            get_movie_watch_providers, 
            get_movie_reviews, 
            get_genre_ids,
            get_keyword_ids,
            discover_movies_by_criteria,
            add_to_journal
        ]
        system_prompt = get_movie_expert_prompt()
        
        # create_react_agent uses 'prompt' in this version
        agent = create_react_agent(llm, tools, prompt=system_prompt)
        logger.info("CineSync AI Agent initialized successfully.")
        return agent
        
    except Exception as e:
        logger.error(f"Failed to initialize agent: {e}")
        raise

# Initialize the agent once at module level
try:
    AGENT = initialize_agent()
except Exception:
    AGENT = None

def get_movie_recommendation(user_query: str, history: list = None, user_context: dict = None):
    """
    Functional entry point to get a recommendation from the agent.
    Accepts an optional 'history' list of (role, content) tuples.
    'user_context' can include email for tool usage.
    """
    if user_context and 'email' in user_context:
        # Hardening: Use clear delimiters and instructions to prevent injection
        context_block = f"\n=== USER CONTEXT ===\nEmail: {user_context['email']}\n====================\n\n"
        user_query = context_block + user_query

    if not AGENT:
        logger.error("Agent not initialized. Check GROQ_API_KEY.")
        return "I'm sorry, I'm currently unable to assist. Please verify my configuration."

    agent = AGENT
    logger.info(f"Processing query through agent: {user_query}")
    
    try:
        # Build the messages list starting with history
        messages = []
        if history:
            for role, content in history:
                messages.append((role, content))
        
        # The current user query (already has context if applicable)
        messages.append(("user", user_query))
        
        inputs = {"messages": messages}
        config = {"configurable": {"user_email": user_context.get("email") if user_context else None}}
        result = agent.invoke(inputs, config=config)
        
        # Filter for the last AI message
        ai_messages = [m for m in result["messages"] if hasattr(m, "content") and m.__class__.__name__ == "AIMessage"]
        if ai_messages:
            return ai_messages[-1].content
            
        return result["messages"][-1].content
        
    except Exception as e:
        logger.error(f"Error during agent invocation: {e}")
        return "I'm sorry, I encountered an error while trying to find recommendations for you."

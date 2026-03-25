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

# Singleton for the agent
_AGENT = None

def get_agent():
    """
    Lazy initialization of the agent.
    """
    global _AGENT
    if _AGENT is None:
        try:
            _AGENT = initialize_agent()
        except Exception as e:
            logger.error(f"Lazy agent initialization failed: {e}")
    return _AGENT

def get_movie_recommendation(user_query: str, history: list = None, user_context: dict = None):
    """
    Functional entry point to get a recommendation from the agent.
    Accepts an optional 'history' list of (role, content) tuples.
    'user_context' can include email for tool usage.
    """
    agent = get_agent()
    if not agent:
        logger.error("Agent not initialized. Check GROQ_API_KEY.")
        return "I'm sorry, I'm currently unable to assist. Please verify my configuration."
    logger.info(f"Processing query through agent: {user_query}")
    
    # Retry logic for the agent invocation to handle rate limits (429)
    max_attempts = 3
    attempt_delay = 5 # Initial delay
    
    for attempt in range(max_attempts):
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
            error_str = str(e).lower()
            # If it's a rate limit error (429) or a server error (500+), retry
            if ("rate limit" in error_str or "429" in error_str or "500" in error_str or "503" in error_str) and attempt < max_attempts - 1:
                import time
                logger.warning(f"AI Agent rate limit or server error (attempt {attempt + 1}): {e}. Retrying in {attempt_delay}s...")
                time.sleep(attempt_delay)
                attempt_delay *= 2
                continue
                
            logger.error(f"Error during agent invocation after {attempt + 1} attempts: {e}")
            return "I'm sorry, I encountered an error while trying to find recommendations for you. Please try again in a moment."

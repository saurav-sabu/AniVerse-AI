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

def get_movie_recommendation(user_query: str, history: list = None, user_context: dict = None):
    """
    Functional entry point to get a recommendation from the agent.
    Accepts an optional 'history' list of (role, content) tuples.
    'user_context' can include email for tool usage.
    """
    agent = initialize_agent()
    logger.info(f"Processing query through agent: {user_query}")
    
    try:
        # Build the messages list starting with history
        messages = []
        if history:
            for role, content in history:
                messages.append((role, content))
        
        # Add user context to the first system message or a separate note
        if user_context and 'email' in user_context:
            user_query = f"[User Context: {user_context['email']}]\n\n" + user_query
            
        # Add the current user query
        messages.append(("user", user_query))
        
        inputs = {"messages": messages}
        result = agent.invoke(inputs)
        
        # The last message in the state will be the AI's response
        return result["messages"][-1].content
        
    except Exception as e:
        logger.error(f"Error during agent invocation: {e}")
        return "I'm sorry, I encountered an error while trying to find recommendations for you."

import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

# We need a valid token to test /recommend
# Since I can't easily get a user token without login, I'll just check the agent directly
sys.path.append(os.getcwd())
from backend.agent import get_movie_recommendation

def inspect_agent_output():
    print("Requesting recommendation from agent...")
    query = "Recommend 3 space movies."
    response = get_movie_recommendation(query)
    print("RAW RESPONSE START:")
    print(response)
    print("RAW RESPONSE END")

if __name__ == "__main__":
    inspect_agent_output()

from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage, HumanMessage
from src.prompt_template import get_anime_prompt


def build_anime_retriever_tool(retriever):

    @tool
    def anime_retriever_tool(query: str):
        """
        Retrieves anime information from the vector database based on a user query.
        
        Args:
            query (str): The search query to find relevant anime documents.
        
        Returns:
            str: A formatted string containing the combined page content of retrieved documents,
                separated by double newlines.
        """
        docs = retriever.invoke(query)
        return "\n\n".join(doc.page_content for doc in docs)
    
    return anime_retriever_tool

class AnimeRecommendar:

    def __init__(self,retriever):

        self.retriever = retriever
        self.prompt_template = get_anime_prompt()
        self.llm = ChatGroq(model="qwen/qwen3-32b", temperature=0.2)

        self.anime_tool = build_anime_retriever_tool(self.retriever)

        self.chain_with_tools = self.llm.bind_tools([self.anime_tool])


    def get_recommendation(self,query):

        try:

            system_instruction = self.prompt_template.template

            messages = [
                SystemMessage(content=system_instruction),
                HumanMessage(content=query)
            ]

            ai_msg = self.chain_with_tools.invoke(messages)
            messages.append(ai_msg)

            if ai_msg.tool_calls:

                for tool_call in ai_msg.tool_calls:
                    tool_result = self.anime_tool.invoke(tool_call)
                    messages.append(tool_result)

                
                response = self.chain_with_tools.invoke(messages)
                return response.content
            
            return ai_msg.content
        
        except Exception as e:
            raise Exception(f"LLM recommendation failed: {e}")


from pydantic import BaseModel, Field
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., max_length=5000)

class RecommendRequest(BaseModel):
    query: str = Field(..., max_length=1000)
    history: Optional[List[ChatMessage]] = Field(None, max_length=20)

class RecommendResponse(BaseModel):
    response: str

from pydantic import BaseModel, EmailStr, ConfigDict

class UserBase(BaseModel):
    email: EmailStr

class UserPublic(BaseModel):
    id: int
    email: str

    model_config = ConfigDict(from_attributes=True)

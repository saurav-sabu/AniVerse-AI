from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr

class UserPublic(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True

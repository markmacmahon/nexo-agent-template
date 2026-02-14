import uuid

from fastapi_users import schemas
from pydantic import BaseModel
from uuid import UUID


class UserRead(schemas.BaseUser[uuid.UUID]):
    pass


class UserCreate(schemas.BaseUserCreate):
    pass


class UserUpdate(schemas.BaseUserUpdate):
    pass


class AppBase(BaseModel):
    name: str
    description: str | None = None


class AppCreate(AppBase):
    pass


class AppRead(AppBase):
    id: UUID
    user_id: UUID

    model_config = {"from_attributes": True}

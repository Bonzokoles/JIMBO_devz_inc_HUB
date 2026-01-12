from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class TwitterPublishRequest(BaseModel):
    text: str
    image_url: Optional[str] = None
    max_length: int = 280

class DevToPublishRequest(BaseModel):
    title: str
    body_markdown: str
    tags: List[str] = []
    main_image: Optional[str] = None
    published: bool = True

class BlogPublishRequest(BaseModel):
    title: str
    content: str
    excerpt: str
    cover_image: Optional[str] = None

class R2UploadRequest(BaseModel):
    file_path: str
    key: Optional[str] = None
    content_type: str = "image/png"

class PublishEverywhereRequest(BaseModel):
    article_markdown: str
    image_path: Optional[str] = None

class PublishResponse(BaseModel):
    id: str
    platform: str
    status: str  # success, failed, pending
    url: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime

class PublishHistoryItem(BaseModel):
    id: str
    platforms: List[str]
    title: str
    status: str
    urls: Dict[str, str]
    created_at: datetime

from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from datetime import datetime

from ..schemas_publishing import (
    TwitterPublishRequest,
    DevToPublishRequest,
    BlogPublishRequest,
    R2UploadRequest,
    PublishEverywhereRequest,
    PublishResponse,
    PublishHistoryItem
)
from ..services.twitter import TwitterService
from ..services.devto import DevToService
from ..services.r2 import R2Service
from ..services.blog import BlogService

router = APIRouter(prefix="/v1/publish", tags=["publishing"])

@router.post("/twitter", response_model=PublishResponse)
async def publish_to_twitter(request: TwitterPublishRequest):
    """Publish tweet to Twitter/X with optional image"""
    try:
        service = TwitterService()
        result = await service.publish(request.text, request.image_url)
        
        return PublishResponse(
            id=str(uuid.uuid4()),
            platform="twitter",
            status="success",
            url=result["url"],
            created_at=datetime.now()
        )
    except Exception as e:
        return PublishResponse(
            id=str(uuid.uuid4()),
            platform="twitter",
            status="failed",
            error=str(e),
            created_at=datetime.now()
        )

@router.post("/devto", response_model=PublishResponse)
async def publish_to_devto(request: DevToPublishRequest):
    """Publish article to Dev.to"""
    try:
        service = DevToService()
        result = await service.publish(
            request.title,
            request.body_markdown,
            request.tags,
            request.main_image,
            request.published
        )
        
        return PublishResponse(
            id=str(uuid.uuid4()),
            platform="devto",
            status="success",
            url=result["url"],
            created_at=datetime.now()
        )
    except Exception as e:
        return PublishResponse(
            id=str(uuid.uuid4()),
            platform="devto",
            status="failed",
            error=str(e),
            created_at=datetime.now()
        )

@router.post("/blog", response_model=PublishResponse)
async def publish_to_blog(request: BlogPublishRequest):
    """Publish article to blog via Cloudflare Worker"""
    try:
        service = BlogService()
        result = await service.publish(
            request.title,
            request.content,
            request.excerpt,
            request.cover_image
        )
        
        return PublishResponse(
            id=str(uuid.uuid4()),
            platform="blog",
            status="success",
            url=result["url"],
            created_at=datetime.now()
        )
    except Exception as e:
        return PublishResponse(
            id=str(uuid.uuid4()),
            platform="blog",
            status="failed",
            error=str(e),
            created_at=datetime.now()
        )

@router.post("/r2")
async def upload_to_r2(request: R2UploadRequest):
    """Upload file to Cloudflare R2 storage"""
    try:
        service = R2Service()
        url = await service.upload(
            request.file_path,
            request.key,
            request.content_type
        )
        
        return {
            "status": "success",
            "url": url,
            "key": request.key
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/everywhere", response_model=List[PublishResponse])
async def publish_everywhere(request: PublishEverywhereRequest):
    """
    Publish to all platforms (Twitter, Dev.to, Blog)
    
    Parses markdown article and publishes to:
    - R2 (image upload)
    - Blog (via Worker)
    - Dev.to
    - Twitter
    """
    try:
        results = []
        
        # Parse markdown
        article_data = _parse_markdown(request.article_markdown)
        
        # Upload image to R2 if provided
        image_url = None
        if request.image_path:
            r2_service = R2Service()
            image_url = await r2_service.upload(request.image_path)
        
        # 1. Publish to Blog
        try:
            blog_service = BlogService()
            blog_result = await blog_service.publish(
                article_data["title"],
                article_data["body"],
                article_data["description"],
                image_url
            )
            results.append(PublishResponse(
                id=str(uuid.uuid4()),
                platform="blog",
                status="success",
                url=blog_result["url"],
                created_at=datetime.now()
            ))
            blog_url = blog_result["url"]
        except Exception as e:
            results.append(PublishResponse(
                id=str(uuid.uuid4()),
                platform="blog",
                status="failed",
                error=str(e),
                created_at=datetime.now()
            ))
            blog_url = "https://www.mybonzo.com"
        
        # 2. Publish to Dev.to
        try:
            devto_service = DevToService()
            devto_result = await devto_service.publish(
                article_data["title"],
                article_data["body"],
                article_data.get("tags", []),
                image_url
            )
            results.append(PublishResponse(
                id=str(uuid.uuid4()),
                platform="devto",
                status="success",
                url=devto_result["url"],
                created_at=datetime.now()
            ))
        except Exception as e:
            results.append(PublishResponse(
                id=str(uuid.uuid4()),
                platform="devto",
                status="failed",
                error=str(e),
                created_at=datetime.now()
            ))
        
        # 3. Publish to Twitter
        try:
            twitter_service = TwitterService()
            tweet_text = _create_tweet_text(article_data, blog_url)
            twitter_result = await twitter_service.publish(tweet_text, image_url)
            results.append(PublishResponse(
                id=str(uuid.uuid4()),
                platform="twitter",
                status="success",
                url=twitter_result["url"],
                created_at=datetime.now()
            ))
        except Exception as e:
            results.append(PublishResponse(
                id=str(uuid.uuid4()),
                platform="twitter",
                status="failed",
                error=str(e),
                created_at=datetime.now()
            ))
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", response_model=List[PublishHistoryItem])
async def get_publish_history():
    """Get publishing history (TODO: implement database)"""
    # TODO: Query from database
    return []

def _parse_markdown(content: str) -> dict:
    """Parse markdown with frontmatter"""
    lines = content.split('\n')
    in_frontmatter = False
    frontmatter = {}
    body_lines = []
    
    for line in lines:
        if line.strip() == "---":
            in_frontmatter = not in_frontmatter
            continue
        
        if in_frontmatter:
            if ":" in line:
                key, value = line.split(":", 1)
                frontmatter[key.strip()] = value.strip().strip('"')
        else:
            body_lines.append(line)
    
    return {
        "title": frontmatter.get("title", "Untitled"),
        "description": frontmatter.get("description", ""),
        "tags": frontmatter.get("tags", "AI,DevOps,Automation").split(","),
        "body": "\n".join(body_lines).strip()
    }

def _create_tweet_text(article_data: dict, blog_url: str) -> str:
    """Create optimized tweet text"""
    title = article_data["title"]
    body = article_data["body"]
    
    # Clean markdown
    clean_body = body.replace("**", "").replace("__", "").replace("`", "").replace("#", "")
    preview = clean_body[:100] + "..." if len(clean_body) > 100 else clean_body
    
    tweet = f"{title} 🚀\n\n{preview}\n\n📖 Read: {blog_url}\n\n#AI #DevOps #Automation"
    
    # Trim to 280 chars
    if len(tweet) > 280:
        # Recalculate preview to fit
        max_preview = 280 - len(title) - len(blog_url) - 50  # 50 for formatting
        preview = clean_body[:max_preview] + "..."
        tweet = f"{title} 🚀\n\n{preview}\n\n📖 {blog_url}\n\n#AI"
    
    return tweet

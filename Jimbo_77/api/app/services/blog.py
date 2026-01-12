import os
import httpx
from typing import Optional

class BlogService:
    """Blog publishing service via Cloudflare Worker"""
    
    def __init__(self):
        self.worker_url = os.getenv(
            "BLOG_WORKER_URL",
            "https://mybonzo-blog-worker.stolarnia-ams.workers.dev"
        )
    
    async def publish(
        self,
        title: str,
        content: str,
        excerpt: str,
        cover_image: Optional[str] = None
    ) -> dict:
        """
        Publish article to blog via Worker API
        
        Args:
            title: Article title
            content: Article content (markdown)
            excerpt: Short description
            cover_image: Optional cover image URL
            
        Returns:
            dict with post_id and url
        """
        form_data = {
            'title': title,
            'content': content,
            'excerpt': excerpt
        }
        
        if cover_image:
            form_data['cover_image'] = cover_image
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.worker_url}/api/blog/upload",
                data=form_data
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                post_id = data.get("postId")
                return {
                    "post_id": post_id,
                    "url": f"https://www.mybonzo.com/posts/{post_id}"
                }
            else:
                raise Exception(f"Blog Worker error: {response.status_code} - {response.text}")

import os
import httpx
from typing import Optional, List

class DevToService:
    """Dev.to publishing service"""
    
    def __init__(self):
        self.api_key = os.getenv("DEVTO_API_KEY")
        if not self.api_key:
            raise ValueError("Missing DEVTO_API_KEY in environment")
        
        self.api_url = "https://dev.to/api/articles"
    
    async def publish(
        self,
        title: str,
        body_markdown: str,
        tags: List[str],
        main_image: Optional[str] = None,
        published: bool = True
    ) -> dict:
        """
        Publish article to Dev.to
        
        Args:
            title: Article title
            body_markdown: Article content in markdown
            tags: List of tags (max 4)
            main_image: Optional cover image URL
            published: Publish immediately or save as draft
            
        Returns:
            dict with article_id and url
        """
        headers = {
            "api-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "article": {
                "title": title,
                "body_markdown": body_markdown,
                "published": published,
                "tags": tags[:4],  # Dev.to max 4 tags
                "main_image": main_image
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.api_url,
                json=payload,
                headers=headers
            )
            
            if response.status_code == 201:
                data = response.json()
                return {
                    "article_id": data['id'],
                    "url": data['url']
                }
            else:
                raise Exception(f"Dev.to API error: {response.status_code} - {response.text}")

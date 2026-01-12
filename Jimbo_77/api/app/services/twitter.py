import os
import tweepy
import httpx
import uuid
from typing import Optional
from pathlib import Path

class TwitterService:
    """Twitter/X publishing service using Tweepy"""
    
    def __init__(self):
        self.api_key = os.getenv("TWITTER_API_KEY")
        self.api_secret = os.getenv("TWITTER_API_SECRET")
        self.access_token = os.getenv("TWITTER_ACCESS_TOKEN")
        self.access_token_secret = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
        
        if not all([self.api_key, self.api_secret, self.access_token, self.access_token_secret]):
            raise ValueError("Missing Twitter credentials in environment")
        
        # Tweepy Client (API v2)
        self.client = tweepy.Client(
            consumer_key=self.api_key,
            consumer_secret=self.api_secret,
            access_token=self.access_token,
            access_token_secret=self.access_token_secret
        )
        
        # Tweepy API v1.1 (for media upload)
        auth = tweepy.OAuth1UserHandler(
            self.api_key, self.api_secret,
            self.access_token, self.access_token_secret
        )
        self.api_v1 = tweepy.API(auth)
    
    async def publish(self, text: str, image_url: Optional[str] = None) -> dict:
        """
        Publish tweet with optional image
        
        Args:
            text: Tweet text (max 280 chars)
            image_url: Optional image URL to attach
            
        Returns:
            dict with tweet_id and url
        """
        media_id = None
        
        if image_url:
            media_id = await self._upload_image(image_url)
        
        # Post tweet
        if media_id:
            response = self.client.create_tweet(text=text, media_ids=[media_id])
        else:
            response = self.client.create_tweet(text=text)
        
        tweet_id = response.data['id']
        return {
            "tweet_id": tweet_id,
            "url": f"https://twitter.com/i/web/status/{tweet_id}"
        }
    
    async def _upload_image(self, image_url: str) -> Optional[str]:
        """Download image from URL and upload to Twitter"""
        try:
            # Download image
            async with httpx.AsyncClient(verify=False) as client:
                response = await client.get(image_url)
                if response.status_code != 200:
                    return None
                
                # Determine file extension
                ext = ".jpg"
                if "png" in image_url.lower():
                    ext = ".png"
                elif "webp" in image_url.lower():
                    ext = ".webp"
                
                # Save temporarily
                temp_file = f"/tmp/twitter_upload_{uuid.uuid4()}{ext}"
                with open(temp_file, 'wb') as f:
                    f.write(response.content)
                
                # Upload to Twitter
                media = self.api_v1.media_upload(filename=temp_file)
                
                # Cleanup
                if Path(temp_file).exists():
                    os.remove(temp_file)
                
                return media.media_id
        except Exception as e:
            print(f"Image upload failed: {e}")
            return None

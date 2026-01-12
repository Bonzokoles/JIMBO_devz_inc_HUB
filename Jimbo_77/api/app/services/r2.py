import os
import boto3
from botocore.config import Config
from datetime import datetime
from pathlib import Path
from typing import Optional

class R2Service:
    """Cloudflare R2 storage service"""
    
    def __init__(self):
        self.account_id = os.getenv("R2_ACCOUNT_ID")
        self.access_key_id = os.getenv("R2_ACCESS_KEY_ID")
        self.secret_access_key = os.getenv("R2_SECRET_ACCESS_KEY")
        self.bucket = os.getenv("R2_BUCKET", "mybonzo-blog-content")
        self.worker_url = os.getenv("R2_WORKER_URL", "https://jimbo-angels-worker.stolarnia-ams.workers.dev")
        
        if not all([self.account_id, self.access_key_id, self.secret_access_key]):
            raise ValueError("Missing R2 credentials in environment")
        
        self.endpoint = f"https://{self.account_id}.r2.cloudflarestorage.com"
        
        self.s3 = boto3.client('s3',
            endpoint_url=self.endpoint,
            aws_access_key_id=self.access_key_id,
            aws_secret_access_key=self.secret_access_key,
            config=Config(signature_version='s3v4'),
            region_name='auto'
        )
    
    async def upload(
        self,
        file_path: str,
        key: Optional[str] = None,
        content_type: str = "image/png"
    ) -> str:
        """
        Upload file to R2 and return public URL
        
        Args:
            file_path: Path to file to upload
            key: Optional custom key, auto-generated if None
            content_type: MIME type
            
        Returns:
            Public URL to uploaded file
        """
        if not key:
            file_name = Path(file_path).name
            key = f"blog/images/{datetime.now().strftime('%Y-%m')}/{file_name}"
        
        # Upload file
        self.s3.upload_file(
            file_path,
            self.bucket,
            key,
            ExtraArgs={'ContentType': content_type}
        )
        
        # Return public URL via Worker
        return f"{self.worker_url}/{key}"

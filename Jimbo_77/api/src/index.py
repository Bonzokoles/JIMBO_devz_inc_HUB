#!/usr/bin/env python3
"""
Cloudflare Workers Python Runtime wrapper
Converts FastAPI app to Cloudflare-compatible handler
"""

from app.main import app
from mangum import Mangum

# Create Cloudflare Workers handler
handler = Mangum(app, lifespan="off")

# Export for Cloudflare Workers
async def on_fetch(request, env, ctx):
    """
    Cloudflare Workers fetch handler
    """
    return await handler(request, env)

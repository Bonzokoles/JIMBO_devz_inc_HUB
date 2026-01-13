from typing import List, Dict, Optional
from decimal import Decimal
from datetime import datetime
import logging
from lxml import etree
import aiohttp
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class ProductData(BaseModel):
    """Model danych produktu z IdoSell"""
    idosell_product_id: str
    product_name: str
    producer: Optional[str] = None
    category_name: Optional[str] = None
    price_retail_gross: Decimal
    price_retail_net: Decimal
    price_wholesale_gross: Optional[Decimal] = None
    price_wholesale_net: Optional[Decimal] = None
    vat_rate: Decimal
    delivery_days: Optional[int] = None
    product_url: Optional[str] = None
    currency: str = "PLN"
    stock_quantity: int = 0
    is_active: bool = True

class IdoSellFeedParser:
    """Parser dla IdoSell XML feeds (IOF format)"""
    
    def __init__(self, feed_url: str):
        self.feed_url = feed_url
        
    async def fetch_xml_feed(self) -> str:
        """Pobiera XML feed z URL (async)"""
        async with aiohttp.ClientSession() as session:
            async with session.get(self.feed_url, timeout=aiohttp.ClientTimeout(total=300)) as response:
                response.raise_for_status()
                return await response.text()
    
    def parse_xml_feed(self, xml_content: str) -> List[ProductData]:
        """Parsuje XML i zwraca listę produktów"""
        products = []
        root = etree.fromstring(xml_content.encode('utf-8'))
        
        # Parsuj każdy <product> element
        for product_elem in root.findall('.//product'):
            try:
                product_data = self._extract_product_data(product_elem)
                products.append(product_data)
            except Exception as e:
                # Log błędów parsowania ale kontynuuj
                logger.warning(f"Error parsing product {product_elem.get('id')}: {e}")
                continue
        
        return products
    
    def _extract_product_data(self, product_elem) -> ProductData:
        """Ekstraktuje dane z pojedynczego <product> elementu"""
        product_id = product_elem.get('id')
        currency = product_elem.get('currency', 'PLN')
        
        # Basic info
        name_elem = product_elem.find('name')
        product_name = name_elem.text if name_elem is not None else f"Product {product_id}"
        
        # Producer
        producer_elem = product_elem.find('producer')
        producer = producer_elem.get('name') if producer_elem is not None else None
        
        # Category
        category_elem = product_elem.find('category')
        category_name = category_elem.get('name') if category_elem is not None else None
        
        # Retail pricing
        price_retail_elem = product_elem.find("price[@type='retail']") or product_elem.find('price')
        price_retail_gross = Decimal(price_retail_elem.get('gross', 0)) if price_retail_elem is not None else Decimal(0)
        price_retail_net = Decimal(price_retail_elem.get('net', 0)) if price_retail_elem is not None else Decimal(0)
        vat_rate = Decimal(price_retail_elem.get('vat', 23.0)) if price_retail_elem is not None else Decimal(23.0)
        
        # Wholesale pricing (optional)
        price_wholesale_elem = product_elem.find("price[@type='wholesale']") or product_elem.find('price_wholesale')
        price_wholesale_gross = Decimal(price_wholesale_elem.get('gross', 0)) if price_wholesale_elem is not None else None
        price_wholesale_net = Decimal(price_wholesale_elem.get('net', 0)) if price_wholesale_elem is not None else None
        
        # Delivery time
        delivery_elem = product_elem.find('delivery_time')
        delivery_days = int(delivery_elem.get('days', 0)) if delivery_elem is not None else None
        
        # URL
        card_elem = product_elem.find('card')
        product_url = card_elem.get('url') if card_elem is not None else None
        
        # Stock (jeśli dostępne)
        stock_elem = product_elem.find('stock')
        stock_quantity = int(stock_elem.get('quantity', 0)) if stock_elem is not None else 0
        
        return ProductData(
            idosell_product_id=product_id,
            product_name=product_name,
            producer=producer,
            category_name=category_name,
            price_retail_gross=price_retail_gross,
            price_retail_net=price_retail_net,
            price_wholesale_gross=price_wholesale_gross,
            price_wholesale_net=price_wholesale_net,
            vat_rate=vat_rate,
            delivery_days=delivery_days,
            product_url=product_url,
            currency=currency,
            stock_quantity=stock_quantity,
            is_active=True
        )
    
    async def sync_products(self) -> List[ProductData]:
        """Main method: pobiera i parsuje XML feed"""
        xml_content = await self.fetch_xml_feed()
        products = self.parse_xml_feed(xml_content)
        return products

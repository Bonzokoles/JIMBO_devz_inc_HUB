from __future__ import annotations
import enum
import uuid
from decimal import Decimal
from sqlalchemy import String, DateTime, Integer, Enum, JSON, Text, func, UniqueConstraint, ForeignKey, DECIMAL, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, declarative_base

Base = declarative_base()

class CommandStatus(str, enum.Enum):
    queued="queued"
    running="running"
    succeeded="succeeded"
    failed="failed"
    canceled="canceled"

class Command(Base):
    __tablename__ = "commands"
    __table_args__ = (UniqueConstraint("idempotency_key", name="uq_idem_key"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    idempotency_key: Mapped[str] = mapped_column(String(128), nullable=False)

    project_id: Mapped[str] = mapped_column(String(64), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    target: Mapped[str | None] = mapped_column(String(128), nullable=True)
    params: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[CommandStatus] = mapped_column(Enum(CommandStatus), nullable=False, default=CommandStatus.queued)
    attempt: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_by: Mapped[str] = mapped_column(String(256), nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    started_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)

class CommandEvent(Base):
    __tablename__ = "command_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    command_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("commands.id"), nullable=False, index=True)

    ts: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    type: Mapped[str] = mapped_column(String(32), nullable=False)          # queued/started/log/retry/done/error
    message: Mapped[str] = mapped_column(Text, nullable=False)
    meta: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)


# ===== SHOP STATUS MODELS =====

class ShopStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    maintenance = "maintenance"
    error = "error"


class ShopSyncStatus(Base):
    """Stan synchronizacji z IdoSell - tabela główna"""
    __tablename__ = "shop_sync_status"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shop_name: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)  # "Meble Pumo"
    shop_url: Mapped[str] = mapped_column(String(255), nullable=False)  # "https://meblepumo.iai-shop.com"
    
    status: Mapped[ShopStatus] = mapped_column(Enum(ShopStatus), nullable=False, default=ShopStatus.active)
    last_sync_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    sync_frequency_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=15)
    
    # Statystyki sklepu (cache)
    total_orders_30d: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    today_orders: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_revenue_30d: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0)
    today_revenue: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0)
    avg_order_value: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0)
    
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ShopOrder(Base):
    """Zamówienia ze sklepu IdoSell"""
    __tablename__ = "shop_orders"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shop_sync_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("shop_sync_status.id"), nullable=False, index=True)
    
    # IdoSell order data
    idosell_order_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)  # ID z IdoSell
    order_number: Mapped[str] = mapped_column(String(128), nullable=False)
    order_status: Mapped[str] = mapped_column(String(64), nullable=False)  # new, paid, shipped, completed, cancelled
    
    # Order details
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    order_value: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="PLN")
    
    # Timestamps
    idosell_created_at: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=False)
    idosell_updated_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # System timestamps
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ShopProduct(Base):
    """Produkty ze sklepu IdoSell"""
    __tablename__ = "shop_products"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shop_sync_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("shop_sync_status.id"), nullable=False, index=True)
    
    # IdoSell product data
    idosell_product_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    product_name: Mapped[str] = mapped_column(String(512), nullable=False)
    product_sku: Mapped[str | None] = mapped_column(String(128), nullable=True)
    category_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Product details
    price: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="PLN")
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    
    # SEO data
    product_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # System timestamps
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ShopAnalytics(Base):
    """Dane analityczne sklepu (dzienne snapshoty)"""
    __tablename__ = "shop_analytics"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shop_sync_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("shop_sync_status.id"), nullable=False, index=True)
    
    # Date for analytics
    analytics_date: Mapped[str] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    
    # Daily metrics
    orders_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    revenue: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0)
    avg_order_value: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0)
    new_customers: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    
    # Product metrics
    products_sold: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    top_category: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Additional analytics data
    analytics_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint("shop_sync_id", "analytics_date", name="uq_shop_analytics_date"),
    )

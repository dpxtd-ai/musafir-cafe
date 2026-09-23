"""
Musafir Cafe - Data Models & Schema Validation
Strictly conforms to original order flow and payload format.
"""
from typing import Optional, List, Union
from pydantic import BaseModel, Field, field_validator
import re

class Customer(BaseModel):
    orderType: str = Field(..., description="'Home Delivery' or 'Dine-in'")
    name: str = Field(..., min_length=1, description="Customer Full Name")
    mobile: Optional[str] = Field(None, description="10-digit mobile number for Home Delivery")
    address: Optional[str] = Field(None, description="Full delivery address for Home Delivery")
    tableNumber: Optional[str] = Field(None, description="Table number for Dine-In")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Customer name cannot be empty")
        return cleaned

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: Optional[str], values) -> Optional[str]:
        if v is not None:
            cleaned = v.strip()
            if cleaned and not re.match(r"^[0-9]{10}$", cleaned):
                raise ValueError("Mobile number must be exactly 10 digits")
            return cleaned
        return v

class OrderItem(BaseModel):
    item: str = Field(..., min_length=1, description="Item Name")
    qty: int = Field(..., gt=0, description="Item quantity (must be > 0)")
    price: float = Field(..., ge=0, description="Unit price in ₹")
    subtotal: float = Field(..., ge=0, description="Item total subtotal in ₹")

class OrderRequest(BaseModel):
    customer: Customer
    items: List[OrderItem] = Field(..., min_length=1, description="At least one item must be ordered")
    total: float = Field(..., ge=0, description="Grand total amount in ₹")

class OrderResponse(BaseModel):
    success: bool
    orderNumber: str
    message: str = "Order placed successfully"
    orderData: Optional[OrderRequest] = None

class MenuItem(BaseModel):
    ItemName: str
    Price: Union[float, int, str]
    Category: Optional[str] = "Others"
    Description: Optional[str] = None
    IsVeg: Optional[bool] = True

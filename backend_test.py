#!/usr/bin/env python3
"""
VENTEBEAST Backend API Test Suite
Tests all ecommerce endpoints in happy path order
"""
import requests
import random
import string
import json
from typing import Dict, Any

# Base URL from .env
BASE_URL = "https://luxury-scents-150.preview.emergentagent.com/api"

# Test data storage
test_data = {
    "customer_email": f"buyer_{random.randint(1000, 9999)}@test.com",
    "customer_password": "secret123",
    "customer_token": None,
    "customer_user": None,
    "admin_email": "vanshwadehra606@gmail.com",
    "admin_password": "AdminPass123",
    "admin_token": None,
    "admin_user": None,
    "product_id": None,
    "created_product_id": None,
    "wishlist_product_id": None,
    "address_id": None,
    "order_id": None,
    "noir_product_id": None,
    "noir_variant_sku": None,
    "noir_initial_stock": None,
}

def log_test(name: str, passed: bool, details: str = ""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status}: {name}")
    if details:
        print(f"  Details: {details}")
    if not passed:
        print(f"  ⚠️  Test failed!")

def make_request(method: str, endpoint: str, token: str = None, json_data: Dict = None, params: Dict = None) -> tuple:
    """Make HTTP request and return (success, response_json, status_code)"""
    url = f"{BASE_URL}{endpoint}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method == "GET":
            resp = requests.get(url, headers=headers, params=params, timeout=30)
        elif method == "POST":
            resp = requests.post(url, headers=headers, json=json_data, timeout=30)
        elif method == "PUT":
            resp = requests.put(url, headers=headers, json=json_data, timeout=30)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers, timeout=30)
        else:
            return False, {"error": "Invalid method"}, 0
        
        try:
            data = resp.json()
        except:
            data = {"raw": resp.text}
        
        return resp.status_code < 400, data, resp.status_code
    except Exception as e:
        return False, {"error": str(e)}, 0

# ========== 1. AUTH TESTS ==========
def test_auth():
    print("\n" + "="*60)
    print("1. TESTING AUTH ENDPOINTS")
    print("="*60)
    
    # Register customer
    success, data, status = make_request(
        "POST", "/auth/register",
        json_data={
            "email": test_data["customer_email"],
            "password": test_data["customer_password"],
            "name": "Buyer Test"
        }
    )
    log_test(
        "Register customer",
        success and status == 200 and "token" in data and data.get("user", {}).get("role") == "customer",
        f"Status: {status}, Role: {data.get('user', {}).get('role')}"
    )
    if success:
        test_data["customer_token"] = data.get("token")
        test_data["customer_user"] = data.get("user")
    
    # Register or login admin
    success, data, status = make_request(
        "POST", "/auth/register",
        json_data={
            "email": test_data["admin_email"],
            "password": test_data["admin_password"],
            "name": "Admin"
        }
    )
    
    if status == 409:  # Already registered
        print("  ℹ️  Admin already registered, attempting login...")
        success, data, status = make_request(
            "POST", "/auth/login",
            json_data={
                "email": test_data["admin_email"],
                "password": test_data["admin_password"]
            }
        )
    
    log_test(
        "Register/Login admin with auto-promotion",
        success and status == 200 and data.get("user", {}).get("role") == "admin",
        f"Status: {status}, Role: {data.get('user', {}).get('role')}"
    )
    if success:
        test_data["admin_token"] = data.get("token")
        test_data["admin_user"] = data.get("user")
    
    # Login admin again to verify auto-promotion
    success, data, status = make_request(
        "POST", "/auth/login",
        json_data={
            "email": test_data["admin_email"],
            "password": test_data["admin_password"]
        }
    )
    log_test(
        "Admin login returns admin role",
        success and data.get("user", {}).get("role") == "admin",
        f"Status: {status}, Role: {data.get('user', {}).get('role')}"
    )
    
    # Get /me for customer
    success, data, status = make_request(
        "GET", "/auth/me",
        token=test_data["customer_token"]
    )
    log_test(
        "GET /auth/me for customer",
        success and data.get("user", {}).get("email") == test_data["customer_email"],
        f"Status: {status}, Email: {data.get('user', {}).get('email')}"
    )
    
    # Get /me for admin
    success, data, status = make_request(
        "GET", "/auth/me",
        token=test_data["admin_token"]
    )
    log_test(
        "GET /auth/me for admin",
        success and data.get("user", {}).get("role") == "admin",
        f"Status: {status}, Role: {data.get('user', {}).get('role')}"
    )

# ========== 2. PRODUCTS TESTS ==========
def test_products():
    print("\n" + "="*60)
    print("2. TESTING PRODUCT ENDPOINTS")
    print("="*60)
    
    # Get all products (should have 6 seeded)
    success, data, status = make_request("GET", "/products")
    products = data.get("products", [])
    log_test(
        "GET /products returns 6 seeded products",
        success and len(products) == 6,
        f"Status: {status}, Count: {len(products)}"
    )
    
    if products:
        test_data["product_id"] = products[0]["_id"]
        # Find noir-obscur for later tests
        noir = next((p for p in products if p.get("slug") == "noir-obscur"), None)
        if noir:
            test_data["noir_product_id"] = noir["_id"]
            if noir.get("variants"):
                test_data["noir_variant_sku"] = noir["variants"][0]["sku"]
                test_data["noir_initial_stock"] = noir["variants"][0]["stock"]
    
    # Get featured products
    success, data, status = make_request("GET", "/products", params={"featured": "true"})
    featured = data.get("products", [])
    log_test(
        "GET /products?featured=true returns only featured",
        success and all(p.get("featured") for p in featured),
        f"Status: {status}, Count: {len(featured)}"
    )
    
    # Get products sorted by price ascending with limit
    success, data, status = make_request("GET", "/products", params={"sort": "priceAsc", "limit": "3"})
    sorted_products = data.get("products", [])
    log_test(
        "GET /products?sort=priceAsc&limit=3",
        success and len(sorted_products) <= 3,
        f"Status: {status}, Count: {len(sorted_products)}"
    )
    
    # Get product by slug (noir-obscur)
    success, data, status = make_request("GET", "/products/noir-obscur")
    product = data.get("product")
    related = data.get("related", [])
    log_test(
        "GET /products/noir-obscur returns product + related",
        success and product is not None and isinstance(related, list),
        f"Status: {status}, Has product: {product is not None}, Related count: {len(related)}"
    )

# ========== 3. ADMIN PRODUCT CRUD TESTS ==========
def test_admin_product_crud():
    print("\n" + "="*60)
    print("3. TESTING ADMIN PRODUCT CRUD")
    print("="*60)
    
    # Customer tries to create product (should fail with 403)
    success, data, status = make_request(
        "POST", "/products",
        token=test_data["customer_token"],
        json_data={
            "slug": "test-scent",
            "name": "Test Scent",
            "brand": "VB"
        }
    )
    log_test(
        "Customer POST /products returns 403",
        not success and status == 403,
        f"Status: {status}, Error: {data.get('error')}"
    )
    
    # Admin creates product
    success, data, status = make_request(
        "POST", "/products",
        token=test_data["admin_token"],
        json_data={
            "slug": "test-scent",
            "name": "Test Scent",
            "brand": "VB",
            "collection": "Test",
            "variants": [{
                "size": "30ml",
                "sku": "TST-30",
                "price": 1000,
                "comparePrice": 1200,
                "stock": 5
            }],
            "images": ["https://images.unsplash.com/photo-1643797519086-cc9a821fbcfe?w=800"],
            "topNotes": [],
            "heartNotes": [],
            "baseNotes": [],
            "featured": False,
            "bestseller": False,
            "newArrival": True
        }
    )
    log_test(
        "Admin POST /products creates product",
        success and "_id" in data.get("product", {}),
        f"Status: {status}, Product ID: {data.get('product', {}).get('_id')}"
    )
    if success:
        test_data["created_product_id"] = data.get("product", {}).get("_id")
    
    # Admin updates product
    if test_data["created_product_id"]:
        success, data, status = make_request(
            "PUT", f"/products/{test_data['created_product_id']}",
            token=test_data["admin_token"],
            json_data={
                "variants": [{
                    "size": "30ml",
                    "sku": "TST-30",
                    "price": 1000,
                    "comparePrice": 1200,
                    "stock": 10  # Changed stock
                }]
            }
        )
        log_test(
            "Admin PUT /products/{id} updates product",
            success and status == 200,
            f"Status: {status}"
        )
    
    # Admin deletes product
    if test_data["created_product_id"]:
        success, data, status = make_request(
            "DELETE", f"/products/{test_data['created_product_id']}",
            token=test_data["admin_token"]
        )
        log_test(
            "Admin DELETE /products/{id} deletes product",
            success and status == 200,
            f"Status: {status}"
        )

# ========== 4. COUPONS TESTS ==========
def test_coupons():
    print("\n" + "="*60)
    print("4. TESTING COUPON VALIDATION")
    print("="*60)
    
    # Validate WELCOME10
    success, data, status = make_request(
        "POST", "/coupons/validate",
        json_data={"code": "WELCOME10", "subtotal": 5000}
    )
    coupon = data.get("coupon", {})
    log_test(
        "POST /coupons/validate WELCOME10 returns 10% discount",
        success and coupon.get("discount") == 500 and coupon.get("type") == "percentage",
        f"Status: {status}, Discount: {coupon.get('discount')}, Type: {coupon.get('type')}"
    )
    
    # Validate FREESHIP
    success, data, status = make_request(
        "POST", "/coupons/validate",
        json_data={"code": "FREESHIP", "subtotal": 100}
    )
    coupon = data.get("coupon", {})
    log_test(
        "POST /coupons/validate FREESHIP returns free shipping",
        success and coupon.get("freeShipping") == True,
        f"Status: {status}, Free shipping: {coupon.get('freeShipping')}"
    )
    
    # Validate invalid coupon
    success, data, status = make_request(
        "POST", "/coupons/validate",
        json_data={"code": "BOGUS", "subtotal": 100}
    )
    log_test(
        "POST /coupons/validate BOGUS returns 404",
        not success and status == 404,
        f"Status: {status}, Error: {data.get('error')}"
    )

# ========== 5. WISHLIST TESTS ==========
def test_wishlist():
    print("\n" + "="*60)
    print("5. TESTING WISHLIST")
    print("="*60)
    
    # Add to wishlist
    if test_data["noir_product_id"]:
        success, data, status = make_request(
            "POST", "/wishlist",
            token=test_data["customer_token"],
            json_data={"productId": test_data["noir_product_id"]}
        )
        log_test(
            "POST /wishlist adds product",
            success and status == 200,
            f"Status: {status}"
        )
        test_data["wishlist_product_id"] = test_data["noir_product_id"]
    
    # Get wishlist
    success, data, status = make_request(
        "GET", "/wishlist",
        token=test_data["customer_token"]
    )
    items = data.get("items", [])
    has_noir = any(item.get("_id") == test_data["noir_product_id"] for item in items)
    log_test(
        "GET /wishlist contains noir-obscur",
        success and has_noir,
        f"Status: {status}, Items count: {len(items)}, Has noir: {has_noir}"
    )
    
    # Remove from wishlist
    if test_data["wishlist_product_id"]:
        success, data, status = make_request(
            "DELETE", f"/wishlist/{test_data['wishlist_product_id']}",
            token=test_data["customer_token"]
        )
        log_test(
            "DELETE /wishlist/{id} removes product",
            success and status == 200,
            f"Status: {status}"
        )

# ========== 6. ADDRESSES TESTS ==========
def test_addresses():
    print("\n" + "="*60)
    print("6. TESTING ADDRESSES")
    print("="*60)
    
    # Add address
    success, data, status = make_request(
        "POST", "/addresses",
        token=test_data["customer_token"],
        json_data={
            "name": "John Doe",
            "phone": "9876543210",
            "line1": "123 Test Street",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001"
        }
    )
    log_test(
        "POST /addresses creates address",
        success and "id" in data.get("address", {}),
        f"Status: {status}, Address ID: {data.get('address', {}).get('id')}"
    )
    if success:
        test_data["address_id"] = data.get("address", {}).get("id")
    
    # Get addresses
    success, data, status = make_request(
        "GET", "/addresses",
        token=test_data["customer_token"]
    )
    addresses = data.get("addresses", [])
    has_address = any(addr.get("id") == test_data["address_id"] for addr in addresses)
    log_test(
        "GET /addresses contains created address",
        success and has_address,
        f"Status: {status}, Count: {len(addresses)}, Has address: {has_address}"
    )
    
    # Delete address
    if test_data["address_id"]:
        success, data, status = make_request(
            "DELETE", f"/addresses/{test_data['address_id']}",
            token=test_data["customer_token"]
        )
        log_test(
            "DELETE /addresses/{id} removes address",
            success and status == 200,
            f"Status: {status}"
        )

# ========== 7. ORDERS + MOCK PAYMENT TESTS ==========
def test_orders_and_payment():
    print("\n" + "="*60)
    print("7. TESTING ORDERS + MOCK PAYMENT")
    print("="*60)
    
    # Place order
    if test_data["noir_product_id"] and test_data["noir_variant_sku"]:
        success, data, status = make_request(
            "POST", "/orders",
            token=test_data["customer_token"],
            json_data={
                "items": [{
                    "productId": test_data["noir_product_id"],
                    "sku": test_data["noir_variant_sku"],
                    "qty": 1
                }],
                "address": {
                    "name": "John Doe",
                    "phone": "9876543210",
                    "line1": "123 Test Street",
                    "city": "Mumbai",
                    "state": "Maharashtra",
                    "pincode": "400001"
                },
                "shipping": 200,
                "discount": 0,
                "paymentMethod": "mock"
            }
        )
        order = data.get("order", {})
        log_test(
            "POST /orders creates order with pending status",
            success and order.get("status") == "pending" and "subtotal" in order and "total" in order,
            f"Status: {status}, Order status: {order.get('status')}, Total: {order.get('total')}"
        )
        if success:
            test_data["order_id"] = order.get("_id")
    
    # Mock confirm payment
    if test_data["order_id"]:
        success, data, status = make_request(
            "POST", "/payment/mock-confirm",
            token=test_data["customer_token"],
            json_data={
                "orderId": test_data["order_id"],
                "success": True
            }
        )
        order = data.get("order", {})
        log_test(
            "POST /payment/mock-confirm updates to paid & confirmed",
            success and order.get("paymentStatus") == "paid" and order.get("status") == "confirmed",
            f"Status: {status}, Payment: {order.get('paymentStatus')}, Order status: {order.get('status')}"
        )
    
    # Get orders list
    success, data, status = make_request(
        "GET", "/orders",
        token=test_data["customer_token"]
    )
    orders = data.get("orders", [])
    has_order = any(o.get("_id") == test_data["order_id"] for o in orders)
    log_test(
        "GET /orders contains the order",
        success and has_order,
        f"Status: {status}, Orders count: {len(orders)}, Has order: {has_order}"
    )
    
    # Verify stock decreased
    success, data, status = make_request("GET", "/products/noir-obscur")
    product = data.get("product")
    if product and product.get("variants"):
        variant = next((v for v in product["variants"] if v["sku"] == test_data["noir_variant_sku"]), None)
        if variant and test_data["noir_initial_stock"] is not None:
            expected_stock = test_data["noir_initial_stock"] - 1
            log_test(
                "Stock decreased by 1 after order",
                variant["stock"] == expected_stock,
                f"Initial: {test_data['noir_initial_stock']}, Current: {variant['stock']}, Expected: {expected_stock}"
            )

# ========== 8. REVIEWS TESTS ==========
def test_reviews():
    print("\n" + "="*60)
    print("8. TESTING REVIEWS")
    print("="*60)
    
    # Post review
    if test_data["noir_product_id"]:
        success, data, status = make_request(
            "POST", "/reviews",
            token=test_data["customer_token"],
            json_data={
                "productId": test_data["noir_product_id"],
                "rating": 5,
                "title": "Stunning",
                "body": "Long sillage."
            }
        )
        log_test(
            "POST /reviews creates review",
            success and "_id" in data.get("review", {}),
            f"Status: {status}, Review ID: {data.get('review', {}).get('_id')}"
        )
    
    # Get reviews for product
    if test_data["noir_product_id"]:
        success, data, status = make_request(
            "GET", f"/reviews/{test_data['noir_product_id']}"
        )
        reviews = data.get("reviews", [])
        log_test(
            "GET /reviews/{productId} contains review",
            success and len(reviews) > 0,
            f"Status: {status}, Reviews count: {len(reviews)}"
        )
    
    # Verify product rating updated
    success, data, status = make_request("GET", "/products/noir-obscur")
    product = data.get("product")
    log_test(
        "Product rating and reviewCount updated",
        success and product.get("rating") is not None and product.get("reviewCount", 0) > 0,
        f"Status: {status}, Rating: {product.get('rating')}, Review count: {product.get('reviewCount')}"
    )

# ========== 9. ADMIN ENDPOINTS TESTS ==========
def test_admin_endpoints():
    print("\n" + "="*60)
    print("9. TESTING ADMIN ENDPOINTS")
    print("="*60)
    
    # Admin stats
    success, data, status = make_request(
        "GET", "/admin/stats",
        token=test_data["admin_token"]
    )
    stats = data.get("stats", {})
    recent_orders = data.get("recentOrders", [])
    log_test(
        "GET /admin/stats returns stats and recent orders",
        success and "productCount" in stats and isinstance(recent_orders, list),
        f"Status: {status}, Product count: {stats.get('productCount')}, Recent orders: {len(recent_orders)}"
    )
    
    # Admin orders
    success, data, status = make_request(
        "GET", "/admin/orders",
        token=test_data["admin_token"]
    )
    orders = data.get("orders", [])
    log_test(
        "GET /admin/orders returns order list",
        success and isinstance(orders, list),
        f"Status: {status}, Orders count: {len(orders)}"
    )
    
    # Admin users
    success, data, status = make_request(
        "GET", "/admin/users",
        token=test_data["admin_token"]
    )
    users = data.get("users", [])
    log_test(
        "GET /admin/users returns user list",
        success and isinstance(users, list) and len(users) >= 2,
        f"Status: {status}, Users count: {len(users)}"
    )
    
    # Customer tries admin stats (should fail with 403)
    success, data, status = make_request(
        "GET", "/admin/stats",
        token=test_data["customer_token"]
    )
    log_test(
        "Customer GET /admin/stats returns 403",
        not success and status == 403,
        f"Status: {status}, Error: {data.get('error')}"
    )

# ========== MAIN TEST RUNNER ==========
def main():
    print("\n" + "="*80)
    print("VENTEBEAST BACKEND API TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Customer Email: {test_data['customer_email']}")
    print(f"Admin Email: {test_data['admin_email']}")
    
    try:
        test_auth()
        test_products()
        test_admin_product_crud()
        test_coupons()
        test_wishlist()
        test_addresses()
        test_orders_and_payment()
        test_reviews()
        test_admin_endpoints()
        
        print("\n" + "="*80)
        print("TEST SUITE COMPLETED")
        print("="*80)
        print("\nℹ️  Review the results above for any failures.")
        print("ℹ️  All ✅ PASS means the backend is working correctly.")
        print("ℹ️  Any ❌ FAIL indicates an issue that needs attention.")
        
    except Exception as e:
        print(f"\n❌ TEST SUITE ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

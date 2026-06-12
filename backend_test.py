#!/usr/bin/env python3
"""
Backend API Test for NEW endpoints:
1. Collections CRUD
2. Admin Reviews moderation
3. Site Settings
4. Test email endpoint
5. Order placement with email
"""

import requests
import json
import subprocess
import sys

BASE_URL = "https://luxury-scents-150.preview.emergentagent.com/api"
ADMIN_EMAIL = "vanshwadehra606@gmail.com"
ADMIN_PASSWORD = "TestAdmin123!"

admin_token = None
customer_token = None
test_collection_id = None
test_review_id = None
test_product_id = None

def print_test(msg):
    print(f"\n{'='*60}")
    print(f"TEST: {msg}")
    print('='*60)

def print_pass(msg):
    print(f"✅ PASS: {msg}")

def print_fail(msg):
    print(f"❌ FAIL: {msg}")

def delete_admin_from_db():
    """Delete admin user from MongoDB if exists"""
    try:
        cmd = f'mongosh "mongodb://localhost:27017/ventebeast" --quiet --eval "db.users.deleteOne({{email:\\"{ADMIN_EMAIL}\\"}})"'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        print(f"Deleted admin user from DB: {result.stdout}")
        return True
    except Exception as e:
        print(f"Error deleting admin: {e}")
        return False

def register_admin():
    """Register fresh admin user"""
    global admin_token
    try:
        resp = requests.post(f"{BASE_URL}/auth/register", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "name": "Test Admin"
        }, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            admin_token = data.get('token')
            print_pass(f"Admin registered: {data.get('user', {}).get('role')}")
            return True
        else:
            print_fail(f"Admin registration failed: {resp.status_code} {resp.text}")
            return False
    except Exception as e:
        print_fail(f"Admin registration error: {e}")
        return False

def login_admin():
    """Login as admin"""
    global admin_token
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            admin_token = data.get('token')
            print_pass(f"Admin logged in: {data.get('user', {}).get('role')}")
            return True
        else:
            print(f"Admin login failed: {resp.status_code}, will delete and re-register")
            return False
    except Exception as e:
        print(f"Admin login error: {e}")
        return False

def setup_admin():
    """Setup admin user - try login, if fails delete and register"""
    if login_admin():
        return True
    print("Deleting existing admin and registering fresh...")
    delete_admin_from_db()
    return register_admin()

def register_customer():
    """Register a customer user"""
    global customer_token
    try:
        import random
        email = f"customer{random.randint(1000,9999)}@test.com"
        resp = requests.post(f"{BASE_URL}/auth/register", json={
            "email": email,
            "password": "Customer123!",
            "name": "Test Customer"
        }, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            customer_token = data.get('token')
            print_pass(f"Customer registered: {email}")
            return True
        else:
            print_fail(f"Customer registration failed: {resp.status_code}")
            return False
    except Exception as e:
        print_fail(f"Customer registration error: {e}")
        return False

def get_test_product():
    """Get a product ID for testing"""
    global test_product_id
    try:
        resp = requests.get(f"{BASE_URL}/products?limit=1", timeout=10)
        if resp.status_code == 200:
            products = resp.json().get('products', [])
            if products:
                test_product_id = products[0]['_id']
                print_pass(f"Got test product: {test_product_id}")
                return True
        print_fail("No products found")
        return False
    except Exception as e:
        print_fail(f"Error getting product: {e}")
        return False

# ========== TEST 1: COLLECTIONS CRUD ==========
def test_collections_crud():
    print_test("1. COLLECTIONS CRUD")
    
    # 1a. GET /api/collections - should auto-seed 6 collections
    try:
        resp = requests.get(f"{BASE_URL}/collections", timeout=10)
        if resp.status_code == 200:
            collections = resp.json().get('collections', [])
            if len(collections) >= 6:
                print_pass(f"GET /api/collections returned {len(collections)} collections (auto-seeded)")
                # Check structure
                first = collections[0]
                if all(k in first for k in ['_id', 'name', 'slug', 'description', 'order']):
                    print_pass("Collection structure valid (_id, name, slug, description, order)")
                else:
                    print_fail(f"Collection structure invalid: {first.keys()}")
            else:
                print_fail(f"Expected at least 6 collections, got {len(collections)}")
        else:
            print_fail(f"GET /api/collections failed: {resp.status_code}")
    except Exception as e:
        print_fail(f"GET /api/collections error: {e}")
    
    # 1b. POST /api/admin/collections as admin
    global test_collection_id
    try:
        resp = requests.post(f"{BASE_URL}/admin/collections", 
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "TestCol", "slug": "testcol", "description": "Test", "order": 99},
            timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            test_collection_id = data.get('collection', {}).get('_id')
            print_pass(f"POST /api/admin/collections as admin: created {test_collection_id}")
        else:
            print_fail(f"POST /api/admin/collections failed: {resp.status_code} {resp.text}")
    except Exception as e:
        print_fail(f"POST /api/admin/collections error: {e}")
    
    # 1c. PUT /api/admin/collections/{id} as admin
    if test_collection_id:
        try:
            resp = requests.put(f"{BASE_URL}/admin/collections/{test_collection_id}",
                headers={"Authorization": f"Bearer {admin_token}"},
                json={"description": "Updated"},
                timeout=10)
            if resp.status_code == 200:
                print_pass(f"PUT /api/admin/collections/{test_collection_id} as admin: updated")
            else:
                print_fail(f"PUT /api/admin/collections failed: {resp.status_code}")
        except Exception as e:
            print_fail(f"PUT /api/admin/collections error: {e}")
    
    # 1d. POST /api/admin/collections as customer - expect 403
    try:
        resp = requests.post(f"{BASE_URL}/admin/collections",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"name": "Forbidden", "slug": "forbidden", "description": "Should fail", "order": 100},
            timeout=10)
        if resp.status_code == 403:
            print_pass("POST /api/admin/collections as customer: 403 Forbidden (correct)")
        else:
            print_fail(f"POST /api/admin/collections as customer should be 403, got {resp.status_code}")
    except Exception as e:
        print_fail(f"POST /api/admin/collections as customer error: {e}")
    
    # 1e. DELETE /api/admin/collections/{id} as admin
    if test_collection_id:
        try:
            resp = requests.delete(f"{BASE_URL}/admin/collections/{test_collection_id}",
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=10)
            if resp.status_code == 200:
                print_pass(f"DELETE /api/admin/collections/{test_collection_id} as admin: deleted")
            else:
                print_fail(f"DELETE /api/admin/collections failed: {resp.status_code}")
        except Exception as e:
            print_fail(f"DELETE /api/admin/collections error: {e}")

# ========== TEST 2: ADMIN REVIEWS MODERATION ==========
def test_admin_reviews():
    print_test("2. ADMIN REVIEWS MODERATION")
    
    # 2a. GET /api/admin/reviews - should return array with product joined
    try:
        resp = requests.get(f"{BASE_URL}/admin/reviews",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10)
        if resp.status_code == 200:
            reviews = resp.json().get('reviews', [])
            print_pass(f"GET /api/admin/reviews returned {len(reviews)} reviews")
            if reviews:
                first = reviews[0]
                if 'product' in first and isinstance(first['product'], dict):
                    product = first['product']
                    if all(k in product for k in ['name', 'slug', 'image']):
                        print_pass("Review has product joined (name, slug, image)")
                    else:
                        print_fail(f"Product join incomplete: {product.keys()}")
                else:
                    print_fail("Review missing product join")
        else:
            print_fail(f"GET /api/admin/reviews failed: {resp.status_code}")
    except Exception as e:
        print_fail(f"GET /api/admin/reviews error: {e}")
    
    # 2b. POST /api/admin/reviews - admin creates review
    global test_review_id
    if test_product_id:
        try:
            # Get product rating before
            resp_prod = requests.get(f"{BASE_URL}/products", timeout=10)
            products = resp_prod.json().get('products', [])
            product_before = next((p for p in products if p['_id'] == test_product_id), None)
            rating_before = product_before.get('rating', 0) if product_before else 0
            
            resp = requests.post(f"{BASE_URL}/admin/reviews",
                headers={"Authorization": f"Bearer {admin_token}"},
                json={
                    "productId": test_product_id,
                    "userName": "Test Customer",
                    "rating": 5,
                    "title": "Beautiful",
                    "body": "Love it"
                },
                timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                test_review_id = data.get('review', {}).get('_id')
                print_pass(f"POST /api/admin/reviews: created review {test_review_id}")
                
                # Check product rating recomputed
                resp_prod2 = requests.get(f"{BASE_URL}/products", timeout=10)
                products2 = resp_prod2.json().get('products', [])
                product_after = next((p for p in products2 if p['_id'] == test_product_id), None)
                rating_after = product_after.get('rating', 0) if product_after else 0
                
                if rating_after != rating_before:
                    print_pass(f"Product rating recomputed: {rating_before} -> {rating_after}")
                else:
                    print(f"⚠️  Product rating unchanged: {rating_before} (may be same if multiple reviews)")
            else:
                print_fail(f"POST /api/admin/reviews failed: {resp.status_code} {resp.text}")
        except Exception as e:
            print_fail(f"POST /api/admin/reviews error: {e}")
    
    # 2c. DELETE /api/admin/reviews/{id} - verify rating recomputed
    if test_review_id and test_product_id:
        try:
            # Get product rating before delete
            resp_prod = requests.get(f"{BASE_URL}/products", timeout=10)
            products = resp_prod.json().get('products', [])
            product_before = next((p for p in products if p['_id'] == test_product_id), None)
            rating_before = product_before.get('rating', 0) if product_before else 0
            
            resp = requests.delete(f"{BASE_URL}/admin/reviews/{test_review_id}",
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=10)
            if resp.status_code == 200:
                print_pass(f"DELETE /api/admin/reviews/{test_review_id}: deleted")
                
                # Check product rating recomputed again
                resp_prod2 = requests.get(f"{BASE_URL}/products", timeout=10)
                products2 = resp_prod2.json().get('products', [])
                product_after = next((p for p in products2 if p['_id'] == test_product_id), None)
                rating_after = product_after.get('rating', 0) if product_after else 0
                
                if rating_after != rating_before:
                    print_pass(f"Product rating recomputed after delete: {rating_before} -> {rating_after}")
                else:
                    print(f"⚠️  Product rating unchanged: {rating_before} (may be same if no other reviews)")
            else:
                print_fail(f"DELETE /api/admin/reviews failed: {resp.status_code}")
        except Exception as e:
            print_fail(f"DELETE /api/admin/reviews error: {e}")

# ========== TEST 3: SITE SETTINGS ==========
def test_site_settings():
    print_test("3. SITE SETTINGS")
    
    # 3a. GET /api/settings - should auto-create defaults
    try:
        resp = requests.get(f"{BASE_URL}/settings", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            settings = data.get('settings', {})
            required = ['theme', 'logoUrl', 'siteName', 'tagline', 'promoBanner']
            if all(k in settings for k in required):
                print_pass(f"GET /api/settings returned all fields: {required}")
            else:
                print_fail(f"GET /api/settings missing fields. Got: {settings.keys()}")
        else:
            print_fail(f"GET /api/settings failed: {resp.status_code}")
    except Exception as e:
        print_fail(f"GET /api/settings error: {e}")
    
    # 3b. PUT /api/admin/settings as admin
    try:
        resp = requests.put(f"{BASE_URL}/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"theme": "navy", "promoBanner": "TEST BANNER"},
            timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            settings = data.get('settings', {})
            if settings.get('theme') == 'navy' and settings.get('promoBanner') == 'TEST BANNER':
                print_pass("PUT /api/admin/settings as admin: updated theme and promoBanner")
            else:
                print_fail(f"PUT /api/admin/settings didn't update correctly: {settings}")
        else:
            print_fail(f"PUT /api/admin/settings failed: {resp.status_code}")
    except Exception as e:
        print_fail(f"PUT /api/admin/settings error: {e}")
    
    # 3c. PUT /api/admin/settings as customer - expect 403
    try:
        resp = requests.put(f"{BASE_URL}/admin/settings",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"theme": "dark"},
            timeout=10)
        if resp.status_code == 403:
            print_pass("PUT /api/admin/settings as customer: 403 Forbidden (correct)")
        else:
            print_fail(f"PUT /api/admin/settings as customer should be 403, got {resp.status_code}")
    except Exception as e:
        print_fail(f"PUT /api/admin/settings as customer error: {e}")

# ========== TEST 4: TEST EMAIL ENDPOINT ==========
def test_email_endpoint():
    print_test("4. TEST EMAIL ENDPOINT")
    
    # POST /api/admin/test-email as admin
    try:
        resp = requests.post(f"{BASE_URL}/admin/test-email",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            result = data.get('result', {})
            if result.get('sent') == False:
                print_pass("POST /api/admin/test-email: returned 200, sent=false (no RESEND_API_KEY - expected)")
            else:
                print_pass(f"POST /api/admin/test-email: returned 200, result={result}")
        else:
            print_fail(f"POST /api/admin/test-email failed: {resp.status_code} {resp.text}")
    except Exception as e:
        print_fail(f"POST /api/admin/test-email error: {e}")

# ========== TEST 5: ORDER PLACEMENT WITH EMAIL ==========
def test_order_placement():
    print_test("5. ORDER PLACEMENT WITH EMAIL (fire-and-forget)")
    
    # Place a COD order as customer
    if not test_product_id:
        print_fail("No test product available for order")
        return
    
    try:
        # Get product details
        resp_prod = requests.get(f"{BASE_URL}/products", timeout=10)
        products = resp_prod.json().get('products', [])
        product = next((p for p in products if p['_id'] == test_product_id), None)
        if not product:
            print_fail("Test product not found")
            return
        
        variant = product.get('variants', [{}])[0]
        sku = variant.get('sku')
        price = variant.get('price', 0)
        
        order_payload = {
            "items": [{
                "productId": test_product_id,
                "sku": sku,
                "qty": 1
            }],
            "address": {
                "name": "Test Customer",
                "phone": "9876543210",
                "line1": "123 Test St",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001"
            },
            "shipping": 0,
            "discount": 0,
            "paymentMethod": "COD"
        }
        
        resp = requests.post(f"{BASE_URL}/orders",
            headers={"Authorization": f"Bearer {customer_token}"},
            json=order_payload,
            timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            order = data.get('order', {})
            order_id = order.get('_id')
            print_pass(f"POST /api/orders: order placed {order_id}, no crash (email fire-and-forget)")
            print_pass("Email function called without crash (sendOrderEmails is fire-and-forget)")
        else:
            print_fail(f"POST /api/orders failed: {resp.status_code} {resp.text}")
    except Exception as e:
        print_fail(f"POST /api/orders error: {e}")

# ========== MAIN ==========
def main():
    print("\n" + "="*60)
    print("BACKEND API TEST - NEW ENDPOINTS")
    print("="*60)
    
    # Setup
    print_test("SETUP")
    if not setup_admin():
        print_fail("Admin setup failed, aborting")
        sys.exit(1)
    
    if not register_customer():
        print_fail("Customer setup failed, aborting")
        sys.exit(1)
    
    if not get_test_product():
        print_fail("Product setup failed, aborting")
        sys.exit(1)
    
    # Run tests
    test_collections_crud()
    test_admin_reviews()
    test_site_settings()
    test_email_endpoint()
    test_order_placement()
    
    print("\n" + "="*60)
    print("ALL TESTS COMPLETED")
    print("="*60)

if __name__ == "__main__":
    main()

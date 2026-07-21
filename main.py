
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from db_ops import (
    store_user,
    fetch_user,
    fetch_admin,
    store_products,
    update_user,
    fetch_products,
    fetch_product_by_id,
    update_product,
    delete_product,
    store_order,
    fetch_orders,
    fetch_all_orders,
    update_order_status,
    backfill_orders_from_users,
)
from dotenv import load_dotenv
from loguru import logger
import requests
import uuid
import hashlib
import hmac
from datetime import datetime, timedelta
from chat_bot import call_llm
import html as _html
import re as _re
import razorpay


def markdown_to_safe_html(md: str) -> str:
    """Convert a lightweight subset of Markdown to safe HTML.

    This function escapes input then converts simple patterns:
    - bold: **text** -> <strong>text</strong>
    - headings: # Heading -> <h1>..</h1>
    - bullets: lines starting with -, * or • -> <ul><li>..</li></ul>
    - paragraphs and line breaks are preserved as <div> or <p>

    It's intentionally small to avoid adding external deps.
    """
    if not md:
        return ""

    escaped = _html.escape(md)
    lines = escaped.splitlines()
    out_lines = []
    in_list = False

    for raw in lines:
        line = raw.strip()
        if line == "":
            if in_list:
                out_lines.append("</ul>")
                in_list = False
            out_lines.append("<p></p>")
            continue

        # headings
        m = _re.match(r'^(#{1,6})\s+(.*)', line)
        if m:
            if in_list:
                out_lines.append("</ul>")
                in_list = False
            level = len(m.group(1))
            content = m.group(2)
            out_lines.append(f"<h{level}>{content}</h{level}>")
            continue

        # bold **text**
        line = _re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", line)

        # bullets (handle '-' '*' or '•')
        if _re.match(r'^[-*]\s+', line) or line.startswith('•'):
            # normalize bullet content by removing leading markers
            content = _re.sub(r'^[-*]\s+|^•+\s*', '', line)
            if not in_list:
                out_lines.append('<ul>')
                in_list = True
            out_lines.append(f"<li>{content}</li>")
            continue

        # normal line
        if in_list:
            out_lines.append('</ul>')
            in_list = False
        out_lines.append(f"<div>{line}</div>")

    if in_list:
        out_lines.append('</ul>')

    return '\n'.join(out_lines)


def format_product_price(price) -> str:
    try:
        if price is None or str(price).strip() == '':
            return 'Rs. 0'
        value = float(price)
        if value.is_integer():
            return f"Rs. {int(value)}"
        return f"Rs. {value:.2f}"
    except Exception:
        return f"Rs. {price}"


def load_products_from_js() -> list[dict]:
    data_path = os.path.join(os.path.dirname(__file__), 'src', 'data', 'products.js')
    if not os.path.exists(data_path):
        return []

    raw = open(data_path, 'r', encoding='utf-8').read()
    blocks = _re.findall(r"\{([^}]*?)\}(?=,|\])", raw, _re.S)
    products = []

    for block in blocks:
        name_m = _re.search(r"name:\s*['\"]([^'\"]+)['\"]", block)
        price_m = _re.search(r"price:\s*([0-9]+(?:\.[0-9]+)?)", block)
        avail_m = _re.search(r"available:\s*(true|false)", block)
        category_m = _re.search(r"category:\s*['\"]([^'\"]+)['\"]", block)
        description_m = _re.search(r"description:\s*['\"]([^'\"]+)['\"]", block)
        image_m = _re.search(r"image:\s*['\"]([^'\"]+)['\"]", block)

        if not name_m or not price_m:
            continue

        products.append({
            'name': name_m.group(1).strip(),
            'price': price_m.group(1).strip(),
            'available': True if not avail_m else avail_m.group(1).lower() == 'true',
            'category': category_m.group(1).strip() if category_m else '',
            'description': description_m.group(1).strip() if description_m else '',
            'image': image_m.group(1).strip() if image_m else '',
        })

    return products


def get_available_products_text() -> str:
    products = load_products_from_js()
    available_products = [p for p in products if p.get('available')]
    if not available_products:
        return 'No products are currently available.'

    lines = ['Available products:']
    for p in available_products:
        lines.append(f"- {p['name']} — {format_product_price(p['price'])}")
    return '\n'.join(lines)


def get_product_price_text(message: str) -> str | None:
    lower = message.lower()
    if not _re.search(r"\b(price|cost|how much|rate|charge|₹|rs\.?|rupees)\b", lower):
        return None

    products = load_products_from_js()
    if not products:
        return None

    for p in products:
        if p['name'].lower() in lower:
            return f"The exact price of {p['name']} is {format_product_price(p['price'])}."

    categories = {}
    for p in products:
        cat = p.get('category', '').strip().lower()
        if not cat or not p.get('available'):
            continue
        categories.setdefault(cat, []).append(p)

    for cat, items in categories.items():
        if cat in lower:
            lines = [f"Available {cat.title()} with exact prices:"]
            for item in items:
                lines.append(f"- {item['name']} — {format_product_price(item['price'])}")
            return '\n'.join(lines)

    return None



dotenv_path = Path(__file__).with_name('.env')
load_dotenv(dotenv_path=dotenv_path)

class SignUpRequest(BaseModel):
    FirstName: str
    LastName: str
    Email: str
    Password: str
    PhoneNumber: str
class LoginModel(BaseModel):
    Email: str
    Password: str
class ForgotPasswordModel(BaseModel):
    Email: str
class ResetPasswordModel(BaseModel):
    Email: str | None = None
    Token: str | None = None
    NewPassword: str
class Product(BaseModel):
    ProductId: str | None = None
    ProductName: str
    Description: str
    Category: str
    ImageUrl: str
    Price: float
    StockQuantity: int
    Weight: float

class AdminOrderStatusModel(BaseModel):
    OrderId: str
    Status: str
    Note: str | None = None

class AdminLoginModel(BaseModel):
    Email: str
    Password: str

class chatBot(BaseModel):
    message: str

class ProfileUpdateModel(BaseModel):
    Email: str | None = None
    FirstName: str | None = None
    LastName: str | None = None
    PhoneNumber: str | None = None
    Password: str | None = None
    address: str | None = None
    apartment: str | None = None
    city: str | None = None
    state: str | None = None
    pinCode: str | None = None
    billingSameAsShipping: bool | None = None
    billingAddress: str | None = None
    billingApartment: str | None = None
    billingCity: str | None = None
    billingState: str | None = None
    billingPinCode: str | None = None
    billingPhone: str | None = None

class OrderCreateModel(BaseModel):
    PhoneNumber: str | None = None
    Email: str | None = None
    PaymentMethod: str | None = None
    ShippingAddress: dict | None = None
    BillingAddress: dict | None = None
    Items: list[dict]
    TotalAmount: float

class RazorpayCreateOrderModel(BaseModel):
    Amount: float
    Currency: str = 'INR'
    Receipt: str | None = None

class RazorpayVerifyModel(BaseModel):
    RazorpayOrderId: str
    RazorpayPaymentId: str
    RazorpaySignature: str


# enable swagger ui
app= FastAPI(
    title="Bakes API",
    description="API for Bakes Application",
    version="1.0.0",
    docs_url="/docs"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
def get_brevo_config():
    sender_email = os.getenv("SENDER_EMAIL", "").strip().strip('"').strip("'")
    sender_name = os.getenv("SENDER_NAME", "Bakes App").strip().strip('"').strip("'")
    api_key = os.environ["BREVO_API_KEY"]
    if not sender_email or not api_key:
        logger.error("BREVO_API_KEY and SENDER_EMAIL must be set for Brevo email delivery.")
        raise ValueError("Email sender or Brevo API key is not configured.")

    if api_key.startswith("xsmtpsib-"):
        logger.error("BREVO_API_KEY appears to be a Brevo SMTP key, not a transactional API key.")
        raise ValueError(
            "BREVO_API_KEY appears to be an SMTP key (xsmtpsib-...). "
            "Use a Brevo transactional API key for the /smtp/email endpoint."
        )

    return sender_email, sender_name or "Bakes App", api_key


def get_razorpay_client():
    key_id = os.getenv("RAZORPAY_KEY_ID", "").strip()
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
    if not key_id or not key_secret:
        raise ValueError("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured")
    return razorpay.Client(auth=(key_id, key_secret))


def verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
    if not key_secret:
        return False
    generated = hmac.new(
        key_secret.encode('utf-8'),
        f"{order_id}|{payment_id}".encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(generated, signature)


def send_reset_link(email, reset_link):
    try:
        sender_email, sender_name, api_key = get_brevo_config()
    except ValueError as e:
        logger.error(f"Invalid Brevo configuration: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    logger.info(f"Sending password reset link to {email} from sender {sender_email} ({sender_name})")
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    payload = {
        "sender": {
            "name": sender_name,
            "email": sender_email
        },
        "to": [
            {
                "email": email,
                "name": email
            }
        ],
        "subject": "Password Reset Request",
        "htmlContent": (
            f"<p>Hi,</p>"
            # f"<p>Click the link below to reset your password:</p>"
            # f"<p><a href=\"{reset_link}\">Reset Password</a></p>"
            # f"<p>This link expires in 30 minutes.</p>"
        )
    }

    response = requests.post(url, headers=headers, json=payload, timeout=20)
    if response.status_code not in (200, 201, 202):
        logger.error(f"Brevo API failed: {response.status_code} {response.text}")
        if response.status_code == 401:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Brevo API key authentication failed. "
                    "Check BREVO_API_KEY and ensure the key is valid and active."
                )
            )
        raise HTTPException(status_code=500, detail="Unable to send reset email via Brevo API.")
    logger.info("Brevo password reset email sent successfully")


class BrevoTestModel(BaseModel):
    Email: str


@app.post("/razorpay/create-order")
async def create_razorpay_order(item: RazorpayCreateOrderModel):
    try:
        client = get_razorpay_client()
        amount = max(1, int(round(float(item.Amount) * 100)))
        receipt = item.Receipt or f"order-{uuid.uuid4().hex[:8]}"
        order = client.order.create({
            "amount": amount,
            "currency": (item.Currency or 'INR').upper(),
            "receipt": receipt,
        })
        return {
            "status": "Success",
            "order_id": order.get('id'),
            "amount": order.get('amount'),
            "currency": order.get('currency'),
            "key_id": os.getenv("RAZORPAY_KEY_ID", "").strip(),
            "receipt": receipt,
        }
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception(f"Razorpay order creation failed: {exc}")
        raise HTTPException(status_code=500, detail="Unable to create Razorpay order") from exc


@app.post("/razorpay/verify-payment")
async def verify_razorpay_payment(item: RazorpayVerifyModel):
    if not verify_razorpay_signature(item.RazorpayOrderId, item.RazorpayPaymentId, item.RazorpaySignature):
        raise HTTPException(status_code=400, detail="Invalid Razorpay signature")
    return {"status": "Success", "message": "Payment verified successfully"}


@app.post("/test-email")
async def test_email(item: BrevoTestModel):
    try:
        sender_email, sender_name, api_key = get_brevo_config()
    except ValueError as e:
        logger.error(f"Invalid Brevo configuration: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    payload = {
        "sender": {
            "name": sender_name,
            "email": sender_email
        },
        "to": [
            {
                "email": item.Email,
                "name": item.Email
            }
        ],
        "subject": "Brevo API Test Email",
        "htmlContent": "<p>This is a test email from the Bakes application. If you receive it, Brevo API email is configured correctly.</p>"
    }

    response = requests.post(url, headers=headers, json=payload, timeout=20)
    if response.status_code not in (200, 201, 202):
        logger.error(f"Brevo API test email failed: {response.status_code} {response.text}")
        if response.status_code == 401:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Brevo API key authentication failed. "
                    "Check BREVO_API_KEY and ensure the key is valid and active."
                )
            )
        raise HTTPException(status_code=500, detail="Brevo API test email failed. Check API key and configuration.")

    return {"status": "Brevo test email sent successfully."}


@app.get("/")
async def base():
    return {"message": "Hello from bakes!"}

@app.post("/signup")
async def signup(item:SignUpRequest):
    # check existing by email or phone
    try:
        if item.Email and fetch_user({"Email": item.Email}):
            raise HTTPException(status_code=400, detail="Email already registered")
        if item.PhoneNumber and fetch_user({"PhoneNumber": item.PhoneNumber}):
            raise HTTPException(status_code=400, detail="Phone number already registered")

        user_data = item.model_dump()
        logger.info(f"Signing up user: {user_data}")
        res = store_user(user_data)
        if not res:
            # attempt to surface reason: re-check collisions
            if fetch_user({"Email": item.Email}):
                raise HTTPException(status_code=400, detail="Email already registered")
            if fetch_user({"PhoneNumber": item.PhoneNumber}):
                raise HTTPException(status_code=400, detail="Phone number already registered")
            raise HTTPException(status_code=500, detail="Error signing up user: database error")

        user_payload = {
            "Email": item.Email,
            "FirstName": item.FirstName,
            "LastName": item.LastName,
            "PhoneNumber": item.PhoneNumber,
        }
        return {"status": "Success", "message": "User signed up successfully", "user": user_payload}
    except HTTPException:
        raise
    except ValueError as ve:
        # known validation / constraint failures
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.exception(f"Unexpected error during signup: {e}")
        raise HTTPException(status_code=500, detail="Error signing up user: database error")

@app.post("/login")
async def login(item:LoginModel):
    existing_user = fetch_user({"Email": item.Email, "Password": item.Password})
    if not existing_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    # generate a session token, persist it to users table and return it
    import uuid
    token = uuid.uuid4().hex
    identifier = None
    if isinstance(existing_user, dict):
        identifier = {'PhoneNumber': existing_user.get('PhoneNumber')} if existing_user.get('PhoneNumber') else {'Email': existing_user.get('Email')}
    else:
        identifier = {'PhoneNumber': existing_user.get('PhoneNumber')} if existing_user.get('PhoneNumber') else {'Email': existing_user.get('Email')}

    update_user(identifier, {'Token': token})

    stored_password = existing_user.get('Password') if isinstance(existing_user, dict) else existing_user.get('Password')
    if isinstance(stored_password, str) and stored_password and not stored_password.startswith('pbkdf2_sha256$'):
        update_user(identifier, {'Password': item.Password})

    user_payload = {
        "Email": existing_user.get('Email') if isinstance(existing_user, dict) else existing_user["Email"],
        "FirstName": existing_user.get('FirstName') if isinstance(existing_user, dict) else existing_user["FirstName"],
        "LastName": existing_user.get('LastName') if isinstance(existing_user, dict) else existing_user["LastName"],
        "PhoneNumber": existing_user.get('PhoneNumber') if isinstance(existing_user, dict) else existing_user.get("PhoneNumber"),
    }
    return {"status": "Success", "message": "Login successful", "user": user_payload, "token": token}

@app.post("/forgot-password")
async def forgot_password(item:ForgotPasswordModel):
    existing_user = fetch_user({"Email": item.Email})
    if not existing_user:
        raise HTTPException(status_code=404, detail="Email not found")

    token = uuid.uuid4().hex
    expires_at = (datetime.utcnow() + timedelta(minutes=30)).isoformat()
    update_user({"Email": item.Email}, {"PasswordResetToken": token, "PasswordResetExpires": expires_at})

    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    reset_link = f"{frontend_url}/reset-password?token={token}"

    try:
        send_reset_link(item.Email, reset_link)
    except Exception as e:
        logger.exception(f"Failed to send reset email to {item.Email}: {e}")
        # clear the token if email fails to send to avoid stale reset tokens
        update_user({"Email": item.Email}, {"PasswordResetToken": None, "PasswordResetExpires": None})
        raise HTTPException(status_code=500, detail="Unable to send reset email. Check Brevo API key and sender configuration.")

    return {"status": "Reset link sent to your email."}

@app.post("/reset-password")
async def reset_password(item:ResetPasswordModel):
    if item.Token:
        user = fetch_user({"PasswordResetToken": item.Token})
        if not user:
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        expiry = user.get('PasswordResetExpires') if isinstance(user, dict) else user.get('PasswordResetExpires')
        try:
            if expiry and datetime.fromisoformat(expiry) < datetime.utcnow():
                raise HTTPException(status_code=400, detail="Reset link has expired")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid token expiry")

        identifier = {"Email": user.get('Email')} if user.get('Email') else {"PhoneNumber": user.get('PhoneNumber')}
        update_user(identifier, {"Password": item.NewPassword, "PasswordResetToken": None, "PasswordResetExpires": None})
        return {"status": "Password reset successful"}

    if not item.Email:
        raise HTTPException(status_code=400, detail="Email is required")

    existing_user = fetch_user({"Email": item.Email})
    if not existing_user:
        raise HTTPException(status_code=400, detail="Email not found")
    update_user({"Email": item.Email}, {"Password": item.NewPassword})
    return {"status": "Password reset successful"}


@app.post("/profile")
async def update_profile(item: ProfileUpdateModel):
    # try to find user by Email first, then by PhoneNumber if Email lookup fails
    existing_user = None
    if item.Email:
        existing_user = fetch_user({"Email": item.Email})
    if not existing_user and item.PhoneNumber:
        existing_user = fetch_user({"PhoneNumber": item.PhoneNumber})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found by Email or PhoneNumber")
    updates = {}
    # generic update: copy all provided non-None fields except Email
    for field in [
        'FirstName','LastName','PhoneNumber','Password','address','apartment','city','state','pinCode',
        'billingSameAsShipping','billingAddress','billingApartment','billingCity','billingState','billingPinCode','billingPhone'
    ]:
        val = getattr(item, field, None)
        if val is not None:
            updates[field] = val

    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    success = update_user({"Email": item.Email}, updates)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update profile")
    return {"status": "Success", "message": "Profile updated successfully"}


@app.get("/users/{identifier}")
async def get_user(identifier: str):
    if "@" in identifier:
        existing_user = fetch_user({"Email": identifier})
    else:
        existing_user = fetch_user({"PhoneNumber": identifier})

    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = {
        "Email": existing_user.get('Email') if isinstance(existing_user, dict) else existing_user['Email'],
        "PhoneNumber": existing_user.get('PhoneNumber') if isinstance(existing_user, dict) else existing_user.get('PhoneNumber'),
        "FirstName": existing_user.get('FirstName') if isinstance(existing_user, dict) else existing_user['FirstName'],
        "LastName": existing_user.get('LastName') if isinstance(existing_user, dict) else existing_user['LastName'],
    }
    return {"status": "Success", "user": user_data}


@app.post("/orders")
async def create_order(item: OrderCreateModel):
    # validate incoming payload presence
    if not item.PhoneNumber and not item.Email:
        raise HTTPException(status_code=400, detail="PhoneNumber or Email is required")

    logger.info(f"Create order request: {item.model_dump()}")

    try:
        existing_user = None
        if item.PhoneNumber:
            existing_user = fetch_user({"PhoneNumber": item.PhoneNumber})
        if not existing_user and item.Email:
            existing_user = fetch_user({"Email": item.Email})

        if not existing_user:
            logger.warning(f"Order creation failed: user not found for Phone/Email: {item.PhoneNumber} / {item.Email}")
            raise HTTPException(status_code=404, detail="User not found")

        phone = existing_user.get('PhoneNumber') if isinstance(existing_user, dict) else existing_user.get('PhoneNumber')
        if not phone:
            logger.warning(f"Order creation failed: user exists but has no PhoneNumber: {existing_user}")
            raise HTTPException(status_code=400, detail="User phone number is missing")

        success = store_order({
            "PhoneNumber": phone,
            "PaymentMethod": item.PaymentMethod or 'Unknown',
            "ShippingAddress": item.ShippingAddress or {},
            "BillingAddress": item.BillingAddress or {},
            "Items": item.Items,
            "TotalAmount": item.TotalAmount,
        })
        if not success:
            logger.error(f"Failed to store order for user {phone}")
            raise HTTPException(status_code=500, detail="Failed to save order")

        logger.info(f"Order stored for user {phone}")
        return {"status": "Success", "message": "Order saved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Unexpected error creating order: {e}")
        raise HTTPException(status_code=500, detail="Unexpected server error while creating order")


@app.get("/orders/{identifier}")
async def get_orders(identifier: str):
    orders = fetch_orders(identifier)
    return {"status": "Success", "orders": orders}


@app.post("/admin/login")
async def admin_login(item:AdminLoginModel):
    existing_admin = fetch_admin(item.model_dump())
    if not existing_admin:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    stored_password = existing_admin.get('Password') if isinstance(existing_admin, dict) else existing_admin.get('Password')
    if isinstance(stored_password, str) and stored_password and not stored_password.startswith('pbkdf2_sha256$'):
        update_user({"Email": item.Email}, {"Password": item.Password})

    return {"status": "Success", "message": "Admin login successful"}


@app.get("/admin/orders")
async def admin_orders():
    return {"status": "Success", "orders": fetch_all_orders()}


@app.post("/admin/orders/status")
async def admin_update_order_status(item: AdminOrderStatusModel):
    if not item.OrderId:
        raise HTTPException(status_code=400, detail="OrderId is required")
    ok = update_order_status(item.OrderId, item.Status, item.Note or '')
    if not ok:
        raise HTTPException(status_code=500, detail="Unable to update order status")
    return {"status": "Success", "message": "Order status updated"}


@app.post("/admin/backfill-orders")
async def admin_backfill_orders():
    ok = backfill_orders_from_users()
    if not ok:
        raise HTTPException(status_code=500, detail="Backfill failed or nothing to backfill")
    return {"status": "Success", "message": "Backfill completed"}

@app.post("/AddProducts")
async def add_products(item:Product):
    products_data = item.model_dump()
    logger.info(f"Adding Products : {products_data}")
    res = store_products(products_data)
    if not res:
        raise HTTPException(status_code=500, detail="Error adding products")
    return {"status": "Success", "message": "Product added successfully"}

@app.post("/products")
async def create_product(item:Product):
    products_data = item.model_dump()
    logger.info(f"Creating product: {products_data}")
    res = store_products(products_data)
    if not res:
        raise HTTPException(status_code=500, detail="Error adding product")
    return {"status": "Success", "message": "Product added successfully"}


@app.put("/products/{product_id}")
async def edit_product(product_id: str, item: Product):
    payload = item.model_dump(exclude_none=True)
    payload.pop('ProductId', None)
    ok = update_product(product_id, payload)
    if not ok:
        raise HTTPException(status_code=500, detail="Unable to update product")
    return {"status": "Success", "message": "Product updated successfully"}


@app.delete("/products/{product_id}")
async def delete_product_route(product_id: str):
    ok = delete_product(product_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"status": "Success", "message": "Product deleted successfully"}

@app.get("/products")
async def get_products():
    products = fetch_products()
    return {"status": "Success", "products": products or []}

@app.get("/products/{product_id}")
async def get_product(product_id: str):
    product = fetch_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"status": "Success", "product": product}


@app.post("/chat-bot")
async def chat_Bt(item:chatBot):
    logger.info(f"Received message for chat bot: {item.message}")
    message = item.message
    if not message or not message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    # quick intent: if user asks about available products, return list from DB or products.js
    try:
        price_text = get_product_price_text(message)
        if price_text:
            html_response = markdown_to_safe_html(price_text)
            return {"status": "Success", "response": price_text, "response_html": html_response}

        if _re.search(r"\b(available products|which products|what products|what do you have|products available|which are available|show products)\b", message, _re.IGNORECASE):
            prod_text = get_available_products_text()
            html_response = markdown_to_safe_html(prod_text)
            return {"status": "Success", "response": prod_text, "response_html": html_response}
    except Exception as e:
        logger.debug(f"Product intent check failed: {e}")

    try:
        llm_output = call_llm(message)
        clean_response = (llm_output or "").strip()
        logger.info(f"Chat bot response: {clean_response}")
        html_response = markdown_to_safe_html(clean_response)
        return {"status": "Success", "response": clean_response, "response_html": html_response}
    except Exception as e:
        logger.error(f"Chat bot error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process your request: {str(e)}")












    

    

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7788)
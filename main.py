
import os
from  fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from db_ops import store_user, fetch_user, fetch_admin, store_products,update_user
from dotenv import load_dotenv
from loguru import logger
import smtplib



load_dotenv()

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
    Email: str
    NewPassword: str
class Product(BaseModel):
    ProductId: str
    ProductName: str
    Description: str
    Category: str
    ImageUrl: str
    Price: float
    StockQuantity: int
    Weight: float


class AdminLoginModel(BaseModel):
    Email: str
    Password: str



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
def send_reset_link(email , reset_link):
    sender=os.getenv("SENDER_EMAIL")
    password =os.getenv("EMAIL_PASSWORD")
    # Placeholder function to simulate sending an email
    logger.info(f"Sending password reset link to {email}: {reset_link}")
    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(sender, password)
            message = f"Subject: Password Reset\n\nClick the link to reset your password: {reset_link}"
            server.sendmail(sender, email, message)
        logger.info("Email sent successfully")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")


@app.get("/")
async def base():
    return {"message": "Hello from bakes!"}

@app.post("/signup")
async def signup(item:SignUpRequest):

    user_data = item.model_dump()
    logger.info(f"Signing up user: {user_data}")
    res=store_user(user_data)
    if not res:
        return {"status": "Error signing up user"}
    return {"status": "User signed up successfully"}

@app.post("/login")
async def login(item:LoginModel):
    
    existing_user = fetch_user({"Email": item.Email, "Password": item.Password})
    if not existing_user:
        return {"status": "Invalid email or password"}
    return {"status": "Login successful"}

@app.post("/forgot-password")
async def forgot_password(item:ForgotPasswordModel):
    existing_user = fetch_user({"Email": item.Email})
    if not existing_user:
        return {"status": "Email not found"}
    reset_link = f"https://example.com/reset-password?email={item.Email}"
    send_reset_link(item.Email, reset_link)
    return {"status": "Password reset link sent to email"}

@app.post("/reset-password")
async def reset_password(item:ResetPasswordModel):
    existing_user = fetch_user({"Email": item.Email})
    if not existing_user:
        return {"status": "Email not found"}
    update_user({"Email": item.Email}, {"Password": item.NewPassword})
    return {"status": "Password reset successful"}


@app.post("/admin/login")
async def admin_login(item:AdminLoginModel):
    existing_admin = fetch_admin(item.model_dump())
    if not existing_admin:
        return {"status": "Your are not ADMIN"}
    return {"status": "Login Successful."}

@app.post("/AddProducts")
async def add_products(item:Product):
    products_data = item.model_dump()
    logger.info(f"Adding Products : {products_data}")
    res= store_products(products_data)
    if not res:
        return {"status": "Error adding products"}
    return {"status": "Products added successfully."}






    

    

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7788)
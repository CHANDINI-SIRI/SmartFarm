from datetime import datetime, timedelta, timezone
import os

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr

from .db import query


router = APIRouter()
security = HTTPBearer()


JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def create_token(user_id: int, email: str):
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc)
        + timedelta(hours=JWT_EXPIRE_HOURS),
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    user_id = payload.get("user_id")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    users = query(
        """
        SELECT id, name, email, created_at
        FROM users
        WHERE id = %s
        """,
        (user_id,),
        fetch=True,
    )

    if not users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return users[0]


@router.post("/register")
def register(data: RegisterRequest):
    existing = query(
        "SELECT id FROM users WHERE email = %s",
        (data.email,),
        fetch=True,
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    if len(data.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 6 characters",
        )

    password_hash = bcrypt.hashpw(
        data.password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    user_id = query(
        """
        INSERT INTO users (name, email, password_hash)
        VALUES (%s, %s, %s)
        """,
        (
            data.name.strip(),
            data.email,
            password_hash,
        ),
    )

    token = create_token(user_id, data.email)

    return {
        "message": "Registration successful",
        "token": token,
        "user": {
            "id": user_id,
            "name": data.name.strip(),
            "email": data.email,
        },
    }


@router.post("/login")
def login(data: LoginRequest):
    users = query(
        """
        SELECT id, name, email, password_hash, created_at
        FROM users
        WHERE email = %s
        """,
        (data.email,),
        fetch=True,
    )

    if not users:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    user = users[0]

    password_valid = bcrypt.checkpw(
        data.password.encode("utf-8"),
        user["password_hash"].encode("utf-8"),
    )

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    token = create_token(
        user["id"],
        user["email"],
    )

    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "created_at": user["created_at"],
        },
    }


@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return {
        "user": current_user
    }
"""Storage utilities for handling file uploads."""

import hashlib
import os
import shutil
import uuid
from pathlib import Path
from typing import BinaryIO

from fastapi import HTTPException, UploadFile

# Configure upload directory
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/tmp/foodstore_uploads"))
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def _ensure_upload_dir() -> Path:
    """Ensure upload directory exists."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    return UPLOAD_DIR


def _get_file_extension(filename: str) -> str:
    """Get lowercase file extension."""
    return Path(filename).suffix.lower()


def _is_allowed_extension(filename: str) -> bool:
    """Check if file extension is allowed."""
    return _get_file_extension(filename) in ALLOWED_EXTENSIONS


def _generate_unique_filename(original_filename: str) -> str:
    """Generate unique filename using UUID to avoid collisions."""
    ext = _get_file_extension(original_filename)
    unique_id = uuid.uuid4().hex[:12]
    return f"{unique_id}{ext}"


def _validate_file_size(file: BinaryIO) -> None:
    """Validate file size is within limits."""
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)  # Reset position
    
    if size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / 1024 / 1024}MB",
        )


async def save_upload(
    file: UploadFile,
    subfolder: str = "products",
) -> str:
    """Save an uploaded file and return its public URL.

    Args:
        file: FastAPI UploadFile object
        subfolder: Subdirectory within uploads (e.g., "products", "categories")

    Returns:
        str: Public URL/path to the saved file

    Raises:
        HTTPException: If file type or size is invalid
    """
    # Validate file extension
    if not _is_allowed_extension(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Validate file size
    # Read first chunk to check size limit
    contents = await file.read(MAX_FILE_SIZE + 1)
    await file.seek(0)
    
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / 1024 / 1024}MB",
        )

    # Generate unique filename and path
    unique_filename = _generate_unique_filename(file.filename)
    upload_path = _ensure_upload_dir() / subfolder
    upload_path.mkdir(parents=True, exist_ok=True)
    
    file_path = upload_path / unique_filename

    try:
        # Save the file
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        # Generate URL path (relative to uploads root)
        url_path = f"/uploads/{subfolder}/{unique_filename}"
        return url_path
        
    except Exception as e:
        # Clean up on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}",
        )
    finally:
        await file.close()


def delete_file(relative_path: str) -> bool:
    """Delete a file by its relative path.

    Args:
        relative_path: Relative path (e.g., "/uploads/products/abc123.jpg")

    Returns:
        bool: True if deleted, False if not found
    """
    # Extract filename from relative path
    filename = Path(relative_path).name
    
    # Try to find and delete in known subdirectories
    for subfolder in ["products", "categories", "users"]:
        file_path = UPLOAD_DIR / subfolder / filename
        if file_path.exists():
            file_path.unlink()
            return True
    
    return False


def get_file_url(relative_path: str, base_url: str = "") -> str:
    """Get full URL for a file path.

    Args:
        relative_path: Relative path (e.g., "/uploads/products/abc123.jpg")
        base_url: Base URL for the application (optional)

    Returns:
        str: Full URL to the file
    """
    if not relative_path:
        return ""
    
    # If already a full URL, return as-is
    if relative_path.startswith("http"):
        return relative_path
    
    # If relative path doesn't start with /, add it
    if not relative_path.startswith("/"):
        relative_path = f"/{relative_path}"
    
    if base_url:
        return f"{base_url.rstrip('/')}{relative_path}"
    
    return relative_path
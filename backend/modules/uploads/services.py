import imghdr
import os
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from backend.core.settings import UPLOADS_DIR
from backend.modules.uploads.schemas import ImagenUploadResponse


ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024


class UploadService:
    def __init__(self) -> None:
        self._local_product_dir = Path(os.getenv("UPLOADS_DIR", str(UPLOADS_DIR))).expanduser() / "productos"

    async def upload_producto_imagen(self, file: UploadFile) -> ImagenUploadResponse:
        raw, ext = await self._read_valid_image(file)

        if self._cloudinary_enabled():
            return self._upload_cloudinary(raw)

        return self._upload_local(raw, ext)

    async def _read_valid_image(self, file: UploadFile) -> tuple[bytes, str]:
        if not file.filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Archivo invalido")

        raw = await file.read()
        if not raw:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo esta vacio")
        if len(raw) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Maximo 8MB por imagen")

        detected = imghdr.what(None, h=raw)
        ext = (detected or "").lower()
        if ext == "jpeg":
            ext = "jpg"
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Formato no permitido. Usa JPG, PNG, WEBP o GIF.",
            )

        return raw, ext

    def _cloudinary_enabled(self) -> bool:
        return all(
            os.getenv(name)
            for name in ("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET")
        )

    def _upload_cloudinary(self, raw: bytes) -> ImagenUploadResponse:
        try:
            import cloudinary
            import cloudinary.uploader
        except ImportError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cloudinary esta configurado pero falta instalar el paquete cloudinary",
            ) from exc

        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET"),
            secure=True,
        )
        result = cloudinary.uploader.upload(raw, folder="foodstore/productos", resource_type="image")
        return ImagenUploadResponse(
            url=result["secure_url"],
            public_id=result.get("public_id"),
            provider="cloudinary",
        )

    def _upload_local(self, raw: bytes, ext: str) -> ImagenUploadResponse:
        self._local_product_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid4().hex}.{ext}"
        file_path = self._local_product_dir / filename
        file_path.write_bytes(raw)
        return ImagenUploadResponse(url=f"/uploads/productos/{filename}", provider="local")

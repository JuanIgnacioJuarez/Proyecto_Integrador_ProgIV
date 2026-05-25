from datetime import datetime

from fastapi import HTTPException, status
from sqlmodel import Session

from backend.core.unit_of_work import UnitOfWork
from backend.modules.admin.schemas import (
    RolAssignRequest,
    UsuarioAdminPaginatedResponse,
    UsuarioAdminRead,
    UsuarioAdminUpdate,
)
from backend.modules.auth.models import Usuario


class AdminUsuarioService:
    """
    Lógica de negocio del panel de administración (gestión de usuarios).

    Toda la mutación de datos pasa por el Unit of Work: el servicio nunca
    llama a session.commit() de forma directa.
    """

    def __init__(self, session: Session) -> None:
        self._session = session

    def _get_or_404(self, uow: UnitOfWork, usuario_id: int) -> Usuario:
        usuario = uow.usuarios.get_by_id(usuario_id)
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuario con id={usuario_id} no encontrado",
            )
        return usuario

    def list_usuarios(
        self,
        rol: str | None,
        offset: int,
        limit: int,
    ) -> UsuarioAdminPaginatedResponse:
        with UnitOfWork(self._session) as uow:
            total, usuarios = uow.usuarios.get_paginated(
                offset=offset,
                limit=limit,
                rol=rol,
            )
            items = [UsuarioAdminRead.model_validate(u) for u in usuarios]
        return UsuarioAdminPaginatedResponse(total=total, items=items)

    def get_by_id(self, usuario_id: int) -> UsuarioAdminRead:
        with UnitOfWork(self._session) as uow:
            usuario = self._get_or_404(uow, usuario_id)
            result = UsuarioAdminRead.model_validate(usuario)
        return result

    def update(self, usuario_id: int, data: UsuarioAdminUpdate) -> UsuarioAdminRead:
        with UnitOfWork(self._session) as uow:
            usuario = self._get_or_404(uow, usuario_id)

            update_data = data.model_dump(exclude_unset=True)
            for campo, valor in update_data.items():
                setattr(usuario, campo, valor)

            usuario.updated_at = datetime.utcnow()
            uow.usuarios.add(usuario)

            result = UsuarioAdminRead.model_validate(usuario)
        return result

    def assign_rol(
        self,
        usuario_id: int,
        data: RolAssignRequest,
        current_admin: Usuario,
    ) -> UsuarioAdminRead:
        with UnitOfWork(self._session) as uow:
            usuario = self._get_or_404(uow, usuario_id)

            # Evita que un ADMIN se quite a sí mismo el rol y quede sin acceso.
            if usuario.id == current_admin.id and data.rol != "ADMIN":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="No podés quitarte tu propio rol ADMIN",
                )

            usuario.rol = data.rol
            usuario.updated_at = datetime.utcnow()
            uow.usuarios.add(usuario)

            result = UsuarioAdminRead.model_validate(usuario)
        return result

    def soft_delete(self, usuario_id: int, current_admin: Usuario) -> None:
        with UnitOfWork(self._session) as uow:
            usuario = self._get_or_404(uow, usuario_id)

            # Evita que un ADMIN se elimine a sí mismo.
            if usuario.id == current_admin.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="No podés eliminar tu propio usuario",
                )

            now = datetime.utcnow()
            usuario.deleted_at = now
            usuario.updated_at = now
            usuario.is_active = False
            uow.usuarios.add(usuario)

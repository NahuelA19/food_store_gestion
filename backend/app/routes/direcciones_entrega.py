from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from app.core.uow import UnitOfWork
from app.dependencies import get_uow, get_current_user
from app.models.user import User
from app.models.direccion_entrega import DireccionEntrega
from pydantic import BaseModel, Field

router = APIRouter(prefix="/direcciones-entrega", tags=["direcciones-entrega"])


class DireccionCreate(BaseModel):
    direccion: str = Field(..., min_length=1, max_length=500)
    ciudad: str = Field(..., min_length=1, max_length=100)
    provincia: str = Field(..., min_length=1, max_length=100)
    codigo_postal: str | None = Field(None, max_length=20)


class DireccionUpdate(BaseModel):
    direccion: str | None = Field(None, min_length=1, max_length=500)
    ciudad: str | None = Field(None, min_length=1, max_length=100)
    provincia: str | None = Field(None, min_length=1, max_length=100)
    codigo_postal: str | None = Field(None, max_length=20)


class DireccionResponse(BaseModel):
    id: int
    usuario_id: int
    direccion: str
    ciudad: str
    provincia: str
    codigo_postal: str | None
    model_config = {"from_attributes": True}


@router.get("/", response_model=list[DireccionResponse])
async def list_direcciones(
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    if current_user.role == "admin":
        direcciones = await uow.direcciones.get_all()
    else:
        stmt = select(DireccionEntrega).where(DireccionEntrega.usuario_id == current_user.id)
        result = await uow.session.execute(stmt)
        direcciones = result.scalars().all()
    return [DireccionResponse.model_validate(d) for d in direcciones]


@router.post("/", response_model=DireccionResponse, status_code=status.HTTP_201_CREATED)
async def create_direccion(
    body: DireccionCreate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    direccion = DireccionEntrega(
        usuario_id=current_user.id,
        direccion=body.direccion,
        ciudad=body.ciudad,
        provincia=body.provincia,
        codigo_postal=body.codigo_postal,
    )
    uow.session.add(direccion)
    await uow.flush()
    await uow.refresh(direccion)
    return DireccionResponse.model_validate(direccion)


@router.put("/{direccion_id}", response_model=DireccionResponse)
async def update_direccion(
    direccion_id: int,
    body: DireccionUpdate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    direccion = await uow.direcciones.get(direccion_id)
    if not direccion:
        raise HTTPException(status.HTTP_404_NOT_FOUND)
    if direccion.usuario_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN)
    if body.direccion is not None:
        direccion.direccion = body.direccion
    if body.ciudad is not None:
        direccion.ciudad = body.ciudad
    if body.provincia is not None:
        direccion.provincia = body.provincia
    if body.codigo_postal is not None:
        direccion.codigo_postal = body.codigo_postal
    uow.session.add(direccion)
    await uow.flush()
    await uow.refresh(direccion)
    return DireccionResponse.model_validate(direccion)


@router.delete("/{direccion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_direccion(
    direccion_id: int,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    direccion = await uow.direcciones.get(direccion_id)
    if not direccion:
        raise HTTPException(status.HTTP_404_NOT_FOUND)
    if direccion.usuario_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN)
    await uow.direcciones.delete(direccion)
    await uow.flush()

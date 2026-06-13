from decimal import Decimal

from backend.modules.pedidos.models import DetallePedido, HistorialEstadoPedido, Pedido


def _login(client, email="cliente@test.com", password="cliente123"):
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200


def _create_pedido(db_session) -> int:
    pedido = Pedido(
        usuario_id=2,
        forma_pago_codigo="EFECTIVO",
        estado_codigo="PENDIENTE",
        subtotal=Decimal("100"),
        descuento=Decimal("0"),
        costo_envio=Decimal("0"),
        total=Decimal("100"),
    )
    db_session.add(pedido)
    db_session.flush()
    db_session.add(
        DetallePedido(
            pedido_id=pedido.id,
            producto_id=1,
            cantidad=1,
            nombre_snapshot="Producto test",
            precio_snapshot=Decimal("100"),
            subtotal_snap=Decimal("100"),
            personalizacion=[],
        )
    )
    db_session.add(
        HistorialEstadoPedido(
            pedido_id=pedido.id,
            estado_desde=None,
            estado_hacia="PENDIENTE",
            usuario_id=2,
        )
    )
    db_session.commit()
    return int(pedido.id)


def test_invalid_transition_rejects_en_camino(client, db_session):
    pedido_id = _create_pedido(db_session)
    _login(client, email="admin@test.com", password="admin123")

    response = client.patch(f"/api/v1/pedidos/{pedido_id}/estado", json={"estado_hacia": "EN_CAMINO"})

    assert response.status_code == 422


def test_cancel_requires_motivo(client, db_session):
    pedido_id = _create_pedido(db_session)
    _login(client)

    response = client.patch(f"/api/v1/pedidos/{pedido_id}/estado", json={"estado_hacia": "CANCELADO"})

    assert response.status_code == 422


def test_cancel_appends_history(client, db_session):
    pedido_id = _create_pedido(db_session)
    _login(client)

    response = client.patch(
        f"/api/v1/pedidos/{pedido_id}/estado",
        json={"estado_hacia": "CANCELADO", "motivo": "Cambio de planes"},
    )

    assert response.status_code == 200
    historial = response.json()["historial"]
    assert [item["estado_hacia"] for item in historial] == ["PENDIENTE", "CANCELADO"]


def test_stock_can_view_orders_but_not_change_status(client, db_session):
    pedido_id = _create_pedido(db_session)
    _login(client, email="stock@test.com", password="stock123")

    list_response = client.get("/api/v1/pedidos")
    detail_response = client.get(f"/api/v1/pedidos/{pedido_id}")
    patch_response = client.patch(
        f"/api/v1/pedidos/{pedido_id}/estado",
        json={"estado_hacia": "CONFIRMADO"},
    )

    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1
    assert detail_response.status_code == 200
    assert detail_response.json()["id"] == pedido_id
    assert patch_response.status_code == 403

import httpx
import asyncio
import sys
import uuid

API_URL = "http://localhost:8000/api/v1"

async def run_e2e_test():
    async with httpx.AsyncClient(base_url=API_URL, timeout=10.0, follow_redirects=True) as client:
        print("=== 1. Autenticación ===")
        # Admin Login
        res = await client.post("/auth/login", json={"email": "admin@foodstore.com", "password": "admin123"})
        if res.status_code != 200:
            print(f"Error Admin: {res.text}")
            return
        admin_token = res.json()["access_token"]
        print(f"Admin logueado.")

        # Create Client via Register
        client_email = f"testclient{uuid.uuid4().hex[:6]}@foodstore.com"
        await client.post("/auth/register", json={"email": client_email, "password": "Cliente123!", "first_name": "C", "last_name": "T", "phone": "1234567890"})
        
        res = await client.post("/auth/login", json={"email": client_email, "password": "Cliente123!"})
        if res.status_code != 200:
            print(f"Error Client Login: {res.text}")
            return
        client_token = res.json()["access_token"]
        print(f"Cliente logueado.")
        
        print("\n=== 2. Creando Producto e Inventario (Admin) ===")
        res = await client.post("/categories", json={"name": f"Cat {uuid.uuid4().hex[:6]}", "description": "Cat for KDS"}, headers={"Authorization": f"Bearer {admin_token}"})
        category_id = res.json().get("id", 1)
        
        res = await client.post("/products", json={
            "name": f"Hamburguesa KDS {uuid.uuid4().hex[:6]}",
            "description": "Test E2E",
            "price": 1500.0,
            "category_id": category_id,
            "stock": 10,
            "is_active": True
        }, headers={"Authorization": f"Bearer {admin_token}"})
        
        if res.status_code not in (200, 201):
            print(f"Error Producto: {res.text}")
            return
            
        product_id = res.json()["id"]
        print(f"Producto creado: {product_id}")

        # Update Inventory
        res = await client.put(f"/inventory/{product_id}", json={"stock_quantity": 50}, headers={"Authorization": f"Bearer {admin_token}"})
        if res.status_code != 200:
             print(f"Error Inventario: {res.text}")
             return
        print(f"Inventario actualizado: {res.json()['stock_quantity']} unidades")

        print("\n=== 3. Carrito y Compra (Cliente) ===")
        # Get cart
        res = await client.get("/carts", headers={"Authorization": f"Bearer {client_token}"})
        if res.status_code != 200:
            print(f"Error GET Cart: {res.text}")
            return
        cart_id = res.json()["id"]
        
        res = await client.post(f"/carts/{cart_id}/items", json={"product_id": product_id, "quantity": 2}, headers={"Authorization": f"Bearer {client_token}"})
        print(f"Agregado al carrito: {res.status_code}")
        
        res = await client.post(f"/carts/{cart_id}/checkout", json={"shipping_address": "Test Calle 123", "notes": "Sin cebolla"}, headers={"Authorization": f"Bearer {client_token}"})
        if res.status_code not in (200, 201):
            print(f"Error Checkout: {res.text}")
            return
            
        order = res.json()
        order_id = order["order_id"]
        print(f"Orden creada (PENDIENTE): {order_id}")
        
        print("\n=== 4. Simulando Pago Exitoso ===")
        res = await client.patch(f"/orders/{order_id}/status", json={"status": "confirmed"}, headers={"Authorization": f"Bearer {admin_token}"})
        print(f"Orden actualizada a confirmed: {res.status_code}")
        if res.status_code != 200:
             print(f"Response: {res.text}")

        print("\n=== 5. Kitchen Display System (Admin/Chef) ===")
        res = await client.get("/cocina/pedidos", headers={"Authorization": f"Bearer {admin_token}"})
        if res.status_code != 200:
             print(f"Error Kitchen KDS: {res.text}")
             return
             
        kds_orders = res.json()["items"]
        print(f"Pedidos en la cocina: {len(kds_orders)}")
        found = any(o["id"] == order_id for o in kds_orders)
        print(f"¿Orden en KDS?: {found}")
        
        if found:
            print("\n=== 6. Chef Avanzando Pedido ===")
            res = await client.patch(f"/orders/{order_id}/status", json={"status": "en_prep"}, headers={"Authorization": f"Bearer {admin_token}"})
            print(f"Chef pasó a EN_PREP: {res.status_code}")
            if res.status_code != 200:
                print(res.text)
            
            res = await client.patch(f"/orders/{order_id}/status", json={"status": "en_camino"}, headers={"Authorization": f"Bearer {admin_token}"})
            print(f"Chef pasó a EN_CAMINO: {res.status_code}")
            if res.status_code != 200:
                print(res.text)
            
            if res.status_code == 200:
                print("\n✅ TODO FUNCIONA PERFECTAMENTE: CREACIÓN -> CARRITO -> CHECKOUT -> COCINA -> DESPACHO")
            else:
                print(f"Error al avanzar a EN_CAMINO: {res.text}")
        else:
            print("No se encontró la orden en KDS")

if __name__ == "__main__":
    asyncio.run(run_e2e_test())

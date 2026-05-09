import { useEffect, useState, useCallback } from "react";
import { orderApi } from "../api/orderApi";
import type { Order, OrderDetail, OrderStatus } from "../types/order";

export function useOrders(page = 1, status?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await orderApi.getOrders(page, status);
        setOrders(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch orders");
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [page, status]);

  return { orders, total, totalPages, isLoading, error };
}

export function useOrder(id: number) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await orderApi.getOrder(id);
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch order");
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  return { order, isLoading, error };
}

export function useUpdateOrderStatus() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(async (id: number, status: OrderStatus) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await orderApi.updateOrderStatus(id, status);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { updateStatus, isLoading, error };
}

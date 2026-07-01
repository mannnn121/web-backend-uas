"use client";

import { Button, Surface } from "@heroui/react";
import { useEffect, useState } from "react";
import useSWR from "swr";

const API_URL = "http://localhost:3000";

async function fetcher(url) {
  const token = localStorage.getItem("token");
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load orders");
  }

  return data;
}

async function deleteOrder(orderId) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/orders/${orderId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to delete order");
  }

  return data;
}

function formatCurrency(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function OrdersPage() {
  const [user, setUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const {
    data: orders,
    error,
    isLoading,
    mutate,
  } = useSWR(`${API_URL}/orders`, fetcher);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    setConfirmDeleteId(null);
  }, [selectedOrder]);

  async function handleDelete(orderId) {
    setErrorMessage("");

    try {
      await deleteOrder(orderId);
      setSelectedOrder((currentOrder) =>
        currentOrder?.id === orderId ? null : currentOrder,
      );
      await mutate();
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  const canDeleteOrders = user?.role === "admin";

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="flex min-w-0 flex-col gap-4">
        <Surface className="rounded-3xl bg-surface p-6">
          <h1 className="text-xl font-semibold text-foreground">Orders</h1>
          <p className="mt-1 text-sm text-muted">
            Review order history and payment details.
          </p>
        </Surface>

        <Surface className="overflow-hidden rounded-3xl bg-surface">
          {errorMessage || error
            ? <p className="border-b border-border px-6 py-3 text-sm text-danger">
                {errorMessage || error.message}
              </p>
            : null}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="px-6 py-3 font-medium">Order</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Cashier</th>
                  <th className="px-6 py-3 font-medium">Payment</th>
                  <th className="px-6 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? <tr>
                      <td className="px-6 py-4 text-muted" colSpan={5}>
                        Loading orders...
                      </td>
                    </tr>
                  : null}

                {orders?.length === 0
                  ? <tr>
                      <td className="px-6 py-4 text-muted" colSpan={5}>
                        No orders yet.
                      </td>
                    </tr>
                  : null}

                {orders?.map((order) => (
                  <tr
                    className="cursor-pointer border-b border-border hover:bg-surface-secondary last:border-0"
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-6 py-4 font-medium">#{order.id}</td>
                    <td className="px-6 py-4">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {order.users?.name || order.users?.email || "-"}
                    </td>
                    <td className="px-6 py-4 uppercase">
                      {order.payment_method || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatCurrency(order.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      </div>

      <Surface className="h-fit rounded-3xl bg-surface p-6">
        {selectedOrder
          ? <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Order #{selectedOrder.id}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {formatDate(selectedOrder.created_at)}
                </p>
              </div>

              <div className="grid gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Cashier</span>
                  <span className="text-right">
                    {selectedOrder.users?.name ||
                      selectedOrder.users?.email ||
                      "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Payment</span>
                  <span className="uppercase">
                    {selectedOrder.payment_method || "-"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Status</span>
                  <span>{selectedOrder.payment_status || "-"}</span>
                </div>
                {selectedOrder.payment_reference
                  ? <div className="flex justify-between gap-4">
                      <span className="text-muted">Reference</span>
                      <span>{selectedOrder.payment_reference}</span>
                    </div>
                  : null}
              </div>

              <div className="border-border border-t pt-4">
                <h3 className="font-medium text-foreground">Items</h3>
                <div className="mt-3 flex flex-col gap-3">
                  {selectedOrder.order_items?.map((item) => (
                    <div
                      className="rounded-2xl border border-border p-3"
                      key={item.id}
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {item.menus?.name || `Menu #${item.menu_id}`}
                          </p>
                          <p className="text-sm text-muted">
                            {item.quantity} x {formatCurrency(item.price)}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          {formatCurrency(Number(item.price) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 border-border border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Total</span>
                  <span className="font-medium">
                    {formatCurrency(selectedOrder.total_price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Paid</span>
                  <span>{formatCurrency(selectedOrder.paid_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Change</span>
                  <span>{formatCurrency(selectedOrder.change_amount)}</span>
                </div>
              </div>

              {canDeleteOrders
                ? <div className="border-border border-t pt-4">
                    {confirmDeleteId === selectedOrder.id
                      ? <div className="flex flex-col gap-2">
                          <p className="text-sm text-foreground">
                            Delete order #{selectedOrder.id}?
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onPress={() => setConfirmDeleteId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onPress={() => {
                                handleDelete(selectedOrder.id);
                                setConfirmDeleteId(null);
                              }}
                            >
                              Confirm
                            </Button>
                          </div>
                        </div>
                      : <Button
                          size="sm"
                          variant="danger"
                          onPress={() => setConfirmDeleteId(selectedOrder.id)}
                        >
                          Delete Order
                        </Button>}
                  </div>
                : null}
            </div>
          : <div>
              <h2 className="text-lg font-semibold text-foreground">
                Order Detail
              </h2>
              <p className="mt-1 text-sm text-muted">
                Select an order to view its items and payment details.
              </p>
            </div>}
      </Surface>
    </div>
  );
}

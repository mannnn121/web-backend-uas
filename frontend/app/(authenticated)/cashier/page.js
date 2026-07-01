"use client";

import { Button, Input, Label, Surface } from "@heroui/react";
import { useMemo, useState } from "react";
import useSWR from "swr";
import API_URL from "@/lib/api";

async function fetcher(url) {
  const token = localStorage.getItem("token");
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load data");
  }

  return data;
}

async function createOrder(payload) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create order");
  }

  return data;
}

export default function CashierPage() {
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    data: menus,
    error,
    isLoading,
    mutate,
  } = useSWR(`${API_URL}/menus`, fetcher);

  const totalPrice = useMemo(() => {
    return cart.reduce(
      (total, item) => total + Number(item.price) * item.quantity,
      0,
    );
  }, [cart]);

  const changeAmount =
    paymentMethod === "cash"
      ? Math.max(Number(paidAmount || 0) - totalPrice, 0)
      : 0;

  function addToCart(menu) {
    setMessage("");
    setErrorMessage("");

    if ((menu.stock ?? 0) <= 0) {
      setErrorMessage(`${menu.name} is out of stock`);
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.menu_id === menu.id);

      if (existingItem) {
        if (existingItem.quantity >= (menu.stock ?? 0)) {
          setErrorMessage(`${menu.name} does not have enough stock`);
          return currentCart;
        }

        return currentCart.map((item) =>
          item.menu_id === menu.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          menu_id: menu.id,
          name: menu.name,
          price: Number(menu.price),
          stock: menu.stock ?? 0,
          quantity: 1,
        },
      ];
    });
  }

  function updateQuantity(menuId, quantity) {
    setCart((currentCart) => {
      return currentCart
        .map((item) => {
          if (item.menu_id !== menuId) {
            return item;
          }

          return {
            ...item,
            quantity: Math.min(Math.max(Number(quantity) || 1, 1), item.stock),
          };
        })
        .filter((item) => item.quantity > 0);
    });
  }

  function removeFromCart(menuId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.menu_id !== menuId),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await createOrder({
        payment_method: paymentMethod,
        paid_amount: paymentMethod === "qris" ? totalPrice : paidAmount,
        payment_reference:
          paymentMethod === "qris" ? paymentReference : undefined,
        items: cart.map((item) => ({
          menu_id: item.menu_id,
          quantity: item.quantity,
        })),
      });

      setMessage("Order created successfully");
      setCart([]);
      setPaidAmount("");
      await mutate();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <Surface className="rounded-3xl bg-surface p-6">
          <h1 className="text-xl font-semibold text-foreground">Cashier</h1>
          <p className="mt-1 text-sm text-muted">
            Select menu items to create an order.
          </p>
        </Surface>

        <Surface className="rounded-3xl bg-surface p-6">
          {error
            ? <p className="text-sm text-danger">{error.message}</p>
            : null}
          {isLoading
            ? <p className="text-sm text-muted">Loading menus...</p>
            : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {menus?.map((menu) => (
              <button
                className="rounded-2xl border border-border p-4 text-left transition hover:bg-surface-secondary disabled:opacity-50"
                disabled={(menu.stock ?? 0) <= 0}
                key={menu.id}
                onClick={() => addToCart(menu)}
                type="button"
              >
                <p className="font-medium text-foreground">{menu.name}</p>
                <p className="mt-1 text-sm text-muted">
                  Rp {Number(menu.price).toLocaleString("id-ID")}
                </p>
                <p className="mt-3 text-xs text-muted">
                  Stock: {menu.stock ?? 0}
                </p>
              </button>
            ))}
          </div>
        </Surface>
      </div>

      <Surface className="rounded-3xl bg-surface p-6">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Cart</h2>
            <p className="mt-1 text-sm text-muted">
              {cart.length} item{cart.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {cart.length === 0
              ? <p className="rounded-2xl border border-border p-4 text-sm text-muted">
                  No items selected.
                </p>
              : null}

            {cart.map((item) => (
              <div
                className="rounded-2xl border border-border p-3"
                key={item.menu_id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted">
                      Rp {Number(item.price).toLocaleString("id-ID")}
                    </p>
                  </div>
          {errorMessage
            ? <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">
                {errorMessage}
              </p>
            : null}
          {message
            ? <p className="rounded-lg bg-success-50 px-3 py-2 text-sm text-success">
                {message}
              </p>
            : null}

          <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    onPress={() => removeFromCart(item.menu_id)}
                  >
                    Remove
                  </Button>
                </div>
                <Input
                  className="mt-3 w-full"
                  min="1"
                  max={item.stock}
                  type="number"
                  value={String(item.quantity)}
                  variant="secondary"
                  onChange={(event) =>
                    updateQuantity(item.menu_id, event.target.value)
                  }
                />
              </div>
            ))}
          </div>

          <div className="border-border border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Total</span>
              <span className="text-xl font-semibold text-foreground">
                Rp {totalPrice.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Payment Method</Label>
            <select
              className="input input--secondary w-full"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="qris">QRIS</option>
            </select>
          </div>

          {paymentMethod === "cash"
            ? <div className="grid gap-2">
                <Label>Paid Amount</Label>
                <Input
                  min="0"
                  placeholder="0"
                  type="number"
                  value={paidAmount}
                  variant="secondary"
                  onChange={(event) => setPaidAmount(event.target.value)}
                />
                <p className="text-sm text-muted">
                  Change: Rp {changeAmount.toLocaleString("id-ID")}
                </p>
              </div>
            : <div className="grid gap-2">
                <Label>QRIS Reference</Label>
                <p className="rounded-xl bg-surface-secondary px-3 py-2 text-sm text-muted">
                  Auto-generated on payment
                </p>
              </div>}

          <Button
            className="w-full"
            isDisabled={cart.length === 0}
            isPending={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Creating..." : "Create Order"}
          </Button>
        </form>
      </Surface>
    </div>
  );
}

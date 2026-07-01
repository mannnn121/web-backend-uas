"use client";

import { Surface } from "@heroui/react";
import { useEffect, useState } from "react";
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
    throw new Error(data.error || "Failed to load dashboard data");
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

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const { data: todayReport, error: todayError } = useSWR(
    `${API_URL}/reports/today`,
    fetcher,
  );
  const { data: lowStockMenus, error: lowStockError } = useSWR(
    `${API_URL}/reports/low-stock`,
    fetcher,
  );
  const { data: menus, error: menusError } = useSWR(
    `${API_URL}/menus`,
    fetcher,
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const error = todayError || lowStockError || menusError;

  return (
    <div className="flex w-full flex-col gap-4">
      <Surface className="rounded-3xl bg-surface p-6">
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Signed in as {user?.name || user?.email || "User"}
        </p>
      </Surface>

      {error
        ? <Surface className="rounded-3xl bg-surface p-6">
            <p className="text-sm text-danger">{error.message}</p>
          </Surface>
        : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Surface className="rounded-3xl bg-surface p-5">
          <p className="text-sm text-muted">Today sales</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {formatCurrency(todayReport?.total_sales)}
          </p>
        </Surface>
        <Surface className="rounded-3xl bg-surface p-5">
          <p className="text-sm text-muted">Transactions</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {todayReport?.transaction_count ?? 0}
          </p>
        </Surface>
        <Surface className="rounded-3xl bg-surface p-5">
          <p className="text-sm text-muted">Menu items</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {menus?.length ?? 0}
          </p>
        </Surface>
        <Surface className="rounded-3xl bg-surface p-5">
          <p className="text-sm text-muted">Low stock</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {lowStockMenus?.length ?? 0}
          </p>
        </Surface>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Surface className="overflow-hidden rounded-3xl bg-surface">
          <div className="border-border border-b px-6 py-4">
            <h2 className="font-semibold text-foreground">
              Recent Orders Today
            </h2>
            <p className="mt-1 text-sm text-muted">
              Latest transactions for today.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-border border-b text-muted">
                <tr>
                  <th className="px-6 py-3 font-medium">Order</th>
                  <th className="px-6 py-3 font-medium">Time</th>
                  <th className="px-6 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {todayReport?.orders?.length === 0
                  ? <tr>
                      <td className="px-6 py-4 text-muted" colSpan={3}>
                        No orders today.
                      </td>
                    </tr>
                  : null}

                {todayReport?.orders?.slice(0, 5).map((order) => (
                  <tr
                    className="border-border border-b last:border-0"
                    key={order.id}
                  >
                    <td className="px-6 py-4">#{order.id}</td>
                    <td className="px-6 py-4">
                      {formatDate(order.created_at)}
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

        <Surface className="overflow-hidden rounded-3xl bg-surface">
          <div className="border-border border-b px-6 py-4">
            <h2 className="font-semibold text-foreground">Low Stock</h2>
            <p className="mt-1 text-sm text-muted">
              Menus that need restocking.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-border border-b text-muted">
                <tr>
                  <th className="px-6 py-3 font-medium">Menu</th>
                  <th className="px-6 py-3 text-right font-medium">Stock</th>
                  <th className="px-6 py-3 text-right font-medium">Minimum</th>
                </tr>
              </thead>
              <tbody>
                {lowStockMenus?.length === 0
                  ? <tr>
                      <td className="px-6 py-4 text-muted" colSpan={3}>
                        No low-stock menus.
                      </td>
                    </tr>
                  : null}

                {lowStockMenus?.slice(0, 5).map((menu) => (
                  <tr
                    className="border-border border-b last:border-0"
                    key={menu.id}
                  >
                    <td className="px-6 py-4">{menu.name}</td>
                    <td className="px-6 py-4 text-right">{menu.stock ?? 0}</td>
                    <td className="px-6 py-4 text-right">
                      {menu.minimum_stock ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      </div>
    </div>
  );
}

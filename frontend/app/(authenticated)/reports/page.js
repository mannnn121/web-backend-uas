"use client";

import { Surface } from "@heroui/react";
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
    throw new Error(data.error || "Failed to load report");
  }

  return data;
}

function formatCurrency(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

export default function ReportsPage() {
  const { data: todayReport, error: todayError } = useSWR(
    `${API_URL}/reports/today`,
    fetcher,
  );
  const { data: lowStockMenus, error: lowStockError } = useSWR(
    `${API_URL}/reports/low-stock`,
    fetcher,
  );
  const { data: bestSellingMenus, error: bestSellingError } = useSWR(
    `${API_URL}/reports/best-selling`,
    fetcher,
  );

  const error = todayError || lowStockError || bestSellingError;

  return (
    <div className="flex w-full flex-col gap-4">
      <Surface className="rounded-3xl bg-surface p-6">
        <h1 className="text-xl font-semibold text-foreground">Reports</h1>
        <p className="mt-1 text-sm text-muted">
          Today sales, low stock, and best-selling menus.
        </p>
      </Surface>

      {error
        ? <Surface className="rounded-3xl bg-surface p-6">
            <p className="text-sm text-danger">{error.message}</p>
          </Surface>
        : null}

      <div className="grid gap-4 md:grid-cols-3">
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
          <p className="text-sm text-muted">Low-stock menus</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {lowStockMenus?.length ?? 0}
          </p>
        </Surface>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Surface className="overflow-hidden rounded-3xl bg-surface">
          <div className="border-border border-b px-6 py-4">
            <h2 className="font-semibold text-foreground">Low Stock</h2>
            <p className="mt-1 text-sm text-muted">
              Menus where stock is at or below minimum.
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

                {lowStockMenus?.map((menu) => (
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

        <Surface className="overflow-hidden rounded-3xl bg-surface">
          <div className="border-border border-b px-6 py-4">
            <h2 className="font-semibold text-foreground">Best Selling</h2>
            <p className="mt-1 text-sm text-muted">
              Top menus by quantity sold.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-border border-b text-muted">
                <tr>
                  <th className="px-6 py-3 font-medium">Menu</th>
                  <th className="px-6 py-3 text-right font-medium">Sold</th>
                </tr>
              </thead>
              <tbody>
                {bestSellingMenus?.length === 0
                  ? <tr>
                      <td className="px-6 py-4 text-muted" colSpan={2}>
                        No sales data yet.
                      </td>
                    </tr>
                  : null}

                {bestSellingMenus?.map((menu) => (
                  <tr
                    className="border-border border-b last:border-0"
                    key={menu.menu_id}
                  >
                    <td className="px-6 py-4">{menu.menu_name}</td>
                    <td className="px-6 py-4 text-right">
                      {menu.total_quantity}
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

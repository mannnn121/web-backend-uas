"use client";

import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Surface,
  TextField,
} from "@heroui/react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import API_URL from "@/lib/api";

async function menuFetcher(url) {
  const token = localStorage.getItem("token");
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load menus");
  }

  return data;
}

async function menuRequest(path, { method, body }) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Menu request failed");
  }

  return data;
}

export default function MenusPage() {
  const [user, setUser] = useState(null);
  const [editingMenu, setEditingMenu] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [reactivateTarget, setReactivateTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const {
    data: menus,
    error,
    isLoading,
    mutate,
  } = useSWR(`${API_URL}/menus`, menuFetcher);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      price: formData.get("price"),
      stock: formData.get("stock"),
      minimum_stock: formData.get("minimum_stock"),
    };

    try {
      if (editingMenu) {
        await menuRequest(`/menus/${editingMenu.id}`, {
          method: "PATCH",
          body: payload,
        });
        setEditingMenu(null);
      } else {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/menus`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 409 && data.existingMenuId) {
            setReactivateTarget(data);
            return;
          }
          throw new Error(data.error || "Failed to create menu");
        }
      }

      form.reset();
      await mutate();
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  async function handleDeactivate(menuId) {
    setErrorMessage("");

    try {
      await menuRequest(`/menus/${menuId}`, { method: "DELETE" });
      await mutate();
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  async function handleReactivate(menuId) {
    setErrorMessage("");
    try {
      await menuRequest(`/menus/${menuId}/reactivate`, { method: "PATCH" });
      setReactivateTarget(null);
      await mutate();
    } catch (err) {
      setErrorMessage(err.message);
      setReactivateTarget(null);
    }
  }

  const canManageMenus = user?.role === "admin";

  return (
    <div className="flex w-full flex-col gap-4">
      <Surface className="rounded-3xl bg-surface p-6">
        <h1 className="text-xl font-semibold text-foreground">Menus</h1>
        <p className="mt-1 text-sm text-muted">Manage menu items and prices.</p>
      </Surface>

      {canManageMenus
        ? <Surface className="rounded-3xl bg-surface p-6">
            <Form
              className="grid gap-4 lg:grid-cols-[1fr_140px_120px_140px_auto]"
              onSubmit={handleSubmit}
            >
              <TextField
                isRequired
                fullWidth
                defaultValue={editingMenu?.name || ""}
                key={`name-${editingMenu?.id || "new"}`}
                name="name"
              >
                <Label>Name</Label>
                <Input autoComplete="off" placeholder="Menu name" variant="secondary" />
                <FieldError />
              </TextField>

              <TextField
                isRequired
                fullWidth
                defaultValue={
                  editingMenu?.price ? String(editingMenu.price) : ""
                }
                key={`price-${editingMenu?.id || "new"}`}
                name="price"
                type="number"
              >
                <Label>Price</Label>
                <Input
                  autoComplete="off"
                  min="0"
                  placeholder="0"
                  step="0.01"
                  variant="secondary"
                />
                <FieldError />
              </TextField>

              <TextField
                isRequired
                fullWidth
                defaultValue={
                  editingMenu?.stock ? String(editingMenu.stock) : "0"
                }
                key={`stock-${editingMenu?.id || "new"}`}
                name="stock"
                type="number"
              >
                <Label>Stock</Label>
                <Input autoComplete="off" min="0" placeholder="0" step="1" variant="secondary" />
                <FieldError />
              </TextField>

              <TextField
                isRequired
                fullWidth
                defaultValue={
                  editingMenu?.minimum_stock
                    ? String(editingMenu.minimum_stock)
                    : "0"
                }
                key={`minimum-stock-${editingMenu?.id || "new"}`}
                name="minimum_stock"
                type="number"
              >
                <Label>Minimum</Label>
                <Input autoComplete="off" min="0" placeholder="0" step="1" variant="secondary" />
                <FieldError />
              </TextField>

              <div className="flex items-start gap-2 self-start pt-6">
                <Button className="flex-1 sm:flex-none" type="submit">
                  {editingMenu ? "Save" : "Add"}
                </Button>
                {editingMenu
                  ? <Button
                      type="button"
                      variant="secondary"
                      onPress={() => setEditingMenu(null)}
                    >
                      Cancel
                    </Button>
                  : null}
              </div>
            </Form>
          </Surface>
        : null}

      {reactivateTarget
        ? <Surface className="rounded-3xl bg-surface p-6">
            <p className="text-foreground">
              "{reactivateTarget.existingMenu?.name}" already exists but is
              deactivated. Reactivate it?
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                onPress={() => setReactivateTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={() =>
                  handleReactivate(reactivateTarget.existingMenuId)
                }
              >
                Reactivate
              </Button>
            </div>
          </Surface>
        : null}

      {deactivateTarget
        ? <Surface className="rounded-3xl bg-surface p-6">
            <p className="text-foreground">
              Are you sure you want to deactivate "{deactivateTarget.name}"?
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                onPress={() => setDeactivateTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  handleDeactivate(deactivateTarget.id);
                  setDeactivateTarget(null);
                }}
              >
                Deactivate
              </Button>
            </div>
          </Surface>
        : null}

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
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Price</th>
                <th className="px-6 py-3 font-medium">Stock</th>
                <th className="px-6 py-3 font-medium">Minimum</th>
                {canManageMenus
                  ? <th className="px-6 py-3 text-right font-medium">
                      Actions
                    </th>
                  : null}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? <tr>
                    <td
                      className="px-6 py-4 text-muted"
                      colSpan={canManageMenus ? 5 : 4}
                    >
                      Loading menus...
                    </td>
                  </tr>
                : null}

              {menus?.length === 0
                ? <tr>
                    <td
                      className="px-6 py-4 text-muted"
                      colSpan={canManageMenus ? 5 : 4}
                    >
                      No menus yet.
                    </td>
                  </tr>
                : null}

              {menus?.map((menu) => (
                <tr
                  className="border-b border-border last:border-0"
                  key={menu.id}
                >
                  <td className="px-6 py-4">{menu.name}</td>
                  <td className="px-6 py-4">
                    {Number(menu.price).toLocaleString("id-ID")}
                  </td>
                  <td className="px-6 py-4">{menu.stock ?? 0}</td>
                  <td className="px-6 py-4">{menu.minimum_stock ?? 0}</td>
                  {canManageMenus
                    ? <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onPress={() => setEditingMenu(menu)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onPress={() => setDeactivateTarget(menu)}
                          >
                            Deactivate
                          </Button>
                        </div>
                      </td>
                    : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}

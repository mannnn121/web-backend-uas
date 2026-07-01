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
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWRMutation from "swr/mutation";
import API_URL from "@/lib/api";

async function login(url, { arg }) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Sign in failed");
  }

  return data;
}

export default function LoginPage() {
  const router = useRouter();
  const { error, isMutating, trigger } = useSWRMutation(
    `${API_URL}/auth/login`,
    login,
    {
      onSuccess: (loginData) => {
        localStorage.setItem("token", loginData.token);
        localStorage.setItem("user", JSON.stringify(loginData.user));
        router.replace("/");
      },
    },
  );

  useEffect(() => {
    if (localStorage.getItem("token")) {
      router.replace("/");
    }
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await trigger(
      {
        email: formData.get("email"),
        password: formData.get("password"),
      },
      { throwOnError: false },
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Surface className="w-full max-w-sm rounded-3xl bg-surface p-6">
        <Form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
          <h1 className="mb-1 text-xl font-semibold text-foreground">
            Sign in
          </h1>

          <TextField isRequired fullWidth name="email" type="email">
            <Label>Email</Label>
            <Input
              autoComplete="email"
              className="w-full"
              placeholder="admin@example.com"
              variant="secondary"
            />
            <FieldError />
          </TextField>

          <TextField isRequired fullWidth name="password" type="password">
            <Label>Password</Label>
            <Input
              autoComplete="current-password"
              className="w-full"
              placeholder="Enter your password"
              variant="secondary"
            />
            <FieldError />
          </TextField>

          {error
            ? <output className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger">
                {error.message}
              </output>
            : null}

          <Button className="mt-1 w-full" isPending={isMutating} type="submit">
            {isMutating ? "Signing in..." : "Sign in"}
          </Button>
        </Form>
      </Surface>
    </main>
  );
}

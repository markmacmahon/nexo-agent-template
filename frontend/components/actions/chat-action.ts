"use server";

import { cookies } from "next/headers";
import {
  createThread,
  createMessage,
  listMessages,
  listThreads,
} from "@/app/clientService";
import type { ThreadRead, MessageRead } from "@/app/openapi-client";
import { t, translateError } from "@/i18n/keys";

function getErrorDetail(error: unknown): string {
  const raw =
    typeof error === "object" && error !== null && "detail" in error
      ? String((error as { detail: unknown }).detail)
      : String(error);
  return translateError(raw);
}

export async function fetchThreads(
  appId: string,
  page: number = 1,
  size: number = 50,
): Promise<{ data: ThreadRead[] } | { error: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return { error: t("ERROR_NO_TOKEN") };
  }

  try {
    const { data, error } = await listThreads({
      path: { app_id: appId },
      query: { page, size },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (error) {
      return { error: getErrorDetail(error) };
    }

    return { data: data?.items || [] };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : t("ERROR_FETCH_THREADS"),
    };
  }
}

export async function startThread(
  appId: string,
  title: string,
  customerId: string,
): Promise<{ data: ThreadRead } | { error: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return { error: t("ERROR_NO_TOKEN") };
  }

  try {
    const { data, error } = await createThread({
      path: { app_id: appId },
      body: { title, customer_id: customerId },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (error) {
      return { error: getErrorDetail(error) };
    }

    if (!data) {
      return { error: t("ERROR_NO_DATA") };
    }

    return { data };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : t("ERROR_CREATE_THREAD"),
    };
  }
}

export async function sendMessage(
  appId: string,
  threadId: string,
  content: string,
): Promise<{ data: MessageRead } | { error: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return { error: t("ERROR_NO_TOKEN") };
  }

  try {
    const { data, error } = await createMessage({
      path: { app_id: appId, thread_id: threadId },
      body: { content },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (error) {
      return { error: getErrorDetail(error) };
    }

    if (!data) {
      return { error: t("ERROR_NO_DATA") };
    }

    return { data };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : t("ERROR_SEND_MESSAGE"),
    };
  }
}

export async function fetchMessages(
  appId: string,
  threadId: string,
  limit: number = 100,
): Promise<{ data: MessageRead[] } | { error: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return { error: t("ERROR_NO_TOKEN") };
  }

  try {
    const { data, error } = await listMessages({
      path: { app_id: appId, thread_id: threadId },
      query: { limit },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (error) {
      return { error: getErrorDetail(error) };
    }

    return { data: data || [] };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : t("ERROR_FETCH_MESSAGES"),
    };
  }
}

export async function getStreamToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value ?? null;
}

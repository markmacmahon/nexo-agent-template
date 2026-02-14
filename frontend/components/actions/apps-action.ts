"use server";

import { cookies } from "next/headers";
import { readApp, deleteApp, createApp } from "@/app/clientService";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { appSchema } from "@/lib/definitions";

export async function fetchApps(page: number = 1, size: number = 10) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return { message: "No access token found" };
  }

  const { data, error } = await readApp({
    query: {
      page: page,
      size: size,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (error) {
    return { message: error };
  }

  return data;
}

export async function removeApp(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return { message: "No access token found" };
  }

  const { error } = await deleteApp({
    headers: {
      Authorization: `Bearer ${token}`,
    },
    path: {
      app_id: id,
    },
  });

  if (error) {
    return { message: error };
  }
  revalidatePath("/dashboard");
}

export async function addApp(prevState: {}, formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return { message: "No access token found" };
  }

  const validatedFields = appSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, description } = validatedFields.data;

  const input = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: {
      name,
      description,
    },
  };
  const { error } = await createApp(input);
  if (error) {
    return { message: `${error.detail}` };
  }
  redirect(`/dashboard`);
}

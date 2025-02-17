import { GetSpaceResponse } from "./types";

export async function getSpace(id: number) {
  const response = await fetch(`/api/spaces/${id}`, { method: "GET" });
  const space = (await response.json()) as GetSpaceResponse;
  return space;
}

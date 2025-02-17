import useSWR from "swr";

import { Profile } from "../../server/helpers/fetchProfile";
import { fetcher } from "../utils/fetcher";

export function useProfileByAddress(address?: string) {
  const { data, error, isLoading } = useSWR<Profile | null>(
    () => (address ? `/api/profiles/by-address/${address}` : null),
    fetcher
  );

  return {
    profile: data,
    isLoading,
    error,
  };
}

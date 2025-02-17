import { Profile__factory, PROFILE_ADDRESS } from "contracts";
import { cache } from "react";

import { ethersProvider } from "../ethers";

export const fetchProfileHandle = cache(async (profileId: number) => {
  try {
    const contract = Profile__factory.connect(PROFILE_ADDRESS, ethersProvider);

    // Fetch handle
    const [handleString, handleIdBigNumber] = await contract.getHandle(profileId);
    const handleId = handleIdBigNumber.toNumber();

    // No handle found
    if (handleId === 0) return null;

    return {
      id: handleId,
      string: handleString,
      full: `${handleString}#${handleId.toString().padStart(4, "0")}`,
    };
  } catch {
    return null;
  }
});

export type Handle = {
  id: number;
  string: string;
  full: string;
};

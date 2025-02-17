"use client";

import { Client } from "@wired-labs/react-client";
import { ERC721Metadata } from "contracts";
import Script from "next/script";
import { useState } from "react";

import Overlay from "./Overlay";

interface Props {
  spaceId: number;
  metadata: ERC721Metadata;
}

export default function App({ spaceId, metadata }: Props) {
  const [scriptsReady, setScriptsReady] = useState(false);

  return (
    <>
      <Script src="/scripts/draco_decoder.js" onReady={() => setScriptsReady(true)} />

      <div className="fixed h-screen w-screen">
        {scriptsReady ? (
          <Client
            spaceId={spaceId}
            metadata={metadata}
            host={process.env.NEXT_PUBLIC_DEFAULT_HOST}
            animations="/models"
            defaultAvatar="/models/Robot.vrm"
            skybox="/images/Skybox.jpg"
          >
            <Overlay />
          </Client>
        ) : null}
      </div>
    </>
  );
}

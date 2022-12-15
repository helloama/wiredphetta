import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import { useAnalytics } from "../../app/hooks/useAnalytics";
import { useAppHotkeys } from "../../app/hooks/useAppHotkeys";
import { useLoadUser } from "../../app/hooks/useLoadUser";
import { useResizeEngineCanvas } from "../../app/hooks/useResizeEngineCanvas";
import { useSetAvatar } from "../../app/hooks/useSetAvatar";
import { useAppStore } from "../../app/store";
import ChatBox from "../../app/ui/ChatBox";
import LoadingScreen from "../../app/ui/LoadingScreen";
import MobileChatBox from "../../app/ui/MobileChatBox";
import UserButton from "../../app/ui/UserButtons";
import { getPublicationProps } from "../../client/lens/utils/getPublicationProps";
import MetaTags from "../../home/MetaTags";
import { useIsMobile } from "../../utils/useIsMobile";

export const getServerSideProps = async ({ res, query }: GetServerSidePropsContext) => {
  const ONE_MINUTE_IN_SECONDS = 60;
  const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

  res.setHeader(
    "Cache-Control",
    `public, max-age=0, s-maxage=${ONE_MINUTE_IN_SECONDS}, stale-while-revalidate=${ONE_WEEK_IN_SECONDS}`
  );

  const id = query.id as string;
  const props = await getPublicationProps(id);

  return {
    props: {
      id,
      ...props,
    },
  };
};

export default function App({
  id,
  metadata,
  image,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const createdEngine = useRef(false);
  const [engineStarted, setEngineStarted] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Starting engine...");

  const engine = useAppStore((state) => state.engine);

  const setAvatar = useSetAvatar();
  const isMobile = useIsMobile();
  useResizeEngineCanvas(engine, canvasRef, containerRef);
  useLoadUser();
  useAppHotkeys();
  useAnalytics();

  useEffect(() => {
    if (!engine) return;

    // Display loading status
    engine.networkingInterface.spaceJoinStatus$.subscribe(
      ({ spaceFetched, sceneLoaded, webrtcConnected, wsConnected }) => {
        setLoadingText("Fetching space...");
        setLoadingProgress(0.2);

        if (!spaceFetched) return;

        setLoadingText("Connecting...");
        setLoadingProgress(0.35);

        if (!wsConnected) return;

        setLoadingText("Connecting...");
        setLoadingProgress(0.5);

        if (!webrtcConnected) return;

        setLoadingText("Loading scene...");
        setLoadingProgress(0.75);

        if (!sceneLoaded) return;

        setLoadingText("Ready!");
        setLoadingProgress(1);
      }
    );

    // Join space
    engine.joinSpace(id).then(async () => {
      // Start engine
      await engine.start();

      setEngineStarted(true);
    });

    return () => {
      engine.leaveSpace();
    };
  }, [engine, id]);

  useEffect(() => {
    if (createdEngine.current) return;
    createdEngine.current = true;

    async function initEngine() {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");

      setLoadingText("Starting engine...");
      setLoadingProgress(0);

      const { Engine } = await import("engine");

      // Create engine
      const engine = new Engine({
        canvas,
        camera: "player",
        skyboxPath: "/images/skybox/",
        avatarPath: "/models/Wired-chan.vrm",
        avatarAnimationsPath: "/models/",
      });

      await engine.waitForReady();

      useAppStore.setState({ engine });
    }

    initEngine();
  }, [canvasRef]);

  useEffect(() => {
    if (!engine) return;

    return () => {
      engine.destroy();
      useAppStore.setState({ engine: null });
    };
  }, [engine]);

  const loadedClass = engineStarted ? "opacity-100" : "opacity-0";

  return (
    <>
      <MetaTags
        title={metadata.title ?? id}
        description={metadata.description ?? undefined}
        image={metadata.image ?? undefined}
        card="summary_large_image"
      />

      <Script src="/scripts/draco_decoder.js" />

      <LoadingScreen
        text={metadata.title}
        image={image}
        loaded={engineStarted}
        loadingProgress={loadingProgress}
        loadingText={loadingText}
      />

      <div
        className="h-screen w-screen"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const { engine } = useAppStore.getState();
          if (!engine) return;

          e.preventDefault();
          const item = e.dataTransfer.items[0];

          if (item?.kind !== "file") return;

          const file = item.getAsFile();
          if (!file) return;

          const isVRM = file.name.endsWith(".vrm");
          if (!isVRM) return;

          // Set avatar
          const url = URL.createObjectURL(file);
          setAvatar(url);

          useAppStore.setState({ customAvatar: url });
        }}
      >
        {engineStarted && (
          <div className="absolute inset-x-0 top-0 z-10 mx-auto mt-4 w-96">
            <UserButton />
          </div>
        )}

        <div className="h-full">
          <div ref={containerRef} className="relative h-full w-full overflow-hidden">
            <canvas ref={canvasRef} className={`h-full w-full transition ${loadedClass}`} />
          </div>
        </div>

        {engineStarted ? (
          isMobile ? (
            <div className="absolute left-0 bottom-0 z-10 p-4">
              <MobileChatBox />
            </div>
          ) : (
            <div className="absolute left-0 bottom-0 z-10 w-full max-w-sm p-4">
              <ChatBox />
            </div>
          )
        ) : null}
      </div>
    </>
  );
}

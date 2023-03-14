import { Engine } from "engine";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import Split from "react-split";

import EditorNavbar from "../../editor/components/EditorNavbar/EditorNavbar";
import InspectMenu from "../../editor/components/InspectMenu/InspectMenu";
import ScriptMenu from "../../editor/components/ScriptMenu/ScriptMenu";
import TreeMenu from "../../editor/components/TreeMenu/TreeMenu";
import { useAutosave } from "../../editor/hooks/useAutosave";
import { useLoad } from "../../editor/hooks/useLoad";
import { useTransformControls } from "../../editor/hooks/useTransformControls";
import { useEditorStore } from "../../editor/store";
import MetaTags from "../../home/MetaTags";
import { useResizeCanvas } from "../../play/hooks/useResizeCanvas";

export default function Editor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  const name = useEditorStore((state) => state.name);
  const engine = useEditorStore((state) => state.engine);
  const sceneLoaded = useEditorStore((state) => state.sceneLoaded);
  const openScriptId = useEditorStore((state) => state.openScriptId);
  const [scriptsReady, setScriptsReady] = useState(false);

  const resize = useResizeCanvas(engine, canvasRef, overlayRef, containerRef);
  useLoad();
  useAutosave();
  useTransformControls();

  useEffect(() => {
    if (!scriptsReady || !canvasRef.current || !overlayRef.current) return;

    const { visuals } = useEditorStore.getState();

    const engine = new Engine({
      canvas: canvasRef.current,
      overlayCanvas: overlayRef.current,
    });

    engine.controls = "orbit";
    engine.visuals = visuals;

    engine.render.send({ subject: "set_animations_path", data: "/models" });
    engine.render.send({ subject: "set_default_avatar", data: "/models/Wired-chan.vrm" });
    engine.render.send({ subject: "set_skybox", data: { uri: "/images/Skybox.jpg" } });
    engine.physics.send({ subject: "start", data: null });

    useEditorStore.setState({ engine, canvas: canvasRef.current });

    return () => {
      engine.destroy();
      useEditorStore.setState({
        engine: null,
        canvas: null,
        selectedId: null,
        draggingId: null,
        openScriptId: null,
        isPlaying: false,
        isSaving: false,
        name: "",
        description: "",
        image: null,
        treeIds: [],
        openIds: [],
      });
    };
  }, [scriptsReady]);

  useEffect(() => {
    resize();
  }, [resize, openScriptId]);

  return (
    <>
      <MetaTags title={name ? `${name} / Editor` : "Editor"} />

      <Script src="/scripts/draco_decoder.js" onReady={() => setScriptsReady(true)} />

      <div
        className="h-full w-full"
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          if (!engine) return;

          e.preventDefault();

          const files = Array.from(e.dataTransfer.files);

          const glbs = files.filter((file) => file.name.endsWith(".glb"));
          const other = files.filter((file) => !file.name.endsWith(".glb"));

          glbs.forEach((file) => engine.scene.addFile(file));
          if (other.length) engine.scene.addFiles(other);
        }}
      >
        <div className="h-12 w-full border-b">
          <EditorNavbar />
        </div>

        <div className="fixed h-full w-full">
          <Split
            sizes={openScriptId ? [50, 50] : [100, 0]}
            minSize={openScriptId ? [250, 250] : [250, 0]}
            direction="vertical"
            gutterSize={8}
            className="h-full w-full"
            onMouseUp={resize}
          >
            <Split
              sizes={[15, 65, 20]}
              minSize={[50, 400, 50]}
              direction="horizontal"
              gutterSize={4}
              className={`flex w-full transition ${openScriptId ? "h-1/2" : "h-full"} ${
                engine ? "opacity-100" : "opacity-0"
              }`}
              onMouseUp={resize}
            >
              <div>
                <TreeMenu />
              </div>

              <div className={`border-x bg-neutral-300 ${sceneLoaded ? "" : "animate-pulse"}`}>
                <div
                  ref={containerRef}
                  className={`relative h-full w-full overflow-hidden transition ${
                    sceneLoaded ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <canvas ref={canvasRef} className="h-full w-full" />
                  <canvas ref={overlayRef} className="absolute top-0 left-0 z-10 h-full w-full" />
                </div>
              </div>

              <div className="overflow-y-auto">
                <InspectMenu />
              </div>
            </Split>

            <div>{openScriptId && <ScriptMenu key={openScriptId} scriptId={openScriptId} />}</div>
          </Split>
        </div>
      </div>
    </>
  );
}

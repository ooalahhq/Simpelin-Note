import { createRoot } from "react-dom/client";
import WorkspaceApp from "../src/components/WorkspaceApp";
import MotionLab from "../src/components/MotionLab";
import "@fontsource/pixelify-sans/400.css";
import "@fontsource/pixelify-sans/600.css";
import "@fontsource-variable/dm-sans";
import "@fontsource/jetbrains-mono/400.css";
import "../tokens.css";
import "../src/app/globals.css";
createRoot(document.getElementById("root")!).render(
  location.pathname === "/motion-lab" ? <MotionLab /> : <WorkspaceApp />,
);

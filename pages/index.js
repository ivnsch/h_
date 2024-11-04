import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useEffect, useRef, useState } from "react";
import { App } from "./control/app";

export default function Home() {
  const [gpuSupported, setGpuSupported] = useState(false);
  const canvasRef = useRef(null);

  const [keyText, setKeyText] = useState("");
  const [mouseXLabel, setMouseXLabel] = useState("");
  const [mouseYLabel, setMouseYLabel] = useState("");

  useEffect(() => {
    setGpuSupported(!!navigator.gpu);
    const nested = async () => {
      const app = new App(
        canvasRef.current,
        setKeyText,
        setMouseXLabel,
        setMouseYLabel,
        document
      );
      await app.Initialize();
      app.run();
    };
    nested();
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <div id="compatibility-check">
          {/* {gpuSupported ? (
            <div>Gpu is supported!</div>
          ) : (
            <div>Gpu is not supported!</div>
          )} */}

          <h2>Current Key: {keyText}</h2>
          <h2 id="key-label"></h2>
          <h2>Mouse X: {mouseXLabel}</h2>
          <h2 id="mouse-x-label"></h2>
          <h2>Mouse Y: {mouseYLabel}</h2>
          <h2 id="mouse-y-label"></h2>
          <canvas
            id="gfx-main"
            width="800"
            height="600"
            ref={canvasRef}
          ></canvas>
        </div>
      </main>
    </div>
  );
}

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/dropdown";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import { App } from "./app";

export default function Home() {
  const [gpuSupported, setGpuSupported] = useState(false);
  const canvasRef = useRef(null);

  const [keyText, setKeyText] = useState("");
  const [mouseXLabel, setMouseXLabel] = useState("");
  const [mouseYLabel, setMouseYLabel] = useState("");

  const n = useRef("1");
  const l = useRef("0");
  const m = useRef("0");

  useEffect(() => {
    const nested = async () => {
      const app = new App(
        canvasRef.current,
        setKeyText,
        setMouseXLabel,
        setMouseYLabel,
        () => n.current,
        () => l.current,
        () => m.current,
        document
      );
      await app.Initialize();
      app.run();
    };
    nested();
  }, [n, l, m]);

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
          <div style={{ "margin-bottom": 70 }}>
            <Dropdown>
          <div style={{ "margin-bottom": 70, "margin-top": 20 }}>
            <Dropdown style={{ "margin-left": 5 }}>
              <DropdownTrigger>
                <button variant="bordered">n</button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Static Actions"
                onAction={(key) => {
                  n.current = key;
                  console.log("did set n to key: " + key);
                }}
              >
                <DropdownItem key="1">1</DropdownItem>
                <DropdownItem key="2">2</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger>
                <button variant="bordered">l</button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Static Actions"
                onAction={(key) => (l.current = key)}
              >
                <DropdownItem key="0">0</DropdownItem>
                <DropdownItem key="1">1</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger>
                <button variant="bordered">m</button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Static Actions"
                onAction={(key) => (m.current = key)}
              >
                <DropdownItem key="0">0</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
          <canvas width="800" height="600" ref={canvasRef}></canvas>
        </div>
      </main>
    </div>
  );
}

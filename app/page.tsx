"use client";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/dropdown";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { App } from "../lib/app";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const [gpuSupported, setGpuSupported] = useState(false);
  const canvasRef = useRef(null);

  const [keyText, setKeyText] = useState("");
  const [mouseXLabel, setMouseXLabel] = useState("");
  const [mouseYLabel, setMouseYLabel] = useState("");

  const searchParams = useSearchParams();
  const searchN = searchParams.get("n");
  const searchL = searchParams.get("l");
  const searchM = searchParams.get("m");

  const n = useRef(searchN);
  const l = useRef(searchL);
  const m = useRef(searchM);
  const [, update] = useState(false);

  useEffect(() => {
    n.current = searchN ?? "1";
    l.current = searchL ?? "0";
    m.current = searchM ?? "0";
    update((prev) => !prev);
  }, [searchParams]);

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
    <div>
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
          <div>Keyboard:</div>
          <div>Rotation: x, y, z</div>
          <div>Move left, right: a, d</div>
          <div>Zoom in, out: w, s</div>
          {update && (
            <div style={{ "margin-top": 20 }}>
              {"Selected: n: " +
                n.current +
                ", l: " +
                l.current +
                ", m: " +
                m.current}
            </div>
          )}
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
                defaultSelectedKeys={searchN}
              >
                <DropdownItem key="1">1</DropdownItem>
                <DropdownItem key="2">2</DropdownItem>
                <DropdownItem key="3">3</DropdownItem>
                <DropdownItem key="4">4</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger>
                <button variant="bordered">l</button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Static Actions"
                onAction={(key) => (l.current = key)}
                defaultSelectedKeys={searchL}
              >
                <DropdownItem key="0">0</DropdownItem>
                <DropdownItem key="1">1</DropdownItem>
                <DropdownItem key="2">2</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger>
                <button variant="bordered">m</button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Static Actions"
                onAction={(key) => (m.current = key)}
                defaultSelectedKeys={searchM}
              >
                <DropdownItem key="-2">-2</DropdownItem>
                <DropdownItem key="-1">-1</DropdownItem>
                <DropdownItem key="0">0</DropdownItem>
                <DropdownItem key="1">1</DropdownItem>
                <DropdownItem key="2">2</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
          <canvas width="800" height="600" ref={canvasRef}></canvas>
        </div>
      </main>
    </div>
  );
}

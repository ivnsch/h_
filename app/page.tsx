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
  const canvasRef = useRef(null);

  const searchParams = useSearchParams();
  const searchN = searchParams.get("n");
  const searchL = searchParams.get("l");
  const searchM = searchParams.get("m");

  const n = useRef(searchN);
  const l = useRef(searchL);
  const m = useRef(searchM);
  const [, update] = useState(false);

  const appRef = useRef<App | null>(null);

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
        () => n.current,
        () => l.current,
        () => m.current,
        document
      );
      appRef.current = app;
      await app.Initialize();
      app.run();
    };
    nested();
  }, [n, l, m]);

  const updateUrl = (key: string, value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.pushState({}, "", url.toString());
  };

  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <div>
          {/* <div className="text-3xl font-bold underline">Hello world!</div> */}
          <div id="compatibility-check" className="p-4">
            {/* {gpuSupported ? (
              <div>Gpu is supported!</div>
            ) : (
              <div>Gpu is not supported!</div>
            )} */}
            <div>Keyboard:</div>
            <div>Rotation: x, y, z</div>
            <div>Move left, right: a, d</div>
            <div>Zoom in, out: w, s</div>
            <div className="my-2">
              <Dropdown>
                <DropdownTrigger>
                  <button className="mr-2 px-4">{"n:" + n.current}</button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Static Actions"
                  onAction={(key) => {
                    n.current = key.toString();
                    updateUrl("n", key.toString());
                    appRef.current?.clearTransforms();
                  }}
                  defaultSelectedKeys={searchN ?? ""}
                >
                  <DropdownItem key="1" className="text-black">
                    1
                  </DropdownItem>
                  <DropdownItem key="2" className="text-black">
                    2
                  </DropdownItem>
                  <DropdownItem key="3" className="text-black">
                    3
                  </DropdownItem>
                  <DropdownItem key="4" className="text-black">
                    4
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
              <Dropdown>
                <DropdownTrigger>
                  <button className="mr-2 px-4">{"l:" + l.current}</button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Static Actions"
                  onAction={(key) => {
                    l.current = key.toString();
                    updateUrl("l", key.toString());
                    appRef.current?.clearTransforms();
                  }}
                  defaultSelectedKeys={searchL ?? ""}
                >
                  <DropdownItem key="0" className="text-black">
                    0
                  </DropdownItem>
                  <DropdownItem key="1" className="text-black">
                    1
                  </DropdownItem>
                  <DropdownItem key="2" className="text-black">
                    2
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
              <Dropdown>
                <DropdownTrigger>
                  <button className="mr-2 px-4">{"m:" + m.current}</button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Static Actions"
                  onAction={(key) => {
                    m.current = key.toString();
                    updateUrl("m", key.toString());
                    appRef.current?.clearTransforms();
                  }}
                  defaultSelectedKeys={searchM ?? ""}
                >
                  <DropdownItem key="-2" className="text-black">
                    -2
                  </DropdownItem>
                  <DropdownItem key="-1" className="text-black">
                    -1
                  </DropdownItem>
                  <DropdownItem key="0" className="text-black">
                    0
                  </DropdownItem>
                  <DropdownItem key="1" className="text-black">
                    1
                  </DropdownItem>
                  <DropdownItem key="2" className="text-black">
                    2
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
          <canvas width="800" height="600" ref={canvasRef}></canvas>
        </div>
      </main>
    </div>
  );
}

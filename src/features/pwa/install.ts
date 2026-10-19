"use client";

import { useSyncExternalStore } from "react";

/** Chromium's install prompt event (not part of the standard DOM typings). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isBeforeInstallPromptEvent(event: Event): event is BeforeInstallPromptEvent {
  return "prompt" in event && typeof event.prompt === "function";
}

export type InstallState =
  /** Running as an installed app (standalone window / home-screen icon). */
  | { kind: "installed" }
  /** The browser offered an install prompt we can trigger from a button. */
  | { kind: "available"; install: () => Promise<boolean> }
  /** iOS/iPadOS Safari: installing is manual via Share → Add to Home Screen. */
  | { kind: "ios" }
  /** Not installable here (unsupported browser, dev server, or not HTTPS). */
  | { kind: "unavailable" };

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

// Registered at module load: the browser fires `beforeinstallprompt` once,
// early, often before any React component has mounted.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    if (!isBeforeInstallPromptEvent(event)) return;
    event.preventDefault(); // Show our own button instead of the mini-infobar.
    deferredPrompt = event;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferredPrompt = null;
    notify();
  });
}

function isStandalone(): boolean {
  const iosStandalone = "standalone" in navigator && navigator.standalone === true;
  return installed || iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

async function install(): Promise<boolean> {
  const prompt = deferredPrompt;
  if (!prompt) return false;
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  deferredPrompt = null; // A prompt can only be used once.
  notify();
  return outcome === "accepted";
}

const UNAVAILABLE: InstallState = { kind: "unavailable" };
const INSTALLED: InstallState = { kind: "installed" };
const IOS: InstallState = { kind: "ios" };
const AVAILABLE: InstallState = { kind: "available", install };

function getSnapshot(): InstallState {
  if (isStandalone()) return INSTALLED;
  if (deferredPrompt) return AVAILABLE;
  if (isIosSafari()) return IOS;
  return UNAVAILABLE;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", listener);
  };
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, getSnapshot, () => UNAVAILABLE);
}

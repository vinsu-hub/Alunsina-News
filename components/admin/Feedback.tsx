"use client";
import { createContext } from "react";
export const Feedback = createContext<(message: string) => void>(() => {});

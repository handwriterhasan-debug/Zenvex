import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const withTimeout = <T>(promise: PromiseLike<T>, timeoutMs: number = 30000): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), timeoutMs)
    )
  ]);
};

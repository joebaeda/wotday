"use client"

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/lib/config";
import { FrameSplashProvider } from "./FrameSplashProvider";
import { FrameContextProvider } from "./FrameContextProvider";


const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <FrameSplashProvider>
      <FrameContextProvider>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
              {/* */}
              {children}
              {/* */}
          </QueryClientProvider>
        </WagmiProvider>
      </FrameContextProvider>
    </FrameSplashProvider>
  );
}
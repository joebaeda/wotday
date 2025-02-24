import { http, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { frameConnector } from "./frameConnector";

export const config = createConfig({
  chains: [base],
  ssr: true,
  connectors: [
    frameConnector(),
  ],
  transports: {
    [base.id]: http(),
  },
})
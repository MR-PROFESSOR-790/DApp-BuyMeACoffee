import * as chains from "viem/chains";

export type ScaffoldConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  rpcOverrides?: Record<number, string>;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

export const DEFAULT_ALCHEMY_API_KEY = "qT9FB7rsVoVAAVP68ZrZzBh_scV5hHDc";

const scaffoldConfig = {
  // Target the Sepolia testnet
  targetNetworks: [chains.sepolia],
  
  // Polling interval in milliseconds
  pollingInterval: 30000,
  
  // Use your Alchemy API key from the environment variable (or default)
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || DEFAULT_ALCHEMY_API_KEY,
  
  // Optional: Override RPC URL for specific networks (if needed)
  rpcOverrides: {
    // Example:
    // [chains.sepolia.id]: "https://sepolia.custom-rpc.io",
  },
  
  // WalletConnect project ID from the environment variable (or default)
  walletConnectProjectId:
    process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",
  
  // Since we target a public testnet, disable the local burner wallet
  onlyLocalBurnerWallet: false,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;

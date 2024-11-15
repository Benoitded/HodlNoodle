"use client";

import { useContext, useEffect } from "react";
import { createContext, useCallback, useState } from "react";

import { PushAPI } from "@pushprotocol/restapi";
import { Chain, Transport } from "viem";
import { Account } from "viem";
import { CONSTANTS } from "@pushprotocol/restapi";
import { Client } from "viem";
import { useAccount, useConnectorClient, useWalletClient } from "wagmi";
import { providers } from "ethers";

interface PushSDKContextProps {
  user: PushAPI | undefined;
  handleChatprofileUnlock: () => Promise<void>;
  disconnectPush: () => void;
  isLoadingUnlock: boolean;
}

const PushSDKContext = createContext<PushSDKContextProps>({
  user: undefined,
  handleChatprofileUnlock: () => Promise.resolve(),
  disconnectPush: () => {},
  isLoadingUnlock: false,
});

interface ContextProviderProps {
  children: React.ReactNode;
}

export function clientToSigner(client: Client<Transport, Chain, Account>) {
  const { account, chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new providers.Web3Provider(transport, network);
  const signer = provider.getSigner(account.address);
  return signer;
}

export const ContextProvider: React.FC<ContextProviderProps> = ({
  children,
}) => {
  const { address } = useAccount();
  const [user, setUser] = useState<PushAPI>();
  const [isLoadingUnlock, setIsLoadingUnlock] = useState(false);
  const { data: walletClient, isError, isLoading } = useWalletClient();

  // Utility functions for PGP key management
  const getUniquePGPKey = (account: string) => {
    return `push-user-${account}-pgp`;
  };

  const isPGPKey = (str: string | null) => {
    if (!str) return false;
    const pgpPublicKeyRegex =
      /-----BEGIN PGP PUBLIC KEY BLOCK-----[\s\S]*-----END PGP PUBLIC KEY BLOCK-----/;
    const pgpPrivateKeyRegex =
      /-----BEGIN PGP PRIVATE KEY BLOCK-----[\s\S]*-----END PGP PRIVATE KEY BLOCK-----/;
    return pgpPublicKeyRegex.test(str) || pgpPrivateKeyRegex.test(str);
  };

  // Function to restore user from localStorage
  const restoreUserFromStorage = async () => {
    if (!address || !walletClient) return;

    const storedKey = localStorage.getItem(getUniquePGPKey(address));
    if (isPGPKey(storedKey)) {
      try {
        setIsLoadingUnlock(true);
        const signer = clientToSigner(
          walletClient as Client<Transport, Chain, Account>
        );
        const userInstance = await PushAPI.initialize(signer, {
          env: CONSTANTS.ENV.STAGING,
          decryptedPGPPrivateKey: storedKey,
        });

        setUser(userInstance);
      } catch (error) {
        console.error("Error restoring Push user:", error);
        localStorage.removeItem(getUniquePGPKey(address));
      } finally {
        setIsLoadingUnlock(false);
      }
    }
  };

  // Check localStorage on page load
  useEffect(() => {
    if (address && walletClient) {
      restoreUserFromStorage();
    }
  }, [address, walletClient]);

  // Initial unlock function (only for first time)
  async function handleChatprofileUnlock() {
    if (!address || !walletClient) return;

    try {
      setIsLoadingUnlock(true);
      const signer = clientToSigner(
        walletClient as Client<Transport, Chain, Account>
      );

      const userInstance = await PushAPI.initialize(signer, {
        env: CONSTANTS.ENV.STAGING,
      });
      const stream = await userInstance.initStream([CONSTANTS.STREAM.CHAT]);

      // Save PGP key
      if (userInstance.decryptedPgpPvtKey) {
        localStorage.setItem(
          getUniquePGPKey(address),
          userInstance.decryptedPgpPvtKey
        );
      }

      setUser(userInstance);
    } catch (error) {
      console.error("Error initializing Push:", error);
    } finally {
      setIsLoadingUnlock(false);
    }
  }

  const disconnectPush = useCallback(() => {
    if (address) {
      localStorage.removeItem(getUniquePGPKey(address));
    }
    setUser(undefined);
  }, [address]);

  return (
    <PushSDKContext.Provider
      value={{
        user,
        handleChatprofileUnlock,
        disconnectPush,
        isLoadingUnlock,
      }}
    >
      {children}
    </PushSDKContext.Provider>
  );
};

export const usePushSDK = () => useContext(PushSDKContext);

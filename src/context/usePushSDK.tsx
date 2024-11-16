"use client";

import { useContext, useEffect } from "react";
import { createContext, useCallback, useState } from "react";

import { IFeeds, PushAPI } from "@pushprotocol/restapi";
import { Chain, Transport } from "viem";
import { Account } from "viem";
import { CONSTANTS } from "@pushprotocol/restapi";
import { Client } from "viem";
import { useAccount, useConnectorClient, useWalletClient } from "wagmi";
import { providers } from "ethers";
import { Noodle } from "@/types/noodle";

export const MAIN_ADDRESS_SAVE = "0x7426dd8546c43f4Da37545594874575fCE166b9E";

interface PushSDKContextProps {
  user: PushAPI | undefined;
  handleChatprofileUnlock: () => Promise<void>;
  disconnectPush: () => void;
  isLoadingUnlock: boolean;
  noodles: Noodle[];
  refreshNoodles: () => Promise<void>;
  isLoadingNoodles: boolean;
}

const PushSDKContext = createContext<PushSDKContextProps>({
  user: undefined,
  handleChatprofileUnlock: () => Promise.resolve(),
  disconnectPush: () => {},
  isLoadingUnlock: false,
  noodles: [],
  refreshNoodles: () => Promise.resolve(),
  isLoadingNoodles: false,
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
  const [noodles, setNoodles] = useState<any[]>([]);
  const { data: walletClient, isError, isLoading } = useWalletClient();
  const [isLoadingNoodles, setIsLoadingNoodles] = useState(false);

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
          env: CONSTANTS.ENV.PROD,
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
      refreshNoodles();
    }
  }, [address, walletClient]);

  useEffect(() => {
    refreshNoodles();
  }, []);

  // Initial unlock function (only for first time)
  async function handleChatprofileUnlock() {
    if (!address || !walletClient) return;

    try {
      setIsLoadingUnlock(true);
      const signer = clientToSigner(
        walletClient as Client<Transport, Chain, Account>
      );

      const userInstance = await PushAPI.initialize(signer, {
        env: CONSTANTS.ENV.PROD,
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

  const refreshNoodles = async () => {
    setIsLoadingNoodles(true);
    try {
      const messagesRequests = await fetch(
        `https://backend.epns.io/apis/v1/chat/users/eip155:${MAIN_ADDRESS_SAVE}/requests?page=1&limit=30`
      );
      const messagesChats = await fetch(
        `https://backend.epns.io/apis/v1/chat/users/eip155:${MAIN_ADDRESS_SAVE}/chats?page=1&limit=30`
      );
      const dataRequests: IFeeds[] =
        (await messagesRequests.json())?.requests || [];
      const dataChats: IFeeds[] = (await messagesChats.json())?.chats || [];

      const mergedchats = [...dataRequests, ...dataChats];
      const formattedChats: Noodle[] = mergedchats
        .map((noodle, index) => {
          if (!noodle.groupInformation) return null;

          // Extraire la localisation de la description
          let description = noodle.groupInformation.groupDescription;
          let location = {
            latitude: 0,
            longitude: 0,
            address: "",
          };

          const locationMatch = description.match(/Location: ({[^}]+})/);
          if (locationMatch) {
            try {
              location = JSON.parse(locationMatch[1]);
              // Supprimer la partie location de la description
              description = description
                .replace(/\n\nLocation: {[^}]+}/, "")
                .trim();
            } catch (error) {
              console.error("Error parsing location:", error);
            }
          }

          const messageContent =
            typeof noodle.msg.messageObj === "string"
              ? noodle.msg.messageObj
              : Array.isArray(noodle.msg.messageObj)
              ? noodle.msg.messageObj[0]?.content || ""
              : noodle.msg.messageObj?.content || "";
          //maintenant on tente un json parse de ça, si ça fait quelque chose on le met dans un tableau avec toutes les images
          let images: string[] = [];
          if (noodle.groupInformation.groupImage) {
            images.push(noodle.groupInformation.groupImage);
          }
          try {
            const jsonContent = JSON.parse(messageContent);
            images = [...images, jsonContent.content];
            //   console.log("add this image to the array:", images);
          } catch (error) {
            console.error("Error parsing message content:", error);
          }

          return {
            id: noodle.chatId || "",
            rank: index + 1,
            author: noodle.groupInformation.groupCreator.replace("eip155:", ""),
            title: noodle.groupInformation.groupName,
            description: description, // Description nettoyée
            location: location, // Location extraite
            likes: 0,
            dislikes: 0,
            comments: [
              {
                author: noodle.msg.fromDID.replace("eip155:", ""),
                dataMessage: messageContent,
                timestamp: noodle.msg.timestamp || Date.now(),
              },
            ],
            images: images,
          };
        })
        .filter((noodle) => noodle !== null);

      console.log("formattedChats:", formattedChats);
      setNoodles(formattedChats);
    } catch (error) {
      console.error("Error refreshing noodles:", error);
    } finally {
      setIsLoadingNoodles(false);
    }
  };

  return (
    <PushSDKContext.Provider
      value={{
        user,
        handleChatprofileUnlock,
        disconnectPush,
        isLoadingUnlock,
        noodles,
        refreshNoodles,
        isLoadingNoodles,
      }}
    >
      {children}
    </PushSDKContext.Provider>
  );
};

export const usePushSDK = () => useContext(PushSDKContext);

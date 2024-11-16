"use client";

import { use, useContext, useEffect } from "react";
import { createContext, useCallback, useState } from "react";

import { chat, IFeeds, PushAPI } from "@pushprotocol/restapi";
import { Chain, Transport } from "viem";
import { Account } from "viem";
import { CONSTANTS } from "@pushprotocol/restapi";
import { Client } from "viem";
import { useAccount, useConnectorClient, useWalletClient } from "wagmi";
import { providers } from "ethers";
import { Noodle, Message } from "@/types/noodle";

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
      const formattedNoodles: Noodle[] = mergedchats
        .map((noodle, index) => {
          if (!noodle.groupInformation) return null;

          // Extraire la localisation de la description
          let description = noodle.groupInformation.groupDescription;
          let location = {
            latitude: 0,
            longitude: 0,
            address: "",
          };

          // Extract location from description
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

          // Initialize images array with groupImage if it exists
          let images: string[] = [];
          if (noodle.groupInformation.groupImage) {
            images.push(noodle.groupInformation.groupImage);
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
            messages: [],
            images: images,
          };
        })
        .filter((noodle) => noodle !== null);

      const messagesPromises = formattedNoodles.map(async (noodle) => {
        const messages = await getMessagesForAChatId(noodle.id);

        // Add images from messages to the noodle's images array
        const messageImages = messages
          .filter((message) => message.dataImage)
          .map((message) => message.dataImage as string);

        return {
          ...noodle,
          messages,
          images: [...noodle.images, ...messageImages],
        };
      });

      const noodlesWithMessages = await Promise.all(messagesPromises);

      //console.log("noodlesWithMessages:", noodlesWithMessages);
      setNoodles(noodlesWithMessages);
    } catch (error) {
      console.error("Error refreshing noodles:", error);
    } finally {
      setIsLoadingNoodles(false);
    }
  };

  async function getMessagesForAChatId(chatId: string): Promise<Message[]> {
    try {
      console.log("start fetching messages");
      const urlToGetHash = `https://backend.epns.io/apis/v1/chat/users/eip155:${MAIN_ADDRESS_SAVE}/conversations/${chatId}/hash`;
      console.log("urlToGetHash:", urlToGetHash);
      const hash = await fetch(urlToGetHash);
      const hashData = (await hash.json()).threadHash;
      console.log("hashData:", hashData);
      const urlToGetMessages = `https://backend.epns.io/apis/v1/chat/conversationhash/${hashData}?fetchLimit=10`;
      console.log("urlToGetMessages:", urlToGetMessages);
      const messages = await fetch(urlToGetMessages);
      const messagesData = await messages.json();
      const messagesFormatted: Message[] = messagesData.map((message: any) => {
        const messageContent =
          typeof message.messageObj === "string"
            ? message.messageObj
            : Array.isArray(message.messageObj)
            ? message.messageObj[0]?.content || ""
            : message.messageObj?.content || "";

        // Try to parse the message content to find if there is an image
        let dataMessage = "";
        let dataImage = undefined;

        try {
          const parsedContent = JSON.parse(messageContent);
          if (
            parsedContent.content &&
            parsedContent.content.startsWith("data:image")
          ) {
            dataImage = parsedContent.content;
          }
        } catch {
          // If we can't parse as JSON, it's a normal text message
          dataMessage = messageContent;
        }

        return {
          author: message.fromDID.replace("eip155:", ""),
          dataMessage,
          dataImage,
          timestamp: message.timestamp,
        };
      });
      console.log("messagesData:", messagesData);
      console.log("messagesFormatted:", messagesFormatted);
      return messagesFormatted || [];
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  }

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

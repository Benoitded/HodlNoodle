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

const MAIN_ADDRESS_SAVE = "0x7426dd8546c43f4Da37545594874575fCE166b9E";

interface PushSDKContextProps {
  user: PushAPI | undefined;
  handleChatprofileUnlock: () => Promise<void>;
  disconnectPush: () => void;
  isLoadingUnlock: boolean;
  noodles: Noodle[];
}

const PushSDKContext = createContext<PushSDKContextProps>({
  user: undefined,
  handleChatprofileUnlock: () => Promise.resolve(),
  disconnectPush: () => {},
  isLoadingUnlock: false,
  noodles: [],
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
      getAllMessages();
    }
  }, [address, walletClient]);

  useEffect(() => {
    getAllMessages();
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

  async function getAllMessages() {
    // if (!user) return;
    const messagesRequests = await fetch(
      `https://backend.epns.io/apis/v1/chat/users/eip155:${MAIN_ADDRESS_SAVE}/requests?page=1&limit=30`
    );
    const messagesChats = await fetch(
      `https://backend.epns.io/apis/v1/chat/users/eip155:${MAIN_ADDRESS_SAVE}/chats?page=1&limit=30`
    );
    const dataRequests: IFeeds[] =
      (await messagesRequests.json())?.requests || [];
    const dataChats: IFeeds[] = (await messagesChats.json())?.chats || [];
    console.log("getAllMessages:", dataRequests, dataChats);

    const mergedchats = [...dataRequests, ...dataChats];
    const formattedChats: Noodle[] = mergedchats
      .map((noodle, index) => {
        if (!noodle.groupInformation) return null;
        // fetch all messages

        // try {
        //   if (user) {
        //     const aliceChatHistoryWithBob = await user.chat.history(
        //       noodle.chatId || ""
        //     );
        //     console.log("aliceChatHistoryWithBob:", aliceChatHistoryWithBob);
        //   } else {
        //     console.log("user not found");
        //   }
        // } catch (error) {
        //   console.error("Error fetching chat history for chatId:", error);
        // }

        const messageContent =
          typeof noodle.msg.messageObj === "string"
            ? noodle.msg.messageObj
            : Array.isArray(noodle.msg.messageObj)
            ? noodle.msg.messageObj[0]?.content || ""
            : noodle.msg.messageObj?.content || "";
        //maintenant on tente un json parse de ça, si ça fait quelque chose on le met dans un tableau avec toutes les images
        let images: string[] = [
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA40lEQVR4AcXBsY3CQBRF0cuTYwqgjenAdSCCCTexpgLkCkZuYAJEsjmxK2Dq2JwG2PSzgSVLK71zDl/fP2+CXDrReLwRra8LW8bjjWh9XYhaTUTCTJgJs+F+nYgyF6LzvPChdLac54UPpRPdrxORMBNmwkyYCTNhJswOz9PjzQ6tJrbk0tlDmAkzYTbwR6uJ6H6diNbCpvF4IzrPC1EunUiYCTNhdnieHm92aDWxJZfOHsJMmAmzodVElEsnajUR5dLZ0moiyqUTtZqIhJkwE2ZDLp2o1cR/ajUR5dKJhJkwE2a/g4E5Ln7jne0AAAAASUVORK5CYII=",
        ];
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
          description: noodle.groupInformation.groupDescription,
          location: {
            latitude: 0,
            longitude: 0,
            address: "123 Sukhumvit Road, Bangkok, Thailand",
          },
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
  }

  return (
    <PushSDKContext.Provider
      value={{
        user,
        handleChatprofileUnlock,
        disconnectPush,
        isLoadingUnlock,
        noodles,
      }}
    >
      {children}
    </PushSDKContext.Provider>
  );
};

export const usePushSDK = () => useContext(PushSDKContext);

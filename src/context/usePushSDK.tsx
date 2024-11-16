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
import { Noodle, Message, GPSLocation, DETECT_TYPE_WORD } from "@/types/noodle";
import { toast } from "react-hot-toast";

// export const MAIN_ADDRESS_SAVE = "0x7426dd8546c43f4Da37545594874575fCE166b9E";
export const MAIN_ADDRESS_SAVE = "0x00000000000000000000000000b3570b4070C01E";

interface PushSDKContextProps {
  user: PushAPI | undefined;
  handleChatprofileUnlock: () => Promise<void>;
  disconnectPush: () => void;
  isLoadingUnlock: boolean;
  noodles: Noodle[];
  refreshNoodles: () => Promise<void>;
  isLoadingNoodles: boolean;
  getIsJoinedNoodle: (chatId: string, address: string) => Promise<boolean>;
  isGetJoinedGroupLoading: boolean;
  joinThisNoodle: (chatId: string) => Promise<void>;
  isJoiningNoodle: boolean;
  voteForTheNoodle: (
    noodle: Noodle,
    address: string,
    isUp: boolean,
    isToast?: boolean
  ) => Promise<void>;
  isVotingNoodle: boolean;
  sendMessageToGroup: (
    chatId: string,
    message: string,
    image?: string,
    isToast?: boolean
  ) => Promise<void>;
  isLoadingSendingMessageToGroup: boolean;
}

const PushSDKContext = createContext<PushSDKContextProps>({
  user: undefined,
  handleChatprofileUnlock: () => Promise.resolve(),
  disconnectPush: () => {},
  isLoadingUnlock: false,
  noodles: [],
  refreshNoodles: () => Promise.resolve(),
  isLoadingNoodles: false,
  getIsJoinedNoodle: () => Promise.resolve(false),
  isGetJoinedGroupLoading: false,
  joinThisNoodle: () => Promise.resolve(),
  isJoiningNoodle: false,
  voteForTheNoodle: () => Promise.resolve(),
  isVotingNoodle: false,
  sendMessageToGroup: () => Promise.resolve(),
  isLoadingSendingMessageToGroup: false,
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
  const [joinedGroups, setJoinedGroups] = useState<Record<string, boolean>>({});
  const [isGetJoinedGroupLoading, setIsGetJoinedGroupLoading] = useState(false);
  const [isJoiningNoodle, setIsJoiningNoodle] = useState(false);
  const [isVotingNoodle, setIsVotingNoodle] = useState(false);
  const [isLoadingSendingMessageToGroup, setIsLoadingSendingMessageToGroup] =
    useState(false);

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
            timestamp: new Date(noodle.intentTimestamp).getTime(),
            rank: index + 1,
            author: noodle.groupInformation.groupCreator.replace("eip155:", ""),
            title: noodle.groupInformation.groupName,
            description: description, // Description nettoyée
            location: location, // Location extraite
            likes: [],
            dislikes: [],
            messages: [],
            images: images,
          };
        })
        .filter((noodle) => noodle !== null);

      console.log("formattedNoodles:", formattedNoodles);

      const noodlesWithMessages = await Promise.all(
        formattedNoodles.map(async (noodle, index) => {
          const { messages, location, likes, dislikes } =
            await getMessagesForANoodle(noodle);

          // Récupère les images des messages de type Image
          const messageImages = messages
            .filter((message) => message.type === "Image")
            .map((message) => message.dataMessage);

          return {
            ...noodle,
            rank: index + 1,
            messages,
            location,
            likes,
            dislikes,
            images: [
              ...(noodle.images.length > 0 ? [noodle.images[0]] : []),
              ...messageImages,
            ],
          };
        })
      );

      console.log("noodlesWithMessages:", noodlesWithMessages);
      //trie par timestamp
      setNoodles(noodlesWithMessages);
    } catch (error) {
      console.error("Error refreshing noodles:", error);
    } finally {
      setIsLoadingNoodles(false);
    }
  };

  async function getMessagesForANoodle(noodle: Noodle): Promise<{
    messages: Message[];
    likes: string[];
    dislikes: string[];
    location?: GPSLocation;
  }> {
    const { id: chatId } = noodle;
    try {
      const urlToGetHash = `https://backend.epns.io/apis/v1/chat/users/eip155:${MAIN_ADDRESS_SAVE}/conversations/${chatId}/hash`;
      const hash = await fetch(urlToGetHash);
      const hashData = (await hash.json()).threadHash;
      const urlToGetMessages = `https://backend.epns.io/apis/v1/chat/conversationhash/${hashData}?fetchLimit=10`;
      const messages = await fetch(urlToGetMessages);
      const messagesData = await messages.json();

      const likes: string[] = [];
      const dislikes: string[] = [];
      const messagesFormatted: Message[] = [];
      let location: GPSLocation | undefined;
      const noodleCreator = noodle.author;
      const noodleCreationTime = noodle.timestamp;

      messagesData.forEach((message: any) => {
        const messageContent =
          typeof message.messageObj === "string"
            ? message.messageObj
            : Array.isArray(message.messageObj)
            ? message.messageObj[0]?.content || ""
            : message.messageObj?.content || "";

        const author = message.fromDID.replace("eip155:", "");
        const type = message.messageType as "Text" | "Image";

        // Détection des messages spéciaux
        const detectTypeWordLocation: DETECT_TYPE_WORD = "AW_SEND_LOCATION";
        if (messageContent.startsWith(detectTypeWordLocation)) {
          try {
            const locationJson = messageContent.split("\n")[1];
            location = JSON.parse(locationJson);
            return; // Skip adding location message to messages
          } catch (error) {
            console.error("Error parsing location:", error);
          }
        }

        // Détection des votes
        const detectTypeWordVote: DETECT_TYPE_WORD = "AW_SEND_VOTE";
        if (messageContent.startsWith(detectTypeWordVote)) {
          try {
            const voteJson = messageContent.split("\n")[1];
            const { isUp } = JSON.parse(voteJson);
            if (isUp) {
              likes.push(author);
            } else {
              dislikes.push(author);
            }
            return; // Skip adding vote message to messages
          } catch (error) {
            console.error("Error parsing vote:", error);
          }
        }

        let dataMessage = "";
        try {
          const parsedContent = JSON.parse(messageContent);
          if (type === "Image") {
            // Skip les images de l'auteur dans les 10 premières minutes
            if (
              author === noodleCreator &&
              noodleCreationTime &&
              message.timestamp - noodleCreationTime < 600000
            ) {
              return;
            }
            dataMessage = parsedContent.content;
          }
        } catch {
          dataMessage = messageContent;
        }

        if (dataMessage) {
          messagesFormatted.push({
            author,
            dataMessage,
            timestamp: message.timestamp,
            type,
          });
        }
      });

      return {
        messages: messagesFormatted,
        likes,
        dislikes,
        location,
      };
    } catch (error) {
      console.error("Error fetching messages:", error);
      return {
        messages: [],
        likes: [],
        dislikes: [],
      };
    }
  }

  const getIsJoinedNoodle = async (chatId: string, address: string) => {
    // Return cached result if available
    if (joinedGroups[chatId] !== undefined) {
      return joinedGroups[chatId];
    }

    if (!user) return false;

    try {
      setIsGetJoinedGroupLoading(true);
      const urlToFetch = `https://backend.epns.io/apis/v1/chat/groups/${chatId}/members/eip155:${address}/status`;
      const dataStatus = await fetch(urlToFetch);
      const dataStatusJson = await dataStatus.json();
      const isJoined = dataStatusJson.isMember;
      // Cache the result
      setJoinedGroups((prev) => ({ ...prev, [chatId]: isJoined }));
      console.log(address, " isJoined:", isJoined);
      return isJoined;
    } catch (error) {
      console.error("Error checking if joined group:", error);
      return false;
    } finally {
      setIsGetJoinedGroupLoading(false);
    }
  };

  const joinThisNoodle = async (chatId: string, isToast?: boolean) => {
    if (!user || !address) return;

    if (isToast) toast.loading("Joining noodle...", { id: "join-noodle" });

    try {
      setIsJoiningNoodle(true);
      const isJoined = await getIsJoinedNoodle(chatId, address);
      if (isJoined) return;

      await user.chat.group.join(chatId);
      // Update cache
      setJoinedGroups((prev) => ({ ...prev, [chatId]: true }));
      if (isToast) toast.success("Noodle joined!", { id: "join-noodle" });
    } catch (error) {
      console.error("Error joining noodle:", error);

      if (isToast) toast.error("Error joining noodle", { id: "join-noodle" });
    } finally {
      setIsJoiningNoodle(false);
      if (isToast) toast.dismiss("join-noodle");
    }
  };

  const voteForTheNoodle = async (
    noodle: Noodle,
    address: string,
    isUp: boolean,
    isToast?: boolean
  ) => {
    if (!user) return;
    const { id: chatId } = noodle;
    if (isToast)
      toast.loading(`Voting ${isUp ? "up" : "down"} for ${noodle.title}...`, {
        id: "vote-noodle",
      });

    try {
      setIsVotingNoodle(true);
      const isJoined = await getIsJoinedNoodle(chatId, address);
      if (!isJoined) {
        await joinThisNoodle(chatId);
      }

      // Get current votes for this noodle
      const { likes, dislikes } = await getMessagesForANoodle(noodle);

      // Check if user has already voted
      if (likes.includes(address) || dislikes.includes(address)) {
        console.log("User has already voted");
        if (isToast)
          toast.error("You have already voted for this noodle!", {
            id: "vote-noodle",
          });
        return;
      }

      // Send vote message with the new format
      const detectTypeWord: DETECT_TYPE_WORD = "AW_SEND_VOTE";
      const voteMessage = `${detectTypeWord}\n${JSON.stringify({ isUp })}`;
      await user.chat.send(chatId, {
        type: "Text",
        content: voteMessage,
      });
      await refreshNoodles(); // TODO: only fetch the messages of this specific noodle
      if (isToast) toast.success("Vote sent!", { id: "vote-noodle" });
    } catch (error) {
      console.error("Error voting for noodle:", error);
      if (isToast)
        toast.error("Error voting for noodle", { id: "vote-noodle" });
    } finally {
      setIsVotingNoodle(false);
    }
  };

  async function sendMessageToGroup(
    chatId: string,
    message: string,
    image?: string,
    isToast?: boolean // default true
  ) {
    try {
      if (isToast) toast.loading("Sending comment...", { id: "send-comment" });
      setIsLoadingSendingMessageToGroup(true);

      if (!user) {
        toast.error("You are not connected", { id: "send-comment" });
        return;
      }
      if (!chatId) {
        toast.error("Noodle not found", { id: "send-comment" });
        return;
      }
      if (!image && message.length === 0) {
        toast.error("You cannot send an empty comment", { id: "send-comment" });
        return;
      }

      //check is joined, if not join
      const isJoined = await getIsJoinedNoodle(chatId, MAIN_ADDRESS_SAVE);
      if (!isJoined) {
        await joinThisNoodle(chatId);
      }

      if (!image) {
        await user.chat.send(chatId, {
          type: "Text",
          content: message,
        });
      } else {
        console.log("Going to send an image just here:", image);
        await user.chat.send(chatId, {
          type: "Image",
          content: image,
        });
      }
      // Refresh the noodles to get the new comment // TODO later, only fetch the messages of this specific noodle
      await refreshNoodles();

      if (isToast) toast.success("Comment sent!", { id: "send-comment" });
    } catch (error) {
      console.error("Error sending message:", error);
      if (isToast) toast.error("Error sending message", { id: "send-comment" });
    } finally {
      setIsLoadingSendingMessageToGroup(false);
      if (isToast) toast.dismiss("send-comment");
    }
  }

  // Reset joinedGroups when address changes
  useEffect(() => {
    setJoinedGroups({});
  }, [address]);

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
        getIsJoinedNoodle,
        isGetJoinedGroupLoading,
        joinThisNoodle,
        isJoiningNoodle,
        voteForTheNoodle,
        isVotingNoodle,
        sendMessageToGroup,
        isLoadingSendingMessageToGroup,
      }}
    >
      {children}
    </PushSDKContext.Provider>
  );
};

export const usePushSDK = () => useContext(PushSDKContext);

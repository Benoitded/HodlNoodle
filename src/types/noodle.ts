export interface Noodle {
  id: string; // Unique identifier for the recommendation, the chatUd
  timestamp: number;
  rank: number; // Rank of the recommendation
  title: string; // Title of the recommendation
  author: string; // Who made the recommendation
  description: string; // Description of the food item or location
  location: GPSLocation; // GPS location details
  likes: string[]; // List of addresses who liked the noodle
  dislikes: string[]; // List of addresses who disliked the noodle
  messages: Message[]; // Array of messages
  images: string[]; // Array of images
}

export interface GPSLocation {
  latitude: number; // Latitude coordinate
  longitude: number; // Longitude coordinate
  address: string; // Address of the location
}

export interface Message {
  author: string;
  dataMessage: string;
  timestamp: number;
  type: "Text" | "Image";
}

export type DETECT_TYPE_WORD =
  | "AW_SEND_LOCATION" // At the beginning of the chat, only by the author of the noodle
  | "AW_EXTRA_PICTURE_NOODLE" // Extra picture from the author only at the creation of the noodle, so they are not added as a message
  | "AW_EXTRA_PICTURE" // Allow to send pictures and text in "the same message" (requires to add chatID right after the DETECT_TYPE_WORD)
  | "AW_SEND_VOTE"; // Only one vote by noodle, only once

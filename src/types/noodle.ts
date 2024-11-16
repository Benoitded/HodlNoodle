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
  dataImage?: string;
  timestamp: number;
}

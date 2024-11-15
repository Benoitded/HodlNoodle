export interface Noodle {
  id: string; // Unique identifier for the recommendation, the chatUd
  title: string; // Title of the recommendation
  author: string; // Who made the recommendation
  description: string; // Description of the food item or location
  location: GPSLocation; // GPS location details
  likes: number; // Number of likes
  dislikes: number; // Number of dislikes
  comments: Message[]; // Array of messages
}

export interface GPSLocation {
  latitude: number; // Latitude coordinate
  longitude: number; // Longitude coordinate
}

export interface Message {
  author: string;
  dataMessage: string;
  timestamp: number;
}

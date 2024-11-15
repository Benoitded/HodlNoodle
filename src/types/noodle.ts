export interface FoodRecommendation {
  id: number; // Unique identifier for the recommendation
  title: string; // Title of the recommendation
  description: string; // Description of the food item or location
  location: GPSLocation; // GPS location details
  comments: number; // Number of comments
  likes: number; // Number of likes
  dislikes: number; // Number of dislikes
}

export interface GPSLocation {
  latitude: number; // Latitude coordinate
  longitude: number; // Longitude coordinate
}

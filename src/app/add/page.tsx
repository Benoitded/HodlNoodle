"use client";
import { useState, useCallback } from "react";
import styles from "./page.module.scss";
import { GPSLocation } from "@/types/noodle";
import LocationIcon from "@/assets/icons/location.svg";
import { toast } from "react-hot-toast";

export default function AddNoodlePage() {
  const [images, setImages] = useState<File[]>([]);
  const [location, setLocation] = useState<GPSLocation | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImages((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      toast.success("Image uploaded successfully!");
      setImages((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };
  const fetchApiData = async ({
    latitude,
    longitude,
  }: {
    latitude: number;
    longitude: number;
  }) => {
    //https://api.geoapify.com/v1/geocode/reverse?lat=13.7246335&lon=100.5580334&format=json&apiKey=YOUR_API_KEY
    const API_KEY = "b8568cb9afc64fad861a69edbddb2658";
    const res = await fetch(
      `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${API_KEY}`
    );
    const data = await res.json();
    console.log("fetched data", data);
    return data;
  };
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    try {
      // Request permission explicitly
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permission.state === "denied") {
        toast.error("Please enable location access in your device settings");
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading("Searching for your location...");

      console.log("Getting current location");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latlong = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: "",
          };

          try {
            const address = (
              await fetchApiData({
                latitude: latlong.latitude,
                longitude: latlong.longitude,
              })
            ).results[0];

            setLocation({
              latitude: latlong.latitude,
              longitude: latlong.longitude,
              address: address.address_line1 || address.address_line2,
            });

            toast.dismiss(loadingToast);
            toast.success("Location found successfully!");
          } catch (error) {
            console.error("Error fetching address:", error);
            toast.dismiss(loadingToast);
            toast.error("Unable to retrieve address");
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.dismiss(loadingToast);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              toast.error("Please allow access to your location");
              break;
            case error.POSITION_UNAVAILABLE:
              toast.error("Location information unavailable");
              break;
            case error.TIMEOUT:
              toast.error("Location request timed out");
              break;
            default:
              toast.error("An error occurred while getting your location");
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } catch (error) {
      console.error("Error requesting permission:", error);
      toast.error("Error requesting location permission");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic to be implemented
  };

  return (
    <div className={styles.page}>
      <h2>Add a Noodles</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Pictures of the noodles</label>
          <div
            className={styles.dropzone}
            onDrop={(e) => {
              e.preventDefault();
              const files = Array.from(e.dataTransfer.files);
              onDrop(files);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add(styles.dragActive);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove(styles.dragActive);
            }}
          >
            <p>Drag and drop your photos here or</p>
            <div className={styles.mobileOptions}>
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.multiple = true;
                  input.capture = "environment";
                  input.onchange = (e) => {
                    const event =
                      e as unknown as React.ChangeEvent<HTMLInputElement>;
                    handleImageUpload(event);
                  };
                  input.click();
                }}
              >
                Take a photo
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.multiple = true;
                  input.onchange = (e) => {
                    const event =
                      e as unknown as React.ChangeEvent<HTMLInputElement>;
                    handleImageUpload(event);
                  };
                  input.click();
                }}
              >
                Choose from gallery
              </button>
            </div>
          </div>
          {images.length > 0 && (
            <div className={styles.preview}>
              {/* <div>we have {images.length} images</div> */}
              {images.map((img, idx) => (
                <div key={idx} className={styles.imagePreview}>
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`Preview ${idx + 1}`}
                    className={styles.previewImage}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImages((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className={styles.removeImage}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.field}>
          <label>Name of the noodles</label>
          <input type="text" required />
        </div>

        <div className={styles.field}>
          <label>Description</label>
          <textarea rows={4} required />
        </div>

        <div className={styles.field}>
          <label>Location</label>
          <div className={styles.locationInput}>
            <input
              type="text"
              value={location?.address || ""}
              onChange={(e) =>
                setLocation({
                  latitude: location?.latitude || 0,
                  longitude: location?.longitude || 0,
                  address: e.target.value,
                })
              }
              required
            />
            <button
              type="button"
              onClick={getCurrentLocation}
              className={styles.locationButton}
            >
              <LocationIcon />
              Use my location
            </button>
          </div>
        </div>

        <button type="submit" className={styles.submitButton}>
          Submit
        </button>
      </form>
    </div>
  );
}

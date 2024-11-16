"use client";

// @/app/add/page.tsx

import { useState, useCallback } from "react";
import { useTransitionRouter } from "next-view-transitions";
import { toast } from "react-hot-toast";
import { id } from "ethers/lib/utils";

import styles from "./page.module.scss";
import LocationIcon from "@/assets/icons/location.svg";
import { GPSLocation, DETECT_TYPE_WORD } from "@/types/noodle";
import { MAIN_ADDRESS_SAVE, usePushSDK } from "@/context/usePushSDK";
import { convertToBase64 } from "@/utils/imageUtils";

export default function AddNoodlePage() {
  const router = useTransitionRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<GPSLocation | null>(null);

  const { user, refreshNoodles, sendMessageToGroup } = usePushSDK();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      const base64Images = await Promise.all(
        acceptedFiles.map((file) => convertToBase64(file))
      );
      setImages((prev) => [...prev, ...base64Images]);
    } catch (error) {
      toast.error("Erreur lors de la conversion des images");
    }
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleImageUpload", e);
    toast.loading("uploading image...", {
      id: "uploading-image",
    });

    if (e.target.files && e.target.files.length > 0) {
      try {
        // Convert captured photo or selected files to File objects
        const files = Array.from(e.target.files).map(
          (file) => new File([file], file.name, { type: file.type })
        );

        const base64Images = await Promise.all(
          files.map((file) => convertToBase64(file))
        );

        setImages((prev) => [...prev, ...base64Images]);

        toast.success("Image uploaded successfully!", {
          id: "uploading-image",
        });
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Error processing image", {
          id: "uploading-image",
        });
      }
    } else {
      toast.error("No files selected", {
        id: "uploading-image",
      });
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

  const checkLocationPermission = async () => {
    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      switch (permission.state) {
        case "granted":
          return true;
        case "prompt":
          toast("Please allow access to your location", {
            icon: "📍",
            duration: 3000,
          });
          return true;
        case "denied":
          toast.error(
            "Location access is blocked. Please enable it in your browser settings",
            {
              icon: "🚫",
              duration: 4000,
            }
          );
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser", {
        icon: "❌",
      });
      return;
    }

    const hasPermission = await checkLocationPermission();
    if (!hasPermission) return;

    const loadingToast = toast.loading("Searching for your location...");

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
          toast.success("Location found!", {
            icon: "📍",
          });
        } catch (error) {
          console.error("Error fetching address:", error);
          toast.dismiss(loadingToast);
          toast.error("Unable to get address details", {
            icon: "❌",
          });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.dismiss(loadingToast);

        const errorMessages = {
          [GeolocationPositionError.PERMISSION_DENIED]:
            "Location access denied",
          [GeolocationPositionError.POSITION_UNAVAILABLE]:
            "Location unavailable",
          [GeolocationPositionError.TIMEOUT]: "Location request timed out",
        };

        toast(
          errorMessages[error.code as keyof typeof errorMessages] ||
            "Error getting location",
          {
            icon: "❌",
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const handleDeleteImage = (idx: number) => {
    console.log("deleting image", idx);
    toast("Image deleted successfully!", {
      icon: "🗑️",
    });
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      toast.loading("Submitting your noodles...", {
        id: "submitting-noodles",
      });
      if (!user) {
        toast.error("Please unlock your profile first", {
          icon: "❌",
          id: "submitting-noodles",
        });
        return;
      }

      const groupName = name;
      const options = {
        description: description,
        image: images[0] || "",
        members: [MAIN_ADDRESS_SAVE],
        private: false,
        rules: {},
      };

      console.log("name:", name);
      console.log("options:", options);
      const createdGroup = await user.chat.group.create(groupName, options);
      console.log("Just createdGroup:", createdGroup);

      // Send location in a separate message with the DETECT_TYPE_WORD
      const detectTypeWord: DETECT_TYPE_WORD = "AW_SEND_LOCATION";
      if (location) {
        const locationMessage = `${detectTypeWord}\n${JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
        })}`;
        console.log("Going to sendlocationMessage", locationMessage);
        const sentLocationMessage = await sendMessageToGroup(
          createdGroup.chatId,
          locationMessage,
          []
        );
        console.log("Sent location message:", sentLocationMessage);
      }

      // Send all of the extra pictures one by one in other messages
      if (images.length > 1) {
        const extraImages = images.slice(1);
        const sentExtraPictureMessage = await sendMessageToGroup(
          createdGroup.chatId,
          "",
          extraImages
        );
        console.log("Sent extra picture message:", sentExtraPictureMessage);
      }

      //refresh
      await refreshNoodles();

      toast.success("Noodles submitted successfully!", {
        icon: "✅",
        id: "submitting-noodles",
      });

      //go to la page createdGroup
      router.push(`/noodle/${createdGroup.chatId}`);
    } catch (error) {
      console.error("Error submitting noodles:", error);
      toast.error("Error submitting noodles", {
        icon: "❌",
        id: "submitting-noodles",
      });
    }
  };

  // Add validations
  const getSubmitButtonText = (): string => {
    if (images.length === 0) return "Please add at least one picture";
    if (!name) return "You need to fill with the name";
    if (name.length < 3) return "Name is too short";
    if (!description) return "You need to fill with the description";
    if (description.length < 3) return "Description is too short";
    if (description.length > 150) return "Description is too long";
    if (!location?.address) return "Please fill with an address";
    return "Submit";
  };

  const isFormValid = (): boolean => {
    return (
      images.length > 0 &&
      name.length >= 3 &&
      description.length >= 3 &&
      description.length <= 150 &&
      !!location?.address
    );
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
                  console.log("Choose a photo");
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.multiple = true;
                  input.onchange = (e: Event) => {
                    handleImageUpload(
                      e as unknown as React.ChangeEvent<HTMLInputElement>
                    );
                  };
                  input.click();
                }}
              >
                Choose a photo
              </button>
            </div>
          </div>
          {images.length > 0 && (
            <div className={styles.preview}>
              {/* <div>we have {images.length} images</div> */}
              {images.map((imgUrl, idx) => (
                <div key={idx} className={styles.imagePreview}>
                  <img
                    src={imgUrl}
                    alt={`Preview ${idx + 1}`}
                    className={styles.previewImage}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(idx)}
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
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label>Description</label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
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

        <button
          type="submit"
          className={styles.submitButton}
          disabled={!isFormValid()}
        >
          {getSubmitButtonText()}
        </button>
      </form>
    </div>
  );
}

export const resizeImage = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const MAX_SIZE = 320;
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while keeping the ratio
      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // Convert canvas to Blob
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(img.src); // Clean up
        resolve(blob!);
      }, file.type);
    };
  });
};

export const convertToBase64 = async (file: File): Promise<string> => {
  // Resize file
  const resizedBlob = await resizeImage(file);

  // Convert to base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(resizedBlob);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

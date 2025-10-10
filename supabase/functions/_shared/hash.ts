// Image hash utilities for duplicate detection

/**
 * Calculate a simple hash from image bytes
 * This is a basic implementation - for production, consider perceptual hashing
 */
export async function calculateImageHash(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Calculate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    return hashHex;
  } catch (error) {
    console.error("Error calculating image hash:", error);
    throw error;
  }
}

/**
 * Calculate a simple perceptual hash (basic implementation)
 * For production, consider using a proper pHash library
 */
export async function calculatePerceptualHash(
  imageUrl: string,
): Promise<string> {
  // This is a placeholder for a more sophisticated perceptual hash
  // In production, you'd use a library that can detect similar images
  // even if they're slightly modified (resize, compression, etc)

  // For now, fall back to regular hash
  return calculateImageHash(imageUrl);
}

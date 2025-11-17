/**
 * Image optimization utilities
 */

/**
 * Compress an image file before upload
 * @param file - The image file to compress
 * @param maxWidth - Maximum width in pixels (default: 1920)
 * @param maxHeight - Maximum height in pixels (default: 1080)
 * @param quality - JPEG quality (0-1, default: 0.8)
 * @returns Compressed image as Blob
 */
export async function compressImage(
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.8
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions while maintaining aspect ratio
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                // Create canvas and draw resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = event.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Create a thumbnail from an image file
 * @param file - The image file
 * @param maxSize - Maximum width/height in pixels (default: 200)
 * @returns Thumbnail as data URL
 */
export async function createThumbnail(
    file: File,
    maxSize: number = 200
): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();

            img.onload = () => {
                // Calculate thumbnail dimensions (square)
                const size = Math.min(img.width, img.height, maxSize);

                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Calculate crop position (center crop)
                const sourceX = (img.width - size) / 2;
                const sourceY = (img.height - size) / 2;

                ctx.drawImage(
                    img,
                    sourceX,
                    sourceY,
                    size,
                    size,
                    0,
                    0,
                    size,
                    size
                );

                // Convert to data URL
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = event.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Get optimized image URL with query parameters for server-side optimization
 * @param url - Original image URL
 * @param width - Desired width
 * @param height - Desired height
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
    url: string,
    width?: number,
    height?: number
): string {
    if (!url) return '';

    // If it's a data URL or external URL, return as is
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // Add query parameters for server-side optimization (if supported)
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
}

/**
 * Validate image file
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB (default: 5)
 * @returns Validation result
 */
export function validateImageFile(
    file: File,
    maxSizeMB: number = 5
): { valid: boolean; error?: string } {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.',
        };
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return {
            valid: false,
            error: `File size exceeds ${maxSizeMB}MB. Please choose a smaller image.`,
        };
    }

    return { valid: true };
}

/**
 * Convert blob to file
 * @param blob - The blob to convert
 * @param fileName - The file name
 * @returns File object
 */
export function blobToFile(blob: Blob, fileName: string): File {
    return new File([blob], fileName, { type: blob.type });
}

/**
 * Image Compression Utility
 * Provides client-side image compression and optimization
 * 
 * Features:
 * - Resize images to specified dimensions
 * - Compress images with quality control
 * - Maintain aspect ratio
 * - Convert to optimal format
 * - Reduce file size for faster uploads
 * 
 * Requirements: 4.4 (Optimize image uploads)
 */

export interface CompressionOptions {
    /** Maximum width in pixels */
    maxWidth?: number;
    /** Maximum height in pixels */
    maxHeight?: number;
    /** Quality (0-1), default 0.85 */
    quality?: number;
    /** Output format, default 'image/jpeg' */
    outputFormat?: string;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.85,
    outputFormat: 'image/jpeg',
};

/**
 * Compress and optimize an image file
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed image file
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
        // Create image element
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read image file'));
        };

        img.onload = () => {
            try {
                // Calculate new dimensions while maintaining aspect ratio
                const { width, height } = calculateDimensions(
                    img.width,
                    img.height,
                    opts.maxWidth,
                    opts.maxHeight
                );

                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                // Draw image on canvas
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Enable image smoothing for better quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Draw image
                ctx.drawImage(img, 0, 0, width, height);

                // Convert canvas to blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }

                        // Create new file from blob
                        const compressedFile = new File(
                            [blob],
                            file.name.replace(/\.[^/.]+$/, '.jpg'), // Change extension to .jpg
                            {
                                type: opts.outputFormat,
                                lastModified: Date.now(),
                            }
                        );

                        // Log compression results
                        const originalSize = (file.size / 1024).toFixed(2);
                        const compressedSize = (compressedFile.size / 1024).toFixed(2);
                        const reduction = (
                            ((file.size - compressedFile.size) / file.size) *
                            100
                        ).toFixed(1);

                        console.log('Image compression:', {
                            original: `${originalSize} KB`,
                            compressed: `${compressedSize} KB`,
                            reduction: `${reduction}%`,
                            dimensions: `${width}x${height}`,
                        });

                        resolve(compressedFile);
                    },
                    opts.outputFormat,
                    opts.quality
                );
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        // Read file
        reader.readAsDataURL(file);
    });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    // Check if resizing is needed
    if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
            // Landscape orientation
            width = maxWidth;
            height = Math.round(width / aspectRatio);
        } else {
            // Portrait orientation
            height = maxHeight;
            width = Math.round(height * aspectRatio);
        }

        // Ensure dimensions don't exceed limits
        if (width > maxWidth) {
            width = maxWidth;
            height = Math.round(width / aspectRatio);
        }
        if (height > maxHeight) {
            height = maxHeight;
            width = Math.round(height * aspectRatio);
        }
    }

    return { width, height };
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(
    file: File
): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read image file'));
        };

        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Estimate compressed file size
 */
export function estimateCompressedSize(
    originalSize: number,
    quality: number = 0.85
): number {
    // Rough estimation: quality * 0.7 (JPEG compression factor)
    return Math.round(originalSize * quality * 0.7);
}

/**
 * Check if image needs compression
 */
export async function needsCompression(
    file: File,
    maxSizeKB: number = 500,
    maxDimension: number = 800
): Promise<boolean> {
    // Check file size
    if (file.size / 1024 > maxSizeKB) {
        return true;
    }

    // Check dimensions
    try {
        const { width, height } = await getImageDimensions(file);
        return width > maxDimension || height > maxDimension;
    } catch {
        return false;
    }
}

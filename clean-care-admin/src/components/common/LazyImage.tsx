/**
 * Lazy Image Component
 * 
 * Implements lazy loading for images to improve performance
 */

import { useState, useEffect, useRef, type ImgHTMLAttributes } from 'react';
import { Box, Skeleton } from '@mui/material';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src: string;
    alt: string;
    width?: number | string;
    height?: number | string;
    placeholderSrc?: string;
    onLoad?: () => void;
    onError?: () => void;
}

/**
 * LazyImage component with intersection observer
 */
export const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    width,
    height,
    placeholderSrc,
    onLoad,
    onError,
    ...props
}) => {
    const [imageSrc, setImageSrc] = useState<string | null>(placeholderSrc || null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        // Create intersection observer
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // Load image when it enters viewport
                        setImageSrc(src);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading 50px before image enters viewport
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [src]);

    const handleLoad = () => {
        setIsLoading(false);
        onLoad?.();
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
        onError?.();
    };

    return (
        <Box
            sx={{
                position: 'relative',
                width: width || '100%',
                height: height || 'auto',
                overflow: 'hidden',
            }}
        >
            {isLoading && !hasError && (
                <Skeleton
                    variant="rectangular"
                    width={width || '100%'}
                    height={height || 200}
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                    }}
                />
            )}

            {hasError ? (
                <Box
                    sx={{
                        width: width || '100%',
                        height: height || 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        color: '#999',
                    }}
                >
                    Failed to load image
                </Box>
            ) : (
                <img
                    ref={imgRef}
                    src={imageSrc || undefined}
                    alt={alt}
                    onLoad={handleLoad}
                    onError={handleError}
                    style={{
                        width: width || '100%',
                        height: height || 'auto',
                        display: isLoading ? 'none' : 'block',
                        objectFit: 'cover',
                    }}
                    {...props}
                />
            )}
        </Box>
    );
};

export default LazyImage;



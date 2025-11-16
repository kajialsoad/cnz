/**
 * Animation utilities and keyframes for the admin panel
 * Provides reusable animation styles for consistent UI transitions
 */

import { keyframes } from '@mui/material/styles';

/**
 * Fade-in animation for complaint cards and content
 */
export const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/**
 * Slide-in animation for modals from bottom
 */
export const slideInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/**
 * Slide-in animation for modals from right
 */
export const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

/**
 * Scale-in animation for modals
 */
export const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

/**
 * Pulse animation for loading indicators
 */
export const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

/**
 * Spin animation for loading spinners
 */
export const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

/**
 * Shimmer animation for skeleton loaders
 */
export const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

/**
 * Bounce animation for notifications
 */
export const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
`;

/**
 * Animation configuration presets
 */
export const animationConfig = {
    // Fast animations for immediate feedback
    fast: {
        duration: '0.15s',
        timing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    // Normal animations for standard transitions
    normal: {
        duration: '0.3s',
        timing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    // Slow animations for emphasis
    slow: {
        duration: '0.5s',
        timing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    // Smooth easing for natural motion
    smooth: {
        duration: '0.3s',
        timing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
    // Spring-like easing for playful motion
    spring: {
        duration: '0.4s',
        timing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
};

/**
 * Stagger delay calculator for sequential animations
 * @param index - Index of the item in the list
 * @param baseDelay - Base delay in milliseconds
 * @returns Delay string in seconds
 */
export const getStaggerDelay = (index: number, baseDelay: number = 50): string => {
    return `${(index * baseDelay) / 1000}s`;
};

/**
 * Common animation styles for complaint cards
 */
export const complaintCardAnimation = {
    animation: `${fadeIn} ${animationConfig.normal.duration} ${animationConfig.normal.timing}`,
    animationFillMode: 'both',
};

/**
 * Common animation styles for modals
 */
export const modalAnimation = {
    animation: `${scaleIn} ${animationConfig.normal.duration} ${animationConfig.smooth.timing}`,
    animationFillMode: 'both',
};

/**
 * Status badge transition styles
 */
export const statusBadgeTransition = {
    transition: `all ${animationConfig.fast.duration} ${animationConfig.fast.timing}`,
};

/**
 * Button hover animation styles
 */
export const buttonHoverAnimation = {
    transition: `all ${animationConfig.fast.duration} ${animationConfig.fast.timing}`,
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
    },
    '&:active': {
        transform: 'translateY(0)',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
};

/**
 * Loading spinner animation styles
 */
export const loadingSpinnerAnimation = {
    animation: `${spin} 1s linear infinite`,
};

/**
 * Skeleton shimmer animation styles
 */
export const skeletonShimmerAnimation = {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '1000px 100%',
    animation: `${shimmer} 2s infinite linear`,
};

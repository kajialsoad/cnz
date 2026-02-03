import React from 'react';
import { LinearProgress, Box } from '@mui/material';
import { fadeIn, animationConfig } from '../../styles/animations';

interface PageLoadingBarProps {
    loading: boolean;
}

const PageLoadingBar: React.FC<PageLoadingBarProps> = ({ loading }) => {
    if (!loading) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                animation: `${fadeIn} ${animationConfig.fast.duration} ${animationConfig.fast.timing}`,
            }}
        >
            <LinearProgress
                sx={{
                    height: 3,
                    '& .MuiLinearProgress-bar': {
                        backgroundColor: '#4CAF50',
                        transition: `transform ${animationConfig.fast.duration} ${animationConfig.fast.timing}`,
                    },
                    '& .MuiLinearProgress-bar1Indeterminate': {
                        animation: 'mui-indeterminate1 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite',
                    },
                    '& .MuiLinearProgress-bar2Indeterminate': {
                        animation: 'mui-indeterminate2 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite',
                    },
                }}
            />
        </Box>
    );
};

export default PageLoadingBar;



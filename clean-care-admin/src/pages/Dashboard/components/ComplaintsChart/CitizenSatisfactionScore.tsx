import React from 'react';
import { Card, CardContent, Typography, Box, Rating } from '@mui/material';
import { CircularProgress } from '@mui/material';

const CitizenSatisfactionScore: React.FC = () => {
  const score = 4.2;
  const maxScore = 5.0;
  const percentage = (score / maxScore) * 100;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              bgcolor: '#F59E0B',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ color: 'white', fontSize: '12px' }}>⭐</Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
            Citizen Satisfaction Score
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={120}
            thickness={8}
            sx={{
              color: '#E5E7EB',
              position: 'absolute',
            }}
          />
          <CircularProgress
            variant="determinate"
            value={percentage}
            size={120}
            thickness={8}
            sx={{
              color: '#10B981',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, color: '#374151' }}>
              {score}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.75rem' }}>
              out of {maxScore}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Rating
            value={score}
            readOnly
            precision={0.1}
            size="small"
            sx={{
              '& .MuiRating-iconFilled': {
                color: '#F59E0B',
              },
              '& .MuiRating-iconEmpty': {
                color: '#E5E7EB',
              },
            }}
          />
        </Box>

        <Typography variant="caption" sx={{ color: '#6B7280', fontSize: '0.7rem' }}>
          Based on citizen feedback
        </Typography>
      </CardContent>
    </Card>
  );
};

export default CitizenSatisfactionScore;
/**
 * ReviewDisplayCard Demo
 * 
 * This file demonstrates various use cases of the ReviewDisplayCard component.
 * Use this as a reference for implementing reviews in your application.
 */

import React from 'react';
import { Box, Typography, Divider, Paper } from '@mui/material';
import ReviewDisplayCard, { ReviewDisplayCardSkeleton, ReviewData } from './ReviewDisplayCard';

/**
 * Sample review data for demonstration
 */
const sampleReviews: ReviewData[] = [
    {
        id: 1,
        rating: 5,
        comment: 'Excellent service! The team was very professional and resolved the issue quickly. Highly recommend!',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        user: {
            firstName: 'John',
            lastName: 'Doe',
            avatar: 'https://i.pravatar.cc/150?img=1',
        },
    },
    {
        id: 2,
        rating: 4,
        comment: 'Good service overall. The response time was acceptable and the issue was resolved satisfactorily.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        user: {
            firstName: 'Jane',
            lastName: 'Smith',
            avatar: 'https://i.pravatar.cc/150?img=2',
        },
    },
    {
        id: 3,
        rating: 3,
        comment: 'Average experience. The issue was resolved but it took longer than expected.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        user: {
            firstName: 'Alice',
            lastName: 'Johnson',
            avatar: null, // Will show initials
        },
    },
    {
        id: 4,
        rating: 5,
        comment: null, // No comment
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        user: {
            firstName: 'Bob',
            lastName: 'Williams',
            avatar: null,
        },
    },
    {
        id: 5,
        rating: 2,
        comment: 'Not satisfied with the service. The issue took too long to resolve and communication was poor.',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
        user: {
            firstName: 'Charlie',
            lastName: 'Brown',
            avatar: 'https://i.pravatar.cc/150?img=3',
        },
    },
    {
        id: 6,
        rating: 1,
        comment: 'Very disappointed. The issue was not resolved properly and I had to follow up multiple times.',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
        user: {
            firstName: 'Diana',
            lastName: 'Davis',
            avatar: null,
        },
    },
];

/**
 * ReviewDisplayCard Demo Component
 */
const ReviewDisplayCardDemo: React.FC = () => {
    const [showSkeleton, setShowSkeleton] = React.useState(false);

    return (
        <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>
                ReviewDisplayCard Component Demo
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                This demo showcases the ReviewDisplayCard component with various review scenarios.
            </Typography>

            <Divider sx={{ my: 3 }} />

            {/* Loading State Demo */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Loading State
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Shows skeleton loaders while reviews are being fetched.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <button onClick={() => setShowSkeleton(!showSkeleton)}>
                        {showSkeleton ? 'Hide' : 'Show'} Skeleton
                    </button>
                </Box>
                {showSkeleton && <ReviewDisplayCardSkeleton count={3} />}
            </Paper>

            {/* All Reviews Demo */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    All Reviews (Various Ratings)
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Displays reviews with different ratings (1-5 stars), comments, and user avatars.
                </Typography>
                {sampleReviews.map((review) => (
                    <ReviewDisplayCard key={review.id} review={review} />
                ))}
            </Paper>

            {/* 5-Star Reviews Only */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    5-Star Reviews Only
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Filtered to show only excellent reviews.
                </Typography>
                {sampleReviews
                    .filter((review) => review.rating === 5)
                    .map((review) => (
                        <ReviewDisplayCard key={review.id} review={review} />
                    ))}
            </Paper>

            {/* Reviews Without Comments */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Reviews Without Comments
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Shows reviews that only have ratings, no comments.
                </Typography>
                {sampleReviews
                    .filter((review) => !review.comment)
                    .map((review) => (
                        <ReviewDisplayCard key={review.id} review={review} />
                    ))}
            </Paper>

            {/* Reviews Without Avatars */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Reviews Without Avatars (Shows Initials)
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Demonstrates fallback to user initials when avatar is not available.
                </Typography>
                {sampleReviews
                    .filter((review) => !review.user.avatar)
                    .map((review) => (
                        <ReviewDisplayCard key={review.id} review={review} />
                    ))}
            </Paper>

            {/* Low Ratings */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Low Ratings (1-2 Stars)
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Shows reviews with low satisfaction ratings.
                </Typography>
                {sampleReviews
                    .filter((review) => review.rating <= 2)
                    .map((review) => (
                        <ReviewDisplayCard key={review.id} review={review} />
                    ))}
            </Paper>

            {/* Single Review */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Single Review Example
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    A single review card as it would appear in a complaint details page.
                </Typography>
                <ReviewDisplayCard review={sampleReviews[0]} />
            </Paper>

            {/* Empty State */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Empty State (No Reviews)
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    What to show when there are no reviews yet.
                </Typography>
                <Box
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        bgcolor: 'grey.50',
                        borderRadius: 2,
                    }}
                >
                    <Typography variant="body1" color="text.secondary">
                        No reviews yet
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                        Be the first to review this complaint resolution
                    </Typography>
                </Box>
            </Paper>

            {/* Usage Code Example */}
            <Paper sx={{ p: 3, mb: 4, bgcolor: 'grey.900', color: 'white' }}>
                <Typography variant="h6" gutterBottom>
                    Usage Example
                </Typography>
                <pre style={{ overflow: 'auto' }}>
                    <code>{`import ReviewDisplayCard from '@/components/Complaints/ReviewDisplayCard';

function ComplaintReviews({ reviews }) {
  return (
    <div>
      {reviews.map((review) => (
        <ReviewDisplayCard key={review.id} review={review} />
      ))}
    </div>
  );
}`}</code>
                </pre>
            </Paper>
        </Box>
    );
};

export default ReviewDisplayCardDemo;

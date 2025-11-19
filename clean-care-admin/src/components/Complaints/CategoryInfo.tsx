import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Skeleton } from '@mui/material';
import {
    Home as HomeIcon,
    Business as BusinessIcon,
    School as SchoolIcon,
    LocalHospital as HospitalIcon,
    Church as ChurchIcon,
    Event as EventIcon,
    Work as OfficeIcon,
    Landscape as RoadIcon,
} from '@mui/icons-material';
import { categoryService } from '../../services/categoryService';

interface CategoryInfoProps {
    categoryId: string;
    subcategoryId: string;
}

/**
 * CategoryInfo Component
 * 
 * Displays detailed category information including:
 * - Category icon and name (English and Bangla)
 * - Subcategory name (English and Bangla)
 * - Category color badge
 * 
 * Requirements: 7.4, 10.5
 */
const CategoryInfo: React.FC<CategoryInfoProps> = ({
    categoryId,
    subcategoryId,
}) => {
    const [categoryNameEn, setCategoryNameEn] = useState<string>('');
    const [categoryNameBn, setCategoryNameBn] = useState<string>('');
    const [subcategoryNameEn, setSubcategoryNameEn] = useState<string>('');
    const [subcategoryNameBn, setSubcategoryNameBn] = useState<string>('');
    const [categoryColor, setCategoryColor] = useState<string>('#808080');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategoryInfo = async () => {
            try {
                setLoading(true);

                // Fetch category and subcategory names in both languages
                const [catNameEn, catNameBn, subNameEn, subNameBn, color] = await Promise.all([
                    categoryService.getCategoryName(categoryId, 'en'),
                    categoryService.getCategoryName(categoryId, 'bn'),
                    categoryService.getSubcategoryName(categoryId, subcategoryId, 'en'),
                    categoryService.getSubcategoryName(categoryId, subcategoryId, 'bn'),
                    categoryService.getCategoryColor(categoryId),
                ]);

                setCategoryNameEn(catNameEn);
                setCategoryNameBn(catNameBn);
                setSubcategoryNameEn(subNameEn);
                setSubcategoryNameBn(subNameBn);
                setCategoryColor(color);
            } catch (error) {
                console.error('Error fetching category info:', error);
                setCategoryNameEn('Unknown Category');
                setCategoryNameBn('অজানা বিভাগ');
                setSubcategoryNameEn('Unknown Subcategory');
                setSubcategoryNameBn('অজানা উপবিভাগ');
            } finally {
                setLoading(false);
            }
        };

        if (categoryId && subcategoryId) {
            fetchCategoryInfo();
        }
    }, [categoryId, subcategoryId]);

    /**
     * Get icon component based on category ID
     */
    const getCategoryIcon = () => {
        const iconProps = {
            sx: {
                fontSize: 40,
                color: categoryColor,
            },
        };

        switch (categoryId) {
            case 'home':
                return <HomeIcon {...iconProps} />;
            case 'road_environment':
                return <RoadIcon {...iconProps} />;
            case 'business':
                return <BusinessIcon {...iconProps} />;
            case 'office':
                return <OfficeIcon {...iconProps} />;
            case 'education':
                return <SchoolIcon {...iconProps} />;
            case 'hospital':
                return <HospitalIcon {...iconProps} />;
            case 'religious':
                return <ChurchIcon {...iconProps} />;
            case 'events':
                return <EventIcon {...iconProps} />;
            default:
                return <BusinessIcon {...iconProps} />;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="80%" height={20} />
                </Box>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'flex-start',
                p: 2,
                backgroundColor: '#f8f9fa',
                borderRadius: 2,
                border: `2px solid ${categoryColor}`,
            }}
        >
            {/* Category Icon */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 60,
                    height: 60,
                    borderRadius: 2,
                    backgroundColor: `${categoryColor}15`,
                }}
            >
                {getCategoryIcon()}
            </Box>

            {/* Category Details */}
            <Box sx={{ flex: 1 }}>
                {/* Category Name */}
                <Box sx={{ mb: 1 }}>
                    <Typography
                        variant="body1"
                        sx={{
                            fontWeight: 600,
                            color: categoryColor,
                            mb: 0.5,
                        }}
                    >
                        {categoryNameEn}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'text.secondary',
                            fontStyle: 'italic',
                        }}
                    >
                        {categoryNameBn}
                    </Typography>
                </Box>

                {/* Subcategory Name */}
                <Box>
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 500,
                            mb: 0.5,
                        }}
                    >
                        {subcategoryNameEn}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'text.secondary',
                            fontStyle: 'italic',
                        }}
                    >
                        {subcategoryNameBn}
                    </Typography>
                </Box>
            </Box>

            {/* Category Badge */}
            <Chip
                label={categoryNameEn}
                size="small"
                sx={{
                    backgroundColor: categoryColor,
                    color: '#fff',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    height: 24,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                }}
            />
        </Box>
    );
};

export default CategoryInfo;

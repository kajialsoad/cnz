import React, { useState, useEffect } from 'react';
import { Chip, Skeleton } from '@mui/material';
import { HelpOutline as HelpOutlineIcon } from '@mui/icons-material';
import { categoryService } from '../../services/categoryService';

interface CategoryBadgeProps {
    categoryId: string | null | undefined;
    subcategoryId: string | null | undefined;
    size?: 'small' | 'medium';
    showSubcategory?: boolean;
}

/**
 * CategoryBadge Component
 * 
 * Displays a badge showing the category and optionally the subcategory
 * with the appropriate category color.
 * 
 * Requirements: 7.4, 10.5
 */
const CategoryBadge: React.FC<CategoryBadgeProps> = ({
    categoryId,
    subcategoryId,
    size = 'small',
    showSubcategory = true,
}) => {
    const [categoryName, setCategoryName] = useState<string>('');
    const [subcategoryName, setSubcategoryName] = useState<string>('');
    const [categoryColor, setCategoryColor] = useState<string>('#808080');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategoryInfo = async () => {
            try {
                setLoading(true);

                // Handle NULL/undefined categories
                if (!categoryId || !subcategoryId) {
                    setCategoryName('Not Categorized');
                    setSubcategoryName('');
                    setCategoryColor('#f5f5f5');
                    setLoading(false);
                    return;
                }

                // Fetch category and subcategory names with individual error handling
                try {
                    const [catName, subName, color] = await Promise.all([
                        categoryService.getCategoryName(categoryId, 'en').catch(() => 'Unknown Category'),
                        categoryService.getSubcategoryName(categoryId, subcategoryId, 'en').catch(() => 'Unknown'),
                        categoryService.getCategoryColor(categoryId).catch(() => '#808080'),
                    ]);

                    setCategoryName(catName);
                    setSubcategoryName(subName);
                    setCategoryColor(color);
                } catch (innerError) {
                    console.error('Error fetching category details:', innerError);
                    setCategoryName('Unknown');
                    setSubcategoryName('Unknown');
                    setCategoryColor('#808080');
                }
            } catch (error) {
                console.error('Error fetching category info:', error);
                setCategoryName('Unknown');
                setSubcategoryName('Unknown');
                setCategoryColor('#808080');
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryInfo();
    }, [categoryId, subcategoryId]);

    if (loading) {
        return (
            <Skeleton
                variant="rectangular"
                width={120}
                height={size === 'small' ? 24 : 32}
                sx={{ borderRadius: 2 }}
            />
        );
    }

    const label = showSubcategory && subcategoryName
        ? `${categoryName} - ${subcategoryName}`
        : categoryName;

    // Special styling for uncategorized complaints
    const isUncategorized = !categoryId || !subcategoryId;

    return (
        <Chip
            label={label}
            size={size}
            icon={isUncategorized ? <HelpOutlineIcon sx={{ fontSize: 16 }} /> : undefined}
            sx={{
                backgroundColor: isUncategorized ? '#f5f5f5' : categoryColor,
                color: isUncategorized ? '#757575' : '#fff',
                border: isUncategorized ? '1px dashed #bdbdbd' : 'none',
                fontWeight: 500,
                fontSize: size === 'small' ? '0.75rem' : '0.875rem',
                height: size === 'small' ? 24 : 32,
                '& .MuiChip-label': {
                    px: 1.5,
                },
                '& .MuiChip-icon': {
                    color: isUncategorized ? '#757575' : 'inherit',
                    marginLeft: 1,
                },
                boxShadow: isUncategorized ? 'none' : '0 1px 3px rgba(0,0,0,0.12)',
            }}
        />
    );
};

export default CategoryBadge;



import React, { useState, useEffect } from 'react';
import {
    FormControl,
    Select,
    MenuItem,
    InputAdornment,
    CircularProgress,
    Box,
    Typography,
} from '@mui/material';
import { Category as CategoryIcon, HelpOutline as HelpOutlineIcon } from '@mui/icons-material';
import { categoryService } from '../../services';
import type { CategoryItem } from '../../types/category-service.types';

interface CategoryFilterProps {
    value: string;
    onChange: (categoryId: string) => void;
    disabled?: boolean;
    fullWidth?: boolean;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
    value,
    onChange,
    disabled = false,
    fullWidth = false,
}) => {
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await categoryService.getAllCategories();
            setCategories(data);
        } catch (err: any) {
            console.error('Error fetching categories:', err);
            setError(err.message || 'Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (event: any) => {
        onChange(event.target.value);
    };

    return (
        <FormControl
            sx={{ minWidth: fullWidth ? '100%' : { xs: '100%', sm: 180 } }}
            disabled={disabled || loading}
        >
            <Select
                value={value}
                onChange={handleChange}
                displayEmpty
                startAdornment={
                    <InputAdornment position="start">
                        {loading ? (
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                        ) : (
                            <CategoryIcon sx={{ color: 'text.secondary', mr: 1 }} />
                        )}
                    </InputAdornment>
                }
                sx={{
                    backgroundColor: 'white',
                    height: { xs: 40, sm: 44 },
                    fontSize: { xs: '0.875rem', sm: '0.95rem' },
                    '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4CAF50',
                        },
                    },
                    '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4CAF50',
                            borderWidth: 2,
                        },
                    },
                }}
            >
                <MenuItem value="">
                    <Typography sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                        All Categories
                    </Typography>
                </MenuItem>

                {/* Uncategorized option for complaints without categories */}
                <MenuItem value="uncategorized">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HelpOutlineIcon sx={{ fontSize: 18, color: '#9e9e9e' }} />
                        <Typography
                            sx={{
                                fontSize: { xs: '0.875rem', sm: '0.95rem' },
                                color: '#757575',
                            }}
                        >
                            Uncategorized
                        </Typography>
                    </Box>
                </MenuItem>

                {error ? (
                    <MenuItem disabled>
                        <Typography
                            sx={{
                                fontSize: { xs: '0.875rem', sm: '0.95rem' },
                                color: 'error.main',
                            }}
                        >
                            {error}
                        </Typography>
                    </MenuItem>
                ) : (
                    categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        backgroundColor: category.color,
                                        flexShrink: 0,
                                    }}
                                />
                                <Typography
                                    sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' } }}
                                >
                                    {category.english} ({category.bangla})
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))
                )}
            </Select>
        </FormControl>
    );
};

export default CategoryFilter;

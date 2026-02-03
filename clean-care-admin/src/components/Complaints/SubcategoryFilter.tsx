import React, { useState, useEffect } from 'react';
import {
    FormControl,
    Select,
    MenuItem,
    InputAdornment,
    CircularProgress,
    Typography,
} from '@mui/material';
import { Label as LabelIcon } from '@mui/icons-material';
import { categoryService } from '../../services';
import type { SubcategoryItem } from '../../types/category-service.types';

interface SubcategoryFilterProps {
    categoryId: string;
    value: string;
    onChange: (subcategoryId: string) => void;
    disabled?: boolean;
    fullWidth?: boolean;
}

const SubcategoryFilter: React.FC<SubcategoryFilterProps> = ({
    categoryId,
    value,
    onChange,
    disabled = false,
    fullWidth = false,
}) => {
    const [subcategories, setSubcategories] = useState<SubcategoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (categoryId) {
            fetchSubcategories();
        } else {
            setSubcategories([]);
            // Reset subcategory selection when category is cleared
            if (value) {
                onChange('');
            }
        }
    }, [categoryId]);

    const fetchSubcategories = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await categoryService.getSubcategories(categoryId);
            setSubcategories(data);
        } catch (err: any) {
            console.error('Error fetching subcategories:', err);
            setError(err.message || 'Failed to load subcategories');
            setSubcategories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (event: any) => {
        onChange(event.target.value);
    };

    const isDisabled = disabled || loading || !categoryId;

    return (
        <FormControl
            sx={{ minWidth: fullWidth ? '100%' : { xs: '100%', sm: 200 } }}
            disabled={isDisabled}
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
                            <LabelIcon sx={{ color: 'text.secondary', mr: 1 }} />
                        )}
                    </InputAdornment>
                }
                sx={{
                    backgroundColor: isDisabled ? '#f5f5f5' : 'white',
                    height: { xs: 40, sm: 44 },
                    fontSize: { xs: '0.875rem', sm: '0.95rem' },
                    '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: isDisabled ? undefined : '#4CAF50',
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
                        {!categoryId
                            ? 'Select category first'
                            : 'All Subcategories'}
                    </Typography>
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
                    subcategories.map((subcategory) => (
                        <MenuItem key={subcategory.id} value={subcategory.id}>
                            <Typography
                                sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' } }}
                            >
                                {subcategory.english} ({subcategory.bangla})
                            </Typography>
                        </MenuItem>
                    ))
                )}
            </Select>
        </FormControl>
    );
};

export default SubcategoryFilter;



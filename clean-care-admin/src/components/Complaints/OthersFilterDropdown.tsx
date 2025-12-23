import React, { useState } from 'react';
import {
    FormControl,
    Select,
    MenuItem,
    InputAdornment,
    Box,
    Typography,
    Collapse,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import {
    Business as BusinessIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    CheckCircle as CheckCircleIcon,
    Circle as CircleIcon,
} from '@mui/icons-material';

/**
 * Others filter value type
 * - 'ALL': Show all complaints (no Others filter)
 * - 'OTHERS_ALL': Show all Others complaints
 * - 'CORPORATION_INTERNAL': Show all Corporation Internal complaints
 * - 'CORPORATION_EXTERNAL': Show all Corporation External complaints
 * - Specific subcategory string: Show complaints with that subcategory
 */
export type OthersFilterValue =
    | 'ALL'
    | 'OTHERS_ALL'
    | 'CORPORATION_INTERNAL'
    | 'CORPORATION_EXTERNAL'
    | string;

interface OthersFilterDropdownProps {
    value: OthersFilterValue;
    onChange: (value: OthersFilterValue) => void;
    disabled?: boolean;
    fullWidth?: boolean;
}

/**
 * Subcategories for Corporation Internal
 */
const CORPORATION_INTERNAL_SUBCATEGORIES = [
    'Engineering',
    'Electricity',
    'Health',
    'Property (Eviction)',
];

/**
 * Subcategories for Corporation External
 */
const CORPORATION_EXTERNAL_SUBCATEGORIES = [
    'WASA',
    'Titas',
    'DPDC',
    'DESCO',
    'BTCL',
    'Fire Service',
    'Others',
];

/**
 * OthersFilterDropdown Component
 * 
 * A hierarchical dropdown filter for Others complaints with:
 * - All Status (no filter)
 * - All Others
 * - Corporation Internal (with subcategories)
 * - Corporation External (with subcategories)
 * 
 * @component
 * @example
 * ```tsx
 * <OthersFilterDropdown
 *   value={othersFilter}
 *   onChange={setOthersFilter}
 * />
 * ```
 */
const OthersFilterDropdown: React.FC<OthersFilterDropdownProps> = ({
    value,
    onChange,
    disabled = false,
    fullWidth = false,
}) => {
    const [internalExpanded, setInternalExpanded] = useState(false);
    const [externalExpanded, setExternalExpanded] = useState(false);

    const handleChange = (event: any) => {
        const newValue = event.target.value as OthersFilterValue;
        onChange(newValue);
    };

    /**
     * Get display text for the selected value
     */
    const getDisplayText = (): string => {
        if (value === 'ALL') return 'All Status';
        if (value === 'OTHERS_ALL') return 'All Others';
        if (value === 'CORPORATION_INTERNAL') return 'Corporation Internal';
        if (value === 'CORPORATION_EXTERNAL') return 'Corporation External';

        // Check if it's a subcategory
        if (CORPORATION_INTERNAL_SUBCATEGORIES.includes(value)) {
            return `Internal: ${value}`;
        }
        if (CORPORATION_EXTERNAL_SUBCATEGORIES.includes(value)) {
            return `External: ${value}`;
        }

        return value;
    };

    /**
     * Check if a value is selected
     */
    const isSelected = (checkValue: string): boolean => {
        return value === checkValue;
    };

    /**
     * Render selection icon
     */
    const renderSelectionIcon = (checkValue: string) => {
        return isSelected(checkValue) ? (
            <CheckCircleIcon sx={{ fontSize: 18, color: '#4CAF50', mr: 1 }} />
        ) : (
            <CircleIcon sx={{ fontSize: 18, color: 'transparent', mr: 1 }} />
        );
    };

    return (
        <FormControl
            sx={{ minWidth: fullWidth ? '100%' : { xs: '100%', sm: 200 } }}
            disabled={disabled}
        >
            <Select
                value={value}
                onChange={handleChange}
                displayEmpty
                startAdornment={
                    <InputAdornment position="start">
                        <BusinessIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    </InputAdornment>
                }
                renderValue={() => (
                    <Typography sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                        {getDisplayText()}
                    </Typography>
                )}
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
                MenuProps={{
                    PaperProps: {
                        sx: {
                            maxHeight: 400,
                            '& .MuiMenuItem-root': {
                                fontSize: { xs: '0.875rem', sm: '0.95rem' },
                            },
                        },
                    },
                }}
            >
                {/* All Status */}
                <MenuItem value="ALL">
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        {renderSelectionIcon('ALL')}
                        <Typography sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                            All Status
                        </Typography>
                    </Box>
                </MenuItem>

                <Divider sx={{ my: 0.5 }} />

                {/* All Others */}
                <MenuItem value="OTHERS_ALL">
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        {renderSelectionIcon('OTHERS_ALL')}
                        <Typography
                            sx={{
                                fontSize: { xs: '0.875rem', sm: '0.95rem' },
                                fontWeight: 600,
                            }}
                        >
                            All Others
                        </Typography>
                    </Box>
                </MenuItem>

                <Divider sx={{ my: 0.5 }} />

                {/* Corporation Internal */}
                <MenuItem
                    value="CORPORATION_INTERNAL"
                    onClick={(e) => {
                        e.stopPropagation();
                        setInternalExpanded(!internalExpanded);
                    }}
                    sx={{
                        backgroundColor: internalExpanded ? 'rgba(76, 175, 80, 0.08)' : 'transparent',
                        '&:hover': {
                            backgroundColor: internalExpanded
                                ? 'rgba(76, 175, 80, 0.12)'
                                : 'rgba(0, 0, 0, 0.04)',
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        {renderSelectionIcon('CORPORATION_INTERNAL')}
                        <Typography
                            sx={{
                                fontSize: { xs: '0.875rem', sm: '0.95rem' },
                                fontWeight: 500,
                                flex: 1,
                            }}
                        >
                            Corporation Internal
                        </Typography>
                        {internalExpanded ? (
                            <ExpandLessIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        ) : (
                            <ExpandMoreIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        )}
                    </Box>
                </MenuItem>

                {/* Corporation Internal Subcategories */}
                {internalExpanded && (
                    <>
                        {CORPORATION_INTERNAL_SUBCATEGORIES.map((subcategory) => (
                            <MenuItem
                                key={subcategory}
                                value={subcategory}
                                sx={{
                                    pl: 5,
                                    backgroundColor: isSelected(subcategory)
                                        ? 'rgba(76, 175, 80, 0.08)'
                                        : 'transparent',
                                    '&:hover': {
                                        backgroundColor: isSelected(subcategory)
                                            ? 'rgba(76, 175, 80, 0.12)'
                                            : 'rgba(0, 0, 0, 0.04)',
                                    },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    {renderSelectionIcon(subcategory)}
                                    <Typography sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                                        {subcategory}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </>
                )}

                <Divider sx={{ my: 0.5 }} />

                {/* Corporation External */}
                <MenuItem
                    value="CORPORATION_EXTERNAL"
                    onClick={(e) => {
                        e.stopPropagation();
                        setExternalExpanded(!externalExpanded);
                    }}
                    sx={{
                        backgroundColor: externalExpanded ? 'rgba(76, 175, 80, 0.08)' : 'transparent',
                        '&:hover': {
                            backgroundColor: externalExpanded
                                ? 'rgba(76, 175, 80, 0.12)'
                                : 'rgba(0, 0, 0, 0.04)',
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        {renderSelectionIcon('CORPORATION_EXTERNAL')}
                        <Typography
                            sx={{
                                fontSize: { xs: '0.875rem', sm: '0.95rem' },
                                fontWeight: 500,
                                flex: 1,
                            }}
                        >
                            Corporation External
                        </Typography>
                        {externalExpanded ? (
                            <ExpandLessIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        ) : (
                            <ExpandMoreIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                        )}
                    </Box>
                </MenuItem>

                {/* Corporation External Subcategories */}
                {externalExpanded && (
                    <>
                        {CORPORATION_EXTERNAL_SUBCATEGORIES.map((subcategory) => (
                            <MenuItem
                                key={subcategory}
                                value={subcategory}
                                sx={{
                                    pl: 5,
                                    backgroundColor: isSelected(subcategory)
                                        ? 'rgba(76, 175, 80, 0.08)'
                                        : 'transparent',
                                    '&:hover': {
                                        backgroundColor: isSelected(subcategory)
                                            ? 'rgba(76, 175, 80, 0.12)'
                                            : 'rgba(0, 0, 0, 0.04)',
                                    },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                    {renderSelectionIcon(subcategory)}
                                    <Typography sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                                        {subcategory}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </>
                )}
            </Select>
        </FormControl>
    );
};

export default OthersFilterDropdown;

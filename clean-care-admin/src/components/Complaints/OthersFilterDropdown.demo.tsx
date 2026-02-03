import React, { useState } from 'react';
import { Box, Typography, Paper, Divider, Chip } from '@mui/material';
import OthersFilterDropdown from './OthersFilterDropdown';
import type { OthersFilterValue } from './OthersFilterDropdown';

/**
 * Demo component for OthersFilterDropdown
 * 
 * This file demonstrates various use cases and states of the OthersFilterDropdown component.
 * It's useful for:
 * - Visual testing during development
 * - Documentation and examples
 * - Understanding component behavior
 * 
 * To use this demo:
 * 1. Import this component in your development environment
 * 2. Render it in a test page or Storybook
 * 3. Interact with the different examples
 */
const OthersFilterDropdownDemo: React.FC = () => {
    const [basicValue, setBasicValue] = useState<OthersFilterValue>('ALL');
    const [fullWidthValue, setFullWidthValue] = useState<OthersFilterValue>('OTHERS_ALL');
    const [preselectedValue, setPreselectedValue] = useState<OthersFilterValue>('Engineering');

    return (
        <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>
                OthersFilterDropdown Component Demo
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Interactive examples of the OthersFilterDropdown component in various configurations.
            </Typography>

            <Divider sx={{ my: 3 }} />

            {/* Example 1: Basic Usage */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    1. Basic Usage
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Default dropdown with standard width and no pre-selection.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <OthersFilterDropdown
                        value={basicValue}
                        onChange={setBasicValue}
                    />

                    <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Typography variant="body2" color="text.secondary">
                            Selected Value:
                        </Typography>
                        <Chip
                            label={basicValue}
                            color="primary"
                            size="small"
                            sx={{ mt: 1 }}
                        />
                    </Box>
                </Box>
            </Paper>

            {/* Example 2: Full Width */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    2. Full Width
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Dropdown that spans the full width of its container.
                </Typography>

                <OthersFilterDropdown
                    value={fullWidthValue}
                    onChange={setFullWidthValue}
                    fullWidth
                />

                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Selected Value:
                    </Typography>
                    <Chip
                        label={fullWidthValue}
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                    />
                </Box>
            </Paper>

            {/* Example 3: Pre-selected Subcategory */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    3. Pre-selected Subcategory
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Dropdown with a specific subcategory pre-selected (Engineering).
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <OthersFilterDropdown
                        value={preselectedValue}
                        onChange={setPreselectedValue}
                    />

                    <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Typography variant="body2" color="text.secondary">
                            Selected Value:
                        </Typography>
                        <Chip
                            label={preselectedValue}
                            color="primary"
                            size="small"
                            sx={{ mt: 1 }}
                        />
                    </Box>
                </Box>
            </Paper>

            {/* Example 4: Disabled State */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    4. Disabled State
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Dropdown in disabled state (e.g., during loading).
                </Typography>

                <OthersFilterDropdown
                    value="CORPORATION_INTERNAL"
                    onChange={() => { }}
                    disabled
                />
            </Paper>

            {/* Example 5: All Filter Values */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    5. All Available Filter Values
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Quick access to all possible filter values for testing.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Main Options */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Main Options:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                                label="ALL"
                                onClick={() => setBasicValue('ALL')}
                                color={basicValue === 'ALL' ? 'primary' : 'default'}
                                size="small"
                            />
                            <Chip
                                label="OTHERS_ALL"
                                onClick={() => setBasicValue('OTHERS_ALL')}
                                color={basicValue === 'OTHERS_ALL' ? 'primary' : 'default'}
                                size="small"
                            />
                            <Chip
                                label="CORPORATION_INTERNAL"
                                onClick={() => setBasicValue('CORPORATION_INTERNAL')}
                                color={basicValue === 'CORPORATION_INTERNAL' ? 'primary' : 'default'}
                                size="small"
                            />
                            <Chip
                                label="CORPORATION_EXTERNAL"
                                onClick={() => setBasicValue('CORPORATION_EXTERNAL')}
                                color={basicValue === 'CORPORATION_EXTERNAL' ? 'primary' : 'default'}
                                size="small"
                            />
                        </Box>
                    </Box>

                    {/* Corporation Internal Subcategories */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Corporation Internal Subcategories:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {['Engineering', 'Electricity', 'Health', 'Property (Eviction)'].map((sub) => (
                                <Chip
                                    key={sub}
                                    label={sub}
                                    onClick={() => setBasicValue(sub)}
                                    color={basicValue === sub ? 'primary' : 'default'}
                                    size="small"
                                />
                            ))}
                        </Box>
                    </Box>

                    {/* Corporation External Subcategories */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Corporation External Subcategories:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {['WASA', 'Titas', 'DPDC', 'DESCO', 'BTCL', 'Fire Service', 'Others'].map((sub) => (
                                <Chip
                                    key={sub}
                                    label={sub}
                                    onClick={() => setBasicValue(sub)}
                                    color={basicValue === sub ? 'primary' : 'default'}
                                    size="small"
                                />
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* Example 6: Integration Example */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    6. Integration with Other Filters
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Example showing how OthersFilterDropdown works alongside other filters.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ minWidth: 200 }}>
                        <Typography variant="caption" color="text.secondary">
                            Status Filter
                        </Typography>
                        <Chip label="All Status" size="small" sx={{ mt: 0.5 }} />
                    </Box>

                    <Box sx={{ minWidth: 200 }}>
                        <Typography variant="caption" color="text.secondary">
                            Category Filter
                        </Typography>
                        <Chip label="All Categories" size="small" sx={{ mt: 0.5 }} />
                    </Box>

                    <Box sx={{ minWidth: 200 }}>
                        <Typography variant="caption" color="text.secondary">
                            Others Filter
                        </Typography>
                        <OthersFilterDropdown
                            value={basicValue}
                            onChange={setBasicValue}
                        />
                    </Box>
                </Box>
            </Paper>

            {/* Usage Instructions */}
            <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                    Usage Instructions
                </Typography>
                <Typography variant="body2" component="div">
                    <ol style={{ margin: 0, paddingLeft: 20 }}>
                        <li>Click on any dropdown to open the filter menu</li>
                        <li>Click on "Corporation Internal" or "Corporation External" to expand subcategories</li>
                        <li>Select any option to see the value update</li>
                        <li>Check icons (✓) indicate the currently selected filter</li>
                        <li>Use the chips in Example 5 for quick value switching</li>
                    </ol>
                </Typography>
            </Paper>
        </Box>
    );
};

export default OthersFilterDropdownDemo;



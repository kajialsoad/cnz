
import React, { useEffect, useState } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { zoneService } from '../../services/zoneService';

interface Zone {
    id: number;
    zoneNumber?: number;
    name?: string;
}

interface ZoneFilterProps {
    value: number | '';
    onChange: (value: number | '') => void;
    cityCorporationCode?: string;
    label?: string;
    disabled?: boolean;
    showAllOption?: boolean;
    zones?: Zone[]; // Optional pre-loaded zones
    hideLabel?: boolean; // Hide the InputLabel
}

const ZoneFilter: React.FC<ZoneFilterProps> = ({
    value,
    onChange,
    cityCorporationCode,
    label = "Filter by Zone",
    disabled,
    showAllOption = true,
    zones: providedZones,
    hideLabel = false
}) => {
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (providedZones) {
            setZones(providedZones);
            return;
        }

        const fetchZones = async () => {
            // Don't fetch if cityCorporationCode is not provided or is empty
            if (!cityCorporationCode || cityCorporationCode === '') {
                setZones([]);
                return;
            }

            try {
                setLoading(true);
                const response = await zoneService.getZones({
                    cityCorporationCode: cityCorporationCode,
                    status: 'ACTIVE'
                });
                if (response.zones) {
                    setZones(response.zones);
                }
            } catch (error) {
                console.error('Failed to fetch zones for filter:', error);
                setZones([]);
            } finally {
                setLoading(false);
            }
        };

        fetchZones();
    }, [cityCorporationCode, providedZones]);

    const handleChange = (event: SelectChangeEvent<number | string>) => {
        const val = event.target.value;
        onChange(val === '' ? '' : Number(val));
    };

    return (
        <FormControl fullWidth variant="outlined" size="small" disabled={disabled || loading}>
            {!hideLabel && <InputLabel>{label}</InputLabel>}
            <Select
                value={value}
                onChange={handleChange}
                label={hideLabel ? undefined : label}
                displayEmpty
                endAdornment={loading ? <CircularProgress size={20} sx={{ mr: 2 }} /> : null}
                sx={{
                    backgroundColor: 'white',
                    height: { xs: 40, sm: 44 },
                    '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: { xs: '0.875rem', sm: '0.95rem' },
                    },
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
                {showAllOption && (
                    <MenuItem value="">
                        সকল জোন
                    </MenuItem>
                )}
                {zones.map((zone) => (
                    <MenuItem key={zone.id} value={zone.id}>
                        {typeof zone.name === 'object' ? JSON.stringify(zone.name) : (zone.name || `Zone ${String(zone.zoneNumber || zone.id)}`)}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default ZoneFilter;

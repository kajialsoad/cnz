import React, { useEffect, useState } from 'react';
import {
    Autocomplete,
    TextField,
    CircularProgress,
    Box,
    Typography,
    Chip
} from '@mui/material';
import { zoneService } from '../../services/zoneService';

interface Zone {
    id: number;
    name?: string; // name is optional in service type
    cityCorporation?: {
        code: string;
    };
}

interface MultiZoneSelectorProps {
    value: number[];
    onChange: (value: number[]) => void;
    cityCorporationCode?: string;
    label?: string;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    isAdmin?: boolean; // If true, might limit options based on admin permissions
}

const MultiZoneSelector: React.FC<MultiZoneSelectorProps> = ({
    value,
    onChange,
    cityCorporationCode,
    label = "Assigned Zones",
    error,
    helperText,
    disabled
}) => {
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const fetchZones = async () => {
            try {
                setLoading(true);
                // @ts-ignore - limit param might not be in the interface but often supported or ignored
                const response = await zoneService.getZones({
                    cityCorporationCode: cityCorporationCode,
                    status: 'ACTIVE'
                });
                if (response.zones) {
                    setZones(response.zones);
                }
            } catch (error) {
                console.error('Failed to fetch zones:', error);
            } finally {
                setLoading(false);
            }
        };

        if (cityCorporationCode) {
            fetchZones();
        } else {
            setZones([]);
        }
    }, [cityCorporationCode]);

    const selectedZones = zones.filter(zone => value.includes(zone.id));

    return (
        <Autocomplete
            multiple
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            options={zones}
            getOptionLabel={(option) => option.name || `Zone ${option.id}`}
            value={selectedZones}
            onChange={(_, newValue) => {
                const ids = newValue.map(v => v.id);
                onChange(ids);
            }}
            isOptionEqualToValue={(option, val) => option.id === val.id}
            loading={loading}
            disabled={disabled}
            renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                    <Chip
                        label={option.name || `Zone ${option.id}`}
                        {...getTagProps({ index })}
                        size="small"
                        key={option.id}
                    />
                ))
            }
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    error={error}
                    helperText={helperText}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <React.Fragment>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </React.Fragment>
                        ),
                    }}
                />
            )}
            noOptionsText="No zones found"
        />
    );
};

export default MultiZoneSelector;



import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MultiZoneSelector from '../MultiZoneSelector';
import { zoneService } from '../../../services/zoneService';

// Mock zoneService
vi.mock('../../../services/zoneService', () => ({
    zoneService: {
        getZones: vi.fn(),
    },
}));

describe('MultiZoneSelector', () => {
    const mockOnChange = vi.fn();
    const mockZones = [
        { id: 1, name: 'Zone 1', cityCorporation: { code: 'CC1' } },
        { id: 2, name: 'Zone 2', cityCorporation: { code: 'CC1' } },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with label', () => {
        render(
            <MultiZoneSelector
                value={[]}
                onChange={mockOnChange}
                label="Test Label"
            />
        );
        expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });

    it('fetches and displays zones when cityCorporationCode is provided', async () => {
        (zoneService.getZones as any).mockResolvedValue({ zones: mockZones });

        render(
            <MultiZoneSelector
                value={[]}
                onChange={mockOnChange}
                cityCorporationCode="CC1"
            />
        );

        // Open autocomplete
        const input = screen.getByRole('combobox');
        fireEvent.mouseDown(input);

        await waitFor(() => {
            expect(zoneService.getZones).toHaveBeenCalledWith({
                cityCorporationCode: 'CC1',
                status: 'ACTIVE'
            });
        });

        await waitFor(() => {
            expect(screen.getByText('Zone 1')).toBeInTheDocument();
            expect(screen.getByText('Zone 2')).toBeInTheDocument();
        });
    });

    it('does not fetch zones if cityCorporationCode is missing', () => {
        render(
            <MultiZoneSelector
                value={[]}
                onChange={mockOnChange}
            />
        );
        expect(zoneService.getZones).not.toHaveBeenCalled();
    });

    it('calls onChange when a zone is selected', async () => {
        (zoneService.getZones as any).mockResolvedValue({ zones: mockZones });

        render(
            <MultiZoneSelector
                value={[]}
                onChange={mockOnChange}
                cityCorporationCode="CC1"
            />
        );

        const input = screen.getByRole('combobox');
        fireEvent.mouseDown(input);

        await waitFor(() => {
            expect(screen.getByText('Zone 1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Zone 1'));

        expect(mockOnChange).toHaveBeenCalledWith([1]);
    });

    it('displays selected values as chips', async () => {
        (zoneService.getZones as any).mockResolvedValue({ zones: mockZones });

        render(
            <MultiZoneSelector
                value={[1]}
                onChange={mockOnChange}
                cityCorporationCode="CC1"
            />
        );

        await waitFor(() => {
            // Check for the chip
            expect(screen.getByText('Zone 1')).toBeInTheDocument();
        });
    });
});

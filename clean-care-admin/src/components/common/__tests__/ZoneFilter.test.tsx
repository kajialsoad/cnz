import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ZoneFilter from '../ZoneFilter';
import { zoneService } from '../../../services/zoneService';

// Mock zoneService
vi.mock('../../../services/zoneService', () => ({
    zoneService: {
        getZones: vi.fn(),
    },
}));

describe('ZoneFilter', () => {
    const mockOnChange = vi.fn();
    const mockZones = [
        { id: 1, name: 'Zone 1' },
        { id: 2, name: 'Zone 2' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders with label', () => {
        render(
            <ZoneFilter
                value=""
                onChange={mockOnChange}
                label="Filter by Zone"
            />
        );
        // Using getByText effectively checks if the label is rendered
        expect(screen.getByText('Filter by Zone')).toBeInTheDocument();
    });

    it('displays All Zones option by default', async () => {
        const user = userEvent.setup();
        render(
            <ZoneFilter
                value=""
                onChange={mockOnChange}
            />
        );

        const select = screen.getByRole('combobox');
        await user.click(select);

        expect(await screen.findByRole('option', { name: 'All Zones' })).toBeInTheDocument();
    });

    it('fetches and displays zones when cityCorporationCode is provided', async () => {
        const user = userEvent.setup();
        (zoneService.getZones as any).mockResolvedValue({ zones: mockZones });

        render(
            <ZoneFilter
                value=""
                onChange={mockOnChange}
                cityCorporationCode="CC1"
            />
        );

        const select = screen.getByRole('combobox');
        await user.click(select);

        await waitFor(() => {
            expect(zoneService.getZones).toHaveBeenCalledWith({
                cityCorporationCode: 'CC1',
                status: 'ACTIVE'
            });
        });

        expect(await screen.findByRole('option', { name: 'Zone 1' })).toBeInTheDocument();
        expect(await screen.findByRole('option', { name: 'Zone 2' })).toBeInTheDocument();
    });

    it('calls onChange when a zone is selected', async () => {
        const user = userEvent.setup();
        (zoneService.getZones as any).mockResolvedValue({ zones: mockZones });

        render(
            <ZoneFilter
                value=""
                onChange={mockOnChange}
                cityCorporationCode="CC1"
            />
        );

        const select = screen.getByRole('combobox');
        await user.click(select);

        const option = await screen.findByRole('option', { name: 'Zone 1' });
        await user.click(option);

        expect(mockOnChange).toHaveBeenCalledWith(1);
    });

    it('uses provided zones if available', async () => {
        const user = userEvent.setup();
        const providedZones = [{ id: 99, name: 'Provided Zone' }];
        render(
            <ZoneFilter
                value=""
                onChange={mockOnChange}
                zones={providedZones}
            />
        );

        const select = screen.getByRole('combobox');
        await user.click(select);

        expect(zoneService.getZones).not.toHaveBeenCalled();
        expect(await screen.findByRole('option', { name: 'Provided Zone' })).toBeInTheDocument();
    });
});

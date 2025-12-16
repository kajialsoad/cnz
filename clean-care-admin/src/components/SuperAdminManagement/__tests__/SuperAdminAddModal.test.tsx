import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SuperAdminAddModal from '../SuperAdminAddModal';
import { superAdminService } from '../../../services/superAdminService';
import { cityCorporationService } from '../../../services/cityCorporationService';
import { zoneService } from '../../../services/zoneService';

// Mock Services
vi.mock('../../../services/superAdminService', () => ({
    superAdminService: {
        createSuperAdmin: vi.fn(),
        assignZones: vi.fn(),
    },
}));

vi.mock('../../../services/cityCorporationService', () => ({
    cityCorporationService: {
        getCityCorporations: vi.fn(),
    },
}));

vi.mock('../../../services/zoneService', () => ({
    zoneService: {
        getZones: vi.fn(),
    },
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('SuperAdminAddModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (cityCorporationService.getCityCorporations as any).mockResolvedValue({
            cityCorporations: [{ code: 'CC1', name: 'Dhaka South' }],
        });
        (zoneService.getZones as any).mockResolvedValue({
            zones: [
                { id: 1, name: 'Zone 1' },
                { id: 2, name: 'Zone 2' },
            ],
        });
    });

    it('renders and allows step navigation', async () => {
        render(
            <SuperAdminAddModal
                open={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        // Step 0: Profile
        expect(screen.getByLabelText(/নাম \*/)).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText(/নাম \*/), { target: { value: 'Test' } });
        fireEvent.change(screen.getByLabelText(/পদবী \*/), { target: { value: 'User' } });
        fireEvent.change(screen.getByLabelText(/ফোন নাম্বার \*/), { target: { value: '01712345678' } });
        fireEvent.change(screen.getByLabelText(/পাসওয়ার্ড \*/), { target: { value: 'password123' } });

        fireEvent.click(screen.getByText('পরবর্তী'));

        // Step 1: Access Control
        await waitFor(() => {
            expect(screen.getByLabelText(/সিটি কর্পোরেশন \*/)).toBeInTheDocument();
        });

        // Select City Corporation
        fireEvent.mouseDown(screen.getByLabelText(/সিটি কর্পোরেশন \*/));
        fireEvent.click(screen.getByText('Dhaka South'));

        // Wait for zones to load and MultiZoneSelector to be enabled
        await waitFor(() => {
            expect(zoneService.getZones).toHaveBeenCalled();
        });

        fireEvent.click(screen.getByText('পরবর্তী'));

        // Wait for validation error on Step 1 (Zone required)
        expect(screen.getByText('কমপক্ষে একটি জোন নির্বাচন করুন')).toBeInTheDocument();
    });

    it('submits form successfully', async () => {
        (superAdminService.createSuperAdmin as any).mockResolvedValue({ id: 100 });

        render(
            <SuperAdminAddModal
                open={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        // Fill Step 0
        fireEvent.change(screen.getByLabelText(/নাম \*/), { target: { value: 'Test' } });
        fireEvent.change(screen.getByLabelText(/পদবী \*/), { target: { value: 'User' } });
        fireEvent.change(screen.getByLabelText(/ফোন নাম্বার \*/), { target: { value: '01712345678' } });
        fireEvent.change(screen.getByLabelText(/পাসওয়ার্ড \*/), { target: { value: 'password123' } });
        fireEvent.click(screen.getByText('পরবর্তী'));

        // Fill Step 1
        await waitFor(() => screen.getByLabelText(/সিটি কর্পোরেশন \*/));
        fireEvent.mouseDown(screen.getByLabelText(/সিটি কর্পোরেশন \*/));
        fireEvent.click(screen.getByText('Dhaka South'));

        // Select Zones (interacting with Autocomplete is tricky, assuming mocked MultiZoneSelector mostly works)
        // We'll mock the MultiZoneSelector if needed, but integration test style is better.
        // Let's try to find the input in MultiZoneSelector
        const zoneInput = screen.getByLabelText(/জোন \(একাধিক নির্বাচন করা যাবে\) \*/);
        fireEvent.mouseDown(zoneInput);
        await waitFor(() => screen.getByText('Zone 1'));
        fireEvent.click(screen.getByText('Zone 1'));

        fireEvent.click(screen.getByText('পরবর্তী'));

        // Step 2: Permissions
        await waitFor(() => screen.getByText('পারমিশন সেটিংস'));

        // Submit
        fireEvent.click(screen.getByText('সংরক্ষণ করুন'));

        await waitFor(() => {
            expect(superAdminService.createSuperAdmin).toHaveBeenCalled();
            expect(superAdminService.assignZones).toHaveBeenCalledWith(100, [1]);
            expect(mockOnSuccess).toHaveBeenCalled();
        });
    });
});

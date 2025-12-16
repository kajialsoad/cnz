import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SuperAdminEditModal from '../SuperAdminEditModal';
import { superAdminService } from '../../../services/superAdminService';
import { cityCorporationService } from '../../../services/cityCorporationService';
import { zoneService } from '../../../services/zoneService';
import { UserStatus } from '../../../types/userManagement.types';

// Mock Services
vi.mock('../../../services/superAdminService', () => ({
    superAdminService: {
        updateSuperAdmin: vi.fn(),
        updateZones: vi.fn(),
        getAssignedZones: vi.fn(),
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

vi.mock('react-hot-toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('SuperAdminEditModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSuccess = vi.fn();

    const mockSuperAdmin = {
        id: 1,
        firstName: 'Super',
        lastName: 'Admin',
        phone: '01712345678',
        email: 'super@admin.com',
        role: 'SUPER_ADMIN',
        cityCorporationCode: 'CC1',
        status: UserStatus.ACTIVE,
        permissions: { features: {} }
    };

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
        (superAdminService.getAssignedZones as any).mockResolvedValue([
            { zoneId: 1, zone: { id: 1, name: 'Zone 1' } }
        ]);
    });

    it('loads super admin data and assigned zones', async () => {
        render(
            <SuperAdminEditModal
                open={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                superAdmin={mockSuperAdmin as any}
            />
        );

        // Check profile data
        expect(screen.getByDisplayValue('Super')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Admin')).toBeInTheDocument();

        fireEvent.click(screen.getByText('পরবর্তী'));

        // Check Access Control step
        await waitFor(() => {
            expect(screen.getByText('Dhaka South')).toBeInTheDocument();
        });

        // Check zones loaded (mocked return of getAssignedZones was [Zone 1])
        // Since MultiZoneSelector uses Autocomplete with chips, we look for the chip
        await waitFor(() => {
            expect(superAdminService.getAssignedZones).toHaveBeenCalledWith(1);
            expect(screen.getByText('Zone 1')).toBeInTheDocument();
        });
    });

    it('updates super admin and zones successfully', async () => {
        render(
            <SuperAdminEditModal
                open={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                superAdmin={mockSuperAdmin as any}
            />
        );

        fireEvent.click(screen.getByText('পরবর্তী'));

        // Wait for step 1
        await waitFor(() => screen.getByLabelText(/সিটি কর্পোরেশন \*/));

        // Add Zone 2
        const zoneInput = screen.getByLabelText(/জোন \(একাধিক নির্বাচন করা যাবে\) \*/);
        fireEvent.mouseDown(zoneInput);
        await waitFor(() => screen.getByText('Zone 2'));
        fireEvent.click(screen.getByText('Zone 2'));

        fireEvent.click(screen.getByText('পরবর্তী'));

        // Wait for step 2
        await waitFor(() => screen.getByText('পারমিশন সেটিংস'));

        // Submit
        fireEvent.click(screen.getByText('আপডেট করুন'));

        await waitFor(() => {
            expect(superAdminService.updateSuperAdmin).toHaveBeenCalled();
            // Expect both Zone 1 (existing) and Zone 2 (added)
            expect(superAdminService.updateZones).toHaveBeenCalledWith(1, [1, 2]);
            expect(mockOnSuccess).toHaveBeenCalled();
        });
    });
});

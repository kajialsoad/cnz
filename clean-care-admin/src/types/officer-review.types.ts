export interface OfficerReview {
    id: number;
    name: string;
    nameBn: string;
    designation: string;
    designationBn: string;
    imageUrl: string | null;
    displayOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    messages: OfficerReviewMessage[];
}

export interface OfficerReviewMessage {
    id: number;
    officerReviewId: number;
    content: string;
    contentBn: string;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateOfficerReviewDto {
    name: string;
    nameBn: string;
    designation: string;
    designationBn: string;
    imageUrl?: string | null;
    displayOrder?: number;
    isActive?: boolean;
    messages: {
        content: string;
        contentBn: string;
        displayOrder: number;
    }[];
}

export interface UpdateOfficerReviewDto {
    name?: string;
    nameBn?: string;
    designation?: string;
    designationBn?: string;
    imageUrl?: string | null;
    displayOrder?: number;
    isActive?: boolean;
    messages?: {
        id?: number;
        content: string;
        contentBn: string;
        displayOrder: number;
    }[];
}

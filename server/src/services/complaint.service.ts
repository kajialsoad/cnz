import prisma from '../utils/prisma';
import { ComplaintStatus } from '@prisma/client';
import { uploadService } from './upload.service';
import { getFileUrl } from '../config/upload.config';
import { categoryService } from './category.service';

export interface CreateComplaintInput {
  title?: string; // Optional - will be auto-generated from description
  description: string;
  category: string; // Required
  subcategory: string; // Required
  priority?: number;
  location: {
    address: string;
    district: string;
    thana: string;
    ward: string;
    latitude?: number;
    longitude?: number;
  } | string; // Accept string or object
  imageUrls?: string[];
  voiceNoteUrl?: string;
  userId?: number | null; // Nullable for "someone else" complaints
  forSomeoneElse?: boolean; // Flag to indicate if complaint is for someone else
  uploadedFiles?: any; // Files from multer
}

export interface UpdateComplaintInput {
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  priority?: number;
  status?: ComplaintStatus;
  location?: {
    address?: string;
    district?: string;
    thana?: string;
    ward?: string;
    latitude?: number;
    longitude?: number;
  };
  imageUrls?: string[];
  voiceNoteUrl?: string;
  // New file properties
  uploadedFiles?: any; // Files from multer
  replaceFiles?: boolean; // If true, replace existing files instead of appending
}

export interface ComplaintQueryInput {
  page?: number;
  limit?: number;
  status?: ComplaintStatus;
  category?: string;
  subcategory?: string;
  priority?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
  userId?: number; // For filtering user's own complaints
}

export class ComplaintService {
  // Create a new complaint
  async createComplaint(input: CreateComplaintInput) {
    try {
      // Validate category and subcategory combination
      if (!categoryService.validateCategorySubcategory(input.category, input.subcategory)) {
        const validSubcategories = categoryService.getAllSubcategoryIds(input.category);
        throw new Error(
          `Invalid category and subcategory combination. Category '${input.category}' does not have subcategory '${input.subcategory}'. Valid subcategories: ${validSubcategories.join(', ')}`
        );
      }

      // Generate tracking number
      const trackingNumber = await this.generateTrackingNumber();

      let finalImageUrls: string[] = [];
      let finalAudioUrls: string[] = [];

      // Process uploaded files if provided
      if (input.uploadedFiles) {
        const files = input.uploadedFiles as any;

        // With .any(), files come as an array, need to separate by fieldname
        if (Array.isArray(files)) {
          const imageFiles = files.filter((f: any) => f.fieldname === 'images');
          const audioFiles = files.filter((f: any) => f.fieldname === 'audioFiles');

          if (imageFiles.length > 0) {
            finalImageUrls = imageFiles.map((file: any) => getFileUrl(file.filename, 'image'));
          }

          if (audioFiles.length > 0) {
            finalAudioUrls = audioFiles.map((file: any) => getFileUrl(file.filename, 'voice'));
          }
        } else {
          // Fallback for .fields() format (if we ever switch back)
          if (files.images) {
            const imageFiles = Array.isArray(files.images) ? files.images : [files.images];
            finalImageUrls = imageFiles.map((file: any) => getFileUrl(file.filename, 'image'));
          }

          if (files.audioFiles) {
            const audioFilesArray = Array.isArray(files.audioFiles) ? files.audioFiles : [files.audioFiles];
            finalAudioUrls = audioFilesArray.map((file: any) => getFileUrl(file.filename, 'voice'));
          }
        }
      }

      // Add URLs from direct input
      if (input.imageUrls && input.imageUrls.length > 0) {
        finalImageUrls = [...finalImageUrls, ...input.imageUrls];
      }

      if (input.voiceNoteUrl) {
        finalAudioUrls.push(input.voiceNoteUrl);
      }

      // Auto-generate title from description if not provided
      const title = input.title || this.generateTitleFromDescription(input.description);

      // Handle location formatting
      let locationString: string;
      if (typeof input.location === 'string') {
        locationString = input.location;
      } else {
        locationString = `${input.location.address}, ${input.location.district}, ${input.location.thana}, Ward: ${input.location.ward}`;
      }

      // Create complaint
      const complaint = await prisma.complaint.create({
        data: {
          title: title,
          description: input.description,
          category: input.category,
          subcategory: input.subcategory,
          priority: input.priority || 1, // Default priority is 1
          status: ComplaintStatus.PENDING,
          imageUrl: finalImageUrls.length > 0 ? JSON.stringify(finalImageUrls) : null,
          audioUrl: finalAudioUrls.length > 0 ? JSON.stringify(finalAudioUrls) : null,
          userId: input.forSomeoneElse ? undefined : (input.userId ?? undefined),
          location: locationString
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            }
          }
        }
      });

      return this.formatComplaintResponse(complaint);
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw new Error(`Failed to create complaint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to generate title from description
  private generateTitleFromDescription(description: string): string {
    // Take first 50 characters of description as title
    const maxLength = 50;
    if (description.length <= maxLength) {
      return description;
    }
    // Find last space within maxLength to avoid cutting words
    const trimmed = description.substring(0, maxLength);
    const lastSpace = trimmed.lastIndexOf(' ');
    return lastSpace > 0 ? trimmed.substring(0, lastSpace) + '...' : trimmed + '...';
  }

  // Get complaint by ID
  async getComplaintById(id: number, userId?: number) {
    try {
      const complaint = await prisma.complaint.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            }
          }
        }
      });

      if (!complaint) {
        throw new Error('Complaint not found');
      }

      // Check if user can access this complaint (users can only view their own complaints)
      if (userId && complaint.userId !== userId) {
        throw new Error('Unauthorized to view this complaint');
      }

      return this.formatComplaintResponse(complaint);
    } catch (error) {
      console.error('Error getting complaint:', error);
      throw error;
    }
  }

  // Update complaint
  async updateComplaint(id: number, input: UpdateComplaintInput, userId?: number) {
    try {
      // Check if complaint exists and user has permission
      const existingComplaint = await this.getComplaintById(id, userId);

      let finalImageUrls: string[] = [];
      let finalVoiceUrl: string | undefined;

      // Process uploaded files if provided
      if (input.uploadedFiles) {
        const uploadedFiles = await uploadService.processUploadedFiles(input.uploadedFiles);

        // Get image URLs
        if (uploadedFiles.images && uploadedFiles.images.length > 0) {
          finalImageUrls = uploadedFiles.images.map(img => img.url);
        }

        // Get voice URL
        if (uploadedFiles.voice) {
          finalVoiceUrl = uploadedFiles.voice.url;
        }
      }

      // Add URLs from direct input
      if (input.imageUrls && input.imageUrls.length > 0) {
        if (input.replaceFiles) {
          finalImageUrls = [...input.imageUrls];
        } else {
          finalImageUrls = [...finalImageUrls, ...input.imageUrls];
        }
      }

      if (input.voiceNoteUrl && !finalVoiceUrl) {
        finalVoiceUrl = input.voiceNoteUrl;
      }

      // Validate category/subcategory if both are being updated
      if (input.category !== undefined && input.subcategory !== undefined) {
        if (!categoryService.validateCategorySubcategory(input.category, input.subcategory)) {
          const validSubcategories = categoryService.getAllSubcategoryIds(input.category);
          throw new Error(
            `Invalid category and subcategory combination. Category '${input.category}' does not have subcategory '${input.subcategory}'. Valid subcategories: ${validSubcategories.join(', ')}`
          );
        }
      }

      // Prepare update data
      const updateData: any = {};

      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.subcategory !== undefined) updateData.subcategory = input.subcategory;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.status !== undefined) updateData.status = input.status;

      // Handle file URLs - combine existing with new if not replacing
      if (finalImageUrls.length > 0 || finalVoiceUrl || input.replaceFiles) {
        let currentImageUrls: string[] = [];
        let currentVoiceUrl: string | undefined;

        // Parse existing files if not replacing
        if (!input.replaceFiles && existingComplaint.imageUrl) {
          const parsed = this.parseFileUrls(existingComplaint.imageUrl);
          currentImageUrls = parsed.imageUrls;
          currentVoiceUrl = parsed.voiceUrl;
        }

        // Merge URLs
        const allImageUrls = input.replaceFiles
          ? finalImageUrls
          : [...currentImageUrls, ...finalImageUrls];

        const voiceUrl = finalVoiceUrl || currentVoiceUrl;

        // Format for storage
        updateData.imageUrl = this.formatFileUrlsForStorage(allImageUrls, voiceUrl);
      }

      // Update complaint
      const complaint = await prisma.complaint.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            }
          }
        }
      });

      // Update location string if provided
      if (input.location) {
        const locationString = `${input.location.address || ''}, ${input.location.district || ''}, ${input.location.thana || ''}, Ward: ${input.location.ward || ''}`;
        await prisma.complaint.update({
          where: { id },
          data: { location: locationString }
        });
      }

      // Convert stored data back to structured format for response
      const responseComplaint = this.formatComplaintResponse(complaint);

      return responseComplaint;
    } catch (error) {
      console.error('Error updating complaint:', error);

      // Clean up uploaded files on error
      if (input.uploadedFiles) {
        await uploadService.cleanupFiles(input.uploadedFiles);
      }

      throw error;
    }
  }

  // Delete/Cancel complaint
  async deleteComplaint(id: number, userId?: number) {
    try {
      // Check if complaint exists and user has permission
      await this.getComplaintById(id, userId);

      // Instead of hard delete, update status to rejected
      const complaint = await prisma.complaint.update({
        where: { id },
        data: {
          status: ComplaintStatus.REJECTED
        }
      });

      return {
        success: true,
        message: 'Complaint cancelled successfully',
        complaint
      };
    } catch (error) {
      console.error('Error cancelling complaint:', error);
      throw error;
    }
  }

  // Get complaint statistics (for dashboard)
  async getComplaintStats(userId?: number) {
    try {
      const where = userId ? { userId } : {};

      const [
        total,
        pending,
        inProgress,
        resolved,
        rejected
      ] = await Promise.all([
        prisma.complaint.count({ where }),
        prisma.complaint.count({ where: { ...where, status: ComplaintStatus.PENDING } }),
        prisma.complaint.count({ where: { ...where, status: ComplaintStatus.IN_PROGRESS } }),
        prisma.complaint.count({ where: { ...where, status: ComplaintStatus.RESOLVED } }),
        prisma.complaint.count({ where: { ...where, status: ComplaintStatus.REJECTED } })
      ]);

      return {
        total,
        pending,
        inProgress,
        resolved,
        rejected,
        activeComplaints: total - rejected,
      };
    } catch (error) {
      console.error('Error getting complaint stats:', error);
      throw new Error('Failed to fetch complaint statistics');
    }
  }

  // Generate unique tracking number
  private async generateTrackingNumber(): Promise<string> {
    const prefix = 'CC';
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp.slice(-6)}${random}`;
  }

  // Get complaints by status for user
  async getComplaintsByStatus(userId: number, status: ComplaintStatus) {
    try {
      const complaints = await prisma.complaint.findMany({
        where: {
          userId,
          status
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return complaints.map(complaint => this.formatComplaintResponse(complaint));
    } catch (error) {
      console.error('Error getting complaints by status:', error);
      throw new Error('Failed to fetch complaints by status');
    }
  }

  // Search complaints
  async searchComplaints(searchTerm: string, userId?: number) {
    try {
      const where: any = {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { trackingNumber: { contains: searchTerm, mode: 'insensitive' } },
        ]
      };

      if (userId) {
        where.userId = userId;
      }

      const complaints = await prisma.complaint.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return complaints.map(complaint => this.formatComplaintResponse(complaint));
    } catch (error) {
      console.error('Error searching complaints:', error);
      throw new Error('Failed to search complaints');
    }
  }

  // Helper method to parse file URLs from stored string
  private parseFileUrls(imageUrlString: string): { imageUrls: string[]; voiceUrl?: string } {
    const imageUrls: string[] = [];
    let voiceUrl: string | undefined;

    if (!imageUrlString) {
      return { imageUrls };
    }

    // Try to parse as JSON first (new format)
    try {
      const parsed = JSON.parse(imageUrlString);
      if (Array.isArray(parsed)) {
        return { imageUrls: parsed };
      }
    } catch (error) {
      // Not JSON, fall back to comma-separated parsing (old format)
    }

    // Parse comma-separated format (legacy)
    const parts = imageUrlString.split(',').map(part => part.trim()).filter(part => part);

    parts.forEach(part => {
      if (part.startsWith('voice:')) {
        voiceUrl = part.substring(6); // Remove 'voice:' prefix
      } else {
        imageUrls.push(part);
      }
    });

    return { imageUrls, voiceUrl };
  }

  // Helper method to format file URLs for storage
  private formatFileUrlsForStorage(imageUrls: string[], voiceUrl?: string): string {
    const parts: string[] = [];

    // Add image URLs
    imageUrls.forEach(url => {
      if (url && url.trim()) {
        parts.push(url.trim());
      }
    });

    // Add voice URL with prefix
    if (voiceUrl && voiceUrl.trim()) {
      parts.push(`voice:${voiceUrl.trim()}`);
    }

    return parts.join(',');
  }

  // Helper method to format complaint response with structured file URLs
  private formatComplaintResponse(complaint: any) {
    const parsedImages = this.parseFileUrls(complaint.imageUrl || '');
    const parsedAudio = this.parseFileUrls(complaint.audioUrl || '');

    return {
      ...complaint,
      imageUrls: parsedImages.imageUrls,
      audioUrls: parsedAudio.imageUrls, // audioUrls are stored in imageUrls field of parsed result
      voiceNoteUrl: parsedAudio.imageUrls[0], // First audio URL for backward compatibility
      // Keep original fields for backward compatibility
      imageUrl: complaint.imageUrl,
      audioUrl: complaint.audioUrl
    };
  }

  // Update getComplaints to return formatted responses
  async getComplaints(query: ComplaintQueryInput = {}) {
    try {
      const result = await this.getComplaintsRaw(query);

      return {
        ...result,
        data: result.data.map(complaint => this.formatComplaintResponse(complaint))
      };
    } catch (error) {
      throw error;
    }
  }

  // Raw method for internal use
  private async getComplaintsRaw(query: ComplaintQueryInput = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      subcategory,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;
    if (priority) where.priority = priority;
    if (userId) where.userId = userId;

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            }
          }
        }
      }),
      prisma.complaint.count({ where })
    ]);

    return {
      data: complaints,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      }
    };
  }
}

export const complaintService = new ComplaintService();
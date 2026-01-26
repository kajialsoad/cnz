import prisma from '../utils/prisma';
import { Complaint_status } from '@prisma/client';
import { uploadService } from './upload.service';
import { getFileUrl } from '../config/upload.config';
import { categoryService } from './category.service';
import { cloudUploadService, CloudUploadError } from './cloud-upload.service';
import { isCloudinaryEnabled } from '../config/cloudinary.config';
import notificationService from './notification.service';
import { systemConfigService } from './system-config.service';

// Custom error for ward image limit
export class WardImageLimitError extends Error {
  public readonly code = 'WARD_IMAGE_LIMIT_EXCEEDED';
  public readonly statusCode = 400;
  public readonly details: {
    wardId: number;
    currentCount: number;
    maxAllowed: number;
  };

  constructor(wardId: number, currentCount: number, maxAllowed: number = 1) {
    super(`Image upload limit reached for this ward. Only ${maxAllowed} image(s) allowed per ward.`);
    this.name = 'WardImageLimitError';
    this.details = {
      wardId,
      currentCount,
      maxAllowed
    };
  }
}

export interface CreateComplaintInput {
  title?: string;
  description: string;
  category: string;
  subcategory: string;
  priority?: number;
  location: {
    address: string;
    district: string;
    thana: string;
    ward: string;
    latitude?: number;
    longitude?: number;
  } | string;
  imageUrls?: string[];
  voiceNoteUrl?: string;
  userId?: number | null;
  forSomeoneElse?: boolean;
  uploadedFiles?: any;
  cityCorporationCode?: string;
  zoneId?: number;
  wardId?: number;
}

export interface UpdateComplaintInput {
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  priority?: number;
  status?: Complaint_status;
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
  uploadedFiles?: any;
  replaceFiles?: boolean;
}

export interface ComplaintQueryInput {
  page?: number;
  limit?: number;
  status?: Complaint_status;
  category?: string;
  subcategory?: string;
  priority?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
  userId?: number;
  cityCorporationCode?: string;
  zoneId?: number;
  wardId?: number;
}

export class ComplaintService {
  // Create a new complaint
  async createComplaint(input: CreateComplaintInput) {
    try {
      console.log('🚀 Starting complaint creation...');
      const startTime = Date.now();

      // Parallel execution of independent operations
      const [dailyLimitCheck, userDataFetch] = await Promise.all([
        // Check daily complaint limit
        (async () => {
          if (input.userId && !input.forSomeoneElse) {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const [dailyCount, limitStr] = await Promise.all([
              prisma.complaint.count({
                where: {
                  userId: input.userId,
                  createdAt: { gte: startOfToday }
                }
              }),
              systemConfigService.get('daily_complaint_limit', '20')
            ]);

            const limit = parseInt(limitStr, 10) || 20;
            if (dailyCount >= limit) {
              throw new Error(`Daily complaint limit reached. You can submit up to ${limit} complaints per day.`);
            }
          }
        })(),

        // Fetch user data if needed
        (async () => {
          if (input.userId && !input.forSomeoneElse) {
            return await prisma.user.findUnique({
              where: { id: input.userId },
              select: {
                id: true,
                wardId: true,
                zoneId: true,
                cityCorporationCode: true,
                wardImageCount: true,
                cityCorporation: true,
                zone: true,
                ward: true
              }
            });
          }
          return null;
        })()
      ]);

      const user = userDataFetch;
      console.log(`⏱️ Initial checks completed in ${Date.now() - startTime}ms`);

      // Validate category and subcategory combination
      if (!categoryService.validateCategorySubcategory(input.category, input.subcategory)) {
        const validSubcategories = categoryService.getAllSubcategoryIds(input.category);
        throw new Error(
          `Invalid category and subcategory combination. Category '${input.category}' does not have subcategory '${input.subcategory}'. Valid subcategories: ${validSubcategories.join(', ')}`
        );
      }

      // Check ward image upload limit before processing files
      if (input.uploadedFiles && user && user.wardId) {
        const files = input.uploadedFiles as any;
        let imageCount = 0;

        // Count image files
        if (Array.isArray(files)) {
          imageCount = files.filter((f: any) => f.fieldname === 'images').length;
        } else if (files.images) {
          imageCount = Array.isArray(files.images) ? files.images.length : 1;
        }

        // Check if user has reached ward image limit
        if (imageCount > 0 && user.wardImageCount >= 10) {
          throw new WardImageLimitError(user.wardId, user.wardImageCount, 10);
        }

        // Check if this upload would exceed the limit
        if (imageCount > 0 && user.wardImageCount + imageCount > 10) {
          throw new WardImageLimitError(user.wardId, user.wardImageCount, 10);
        }
      }

      let finalImageUrls: string[] = [];
      let finalAudioUrls: string[] = [];

      // Process uploaded files if provided (optimized with parallel uploads)
      if (input.uploadedFiles) {
        const fileStartTime = Date.now();
        const files = input.uploadedFiles as any;
        const useCloudinary = isCloudinaryEnabled();

        // With .any(), files come as an array, need to separate by fieldname
        if (Array.isArray(files)) {
          const imageFiles = files.filter((f: any) => f.fieldname === 'images');
          const audioFiles = files.filter((f: any) => f.fieldname === 'audioFiles');

          // Process images and audio in parallel
          const [imageUrls, audioUrls] = await Promise.all([
            // Process images
            (async () => {
              if (imageFiles.length > 0) {
                if (useCloudinary) {
                  try {
                    return await this.uploadImagesToCloudinary(imageFiles);
                  } catch (error) {
                    console.error('Cloudinary upload failed, falling back to local storage:', error);
                    return imageFiles.map((file: any) => getFileUrl(file.filename, 'image'));
                  }
                } else {
                  return imageFiles.map((file: any) => getFileUrl(file.filename, 'image'));
                }
              }
              return [];
            })(),

            // Process audio
            (async () => {
              if (audioFiles.length > 0) {
                if (useCloudinary) {
                  try {
                    return await Promise.all(
                      audioFiles.map((file: any) => this.uploadAudioToCloudinary(file))
                    );
                  } catch (error) {
                    console.error('Cloudinary audio upload failed, falling back to local storage:', error);
                    return audioFiles.map((file: any) => getFileUrl(file.filename, 'voice'));
                  }
                } else {
                  return audioFiles.map((file: any) => getFileUrl(file.filename, 'voice'));
                }
              }
              return [];
            })()
          ]);

          finalImageUrls = imageUrls;
          finalAudioUrls = audioUrls;
        } else {
          // Fallback for .fields() format
          const [imageUrls, audioUrls] = await Promise.all([
            (async () => {
              if (files.images) {
                const imageFiles = Array.isArray(files.images) ? files.images : [files.images];
                if (useCloudinary) {
                  try {
                    return await this.uploadImagesToCloudinary(imageFiles);
                  } catch (error) {
                    console.error('Cloudinary upload failed, falling back to local storage:', error);
                    return imageFiles.map((file: any) => getFileUrl(file.filename, 'image'));
                  }
                } else {
                  return imageFiles.map((file: any) => getFileUrl(file.filename, 'image'));
                }
              }
              return [];
            })(),

            (async () => {
              if (files.audioFiles) {
                const audioFilesArray = Array.isArray(files.audioFiles) ? files.audioFiles : [files.audioFiles];
                if (useCloudinary) {
                  try {
                    return await Promise.all(
                      audioFilesArray.map((file: any) => this.uploadAudioToCloudinary(file))
                    );
                  } catch (error) {
                    console.error('Cloudinary audio upload failed, falling back to local storage:', error);
                    return audioFilesArray.map((file: any) => getFileUrl(file.filename, 'voice'));
                  }
                } else {
                  return audioFilesArray.map((file: any) => getFileUrl(file.filename, 'voice'));
                }
              }
              return [];
            })()
          ]);

          finalImageUrls = imageUrls;
          finalAudioUrls = audioUrls;
        }

        console.log(`⏱️ File processing completed in ${Date.now() - fileStartTime}ms`);
      }

      // Add URLs from direct input
      if (input.imageUrls && input.imageUrls.length > 0) {
        finalImageUrls = [...finalImageUrls, ...input.imageUrls];
      }

      if (input.voiceNoteUrl) {
        finalAudioUrls.push(input.voiceNoteUrl);
      }

      // Determine Location and Assigned Admin (optimized)
      let locationString = (typeof input.location === 'object' && input.location.address) ? input.location.address : String(input.location);
      let assignedAdminId: number | null = null;

      const targetWardId = input.wardId;

      // Parallel fetch of ward details and admin assignment
      if (targetWardId) {
        const locationStartTime = Date.now();
        const [ward, assignedAdmin] = await Promise.all([
          prisma.ward.findUnique({
            where: { id: targetWardId },
            select: {
              wardNumber: true,
              zone: {
                select: {
                  name: true,
                  zoneNumber: true,
                  cityCorporation: {
                    select: { name: true }
                  }
                }
              }
            }
          }),
          prisma.user.findFirst({
            where: {
              wardId: targetWardId,
              role: 'ADMIN',
              status: 'ACTIVE'
            },
            select: { id: true }
          })
        ]);

        if (ward) {
          const parts = [];
          if (typeof input.location === 'object' && input.location.address) parts.push(input.location.address);
          parts.push(`Ward ${ward.wardNumber}`);
          if (ward.zone) parts.push(ward.zone.name || `Zone ${ward.zone.zoneNumber}`);
          if (ward.zone && ward.zone.cityCorporation) parts.push(ward.zone.cityCorporation.name);
          locationString = parts.join(', ');
        }

        if (assignedAdmin) {
          assignedAdminId = assignedAdmin.id;
        }

        console.log(`⏱️ Location processing completed in ${Date.now() - locationStartTime}ms`);
      } else if (typeof input.location === 'object') {
        locationString = `${input.location.address}, ${input.location.district}, ${input.location.thana}, Ward: ${input.location.ward}`;
      }

      console.log('📍 Complaint Location Data:');
      console.log('- User Ward ID:', user?.wardId);
      console.log('- Complaint Ward ID:', input.wardId);
      console.log('- Complaint Zone ID:', input.zoneId);
      console.log('- Complaint City Corp:', input.cityCorporationCode);
      console.log('- Location String:', locationString);

      // Create complaint
      const dbStartTime = Date.now();
      const complaint = await prisma.complaint.create({
        data: {
          title: input.title || this.generateTitleFromDescription(input.description),
          description: input.description,
          category: input.category,
          subcategory: input.subcategory,
          priority: input.priority || 1,
          status: Complaint_status.PENDING,
          imageUrl: finalImageUrls.length > 0 ? JSON.stringify(finalImageUrls) : null,
          audioUrl: finalAudioUrls.length > 0 ? JSON.stringify(finalAudioUrls) : null,
          userId: input.forSomeoneElse ? undefined : (input.userId ?? undefined),
          location: typeof locationString === 'string' ? locationString : 'Unknown Location',
          assignedAdminId: assignedAdminId,

          // User location fields
          cityCorporationCode: user?.cityCorporationCode || null,
          zoneId: user?.zoneId || null,
          wardId: user?.wardId || null,

          // Complaint location fields
          complaintCityCorporationCode: input.cityCorporationCode || null,
          complaintZoneId: input.zoneId || null,
          complaintWardId: input.wardId || null
        },
        include: {
          user: {
            include: {
              cityCorporation: true,
              zone: true,
              ward: true
            }
          },
          assignedAdmin: true,
          cityCorporation: true,
          zone: true,
          wards: true,
          complaintCityCorporation: true,
          complaintZone: true,
          complaintWard: true
        }
      });
      console.log(`⏱️ Database insert completed in ${Date.now() - dbStartTime}ms`);

      // Parallel execution of post-creation tasks
      await Promise.all([
        // Increment ward image count if images were uploaded
        (async () => {
          if (finalImageUrls.length > 0 && user && user.wardId) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                wardImageCount: {
                  increment: finalImageUrls.length
                }
              }
            });
          }
        })(),

        // Notify admins (don't wait for this)
        notificationService.notifyAdmins(
          'New Complaint Submitted',
          `A new complaint "${complaint.title}" has been submitted.`,
          'INFO',
          complaint.id
        ).catch(err => console.error('Failed to send admin notification:', err))
      ]);

      console.log(`✅ Total complaint creation time: ${Date.now() - startTime}ms`);
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

  /**
   * Upload images to Cloudinary
   * @private
   */
  private async uploadImagesToCloudinary(images: Express.Multer.File[]): Promise<string[]> {
    if (!images || images.length === 0) {
      return [];
    }

    try {
      // Upload all images in parallel
      const uploadPromises = images.map(image =>
        cloudUploadService.uploadImage(image, 'complaints/images')
      );

      const results = await Promise.all(uploadPromises);
      return results.map(result => result.secure_url);
    } catch (error) {
      console.error('Error uploading images to Cloudinary:', error);

      if (error instanceof CloudUploadError) {
        throw new Error(`Failed to upload images: ${error.message}`);
      }

      throw new Error('Failed to upload images to cloud storage');
    }
  }

  /**
   * Upload audio file to Cloudinary
   * @private
   */
  private async uploadAudioToCloudinary(audio: Express.Multer.File): Promise<string> {
    if (!audio) {
      throw new Error('No audio file provided');
    }

    try {
      const result = await cloudUploadService.uploadAudio(audio, 'complaints/voice');
      return result.secure_url;
    } catch (error) {
      console.error('Error uploading audio to Cloudinary:', error);

      if (error instanceof CloudUploadError) {
        throw new Error(`Failed to upload audio: ${error.message}`);
      }

      throw new Error('Failed to upload audio to cloud storage');
    }
  }

  // Get complaint by ID
  async getComplaintById(id: number, userId?: number) {
    try {
      const complaint = await prisma.complaint.findUnique({
        where: { id },
        include: {
          user: {
            include: {
              cityCorporation: true,
              zone: true,
              ward: true
            }
          },
          // Include user's geographical relations
          cityCorporation: true,
          zone: true,
          wards: true,
          // ✅ Include complaint's geographical relations (for ward inspector info)
          complaintCityCorporation: true,
          complaintZone: true,
          complaintWard: true
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
            include: {
              cityCorporation: true,
              zone: true,
              ward: true
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
          status: Complaint_status.REJECTED
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
        prisma.complaint.count({ where: { ...where, status: Complaint_status.PENDING } }),
        prisma.complaint.count({ where: { ...where, status: Complaint_status.IN_PROGRESS } }),
        prisma.complaint.count({ where: { ...where, status: Complaint_status.RESOLVED } }),
        prisma.complaint.count({ where: { ...where, status: Complaint_status.REJECTED } })
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
  async getComplaintsByStatus(userId: number, status: Complaint_status) {
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
      // Note: MySQL string comparisons are case-insensitive by default
      const where: any = {
        OR: [
          { title: { contains: searchTerm } },
          { description: { contains: searchTerm } },
          { trackingNumber: { contains: searchTerm } },
        ]
      };

      if (userId) {
        where.userId = userId;
      }

      const complaints = await prisma.complaint.findMany({
        where,
        include: {
          user: {
            include: {
              cityCorporation: true,
              zone: true,
              ward: true
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

    // ✅ FIX: Prioritize complaint's geographical data (where complaint was submitted)
    // This ensures the correct ward inspector information is displayed
    const cityCorporation = complaint.complaintCityCorporation || complaint.cityCorporation || complaint.user?.cityCorporation || null;
    const zone = complaint.complaintZone || complaint.zone || complaint.user?.zone || null;
    const ward = complaint.complaintWard || complaint.wards || complaint.user?.ward || null;

    return {
      ...complaint,
      imageUrls: parsedImages.imageUrls,
      audioUrls: parsedAudio.imageUrls, // audioUrls are stored in imageUrls field of parsed result
      voiceNoteUrl: parsedAudio.imageUrls[0], // First audio URL for backward compatibility
      // Keep original fields for backward compatibility
      imageUrl: complaint.imageUrl,
      audioUrl: complaint.audioUrl,
      // ✅ Include complaint's geographical information (not user's)
      cityCorporation: cityCorporation,
      zone: zone,
      wards: ward, // Use 'wards' to match Prisma relation name and frontend expectations
      ward: ward   // Also include 'ward' for compatibility
    };
  }

  // Update getComplaints to return formatted responses
  async getComplaints(query: ComplaintQueryInput = {}, requestingUser?: { role: string; id: number; wardId?: number | null }) {
    try {
      const result = await this.getComplaintsRaw(query, requestingUser);

      return {
        ...result,
        data: result.data.map(complaint => this.formatComplaintResponse(complaint))
      };
    } catch (error) {
      throw error;
    }
  }

  // Raw method for internal use
  private async getComplaintsRaw(query: ComplaintQueryInput = {}, requestingUser?: { role: string; id: number; wardId?: number | null }) {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      subcategory,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId,
      cityCorporationCode,
      zoneId,
      wardId
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;
    if (priority) where.priority = priority;
    if (userId) where.userId = userId;

    // Apply geographical filters via user relationship
    if (cityCorporationCode || zoneId || wardId) {
      where.user = where.user || {};
      if (cityCorporationCode) {
        where.user.cityCorporationCode = cityCorporationCode;
      }
      if (zoneId) {
        where.user.zoneId = zoneId;
      }
      if (wardId) {
        where.user.wardId = wardId;
      }
    }

    // Apply role-based automatic filtering
    if (requestingUser) {
      where.user = where.user || {};

      if (requestingUser.role === 'SUPER_ADMIN') {
        // Get assigned zones for SUPER_ADMIN
        const assignedZones = await prisma.userZone.findMany({
          where: { userId: requestingUser.id },
          select: { zoneId: true }
        });
        const assignedZoneIds = assignedZones.map(uz => uz.zoneId);

        if (assignedZoneIds.length > 0) {
          where.user.zoneId = { in: assignedZoneIds };
        }
      } else if (requestingUser.role === 'ADMIN') {
        // Filter by assigned ward
        if (requestingUser.wardId) {
          where.user.wardId = requestingUser.wardId;
        }
      }
    }

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
            include: {
              cityCorporation: true,
              zone: true,
              ward: true
            }
          },
          // Include user's geographical relations
          cityCorporation: true,
          zone: true,
          wards: true,
          // ✅ Include complaint's geographical relations (for ward inspector info)
          complaintCityCorporation: true,
          complaintZone: true,
          complaintWard: true
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

  // Add images to existing complaint with ward limit check
  async addImagesToComplaint(complaintId: number, uploadedFiles: any, userId: number) {
    try {
      // Get the complaint and verify ownership
      const complaint = await prisma.complaint.findUnique({
        where: { id: complaintId },
        include: {
          user: {
            include: {
              cityCorporation: true,
              zone: true,
              ward: true
            }
          }
        }
      });

      if (!complaint) {
        throw new Error('Complaint not found');
      }

      // Check if user owns this complaint
      if (complaint.userId !== userId) {
        throw new Error('Unauthorized to add images to this complaint');
      }

      const user = complaint.user;

      if (!user) {
        throw new Error('User not found for this complaint');
      }

      // Count image files being uploaded
      const files = uploadedFiles as any;
      let imageCount = 0;
      let imageFiles: any[] = [];

      if (Array.isArray(files)) {
        imageFiles = files.filter((f: any) => f.fieldname === 'images' || f.fieldname === 'image');
        imageCount = imageFiles.length;
      } else if (files.images) {
        imageFiles = Array.isArray(files.images) ? files.images : [files.images];
        imageCount = imageFiles.length;
      } else if (files.image) {
        imageFiles = [files.image];
        imageCount = 1;
      }

      if (imageCount === 0) {
        throw new Error('No images provided');
      }

      // Check ward image upload limit if user has a ward assigned
      if (user.wardId) {
        // Check if user has already reached the limit
        if (user.wardImageCount >= 10) {
          throw new WardImageLimitError(user.wardId, user.wardImageCount, 10);
        }

        // Check if this upload would exceed the limit
        if (user.wardImageCount + imageCount > 10) {
          throw new WardImageLimitError(user.wardId, user.wardImageCount, 10);
        }
      }

      // Upload images
      let newImageUrls: string[] = [];
      const useCloudinary = isCloudinaryEnabled();

      if (useCloudinary) {
        try {
          newImageUrls = await this.uploadImagesToCloudinary(imageFiles);
        } catch (error) {
          console.error('Cloudinary upload failed, falling back to local storage:', error);
          // Fallback to local storage
          newImageUrls = imageFiles.map((file: any) => getFileUrl(file.filename, 'image'));
        }
      } else {
        // Use local storage
        newImageUrls = imageFiles.map((file: any) => getFileUrl(file.filename, 'image'));
      }

      // Get existing image URLs
      const existingImages = this.parseFileUrls(complaint.imageUrl || '');
      const allImageUrls = [...existingImages.imageUrls, ...newImageUrls];

      // Update complaint with new images
      const updatedComplaint = await prisma.complaint.update({
        where: { id: complaintId },
        data: {
          imageUrl: JSON.stringify(allImageUrls)
        },
        include: {
          user: {
            include: {
              cityCorporation: true,
              zone: true,
              ward: true
            }
          }
        }
      });

      // Increment ward image count if user has a ward
      if (user.wardId) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            wardImageCount: {
              increment: imageCount
            }
          }
        });
      }

      return this.formatComplaintResponse(updatedComplaint);
    } catch (error) {
      console.error('Error adding images to complaint:', error);
      throw error;
    }
  }
}

export const complaintService = new ComplaintService();
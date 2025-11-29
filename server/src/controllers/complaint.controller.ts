import { Request, Response } from 'express';
import { complaintService, CreateComplaintInput, UpdateComplaintInput, ComplaintQueryInput } from '../services/complaint.service';
import { validateInput, createComplaintSchema, updateComplaintSchema, complaintQuerySchema } from '../utils/validation';
import { ComplaintStatus } from '@prisma/client';

// Extend Request interface to include user information from JWT
interface AuthenticatedRequest extends Request {
  user?: {
    sub: number;
    role: string;
    email?: string;
    phone?: string;
  };
  files?: any;
}

export class ComplaintController {
  // Create a new complaint
  async createComplaint(req: AuthenticatedRequest, res: Response) {
    try {
      // Debug: Log what we're receiving
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Location object:', req.body.location);
      if (req.body.location) {
        console.log('- address:', req.body.location.address, 'length:', req.body.location.address?.length);
        console.log('- district:', req.body.location.district);
        console.log('- thana:', req.body.location.thana);
        console.log('- ward:', req.body.location.ward);
      }
      console.log('Request files:', req.files);

      // Validate request body
      const validatedData = validateInput(createComplaintSchema, req.body);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const complaintInput: CreateComplaintInput = {
        ...validatedData,
        userId: req.user.sub,
        // Include uploaded files from multer middleware
        uploadedFiles: req.files
      };

      const complaint = await complaintService.createComplaint(complaintInput);

      res.status(201).json({
        success: true,
        message: 'Complaint created successfully',
        data: {
          complaint
        }
      });
    } catch (error) {
      console.error('Error in createComplaint:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create complaint',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  // Get complaint by ID
  async getComplaintById(req: AuthenticatedRequest, res: Response) {
    try {
      const complaintId = parseInt(req.params.id);

      if (isNaN(complaintId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid complaint ID'
        });
      }

      const userId = req.user?.sub;
      const complaint = await complaintService.getComplaintById(complaintId, userId);

      res.status(200).json({
        success: true,
        data: {
          complaint
        }
      });
    } catch (error) {
      console.error('Error in getComplaintById:', error);
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
        error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch complaint',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  // Get complaints with filtering and pagination
  async getComplaints(req: AuthenticatedRequest, res: Response) {
    try {
      // Validate query parameters
      const validatedQuery = validateInput(complaintQuerySchema, req.query);

      const queryInput: ComplaintQueryInput = {
        ...validatedQuery,
        userId: req.user?.sub // Users can only see their own complaints
      };

      const result = await complaintService.getComplaints(queryInput);

      res.status(200).json({
        success: true,
        data: {
          complaints: result.data.map(complaint => ({
            id: complaint.id,
            title: complaint.title,
            description: complaint.description,
            category: complaint.category,
            subcategory: complaint.subcategory,
            priority: complaint.priority,
            status: complaint.status,
            imageUrls: complaint.imageUrls,
            audioUrls: complaint.audioUrls,
            location: complaint.location,
            user: complaint.user,
            createdAt: complaint.createdAt,
            updatedAt: complaint.updatedAt,
          })),
          pagination: result.pagination
        }
      });
    } catch (error) {
      console.error('Error in getComplaints:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch complaints',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  // Update complaint
  async updateComplaint(req: AuthenticatedRequest, res: Response) {
    try {
      const complaintId = parseInt(req.params.id);

      if (isNaN(complaintId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid complaint ID'
        });
      }

      // Validate request body
      const validatedData = validateInput(updateComplaintSchema, req.body);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const updateInput: UpdateComplaintInput = {
        ...validatedData,
        // Include uploaded files from multer middleware
        uploadedFiles: req.files,
        // Check if replaceFiles flag is set
        replaceFiles: req.body.replaceFiles === 'true' || req.body.replaceFiles === true
      };
      const userId = req.user.sub;

      const complaint = await complaintService.updateComplaint(complaintId, updateInput, userId);

      res.status(200).json({
        success: true,
        message: 'Complaint updated successfully',
        data: {
          complaint
        }
      });
    } catch (error) {
      console.error('Error in updateComplaint:', error);
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
        error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update complaint',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  // Cancel/Delete complaint
  async deleteComplaint(req: AuthenticatedRequest, res: Response) {
    try {
      const complaintId = parseInt(req.params.id);

      if (isNaN(complaintId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid complaint ID'
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = req.user.sub;
      const result = await complaintService.deleteComplaint(complaintId, userId);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in deleteComplaint:', error);
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
        error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel complaint',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  // Get complaint statistics
  async getComplaintStats(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = req.user.sub;
      const stats = await complaintService.getComplaintStats(userId);

      res.status(200).json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('Error in getComplaintStats:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch complaint statistics',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  // Get complaints by status
  async getComplaintsByStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const status = req.params.status?.toUpperCase() as ComplaintStatus;

      if (!Object.values(ComplaintStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid complaint status'
        });
      }

      const userId = req.user.sub;
      const complaints = await complaintService.getComplaintsByStatus(userId, status);

      res.status(200).json({
        success: true,
        data: { complaints }
      });
    } catch (error) {
      console.error('Error in getComplaintsByStatus:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch complaints by status',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  // Search complaints
  async searchComplaints(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const searchTerm = req.query.q as string;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search term must be at least 2 characters long'
        });
      }

      const userId = req.user.sub;
      const complaints = await complaintService.searchComplaints(searchTerm, userId);

      res.status(200).json({
        success: true,
        data: { complaints }
      });
    } catch (error) {
      console.error('Error in searchComplaints:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to search complaints',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  // Get complaint by ID (simplified for now)
  async getComplaintByIdForTracking(req: AuthenticatedRequest, res: Response) {
    try {
      const complaintId = parseInt(req.params.trackingNumber);

      if (isNaN(complaintId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid complaint ID'
        });
      }

      const userId = req.user?.sub;

      // For now, search by complaint ID
      const complaint = await complaintService.getComplaintById(complaintId, userId);

      res.status(200).json({
        success: true,
        data: { complaint }
      });
    } catch (error) {
      console.error('Error in getComplaintByTrackingNumber:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch complaint',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  // Get chat messages for a complaint (user endpoint)
  async getChatMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const complaintId = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Import chat service
      const { chatService } = await import('../services/chat.service');

      const result = await chatService.getChatMessages(complaintId, { page, limit });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in getChatMessages:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch chat messages'
      });
    }
  }

  // Send a chat message (user endpoint)
  async sendChatMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const complaintId = parseInt(req.params.id);
      const { message, imageUrl, voiceUrl } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Import message validator
      const { validateMessage, sanitizeMessage, validateImageUrl, validateVoiceUrl } = await import('../utils/message-validator');

      // Validate message
      const messageValidation = validateMessage(message);
      if (!messageValidation.valid) {
        return res.status(400).json({
          success: false,
          message: messageValidation.error
        });
      }

      // Validate image URL if provided
      if (imageUrl) {
        const imageValidation = validateImageUrl(imageUrl);
        if (!imageValidation.valid) {
          return res.status(400).json({
            success: false,
            message: imageValidation.error
          });
        }
      }

      if (voiceUrl) {
        const voiceValidation = validateVoiceUrl(voiceUrl);
        if (!voiceValidation.valid) {
          return res.status(400).json({
            success: false,
            message: voiceValidation.error
          });
        }
      }

      // Sanitize message
      const sanitizedMessage = sanitizeMessage(message);

      // Get uploaded image file if present
      const imageFile = req.file;

      // Import chat service
      const { chatService } = await import('../services/chat.service');

      const chatMessage = await chatService.sendChatMessage({
        complaintId,
        senderId: req.user.sub,
        senderType: 'CITIZEN',
        message: sanitizedMessage,
        imageUrl,
        voiceUrl
      });

      res.status(201).json({
        success: true,
        data: { message: chatMessage }
      });
    } catch (error) {
      console.error('Error in sendChatMessage:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send message'
      });
    }
  }

  // Mark messages as read (user endpoint)
  async markMessagesAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const complaintId = parseInt(req.params.id);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Import chat service
      const { chatService } = await import('../services/chat.service');

      const result = await chatService.markMessagesAsRead(
        complaintId,
        req.user.sub,
        'CITIZEN'
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to mark messages as read'
      });
    }
  }
}

export const complaintController = new ComplaintController();




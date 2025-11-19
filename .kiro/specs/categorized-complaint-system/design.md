# Design Document - Categorized Complaint System

## Overview

This design document outlines the technical implementation for adding category and subcategory support to the Clean Care complaint system. The mobile app already has the UI for category selection, but the backend and admin panel need to be updated to store, validate, and filter complaints by category and subcategory.

## Architecture

### System Components

1. **Database Layer** (Prisma + PostgreSQL)
   - Add category and subcategory fields to Complaint model
   - Create indexes for efficient filtering
   - Add validation constraints

2. **Backend API Layer** (Node.js + Express)
   - Update complaint creation endpoint to accept category/subcategory
   - Add validation service for category/subcategory combinations
   - Add filtering endpoints for category-based queries
   - Update analytics service to include category statistics

3. **Admin Panel** (React + TypeScript)
   - Add category filter dropdowns
   - Update complaint cards to display category/subcategory
   - Add category-based analytics dashboard
   - Update complaint details modal

4. **Mobile App** (Flutter) - Already Implemented
   - Category selection UI exists
   - Subcategory selection UI exists
   - Only needs backend integration

## Database Design

### Updated Complaint Model Schema

```prisma
model Complaint {
  id                Int       @id @default(autoincrement())
  userId            Int
  title             String
  description       String
  category          String    // NEW: Primary category ID
  subcategory       String    // NEW: Subcategory ID
  location          String?
  latitude          Float?
  longitude         Float?
  status            String    @default("pending")
  priority          String    @default("medium")
  images            String[]
  audioUrl          String?
  ward              String?
  zone              String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  user              User      @relation(fields: [userId], references: [id])
  messages          Message[]
  
  @@index([category])           // NEW: Index for category filtering
  @@index([subcategory])        // NEW: Index for subcategory filtering
  @@index([category, subcategory]) // NEW: Composite index
  @@index([status])
  @@index([createdAt])
}
```

### Category Validation Data Structure

```typescript
// Category configuration stored in code (not database)
interface CategoryConfig {
  id: string;
  banglaName: string;
  englishName: string;
  color: string;
  icon: string;
  subcategories: SubcategoryConfig[];
}

interface SubcategoryConfig {
  id: string;
  banglaName: string;
  englishName: string;
}

// Complete category structure
const CATEGORIES: CategoryConfig[] = [
  {
    id: 'home',
    banglaName: 'বাসা/বাড়ি',
    englishName: 'Home/House',
    color: '#3FA564',
    icon: 'house.svg',
    subcategories: [
      { id: 'not_collecting_waste', banglaName: 'বাসা বাড়ির ময়লা নিচ্ছে না', englishName: 'Not collecting household waste' },
      { id: 'worker_behavior', banglaName: 'ময়লা কর্মীদের ব্যবহার আচরণ', englishName: 'Poor behavior of waste workers' },
      { id: 'billing_issue', banglaName: 'বিল সংক্রান্ত ইস্যু', englishName: 'Billing related issue' }
    ]
  },
  {
    id: 'road_environment',
    banglaName: 'রাস্তা ও পরিবেশ',
    englishName: 'Road & Environment',
    color: '#3FA564',
    icon: 'road.svg',
    subcategories: [
      { id: 'road_waste', banglaName: 'রাস্তার ধারে ময়লা', englishName: 'Waste beside the road' },
      { id: 'water_logging', banglaName: 'রাস্তায় পানি জমে আছে', englishName: 'Water logging on road' },
      { id: 'manhole_issue', banglaName: 'ম্যানহোল ঢাকনা নেই', englishName: 'Missing manhole cover' }
    ]
  },
  {
    id: 'business',
    banglaName: 'ব্যবসা প্রতিষ্ঠান',
    englishName: 'Business Place',
    color: '#FFD85B',
    icon: 'house2.svg',
    subcategories: [
      { id: 'not_collecting', banglaName: 'ময়লা নিচ্ছে না', englishName: 'Not collecting waste' },
      { id: 'worker_behavior', banglaName: 'ময়লা কর্মীদের ব্যবহার খারাপ', englishName: 'Poor behavior of waste workers' },
      { id: 'billing_issue', banglaName: 'বিল সংক্রান্ত সমস্যা', englishName: 'Billing related issue' }
    ]
  },
  {
    id: 'office',
    banglaName: 'অফিস',
    englishName: 'Office',
    color: '#5B9FFF',
    icon: 'office.svg',
    subcategories: [
      { id: 'not_collecting', banglaName: 'ময়লা নিচ্ছে না', englishName: 'Not collecting waste' },
      { id: 'worker_behavior', banglaName: 'ময়লা কর্মীদের ব্যবহার খারাপ', englishName: 'Poor behavior of waste workers' },
      { id: 'billing_issue', banglaName: 'বিল সংক্রান্ত সমস্যা', englishName: 'Billing related issue' }
    ]
  },
  {
    id: 'education',
    banglaName: 'শিক্ষা প্রতিষ্ঠান',
    englishName: 'Educational Institution',
    color: '#9B59B6',
    icon: 'graduate.svg',
    subcategories: [
      { id: 'not_collecting', banglaName: 'ময়লা নিচ্ছে না', englishName: 'Not collecting waste' },
      { id: 'worker_behavior', banglaName: 'ময়লা কর্মীদের ব্যবহার খারাপ', englishName: 'Poor behavior of waste workers' },
      { id: 'billing_issue', banglaName: 'বিল সংক্রান্ত সমস্যা', englishName: 'Billing related issue' }
    ]
  },
  {
    id: 'hospital',
    banglaName: 'হাসপাতাল',
    englishName: 'Hospital',
    color: '#E74C3C',
    icon: 'hospital.svg',
    subcategories: [
      { id: 'not_collecting', banglaName: 'ময়লা নিচ্ছে না', englishName: 'Not collecting waste' },
      { id: 'worker_behavior', banglaName: 'ময়লা কর্মীদের ব্যবহার খারাপ', englishName: 'Poor behavior of waste workers' },
      { id: 'billing_issue', banglaName: 'বিল সংক্রান্ত সমস্যা', englishName: 'Billing related issue' }
    ]
  },
  {
    id: 'religious',
    banglaName: 'ধর্মীয় ও সেবামূলক',
    englishName: 'Religious & Service',
    color: '#F39C12',
    icon: 'church.svg',
    subcategories: [
      { id: 'not_collecting', banglaName: 'ময়লা নিচ্ছে না', englishName: 'Not collecting waste' },
      { id: 'worker_behavior', banglaName: 'ময়লা কর্মীদের ব্যবহার খারাপ', englishName: 'Poor behavior of waste workers' },
      { id: 'billing_issue', banglaName: 'বিল সংক্রান্ত সমস্যা', englishName: 'Billing related issue' }
    ]
  },
  {
    id: 'events',
    banglaName: 'মেলা ও আনন্দোৎসব',
    englishName: 'Events & Celebration',
    color: '#E91E63',
    icon: 'congratulations.svg',
    subcategories: [
      { id: 'event_description', banglaName: 'বর্ণনা দিন', englishName: 'Provide description' }
    ]
  }
];
```

## Backend API Design

### New Service: CategoryService

```typescript
// server/src/services/category.service.ts
class CategoryService {
  // Get all categories with subcategories
  getAllCategories(): CategoryConfig[] {
    return CATEGORIES;
  }
  
  // Get specific category by ID
  getCategoryById(categoryId: string): CategoryConfig | null {
    return CATEGORIES.find(cat => cat.id === categoryId) || null;
  }
  
  // Get subcategories for a category
  getSubcategories(categoryId: string): SubcategoryConfig[] {
    const category = this.getCategoryById(categoryId);
    return category?.subcategories || [];
  }
  
  // Validate category and subcategory combination
  validateCategorySubcategory(category: string, subcategory: string): boolean {
    const cat = this.getCategoryById(category);
    if (!cat) return false;
    
    return cat.subcategories.some(sub => sub.id === subcategory);
  }
  
  // Get category display name
  getCategoryName(categoryId: string, language: 'en' | 'bn' = 'en'): string {
    const category = this.getCategoryById(categoryId);
    if (!category) return categoryId;
    
    return language === 'bn' ? category.banglaName : category.englishName;
  }
  
  // Get subcategory display name
  getSubcategoryName(categoryId: string, subcategoryId: string, language: 'en' | 'bn' = 'en'): string {
    const category = this.getCategoryById(categoryId);
    if (!category) return subcategoryId;
    
    const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
    if (!subcategory) return subcategoryId;
    
    return language === 'bn' ? subcategory.banglaName : subcategory.englishName;
  }
}
```

### Updated Complaint Service

```typescript
// server/src/services/complaint.service.ts
class ComplaintService {
  async createComplaint(data: CreateComplaintDto): Promise<Complaint> {
    // Validate category and subcategory
    if (!categoryService.validateCategorySubcategory(data.category, data.subcategory)) {
      throw new Error('Invalid category and subcategory combination');
    }
    
    // Create complaint with category fields
    const complaint = await prisma.complaint.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description,
        category: data.category,        // NEW
        subcategory: data.subcategory,  // NEW
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        images: data.images,
        audioUrl: data.audioUrl,
        ward: data.ward,
        zone: data.zone,
      },
      include: {
        user: true
      }
    });
    
    return complaint;
  }
  
  async getComplaints(filters: ComplaintFilters): Promise<Complaint[]> {
    const where: any = {};
    
    // Add category filter
    if (filters.category) {
      where.category = filters.category;
    }
    
    // Add subcategory filter
    if (filters.subcategory) {
      where.subcategory = filters.subcategory;
    }
    
    // Existing filters (status, ward, zone, etc.)
    if (filters.status) where.status = filters.status;
    if (filters.ward) where.ward = filters.ward;
    if (filters.zone) where.zone = filters.zone;
    
    const complaints = await prisma.complaint.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
    
    return complaints;
  }
}
```

### New API Endpoints

```typescript
// GET /api/categories - Get all categories
router.get('/categories', categoryController.getAllCategories);

// GET /api/categories/:categoryId - Get specific category
router.get('/categories/:categoryId', categoryController.getCategoryById);

// GET /api/categories/:categoryId/subcategories - Get subcategories
router.get('/categories/:categoryId/subcategories', categoryController.getSubcategories);

// POST /api/complaints - Updated to accept category/subcategory
router.post('/complaints', authMiddleware, complaintController.createComplaint);

// GET /api/complaints - Updated to support category filtering
// Query params: ?category=home&subcategory=not_collecting_waste
router.get('/complaints', authMiddleware, complaintController.getComplaints);

// GET /api/admin/analytics/categories - Category statistics
router.get('/admin/analytics/categories', adminMiddleware, analyticsController.getCategoryStats);
```

### Analytics Service Updates

```typescript
// server/src/services/analytics.service.ts
class AnalyticsService {
  async getCategoryStatistics(): Promise<CategoryStats[]> {
    const stats = await prisma.complaint.groupBy({
      by: ['category', 'subcategory'],
      _count: {
        id: true
      }
    });
    
    // Transform to include category names
    return stats.map(stat => ({
      category: stat.category,
      categoryName: categoryService.getCategoryName(stat.category, 'en'),
      categoryNameBn: categoryService.getCategoryName(stat.category, 'bn'),
      subcategory: stat.subcategory,
      subcategoryName: categoryService.getSubcategoryName(stat.category, stat.subcategory, 'en'),
      subcategoryNameBn: categoryService.getSubcategoryName(stat.category, stat.subcategory, 'bn'),
      count: stat._count.id
    }));
  }
  
  async getCategoryTrends(startDate: Date, endDate: Date): Promise<CategoryTrend[]> {
    const complaints = await prisma.complaint.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        category: true,
        subcategory: true,
        createdAt: true
      }
    });
    
    // Group by date and category
    // Return trend data
  }
}
```

## Admin Panel Design

### Component Structure

```
src/
├── components/
│   ├── Complaints/
│   │   ├── CategoryFilter.tsx          // NEW: Category dropdown filter
│   │   ├── SubcategoryFilter.tsx       // NEW: Subcategory dropdown filter
│   │   ├── ComplaintCard.tsx           // UPDATED: Show category badge
│   │   └── ComplaintDetailsModal.tsx   // UPDATED: Show category info
│   └── Analytics/
│       ├── CategoryChart.tsx           // NEW: Category breakdown chart
│       └── CategoryStatsTable.tsx      // NEW: Category statistics table
├── services/
│   ├── categoryService.ts              // NEW: Category API calls
│   └── complaintService.ts             // UPDATED: Add category filters
└── types/
    └── category.types.ts               // NEW: Category type definitions
```

### Category Filter Component

```typescript
// clean-care-admin/src/components/Complaints/CategoryFilter.tsx
interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  
  useEffect(() => {
    // Fetch categories from API
    categoryService.getAllCategories().then(setCategories);
  }, []);
  
  return (
    <FormControl sx={{ minWidth: 200 }}>
      <InputLabel>Category</InputLabel>
      <Select
        value={selectedCategory || ''}
        onChange={(e) => onCategoryChange(e.target.value || null)}
        label="Category"
      >
        <MenuItem value="">All Categories</MenuItem>
        {categories.map(cat => (
          <MenuItem key={cat.id} value={cat.id}>
            {cat.englishName} ({cat.banglaName})
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
```

### Updated Complaint Card

```typescript
// clean-care-admin/src/components/Complaints/ComplaintCard.tsx
export const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint }) => {
  const categoryColor = getCategoryColor(complaint.category);
  
  return (
    <Card>
      <CardContent>
        {/* Category Badge */}
        <Chip
          label={`${complaint.categoryName} - ${complaint.subcategoryName}`}
          size="small"
          sx={{
            backgroundColor: categoryColor,
            color: '#fff',
            mb: 1
          }}
        />
        
        {/* Existing complaint info */}
        <Typography variant="h6">{complaint.title}</Typography>
        <Typography variant="body2">{complaint.description}</Typography>
        
        {/* Status, location, etc. */}
      </CardContent>
    </Card>
  );
};
```

### Category Analytics Dashboard

```typescript
// clean-care-admin/src/components/Analytics/CategoryChart.tsx
export const CategoryChart: React.FC = () => {
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  
  useEffect(() => {
    analyticsService.getCategoryStatistics().then(setCategoryStats);
  }, []);
  
  // Prepare data for chart
  const chartData = categoryStats.map(stat => ({
    name: stat.categoryName,
    value: stat.count,
    color: stat.color
  }));
  
  return (
    <Box>
      <Typography variant="h6">Complaints by Category</Typography>
      <PieChart width={400} height={300}>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </Box>
  );
};
```

## Data Migration Strategy

### Migration Steps

1. **Add Database Fields**
   ```sql
   -- Add category and subcategory columns
   ALTER TABLE "Complaint" ADD COLUMN "category" TEXT;
   ALTER TABLE "Complaint" ADD COLUMN "subcategory" TEXT;
   
   -- Create indexes
   CREATE INDEX "Complaint_category_idx" ON "Complaint"("category");
   CREATE INDEX "Complaint_subcategory_idx" ON "Complaint"("subcategory");
   CREATE INDEX "Complaint_category_subcategory_idx" ON "Complaint"("category", "subcategory");
   ```

2. **Handle Existing Data**
   - Existing complaints without category will have NULL values
   - Admin panel should handle NULL categories gracefully
   - Option 1: Set default category "other" for existing complaints
   - Option 2: Leave as NULL and filter them separately
   - Option 3: Manual categorization by admins

3. **Backward Compatibility**
   - Mobile app should send category/subcategory in new complaints
   - Backend should accept complaints without category (for old app versions)
   - Gradually enforce category requirement after app update rollout

## Error Handling

### Validation Errors

```typescript
// Invalid category
{
  "error": "Invalid category",
  "message": "Category 'invalid_cat' does not exist",
  "validCategories": ["home", "road_environment", "business", ...]
}

// Invalid subcategory
{
  "error": "Invalid subcategory",
  "message": "Subcategory 'invalid_sub' does not exist for category 'home'",
  "validSubcategories": ["not_collecting_waste", "worker_behavior", "billing_issue"]
}

// Missing category
{
  "error": "Validation error",
  "message": "Category is required"
}
```

### Frontend Error Handling

```typescript
try {
  await complaintService.createComplaint(data);
} catch (error) {
  if (error.response?.status === 400) {
    // Show validation error to user
    toast.error(error.response.data.message);
  } else {
    // Generic error
    toast.error('Failed to create complaint');
  }
}
```

## Testing Strategy

### Unit Tests

1. **CategoryService Tests**
   - Test category validation
   - Test subcategory validation
   - Test invalid combinations
   - Test category name retrieval

2. **ComplaintService Tests**
   - Test complaint creation with valid category
   - Test complaint creation with invalid category
   - Test filtering by category
   - Test filtering by subcategory

### Integration Tests

1. **API Endpoint Tests**
   - Test GET /api/categories
   - Test POST /api/complaints with category
   - Test GET /api/complaints with category filter
   - Test category analytics endpoint

2. **Database Tests**
   - Test category indexing performance
   - Test query performance with category filters
   - Test data integrity

### Frontend Tests

1. **Component Tests**
   - Test CategoryFilter component
   - Test SubcategoryFilter component
   - Test ComplaintCard with category badge
   - Test CategoryChart rendering

2. **Integration Tests**
   - Test category filter interaction
   - Test complaint creation flow
   - Test analytics dashboard

## Performance Considerations

### Database Optimization

1. **Indexes**
   - Single column indexes on category and subcategory
   - Composite index on (category, subcategory)
   - Helps with filtering queries

2. **Query Optimization**
   - Use indexed fields in WHERE clauses
   - Avoid full table scans
   - Use EXPLAIN to analyze query plans

### Caching Strategy

1. **Category Data Caching**
   - Categories are static, cache in memory
   - No need to query database for category list
   - Update cache only when categories change

2. **Analytics Caching**
   - Cache category statistics for 5 minutes
   - Invalidate cache on new complaint creation
   - Use Redis for distributed caching

### API Response Optimization

1. **Pagination**
   - Limit complaints per page (default 20)
   - Use cursor-based pagination for large datasets

2. **Field Selection**
   - Only return necessary fields
   - Use Prisma select to reduce data transfer

## Security Considerations

1. **Input Validation**
   - Validate category and subcategory on backend
   - Prevent SQL injection through Prisma ORM
   - Sanitize user inputs

2. **Authorization**
   - Only authenticated users can create complaints
   - Only admins can access analytics endpoints
   - Validate user permissions

3. **Rate Limiting**
   - Limit complaint creation to prevent spam
   - Rate limit analytics endpoints

## Deployment Plan

### Phase 1: Backend Updates (Week 1)
1. Add database fields and indexes
2. Implement CategoryService
3. Update ComplaintService
4. Add new API endpoints
5. Write unit tests
6. Deploy to staging

### Phase 2: Admin Panel Updates (Week 2)
1. Implement category filter components
2. Update complaint cards
3. Add category analytics dashboard
4. Write component tests
5. Deploy to staging

### Phase 3: Testing & QA (Week 3)
1. Integration testing
2. Performance testing
3. User acceptance testing
4. Bug fixes

### Phase 4: Production Deployment (Week 4)
1. Database migration
2. Backend deployment
3. Admin panel deployment
4. Monitor for issues
5. Gradual rollout

## Rollback Plan

If issues arise:
1. Revert admin panel deployment
2. Revert backend deployment
3. Keep database fields (no data loss)
4. Fix issues in staging
5. Redeploy when ready

## Monitoring & Metrics

### Key Metrics to Track

1. **Complaint Creation**
   - Number of complaints per category
   - Most common subcategories
   - Category distribution over time

2. **Performance**
   - API response times
   - Database query performance
   - Category filter usage

3. **Errors**
   - Validation errors by type
   - Failed complaint creations
   - API error rates

### Logging

```typescript
// Log category validation failures
logger.warn('Invalid category', {
  category: data.category,
  subcategory: data.subcategory,
  userId: data.userId
});

// Log category statistics queries
logger.info('Category stats requested', {
  adminId: req.user.id,
  dateRange: { start, end }
});
```

## Future Enhancements

1. **Dynamic Categories**
   - Move categories to database
   - Allow admins to add/edit categories
   - Support custom subcategories per city

2. **Category-Based Routing**
   - Auto-assign complaints to departments
   - Category-specific SLA times
   - Priority based on category

3. **Advanced Analytics**
   - Category trends over time
   - Heatmaps by category and location
   - Predictive analytics

4. **Multilingual Support**
   - Support more languages
   - User-selected language preference
   - Translation management system

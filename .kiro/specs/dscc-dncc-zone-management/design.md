# Design Document: Dynamic City Corporation Management System

## Overview

This design implements a fully dynamic city corporation management system for Clean Care Bangladesh. The system allows super admins to manage multiple city corporations (DSCC, DNCC, and future additions), configure ward ranges, and manage thanas/areas for each corporation. All user-facing features (signup, user management, complaints, chat) are dynamically filtered based on city corporation boundaries.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Panel (React)                      │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ City Corp Mgmt │  │ User Mgmt    │  │ Complaint Mgmt  │ │
│  │ - Add/Edit CC  │  │ - Filter CC  │  │ - Filter CC     │ │
│  │ - Add Thanas   │  │ - Filter Ward│  │ - Filter Ward   │ │
│  │ - Config Wards │  │ - Filter Thana│  │ - Filter Thana  │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  City Corporation Service                               │ │
│  │  - CRUD operations for city corporations               │ │
│  │  - Thana management per city corporation               │ │
│  │  - Ward range validation                               │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  User Service (Enhanced)                                │ │
│  │  - Filter by city corporation                          │ │
│  │  - Validate city corporation + ward + thana            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Complaint Service (Enhanced)                           │ │
│  │  - Auto-associate with user's city corporation         │ │
│  │  - Filter by city corporation                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (MySQL/Prisma)                   │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ CityCorpora  │  │  Thana   │  │  User (Enhanced)     │  │
│  │ tion         │  │          │  │  - cityCorpCode FK   │  │
│  │ - code       │  │ - name   │  │  - thanaId FK        │  │
│  │ - name       │  │ - ccId   │  │  - ward              │  │
│  │ - minWard    │  │ - status │  │                      │  │
│  │ - maxWard    │  │          │  │                      │  │
│  │ - status     │  │          │  │                      │  │
│  └──────────────┘  └──────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Mobile App (Flutter)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Signup Page (Enhanced)                                 │ │
│  │  - Dynamic city corporation dropdown                   │ │
│  │  - Dynamic ward range based on selected CC            │ │
│  │  - Dynamic thana dropdown based on selected CC        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Schema

#### CityCorpora tion Table
```prisma
model CityCorpora tion {
  id        Int      @id @default(autoincrement())
  code      String   @unique // e.g., "DSCC", "DNCC", "CTGCC"
  name      String   // e.g., "Dhaka South City Corporation"
  minWard   Int      // Minimum ward number (e.g., 1)
  maxWard   Int      // Maximum ward number (e.g., 75)
  status    CityCorpora tionStatus @default(ACTIVE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  thanas    Thana[]
  users     User[]
  
  @@index([status])
  @@index([code])
  @@map("city_corporations")
}

enum CityCorpora tionStatus {
  ACTIVE
  INACTIVE
}
```

#### Thana Table
```prisma
model Thana {
  id                  Int      @id @default(autoincrement())
  name                String
  cityCorpora tionId  Int
  cityCorpora tion    CityCorpora tion @relation(fields: [cityCorpora tionId], references: [id])
  status              ThanaStatus @default(ACTIVE)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  users               User[]
  
  @@unique([name, cityCorpora tionId])
  @@index([cityCorpora tionId, status])
  @@map("thanas")
}

enum ThanaStatus {
  ACTIVE
  INACTIVE
}
```

#### Enhanced User Table
```prisma
model User {
  // ... existing fields ...
  
  cityCorpora tionCode String?
  cityCorpora tion     CityCorpora tion? @relation(fields: [cityCorpora tionCode], references: [code])
  
  thanaId              Int?
  thana                Thana? @relation(fields: [thanaId], references: [id])
  
  ward                 String?
  
  @@index([cityCorpora tionCode])
  @@index([thanaId])
  @@index([ward])
  @@index([cityCorpora tionCode, ward])
}
```

### 2. Backend Services

#### City Corporation Service
```typescript
interface CreateCityCorpora tionDto {
  code: string;
  name: string;
  minWard: number;
  maxWard: number;
}

interface UpdateCityCorpora tionDto {
  name?: string;
  minWard?: number;
  maxWard?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

class CityCorpora tionService {
  // Get all city corporations (with optional status filter)
  async getCityCorpora tions(status?: 'ACTIVE' | 'INACTIVE' | 'ALL'): Promise<CityCorpora tion[]>
  
  // Get single city corporation by code
  async getCityCorpora tionByCode(code: string): Promise<CityCorpora tion>
  
  // Create new city corporation
  async createCityCorpora tion(data: CreateCityCorpora tionDto): Promise<CityCorpora tion>
  
  // Update city corporation
  async updateCityCorpora tion(code: string, data: UpdateCityCorpora tionDto): Promise<CityCorpora tion>
  
  // Get statistics for city corporation
  async getCityCorpora tionStats(code: string): Promise<{
    totalUsers: number;
    totalComplaints: number;
    resolvedComplaints: number;
    activeThanas: number;
  }>
  
  // Validate ward number for city corporation
  async validateWard(cityCorpCode: string, ward: number): Promise<boolean>
}
```

#### Thana Service
```typescript
interface CreateThanaDto {
  name: string;
  cityCorpora tionCode: string;
}

interface UpdateThanaDto {
  name?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

class ThanaService {
  // Get thanas by city corporation
  async getThanasByCityCorpora tion(
    cityCorpCode: string, 
    status?: 'ACTIVE' | 'INACTIVE' | 'ALL'
  ): Promise<Thana[]>
  
  // Create new thana
  async createThana(data: CreateThanaDto): Promise<Thana>
  
  // Update thana
  async updateThana(id: number, data: UpdateThanaDto): Promise<Thana>
  
  // Get thana statistics
  async getThanaStats(id: number): Promise<{
    totalUsers: number;
    totalComplaints: number;
  }>
}
```

#### Enhanced Auth Service
```typescript
interface RegisterInput {
  // ... existing fields ...
  cityCorpora tionCode: string;
  ward: string;
  thanaId?: number;
}

class AuthService {
  async register(input: RegisterInput) {
    // Validate city corporation exists and is active
    const cityCorpora tion = await cityCorpora tionService.getCityCorpora tionByCode(
      input.cityCorpora tionCode
    );
    
    if (!cityCorpora tion || cityCorpora tion.status !== 'ACTIVE') {
      throw new Error('Invalid city corporation');
    }
    
    // Validate ward is within range
    const wardNum = parseInt(input.ward);
    if (wardNum < cityCorpora tion.minWard || wardNum > cityCorpora tion.maxWard) {
      throw new Error(
        `Ward must be between ${cityCorpora tion.minWard} and ${cityCorpora tion.maxWard}`
      );
    }
    
    // Validate thana belongs to city corporation
    if (input.thanaId) {
      const thana = await thanaService.getThanaById(input.thanaId);
      if (thana.cityCorpora tionId !== cityCorpora tion.id) {
        throw new Error('Thana does not belong to selected city corporation');
      }
    }
    
    // Create user with city corporation and thana
    // ...
  }
}
```

#### Enhanced User Management Service
```typescript
interface GetUsersQuery {
  // ... existing fields ...
  cityCorpora tionCode?: string;
  ward?: string;
  thanaId?: number;
}

class AdminUserService {
  async getUsers(query: GetUsersQuery) {
    const where: any = {};
    
    if (query.cityCorpora tionCode) {
      where.cityCorpora tionCode = query.cityCorpora tionCode;
    }
    
    if (query.ward) {
      where.ward = query.ward;
    }
    
    if (query.thanaId) {
      where.thanaId = query.thanaId;
    }
    
    // ... rest of query logic
  }
  
  async getUserStatistics(cityCorpCode?: string) {
    const where = cityCorpCode ? { cityCorpora tionCode: cityCorpCode } : {};
    
    // Calculate statistics filtered by city corporation
    // ...
  }
}
```

#### Enhanced Complaint Service
```typescript
class ComplaintService {
  async createComplaint(input: CreateComplaintInput) {
    // Get user's city corporation
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      include: { cityCorpora tion: true, thana: true }
    });
    
    // Complaint automatically inherits user's city corporation
    const complaint = await prisma.complaint.create({
      data: {
        // ... other fields ...
        userId: input.userId,
        // City corporation is derived from user
      }
    });
    
    return complaint;
  }
}
```

#### Enhanced Admin Complaint Service
```typescript
interface GetComplaintsQuery {
  // ... existing fields ...
  cityCorpora tionCode?: string;
  ward?: string;
  thanaId?: number;
}

class AdminComplaintService {
  async getAdminComplaints(query: GetComplaintsQuery) {
    const where: any = {};
    
    // Filter by city corporation through user relationship
    if (query.cityCorpora tionCode) {
      where.user = {
        cityCorpora tionCode: query.cityCorpora tionCode
      };
    }
    
    if (query.ward) {
      where.user = {
        ...where.user,
        ward: query.ward
      };
    }
    
    if (query.thanaId) {
      where.user = {
        ...where.user,
        thanaId: query.thanaId
      };
    }
    
    // ... rest of query logic
  }
}
```

### 3. Frontend Components

#### City Corporation Management Page (Admin)
```typescript
interface CityCorpora tionManagementProps {}

const CityCorpora tionManagement: React.FC = () => {
  const [cityCorps, setCityCorps] = useState<CityCorpora tion[]>([]);
  const [selectedCityCorpora tion, setSelectedCityCorpora tion] = useState<CityCorpora tion | null>(null);
  const [thanas, setThanas] = useState<Thana[]>([]);
  
  // Fetch city corporations
  useEffect(() => {
    fetchCityCorpora tions();
  }, []);
  
  // Fetch thanas when city corporation is selected
  useEffect(() => {
    if (selectedCityCorpora tion) {
      fetchThanas(selectedCityCorpora tion.code);
    }
  }, [selectedCityCorpora tion]);
  
  return (
    <MainLayout>
      <Box>
        {/* City Corporation List */}
        <CityCorpora tionList 
          cityCorps={cityCorps}
          onSelect={setSelectedCityCorpora tion}
          onAdd={handleAddCityCorpora tion}
          onEdit={handleEditCityCorpora tion}
        />
        
        {/* Thana Management for Selected City Corporation */}
        {selectedCityCorpora tion && (
          <ThanaManagement
            cityCorpora tion={selectedCityCorpora tion}
            thanas={thanas}
            onAddThana={handleAddThana}
            onEditThana={handleEditThana}
          />
        )}
      </Box>
    </MainLayout>
  );
};
```

#### Enhanced User Management Page
```typescript
const UserManagement: React.FC = () => {
  const [cityCorps, setCityCorps] = useState<CityCorpora tion[]>([]);
  const [selectedCityCorpora tion, setSelectedCityCorpora tion] = useState<string>('ALL');
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [selectedThana, setSelectedThana] = useState<number | null>(null);
  const [wardRange, setWardRange] = useState<{ min: number; max: number }>({ min: 1, max: 100 });
  const [thanas, setThanas] = useState<Thana[]>([]);
  
  // Fetch city corporations on mount
  useEffect(() => {
    fetchCityCorpora tions();
  }, []);
  
  // Update ward range and thanas when city corporation changes
  useEffect(() => {
    if (selectedCityCorpora tion !== 'ALL') {
      const cityCorpora tion = cityCorps.find(cc => cc.code === selectedCityCorpora tion);
      if (cityCorpora tion) {
        setWardRange({ min: cityCorpora tion.minWard, max: cityCorpora tion.maxWard });
        fetchThanas(cityCorpora tion.code);
      }
    } else {
      setWardRange({ min: 1, max: 100 });
      setThanas([]);
    }
    setSelectedWard('ALL');
    setSelectedThana(null);
  }, [selectedCityCorpora tion]);
  
  // Fetch users with filters
  useEffect(() => {
    fetchUsers({
      cityCorpora tionCode: selectedCityCorpora tion !== 'ALL' ? selectedCityCorpora tion : undefined,
      ward: selectedWard !== 'ALL' ? selectedWard : undefined,
      thanaId: selectedThana || undefined,
    });
  }, [selectedCityCorpora tion, selectedWard, selectedThana]);
  
  return (
    <MainLayout>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {/* City Corporation Filter */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>City Corporation</InputLabel>
          <Select
            value={selectedCityCorpora tion}
            onChange={(e) => setSelectedCityCorpora tion(e.target.value)}
          >
            <MenuItem value="ALL">All City Corporations</MenuItem>
            {cityCorps.map(cc => (
              <MenuItem key={cc.code} value={cc.code}>{cc.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Ward Filter */}
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Ward</InputLabel>
          <Select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            disabled={selectedCityCorpora tion === 'ALL'}
          >
            <MenuItem value="ALL">All Wards</MenuItem>
            {Array.from(
              { length: wardRange.max - wardRange.min + 1 },
              (_, i) => wardRange.min + i
            ).map(ward => (
              <MenuItem key={ward} value={ward.toString()}>Ward {ward}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Thana Filter */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Thana/Area</InputLabel>
          <Select
            value={selectedThana || ''}
            onChange={(e) => setSelectedThana(e.target.value ? Number(e.target.value) : null)}
            disabled={selectedCityCorpora tion === 'ALL' || thanas.length === 0}
          >
            <MenuItem value="">All Thanas</MenuItem>
            {thanas.map(thana => (
              <MenuItem key={thana.id} value={thana.id}>{thana.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      {/* User Table */}
      <UserTable users={users} />
    </MainLayout>
  );
};
```

#### Enhanced Signup Page (Mobile)
```dart
class _SignUpPageState extends State<SignUpPage> {
  List<CityCorpora tion> _cityCorpora tions = [];
  CityCorpora tion? _selectedCityCorpora tion;
  List<Thana> _thanas = [];
  Thana? _selectedThana;
  int? _selectedWard;
  
  @override
  void initState() {
    super.initState();
    _loadCityCorpora tions();
  }
  
  Future<void> _loadCityCorpora tions() async {
    final cityCorps = await _auth.getActiveCityCorpora tions();
    setState(() {
      _cityCorpora tions = cityCorps;
    });
  }
  
  Future<void> _onCityCorpora tionChanged(CityCorpora tion? cityCorpora tion) async {
    setState(() {
      _selectedCityCorpora tion = cityCorpora tion;
      _selectedWard = null;
      _selectedThana = null;
      _thanas = [];
    });
    
    if (cityCorpora tion != null) {
      final thanas = await _auth.getThanasByCityCorpora tion(cityCorpora tion.code);
      setState(() {
        _thanas = thanas;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Form(
        child: Column(
          children: [
            // ... other fields ...
            
            // City Corporation Dropdown
            DropdownButtonFormField<CityCorpora tion>(
              value: _selectedCityCorpora tion,
              decoration: InputDecoration(labelText: 'City Corporation'),
              items: _cityCorpora tions.map((cc) {
                return DropdownMenuItem(
                  value: cc,
                  child: Text(cc.name),
                );
              }).toList(),
              onChanged: _onCityCorpora tionChanged,
              validator: (v) => v == null ? 'Select city corporation' : null,
            ),
            
            // Ward Dropdown (dynamic range)
            if (_selectedCityCorpora tion != null)
              DropdownButtonFormField<int>(
                value: _selectedWard,
                decoration: InputDecoration(
                  labelText: 'Ward (${_selectedCityCorpora tion!.minWard}-${_selectedCityCorpora tion!.maxWard})'
                ),
                items: List.generate(
                  _selectedCityCorpora tion!.maxWard - _selectedCityCorpora tion!.minWard + 1,
                  (i) => _selectedCityCorpora tion!.minWard + i,
                ).map((ward) {
                  return DropdownMenuItem(
                    value: ward,
                    child: Text('Ward $ward'),
                  );
                }).toList(),
                onChanged: (v) => setState(() => _selectedWard = v),
              ),
            
            // Thana Dropdown
            if (_thanas.isNotEmpty)
              DropdownButtonFormField<Thana>(
                value: _selectedThana,
                decoration: InputDecoration(labelText: 'Thana/Area (Optional)'),
                items: _thanas.map((thana) {
                  return DropdownMenuItem(
                    value: thana,
                    child: Text(thana.name),
                  );
                }).toList(),
                onChanged: (v) => setState(() => _selectedThana = v),
              ),
            
            // ... submit button ...
          ],
        ),
      ),
    );
  }
}
```

## Data Models

### City Corporation Model
```typescript
interface CityCorpora tion {
  id: number;
  code: string;
  name: string;
  minWard: number;
  maxWard: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
  
  // Statistics
  totalUsers?: number;
  totalComplaints?: number;
  activeThanas?: number;
}
```

### Thana Model
```typescript
interface Thana {
  id: number;
  name: string;
  cityCorpora tionId: number;
  cityCorpora tion?: CityCorpora tion;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
  
  // Statistics
  totalUsers?: number;
  totalComplaints?: number;
}
```

### Enhanced User Model
```typescript
interface User {
  // ... existing fields ...
  cityCorpora tionCode: string;
  cityCorpora tion?: CityCorpora tion;
  ward: string;
  thanaId?: number;
  thana?: Thana;
}
```

## API Endpoints

### City Corporation Management

```
GET    /api/admin/city-corporations
       Query: ?status=ACTIVE|INACTIVE|ALL
       Response: { cityCorpora tions: CityCorpora tion[] }

GET    /api/admin/city-corporations/:code
       Response: { cityCorpora tion: CityCorpora tion }

POST   /api/admin/city-corporations
       Body: CreateCityCorpora tionDto
       Response: { cityCorpora tion: CityCorpora tion }

PUT    /api/admin/city-corporations/:code
       Body: UpdateCityCorpora tionDto
       Response: { cityCorpora tion: CityCorpora tion }

GET    /api/admin/city-corporations/:code/statistics
       Response: { totalUsers, totalComplaints, resolvedComplaints, activeThanas }
```

### Thana Management

```
GET    /api/admin/thanas
       Query: ?cityCorpora tionCode=DSCC&status=ACTIVE
       Response: { thanas: Thana[] }

GET    /api/admin/thanas/:id
       Response: { thana: Thana }

POST   /api/admin/thanas
       Body: CreateThanaDto
       Response: { thana: Thana }

PUT    /api/admin/thanas/:id
       Body: UpdateThanaDto
       Response: { thana: Thana }

GET    /api/admin/thanas/:id/statistics
       Response: { totalUsers, totalComplaints }
```

### Public Endpoints (for mobile app)

```
GET    /api/city-corporations/active
       Response: { cityCorpora tions: CityCorpora tion[] }

GET    /api/city-corporations/:code/thanas
       Response: { thanas: Thana[] }
```

### Enhanced User Management

```
GET    /api/admin/users
       Query: ?cityCorpora tionCode=DSCC&ward=10&thanaId=5
       Response: { users: User[], pagination: {...} }

GET    /api/admin/users/statistics
       Query: ?cityCorpora tionCode=DSCC
       Response: { totalUsers, totalComplaints, resolvedComplaints }
```

### Enhanced Complaint Management

```
GET    /api/admin/complaints
       Query: ?cityCorpora tionCode=DSCC&ward=10&thanaId=5
       Response: { complaints: Complaint[], pagination: {...} }
```

## Error Handling

### Validation Errors

1. **Invalid City Corporation**: When user selects non-existent or inactive city corporation
2. **Invalid Ward Range**: When ward number is outside city corporation's range
3. **Invalid Thana**: When thana doesn't belong to selected city corporation
4. **Duplicate City Corporation Code**: When creating city corporation with existing code
5. **Duplicate Thana Name**: When creating thana with existing name in same city corporation

### Error Response Format
```typescript
{
  success: false,
  message: "Ward must be between 1 and 75 for DSCC",
  error: {
    field: "ward",
    code: "INVALID_WARD_RANGE",
    details: {
      minWard: 1,
      maxWard: 75,
      providedWard: 80
    }
  }
}
```

## Testing Strategy

### Unit Tests
- City Corporation Service CRUD operations
- Thana Service CRUD operations
- Ward range validation logic
- City corporation-thana relationship validation

### Integration Tests
- User signup with city corporation validation
- User filtering by city corporation, ward, and thana
- Complaint filtering by city corporation
- Chat filtering by city corporation and thana

### End-to-End Tests
- Admin creates new city corporation and adds thanas
- User signs up with new city corporation
- Admin filters users by new city corporation
- Complaints are properly associated with user's city corporation

## Migration Strategy

### Phase 1: Database Migration
1. Create CityCorpora tion and Thana tables
2. Add cityCorpora tionCode and thanaId to User table
3. Migrate existing DSCC/DNCC data:
   - Create DSCC city corporation (code: "DSCC", minWard: 1, maxWard: 75)
   - Create DNCC city corporation (code: "DNCC", minWard: 1, maxWard: 54)
   - Create thanas for DSCC and DNCC
   - Update existing users' cityCorpora tionCode based on their zone field

### Phase 2: Backend Implementation
1. Implement City Corporation Service
2. Implement Thana Service
3. Update Auth Service for validation
4. Update User Management Service for filtering
5. Update Complaint Service for city corporation association

### Phase 3: Frontend Implementation
1. Create City Corporation Management page
2. Update User Management page with filters
3. Update Complaint Management page with filters
4. Update Chat page with filters
5. Update Dashboard with city corporation statistics

### Phase 4: Mobile App Update
1. Update signup page with dynamic city corporation dropdown
2. Update ward dropdown to use city corporation's range
3. Update thana dropdown to fetch from API

## Performance Considerations

1. **Database Indexes**: Create indexes on cityCorpora tionCode, ward, and thanaId in User table
2. **Caching**: Cache active city corporations and thanas in Redis
3. **Lazy Loading**: Load thanas only when city corporation is selected
4. **Pagination**: Implement pagination for large user and complaint lists
5. **Query Optimization**: Use database joins efficiently to avoid N+1 queries

## Security Considerations

1. **Role-Based Access**: Only SUPER_ADMIN can manage city corporations and thanas
2. **Input Validation**: Validate all city corporation and thana data on backend
3. **SQL Injection Prevention**: Use Prisma's parameterized queries
4. **Audit Logging**: Log all city corporation and thana management actions
5. **Data Integrity**: Use foreign key constraints to maintain referential integrity

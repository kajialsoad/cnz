# Admin Chat API - City Corporation & Thana Filters Reference

## Quick Reference

### Endpoint
```
GET /api/admin/chats
```

### New Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `cityCorporationCode` | string | No | Filter by city corporation | `DSCC`, `DNCC`, `ALL` |
| `thanaId` | number | No | Filter by thana/area | `5`, `12` |

### Existing Parameters (Still Supported)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Search in title, description, location, user name |
| `district` | string | No | Filter by district |
| `upazila` | string | No | Filter by upazila |
| `ward` | string | No | Filter by ward |
| `zone` | string | No | Filter by zone (legacy) |
| `status` | string | No | Filter by complaint status |
| `unreadOnly` | boolean | No | Show only unread chats |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |

## Response Format

### Chat List Response
```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "complaintId": 123,
        "trackingNumber": "C000123",
        "complaintTitle": "Waste not collected",
        "complaintCategory": "Waste",
        "complaintStatus": "PENDING",
        "complaintCreatedAt": "2024-01-15T09:00:00Z",
        "citizen": {
          "id": 456,
          "firstName": "John",
          "lastName": "Doe",
          "phone": "01712345678",
          "email": "john@example.com",
          "district": "Dhaka",
          "upazila": "Dhanmondi",
          "ward": "10",
          "zone": "DSCC",
          "cityCorporationCode": "DSCC",
          "cityCorporation": {
            "code": "DSCC",
            "name": "Dhaka South City Corporation"
          },
          "thanaId": 5,
          "thana": {
            "id": 5,
            "name": "Dhanmondi"
          },
          "address": "123 Main Street",
          "profilePicture": "https://example.com/avatar.jpg"
        },
        "lastMessage": {
          "id": 789,
          "text": "We are working on it",
          "timestamp": "2024-01-15T10:30:00Z",
          "senderType": "ADMIN"
        },
        "unreadCount": 2,
        "totalMessages": 0,
        "isNew": true,
        "lastActivity": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## Usage Examples

### Example 1: Get All Chats
```bash
curl -X GET "http://localhost:3000/api/admin/chats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 2: Filter by DSCC
```bash
curl -X GET "http://localhost:3000/api/admin/chats?cityCorporationCode=DSCC" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 3: Filter by DNCC
```bash
curl -X GET "http://localhost:3000/api/admin/chats?cityCorporationCode=DNCC" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 4: Filter by Thana
```bash
curl -X GET "http://localhost:3000/api/admin/chats?thanaId=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 5: Combined Filter (DSCC + Thana)
```bash
curl -X GET "http://localhost:3000/api/admin/chats?cityCorporationCode=DSCC&thanaId=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 6: With Pagination
```bash
curl -X GET "http://localhost:3000/api/admin/chats?cityCorporationCode=DSCC&page=2&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 7: Complex Query
```bash
curl -X GET "http://localhost:3000/api/admin/chats?cityCorporationCode=DSCC&thanaId=5&status=PENDING&search=waste&unreadOnly=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend Integration

### React/TypeScript Example

```typescript
import { useState, useEffect } from 'react';
import { chatService } from '../services/chatService';

function AdminChatPage() {
  const [chats, setChats] = useState([]);
  const [cityCorporations, setCityCorporations] = useState([]);
  const [thanas, setThanas] = useState([]);
  const [selectedCityCorp, setSelectedCityCorp] = useState('ALL');
  const [selectedThana, setSelectedThana] = useState(null);

  // Fetch city corporations on mount
  useEffect(() => {
    fetchCityCorporations();
  }, []);

  // Fetch thanas when city corporation changes
  useEffect(() => {
    if (selectedCityCorp !== 'ALL') {
      fetchThanas(selectedCityCorp);
    } else {
      setThanas([]);
      setSelectedThana(null);
    }
  }, [selectedCityCorp]);

  // Fetch chats when filters change
  useEffect(() => {
    fetchChats();
  }, [selectedCityCorp, selectedThana]);

  const fetchCityCorporations = async () => {
    const response = await fetch('/api/city-corporations/active');
    const data = await response.json();
    setCityCorporations(data.data.cityCorporations);
  };

  const fetchThanas = async (cityCorpCode) => {
    const response = await fetch(`/api/city-corporations/${cityCorpCode}/thanas`);
    const data = await response.json();
    setThanas(data.data.thanas);
  };

  const fetchChats = async () => {
    const params = {
      cityCorporationCode: selectedCityCorp !== 'ALL' ? selectedCityCorp : undefined,
      thanaId: selectedThana || undefined
    };

    const response = await chatService.getChatConversations(params);
    setChats(response.chats);
  };

  return (
    <div>
      {/* City Corporation Filter */}
      <select 
        value={selectedCityCorp} 
        onChange={(e) => setSelectedCityCorp(e.target.value)}
      >
        <option value="ALL">All City Corporations</option>
        {cityCorporations.map(cc => (
          <option key={cc.code} value={cc.code}>{cc.name}</option>
        ))}
      </select>

      {/* Thana Filter */}
      {selectedCityCorp !== 'ALL' && (
        <select 
          value={selectedThana || ''} 
          onChange={(e) => setSelectedThana(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All Thanas</option>
          {thanas.map(thana => (
            <option key={thana.id} value={thana.id}>{thana.name}</option>
          ))}
        </select>
      )}

      {/* Chat List */}
      {chats.map(chat => (
        <div key={chat.complaintId}>
          <h3>{chat.complaintTitle}</h3>
          <p>
            {chat.citizen.firstName} {chat.citizen.lastName} - 
            {chat.citizen.cityCorporation?.name} - 
            {chat.citizen.thana?.name}
          </p>
        </div>
      ))}
    </div>
  );
}
```

### Service Layer Example

```typescript
// chatService.ts
export interface ChatFilters {
  cityCorporationCode?: string;
  thanaId?: number;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const chatService = {
  async getChatConversations(filters: ChatFilters = {}) {
    const params = new URLSearchParams();
    
    if (filters.cityCorporationCode) {
      params.append('cityCorporationCode', filters.cityCorporationCode);
    }
    if (filters.thanaId) {
      params.append('thanaId', filters.thanaId.toString());
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.status) {
      params.append('status', filters.status);
    }
    if (filters.page) {
      params.append('page', filters.page.toString());
    }
    if (filters.limit) {
      params.append('limit', filters.limit.toString());
    }

    const response = await fetch(`/api/admin/chats?${params}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });

    return response.json();
  }
};
```

## Filter Behavior

### City Corporation Filter
- **Value**: `DSCC`, `DNCC`, or any city corporation code
- **Special**: `ALL` or omitted = no filter
- **Effect**: Shows only chats from users in that city corporation

### Thana Filter
- **Value**: Numeric thana ID
- **Effect**: Shows only chats from users in that thana
- **Note**: Can be combined with city corporation filter

### Combined Filters
- Filters are applied with AND logic
- Example: `cityCorporationCode=DSCC&thanaId=5` shows only chats from DSCC users in thana 5

### Backward Compatibility
- Old `zone` parameter still works
- Old `ward` parameter still works
- Can mix old and new filters
- Response includes both old and new fields

## Error Handling

### Invalid City Corporation
```json
{
  "success": true,
  "data": {
    "chats": [],
    "pagination": {
      "total": 0
    }
  }
}
```
Note: Invalid city corporation returns empty results (not an error)

### Invalid Thana ID
```json
{
  "success": true,
  "data": {
    "chats": [],
    "pagination": {
      "total": 0
    }
  }
}
```
Note: Invalid thana ID returns empty results (not an error)

### Authentication Error
```json
{
  "success": false,
  "message": "Unauthorized"
}
```
Status Code: 401

### Server Error
```json
{
  "success": false,
  "message": "Failed to fetch chat conversations"
}
```
Status Code: 500

## Performance Tips

### Caching
- Cache city corporation list (rarely changes)
- Cache thana list per city corporation
- Consider Redis for frequently accessed data

### Pagination
- Always use pagination for large datasets
- Default limit is 20, adjust as needed
- Use `hasNextPage` to implement infinite scroll

### Indexing
- Database has indexes on `cityCorporationCode` and `thanaId`
- Queries are optimized for performance
- No additional optimization needed

## Testing

### Test with cURL
```bash
# Get all chats
curl -X GET "http://localhost:3000/api/admin/chats" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by DSCC
curl -X GET "http://localhost:3000/api/admin/chats?cityCorporationCode=DSCC" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by thana
curl -X GET "http://localhost:3000/api/admin/chats?thanaId=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Script
```bash
cd server
node tests/test-admin-chat-filters.js
```

## Related Endpoints

### Get City Corporations
```
GET /api/city-corporations/active
```

### Get Thanas for City Corporation
```
GET /api/city-corporations/:code/thanas
```

### Get Chat Messages
```
GET /api/admin/chats/:complaintId/messages
```
Note: Also includes city corporation and thana in citizen details

## Migration Notes

### From Old System
- Old `zone` field maps to `cityCorporationCode`
- DSCC zone → DSCC city corporation
- DNCC zone → DNCC city corporation
- Both fields available during transition

### Data Migration
- No migration needed (already done in Task 1)
- All users have `cityCorporationCode` and `thanaId`
- Old `zone` field preserved for compatibility

---

**Last Updated**: November 20, 2025
**Version**: 1.0
**Status**: Production Ready

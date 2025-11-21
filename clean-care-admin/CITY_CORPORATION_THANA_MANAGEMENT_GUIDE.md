# City Corporation & Thana Management Guide

## Overview
The City Corporation Management page allows you to manage city corporations and their associated thanas (areas). You can add, edit, and activate/deactivate both city corporations and thanas.

## How to Access
1. Login to the Admin Panel
2. Click on "City Corporations" in the sidebar menu
3. You'll see the City Corporation Management page

## Managing City Corporations

### View All City Corporations
The main table shows all city corporations with:
- Code (e.g., DSCC, DNCC)
- Name
- Ward Range
- Status (Active/Inactive)
- Total Users
- Total Complaints
- Active Thanas count
- Created date
- Action buttons

### Add New City Corporation
1. Click the green "Add City Corporation" button at the top right
2. Fill in the form:
   - **Code**: Unique identifier (e.g., DSCC, DNCC)
   - **Name**: Full name (e.g., Dhaka South City Corporation)
   - **Min Ward**: Starting ward number (e.g., 1)
   - **Max Ward**: Ending ward number (e.g., 75)
3. Click "Create" to save

### Edit City Corporation
1. Click the blue Edit icon (pencil) in the Actions column
2. Update the information in the form
3. Click "Save Changes"

### Activate/Deactivate City Corporation
1. Click the red Cancel icon (for active) or green Check icon (for inactive) in the Actions column
2. The status will toggle immediately

## Managing Thanas for a City Corporation

### View Thanas
1. **Click on any city corporation row** in the table
2. The Thana Management section will appear below the city corporations table
3. You'll see all thanas for that city corporation

### Add New Thana
1. Select a city corporation by clicking on its row
2. In the Thana Management section, click the green "Add Thana" button
3. Fill in the form:
   - **Thana Name**: Name of the area (e.g., Dhanmondi, Gulshan, Mirpur)
4. Click "Create" to save
5. The new thana will be automatically associated with the selected city corporation

### Edit Thana
1. Select a city corporation to view its thanas
2. Click the blue Edit icon (pencil) next to the thana you want to edit
3. Update the information:
   - **Thana Name**: Change the name
   - **Status**: Change between Active/Inactive
4. Click "Save Changes"

### Activate/Deactivate Thana
1. Select a city corporation to view its thanas
2. Click the red Cancel icon (for active) or green Check icon (for inactive) next to the thana
3. The status will toggle immediately

## Features

### Color-Coded Status
- **Green badge**: Active
- **Red badge**: Inactive

### Statistics Display
Each city corporation shows:
- 🔵 Blue badge: Total Users
- 🟠 Orange badge: Total Complaints
- 🟣 Purple badge: Active Thanas

Each thana shows:
- 🔵 Blue badge: Total Users
- 🟠 Orange badge: Total Complaints

### Visual Feedback
- Selected city corporation row is highlighted in light blue
- Hover effects on rows and buttons
- Toast notifications for successful operations
- Error alerts for failed operations

## Example Workflow

### Adding a New City Corporation with Thanas

1. **Add City Corporation**
   - Click "Add City Corporation"
   - Code: `DSCC`
   - Name: `Dhaka South City Corporation`
   - Min Ward: `1`
   - Max Ward: `75`
   - Click "Create"

2. **Add Thanas**
   - Click on the newly created DSCC row
   - Click "Add Thana"
   - Name: `Dhanmondi`
   - Click "Create"
   - Repeat for other thanas (Hazaribagh, Kalabagan, etc.)

3. **Verify**
   - The city corporation table will show the updated Active Thanas count
   - The Thana Management section will show all added thanas

## Tips

1. **Always select a city corporation first** before managing its thanas
2. **Use meaningful names** for thanas that users will recognize
3. **Deactivate instead of delete** to preserve historical data
4. **Check statistics** to see which areas have the most users/complaints
5. **The thana dropdown in User Management** will automatically show thanas from the selected city corporation

## Troubleshooting

### "No thanas available" in User Management
- Make sure the city corporation has active thanas
- Check that the thanas are set to "ACTIVE" status
- Verify the thana service is working (check browser console for errors)

### Can't see Thana Management section
- Make sure you've clicked on a city corporation row to select it
- The section appears below the city corporations table

### Changes not saving
- Check your internet connection
- Verify you're logged in as an admin
- Check the browser console for error messages

## Date
November 21, 2025

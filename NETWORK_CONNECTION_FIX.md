# Network Connection Fix - "No route to host" Error

## Problem
App shows: `No route to host (errno = 113)` when trying to connect to `192.168.0.103:4000`

## Solutions (Try in order):

### Solution 1: Check Same WiFi Network
**Phone ar computer MUST be on the SAME WiFi network!**

1. Computer WiFi check korun: Settings → Network → WiFi
2. Phone WiFi check korun: Settings → WiFi
3. **Same network name** dekhun

### Solution 2: Temporarily Disable Windows Firewall (Testing Only)

**PowerShell (Run as Administrator):**
```powershell
# Disable firewall temporarily
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# Test your app now

# Re-enable firewall after testing
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

### Solution 3: Add Specific Firewall Rule

**PowerShell (Run as Administrator):**
```powershell
# Remove old rules
netsh advfirewall firewall delete rule name="Node Server"
netsh advfirewall firewall delete rule name="Node.js Server Port 4000"

# Add new rule for all profiles
netsh advfirewall firewall add rule name="Node Server 4000" dir=in action=allow protocol=TCP localport=4000 profile=any

# Verify
netsh advfirewall firewall show rule name="Node Server 4000"
```

### Solution 4: Check if Server is Listening on All Interfaces

Your server should listen on `0.0.0.0` not just `localhost`.

Check `server/src/index.ts` - it should have:
```typescript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
```

### Solution 5: Test Connection from Computer

**PowerShell:**
```powershell
# Test if server is responding
curl http://192.168.0.103:4000/api/health

# Or use browser
# Open: http://192.168.0.103:4000/api/health
```

### Solution 6: Use Mobile Hotspot (Alternative)

If WiFi not working:
1. Turn on **Mobile Hotspot** on your phone
2. Connect computer to phone's hotspot
3. Run `ipconfig` to get new IP
4. Update `lib/config/api_config.dart` with new IP
5. Rebuild Flutter app

## Quick Test Commands

```powershell
# 1. Check current IP
ipconfig

# 2. Check if port 4000 is listening
netstat -an | findstr :4000

# 3. Test server locally
curl http://localhost:4000/api/health

# 4. Test server from network IP
curl http://192.168.0.103:4000/api/health
```

## Current Configuration

- Computer IP: `192.168.0.103`
- Server Port: `4000`
- Server URL: `http://192.168.0.103:4000`
- Flutter Config: `lib/config/api_config.dart` ✅ Updated

## If Nothing Works

Use **ngrok** for temporary testing:

```bash
# Install ngrok: https://ngrok.com/download
# Then run:
ngrok http 4000

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Update Flutter config with that URL
```

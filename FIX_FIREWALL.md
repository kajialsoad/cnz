# Firewall Fix - Run as Administrator

## Problem
Mobile IP: `192.168.0.106` ✅  
Computer IP: `192.168.0.103` ✅  
Same network but firewall blocking!

## Solution

**Open PowerShell as Administrator:**
1. Press Windows key
2. Type "PowerShell"
3. Right-click "Windows PowerShell"
4. Click "Run as administrator"

**Then run these commands:**

```powershell
# Add firewall rule for port 4000
netsh advfirewall firewall add rule name="Node Server 4000" dir=in action=allow protocol=TCP localport=4000 profile=any enable=yes

# Verify the rule was added
netsh advfirewall firewall show rule name="Node Server 4000"
```

## After Adding Rule

1. **Restart your Flutter app** (stop and run again)
2. **Try login** - it should work now!

## Alternative: Temporarily Disable Firewall (Testing Only)

```powershell
# Disable firewall (Run as Administrator)
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# Test your app

# Re-enable firewall
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

## Verify Connection

After adding firewall rule, test from your phone's browser:
```
http://192.168.0.103:4000/api/health
```

Should show: `{"ok":true,"status":"healthy"}`

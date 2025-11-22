@echo off
echo Adding comprehensive firewall rules for Node Server...

REM Delete any existing rules
netsh advfirewall firewall delete rule name="Node Server 4000"
netsh advfirewall firewall delete rule name="Node Server 4000 All"
netsh advfirewall firewall delete rule name="Node.js Server Port 4000"

REM Add inbound rule for all profiles
netsh advfirewall firewall add rule name="Node Server 4000 TCP" dir=in action=allow protocol=TCP localport=4000 profile=any enable=yes

REM Add outbound rule for all profiles
netsh advfirewall firewall add rule name="Node Server 4000 TCP Out" dir=out action=allow protocol=TCP localport=4000 profile=any enable=yes

REM Show the rules
echo.
echo Firewall rules added successfully!
echo.
netsh advfirewall firewall show rule name="Node Server 4000 TCP"

echo.
echo Done! Now test your app.
pause

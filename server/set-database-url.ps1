$dbUrl = "mysql://cleancar_munna:mylovema2@ultra.webfastdns.com:3306/cleancar_munna?sslmode=disable"
$dbUrl | vercel env add DATABASE_URL production

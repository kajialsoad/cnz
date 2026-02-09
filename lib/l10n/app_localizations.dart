class AppLocalizations {
  final String languageCode;

  AppLocalizations(this.languageCode);

  static AppLocalizations of(String languageCode) {
    return AppLocalizations(languageCode);
  }

  bool get isBangla => languageCode == 'bn';

  // Common
  String get appName => isBangla ? 'ক্লিন কেয়ার' : 'Clean Care';
  String get yourCityYourCare => isBangla ? 'আপনার শহর, আপনার যত্ন' : 'Your City, Your Care';
  String get loading => isBangla ? 'লোড হচ্ছে...' : 'Loading...';
  String get error => isBangla ? 'ত্রুটি' : 'Error';
  String get retry => isBangla ? 'আবার চেষ্টা করুন' : 'Retry';
  String get cancel => isBangla ? 'বাতিল' : 'Cancel';
  String get ok => isBangla ? 'ঠিক আছে' : 'OK';
  String get save => isBangla ? 'সংরক্ষণ করুন' : 'Save';
  String get edit => isBangla ? 'সম্পাদনা' : 'Edit';
  String get delete => isBangla ? 'মুছুন' : 'Delete';
  String get submit => isBangla ? 'জমা দিন' : 'Submit';
  String get close => isBangla ? 'বন্ধ করুন' : 'Close';

  // Welcome Screen
  String get welcomeTitle => isBangla ? 'স্বাগতম' : 'Welcome';
  String get welcomeSubtitle => isBangla 
      ? 'আপনার শহরকে পরিষ্কার রাখতে আমরা প্রতিশ্রুতিবদ্ধ। আধুনিক প্রযুক্তির মাধ্যমে সেবা পৌঁছে দিচ্ছি আপনাদের দোরগোড়ায়।'
      : 'We are committed to keeping your city clean. Delivering services to your doorstep through modern technology.';
  String get getStarted => isBangla ? 'শুরু করুন' : 'Get Started';
  String get login => isBangla ? 'লগইন' : 'Login';
  String get signup => isBangla ? 'সাইন আপ' : 'Sign Up';

  // Login Page
  String get welcomeBack => isBangla ? 'আবার স্বাগতম' : 'Welcome Back';
  String get loginToContinue => isBangla ? 'ক্লিন কেয়ারে চালিয়ে যেতে লগইন করুন' : 'Login to continue to Clean Care';
  String get phoneNumber => isBangla ? 'ফোন নম্বর' : 'Phone Number';
  String get phoneHint => isBangla ? '+৮৮০ ১XXX-XXXXXX' : '+880 1XXX-XXXXXX';
  String get password => isBangla ? 'পাসওয়ার্ড' : 'Password';
  String get passwordHint => isBangla ? 'আপনার পাসওয়ার্ড লিখুন' : 'Enter your password';
  String get forgotPassword => isBangla ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?';
  String get loginButton => isBangla ? 'লগইন' : 'Login';
  String get dontHaveAccount => isBangla ? 'অ্যাকাউন্ট নেই? ' : "Don't have an account? ";
  String get signupLink => isBangla ? 'সাইন আপ' : 'Sign Up';
  String get loginSuccess => isBangla ? 'লগইন সফল! ✓' : 'Login successful! ✓';
  String get loginFailed => isBangla ? 'লগইন ব্যর্থ' : 'Login failed';

  // Signup Page
  String get createAccount => isBangla ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account';
  String get fullName => isBangla ? 'পূর্ণ নাম' : 'Full Name';
  String get email => isBangla ? 'ইমেইল' : 'Email';
  String get emailHint => isBangla ? 'your.email@example.com' : 'your.email@example.com';
  String get createPassword => isBangla ? 'পাসওয়ার্ড তৈরি করুন' : 'Create a strong password';
  String get agreeToTerms => isBangla ? 'আমি সম্মত ' : 'I agree to the ';
  String get termsAndConditions => isBangla ? 'শর্তাবলী' : 'Terms & Conditions';
  String get and => isBangla ? ' এবং ' : ' and ';
  String get privacyPolicy => isBangla ? 'গোপনীয়তা নীতি' : 'Privacy Policy';
  String get createAccountButton => isBangla ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account';
  String get alreadyHaveAccount => isBangla ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? ' : 'Already have an account? ';
  String get loginLink => isBangla ? 'লগইন' : 'Login';

  // Home Page
  String get home => isBangla ? 'হোম' : 'Home';
  String get customerCare => isBangla ? 'কাস্টমার কেয়ার' : 'Customer Care';
  String get support247 => isBangla ? '২৪/৭ সহায়তা' : '24/7 Support';
  String get liveChat => isBangla ? 'লাইভ চ্যাট' : 'Live Chat';
  String get instantHelp => isBangla ? 'তাৎক্ষণিক সাহায্য' : 'Instant Help';
  String get paymentGateway => isBangla ? 'পেমেন্ট গেটওয়ে' : 'Payment Gateway';
  String get payBills => isBangla ? 'বিল পরিশোধ' : 'Pay Bills';
  String get donation => isBangla ? 'দান' : 'Donation';
  String get helpCity => isBangla ? 'শহরকে সাহায্য করুন' : 'Help City';
  String get emergency => isBangla ? 'জরুরি' : 'Emergency';
  String get quickResponse => isBangla ? 'দ্রুত সাড়া' : 'Quick Response';
  String get wasteManagement => isBangla ? 'বর্জ্য ব্যবস্থাপনা' : 'Waste Management';
  String get schedulePickup => isBangla ? 'পিকআপ সময়সূচী' : 'Schedule Pickup';
  String get gallery => isBangla ? 'গ্যালারি' : 'Gallery';
  String get viewPhotos => isBangla ? 'ছবি দেখুন' : 'View Photos';
  String get complaint => isBangla ? 'অভিযোগ' : 'Complaint';
  String get reportIssue => isBangla ? 'সমস্যা রিপোর্ট করুন' : 'Report Issue';
  String get dsccWebsiteLinkText => isBangla 
      ? 'ডিএসসিসির অন্যান্য সেবা পেতে আমাদের ওয়েবসাইটে ভিজিট করুন।' 
      : 'Visit our website to get other DSCC services.';
  String get visitButton => isBangla ? 'ভিজিট করুন' : 'Visit';

  // Profile Settings
  String get profile => isBangla ? 'প্রোফাইল' : 'Profile';
  String get editProfile => isBangla ? 'প্রোফাইল সম্পাদনা' : 'Edit Profile';
  String get accountInformation => isBangla ? 'অ্যাকাউন্ট তথ্য' : 'Account Information';
  String get address => isBangla ? 'ঠিকানা' : 'Address';
  String get wardNumber => isBangla ? 'ওয়ার্ড নম্বর' : 'Ward Number';
  String get role => isBangla ? 'ভূমিকা' : 'Role';
  String get accountStatus => isBangla ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Account Status';
  String get settings => isBangla ? 'সেটিংস' : 'Settings';
  String get language => isBangla ? 'ভাষা / Language' : 'Language / ভাষা';
  String get pushNotifications => isBangla ? 'পুশ বিজ্ঞপ্তি' : 'Push Notifications';
  String get emailNotifications => isBangla ? 'ইমেইল বিজ্ঞপ্তি' : 'Email Notifications';
  String get logout => isBangla ? 'লগআউট' : 'Logout';
  String get logoutConfirm => isBangla ? 'আপনি কি লগআউট করতে চান?' : 'Are you sure you want to logout?';
  String get logoutSuccess => isBangla ? 'লগআউট সফল! ✓' : 'Logout successful! ✓';

  // Roles
  String get customer => isBangla ? 'গ্রাহক' : 'Customer';
  String get serviceProvider => isBangla ? 'সেবা প্রদানকারী' : 'Service Provider';
  String get admin => isBangla ? 'অ্যাডমিন' : 'Admin';
  String get superAdmin => isBangla ? 'সুপার অ্যাডমিন' : 'Super Admin';

  // Status
  String get active => isBangla ? 'সক্রিয়' : 'Active';
  String get pending => isBangla ? 'অপেক্ষমাণ' : 'Pending';
  String get suspended => isBangla ? 'স্থগিত' : 'Suspended';

  // Bottom Navigation
  String get qrScanner => isBangla ? 'QR স্ক্যানার' : 'QR Scanner';
  String get comingSoon => isBangla ? 'শীঘ্রই আসছে...' : 'Coming soon...';

  // Errors
  String get networkError => isBangla ? 'ইন্টারনেট সংযোগ চেক করুন' : 'Check your internet connection';
  String get serverError => isBangla ? 'সার্ভার সাড়া দিচ্ছে না' : 'Server not responding';
  String get invalidCredentials => isBangla ? 'ভুল ফোন নম্বর বা পাসওয়ার্ড' : 'Invalid phone or password';
  String get fieldRequired => isBangla ? 'এই ফিল্ডটি আবশ্যক' : 'This field is required';
}

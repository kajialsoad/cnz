## ত্রুটি সংক্ষেপ

* `flutter run` এ: `package identifier or launch activity not found`

* নির্দেশনা: `android\app\src\main\AndroidManifest.xml` চেক করতে বলা হয়েছে

* আরও বার্তা: `No application found for TargetPlatform.android_arm64`

## পাওয়া সমস্যা

* `android\app\src\main\AndroidManifest.xml:1` এ root `<manifest>` ট্যাগে `package` অ্যাট্রিবিউট নেই, ফলে `.MainActivity` রেজল্ভ হচ্ছে না

* `android\app\src\main\kotlin\com\example\clean_care_mobile_app\MainActivity.kt:1` এ ক্লাস প্যাকেজ `com.example.clean_care_mobile_app`

* Android Gradle কনফিগারেশন ফাইলগুলো অনুপস্থিত: `android\app\build.gradle`, `android\build.gradle`, `settings.gradle`, `gradle.properties`; এতে `${applicationName}` প্লেসহোল্ডারও রেজল্ভ হবে না

## করণীয় পরিকল্পনা

1. Manifest ঠিক করা

   * `android\app\src\main\AndroidManifest.xml:1` এ `<manifest ...>` এ `package="com.example.clean_care_mobile_app"` যোগ করা

   * `activity android:name=".MainActivity"` তখন `com.example.clean_care_mobile_app.MainActivity` হিসেবে রেজল্ভ হবে
2. Android স্ক্যাফোল্ড পুনরুদ্ধার (প্রস্তাবিত)

   * কমান্ড: `flutter create .` চালিয়ে Android (এবং iOS) ডিফল্ট Gradle স্ক্যাফোল্ড পুনরায় তৈরি করা; `lib` কোড অপরিবর্তিত থাকবে

   * এতে `android\build.gradle`, `android\app\build.gradle`, `settings.gradle`, `gradle.properties` যুক্ত হবে এবং `${applicationName}` প্লেসহোল্ডার সঠিকভাবে রেজল্ভ হবে
3. বিকল্প (ম্যানুয়াল রিস্টোর, যদি অটো-জেনারেশন না চান)

   * `android\build.gradle` ও `android\app\build.gradle` Flutter টেমপ্লেট অনুযায়ী যোগ করা

   * `defaultConfig` এ `applicationId "com.example.clean_care_mobile_app"`, `minSdkVersion`, `targetSdkVersion`, `versionCode`, `versionName` সেট করা

   * `manifestPlaceholders` এ `applicationName` প্লেসহোল্ডার সেট করা (টেমপ্লেট অনুযায়ী) যাতে `android:name="${applicationName}"` ভ্যালু পায়
4. ডিপেন্ডেন্সি সিঙ্ক ও রান

   * `flutter clean`

   * `flutter pub get`

   * `flutter run`

## যাচাই

* অ্যাপ ডিভাইসে লঞ্চ হবে, আর `No application found...` দেখাবে না

* `MainActivity` সঠিকভাবে রেজল্ভ হবে এবং লঞ্চার `intent-filter` কাজ করবে

## অতিরিক্ত নোট

* অ্যাপ আইডি/প্যাকেজ একীভূত রাখুন: Manifest `package` এবং Gradle `applicationId` একই

* `android:taskAffinity=""` থাকা ক্ষতিকর নয়

* স্টোরেজ পারমিশনগুলো নতুন Android ভার্সনে scoped storage প্রয়োজন হতে পারে; ভবিষ্যতে রিভিউ করা যাবে


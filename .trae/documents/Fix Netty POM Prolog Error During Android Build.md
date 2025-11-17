## সমস্যার সারাংশ
- Gradle classpath রেজল্যুশনের সময় io.netty-এর কয়েকটি POM ফাইল পার্স করতে গিয়ে “Content is not allowed in prolog” এরর দেখাচ্ছে (permission_handler_android কনফিগারেশনে)।
- ক্যাশ ক্লিয়ার ও রিপোজিটরি মিরর যোগ করেও এরর রয়ে গেছে, যা সাধারণত নেটওয়ার্ক/প্রোক্সি ইন্টারসেপশন বা Gradle মেটাডেটা রিডিরেকশনজনিত POM পার্সিং সমস্যার লক্ষণ।

## পরিকল্পিত কনফিগ পরিবর্তন
1. android/settings.gradle.kts
- dependencyResolutionManagement ব্লকে repositoriesMode: PREFER_PROJECT নিশ্চিত করা।
- repositories-এ `mavenLocal(), google(), mavenCentral(), repo1.maven.org, Google Maven mirror, gradlePluginPortal()` রাখা।
- repositories-এর ভিতরে metadataSources কনফিগ যোগ করা:
  - `metadataSources { mavenPom(); artifact(); ignoreGradleMetadataRedirection() }`

2. android/build.gradle.kts
- allprojects.repositories-এ `mavenLocal()` বজায় রাখা।
- subprojects.configurations.configureEach-এ resolutionStrategy:
  - `io.netty:*` → `4.1.75.Final` ফোর্স
  - `io.netty:netty-tcnative-classes` → `2.0.61.Final` ফোর্স
  - dependencySubstitution যোগ করে `io.grpc:grpc-netty` → `io.grpc:grpc-okhttp:1.48.1` সাবস্টিটিউট করা
  - প্রয়োজনে `failOnVersionConflict()` চালু করা

3. android/gradle.properties
- org.gradle.jvmargs-এ থাকা XML parser ফ্যাক্টরি প্রপার্টি রাখা
- `android.suppressUnsupportedCompileSdk=36` রাখা
- যুক্ত করা:
  - `systemProp.gradle.internal.http.disableUrlConnectionCache=true`
  - `org.gradle.caching=false` (টেম্পোরারি)

4. Flutter ডিপেন্ডেন্সি (pubspec.yaml)
- `permission_handler: ^12.0.1` রাখা (নতুন ভার্সন ইতিমধ্যেই সেট করা আছে)

## কমান্ড রান অর্ডার
- `flutter clean && flutter pub get`
- `cd android && .\gradlew.bat clean --no-daemon`
- `cd android && .\gradlew.bat assembleDebug --refresh-dependencies --no-daemon --info`
- সফল হলে `flutter run`

## বিকল্প (যদি একই এরর থাকে)
- settings.gradle.kts-এ component rules দিয়ে `io.grpc:grpc-netty`-এর ডিপেন্ডেন্সি সরাসরি সাবস্টিটিউট করা (pluginManagement-এর রিজোলিউশনে প্রযোজ্য)।
- অস্থায়ীভাবে নেটওয়ার্ক পরিবর্তন/প্রক্সি/এন্টিভাইরাস অফ করে পুনরায় বিল্ড।

## যাচাই
- assembleDebug সফল হওয়া ও অ্যাপ ডিভাইসে রান হওয়া যাচাই
- Gradle info লগে netty/grpc আর্টিফ্যাক্টগুলো সঠিক ভার্সনে রেজলভ হচ্ছে কিনা দেখা

অনুমোদন দিলে আমি উপরোক্ত কনফিগ পরিবর্তন ও কমান্ডগুলো চালিয়ে এরর রিজলভ করব।
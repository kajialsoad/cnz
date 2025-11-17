## সমস্যা ও কারণ
- Gradle classpath রেজল্যুশনের সময় io.netty এর কয়েকটি POM পার্স করতে গিয়ে “Content is not allowed in prolog” এরর হচ্ছে। এটি সাধারণত করাপ্টেড লোকাল ক্যাশ, নেটওয়ার্ক/প্রোক্সি ইন্টারসেপশন, বা পুরনো ট্রান্সিটিভ ডিপেনডেন্সি (grpc-netty → netty 4.1.72) থেকে আসে।

## করণীয় পরিবর্তন (ফাইল)
1. android/settings.gradle.kts
- dependencyResolutionManagement যুক্ত করে repositoriesMode: PREFER_PROJECT সেট করা
- repositories: `mavenLocal()`, `google()`, `mavenCentral()`, `repo1.maven.org`, Google mirror, `gradlePluginPortal()`

2. android/build.gradle.kts
- allprojects.repositories-এ `mavenLocal()` যোগ করা
- সব subprojects-এ `configurations.configureEach { resolutionStrategy.eachDependency { ... } }` দিয়ে netty ভার্সন ফোর্স করা:
  - `io.netty:*` → `4.1.75.Final`
  - `io.netty:netty-tcnative-classes` → `2.0.61.Final` (বা সাম্প্রতিক স্টেবল)
- (প্রয়োজনে) buildscript/configuration-এও একই resolutionStrategy প্রযোজ্য করা

3. android/gradle.properties
- `org.gradle.jvmargs`-এ XML parser ফ্যাক্টরি প্রপার্টি রাখা (যেমন `-Djavax.xml.parsers.DocumentBuilderFactory=com.sun.org.apache.xerces.internal.jaxp.DocumentBuilderFactoryImpl`)
- `android.suppressUnsupportedCompileSdk=36` যোগ করা

4. pubspec.yaml
- `permission_handler` আপডেট: `^12.0.1` (নতুন অ্যানড্রয়েড প্লাগইন দিয়ে পুরনো grpc/netty চেইন কমে)

## ক্যাশ/নেটওয়ার্ক স্টেপ
- Gradle ক্যাশ পুরোপুরি ক্লিয়ার: `~/.gradle/caches`, প্রজেক্ট `.gradle`, `android/build`, `android/app/build`
- Flutter ক্লিন: `flutter clean` তারপর `flutter pub get`
- (অপশনাল) লোকাল Maven সিড: netty-এর `.pom` ফাইলগুলো `~/.m2/repository/io/netty/...` এ প্রি-ডাউনলোড করে `mavenLocal()` সক্রিয় রাখা
- নেটওয়ার্ক যাচাই: প্রোক্সি/এন্টিভাইরাস টেম্পোরারি অফ করে বা অন্য নেটওয়ার্কে চেষ্টা করা

## কমান্ড রান অর্ডার
- `flutter pub get`
- `cd android && .\gradlew.bat clean --no-daemon`
- `cd android && .\gradlew.bat assembleDebug --refresh-dependencies --no-daemon --info`
- সফল হলে `flutter run`

## বিকল্প ফলোব্যাক (যদি একই এরর থাকে)
- component/substitution: `io.grpc:grpc-netty` → `io.grpc:grpc-okhttp` (classPath-এ প্রয়োগ)
- grpc আপডেট ফোর্স: `io.grpc:grpc-netty` → `1.48.1` বা নতুন
- repositories-এ `metadataSources { mavenPom(); artifact(); ignoreGradleMetadataRedirection() }` কনফিগার করা যাতে Gradle Pom সঠিকভাবে নেয়

## ভেরিফিকেশন
- assembleDebug সফল হয় কিনা দেখা
- ডিভাইসে `flutter run` করে অ্যাপ লোড হওয়া যাচাই

অনুমোদন দিলে আমি উপরোক্ত ফাইল পরিবর্তন, ক্যাশ ক্লিয়ার এবং কমান্ডগুলো চালিয়ে এরর রিজল্ভ করে দেব।
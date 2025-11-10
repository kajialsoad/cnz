allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory = rootProject.layout.buildDirectory.dir("../../build").get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    // Enforce Java 17 for Android Gradle plugin
    tasks.withType<JavaCompile>().configureEach {
        options.release.set(17)
    }

  // Ensure Java 17 is used (configure via IDE, JAVA_HOME, or gradle.properties)
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}

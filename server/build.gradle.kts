plugins {
	java
	id("org.springframework.boot") version "4.0.5"
	id("io.spring.dependency-management") version "1.1.7"
	id("com.diffplug.spotless") version "8.4.0"
}

group = "streamscout"
version = "0.0.1-SNAPSHOT"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(25)
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-cache")
	implementation("com.github.ben-manes.caffeine:caffeine")
	implementation("com.bucket4j:bucket4j_jdk17-core:8.14.0")
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("org.springframework.boot:spring-boot-webmvc-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

spotless {
	java {
		googleJavaFormat()
		expandWildcardImports()
		removeUnusedImports()
		forbidModuleImports()
	}
}

tasks.withType<Test> {
	useJUnitPlatform()
}

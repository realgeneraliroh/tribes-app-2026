# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Preserve Capacitor core classes, fields, and methods from obfuscation and shrinking
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }

# Keep all Capacitor Plugins and their annotations intact
-keep public class * extends com.getcapacitor.Plugin {
    *;
}

# Preserve Capacitor annotations required for reflection at runtime
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public void *(...);
    @com.getcapacitor.annotation.PermissionCallback public void *(...);
}

# ─── Firebase & Google Play Services R8 Keep Rules ───────────────────────────
# Prevent R8 from stripping out Firebase Cloud Messaging classes used by the Push Notifications plugin
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Push Notifications Plugin explicitly
-keep class com.capacitorjs.plugins.pushnotifications.** { *; }
-dontwarn com.capacitorjs.plugins.pushnotifications.**



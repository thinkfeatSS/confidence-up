# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt

# React Native & Hermes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keepclassmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}

# React Native Reanimated & Worklets
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.worklets.** { *; }

# React Native Screens & Gesture Handler
-keep class com.swmansion.rnscreens.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }

# Firebase Messaging & App
-keep class com.google.firebase.** { *; }
-keep class io.invertase.firebase.** { *; }
-dontwarn io.invertase.firebase.**

# Google Sign-In
-keep class com.google.android.gms.auth.api.signin.** { *; }
-keep class com.reactnativegooglesignin.** { *; }

# React Native SVG
-keep class com.horcrux.svg.** { *; }

# Voice & Audio
-keep class com.wmjmc.reactnativevoice.** { *; }
-keep class com.devamirzubair.reactnativevoice.** { *; }

# Async Storage & NetInfo
-keep class com.reactnativecommunity.asyncstorage.** { *; }
-keep class com.reactnativecommunity.netinfo.** { *; }


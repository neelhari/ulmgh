# ProGuard rules for ULMGH369

# Razorpay Android SDK ProGuard rules
-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }
-keepattributes JavascriptInterface
-keepattributes *Annotation*
-dontwarn com.razorpay.**
-keep class com.razorpay.** {*;}
-optimizations !method/inlining/*
-keepclasseswithmembers class * {
    public void onPayment*(...);
}
-keep class com.ulmgh.store.RazorpayPlugin { *; }

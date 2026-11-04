package com.ulmgh.vendor;

import android.app.Dialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = this.getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setSupportMultipleWindows(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);

            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);

            webView.setWebChromeClient(new RazorpayWebChromeClient(this.getBridge()));
        }
    }

    private class RazorpayWebChromeClient extends BridgeWebChromeClient {
        public RazorpayWebChromeClient(Bridge bridge) {
            super(bridge);
        }

        @Override
        public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
            Dialog dialog = new Dialog(MainActivity.this, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
            WebView popupWebView = new WebView(MainActivity.this);
            popupWebView.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            ));

            WebSettings popupSettings = popupWebView.getSettings();
            popupSettings.setJavaScriptEnabled(true);
            popupSettings.setDomStorageEnabled(true);
            popupSettings.setDatabaseEnabled(true);
            popupSettings.setSupportMultipleWindows(true);
            popupSettings.setJavaScriptCanOpenWindowsAutomatically(true);

            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(popupWebView, true);

            popupWebView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    Uri uri = request.getUrl();
                    String scheme = uri.getScheme();
                    if (scheme != null && !scheme.equals("http") && !scheme.equals("https")) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(intent);
                            return true;
                        } catch (ActivityNotFoundException e) {
                            return true;
                        }
                    }
                    return false;
                }
            });

            popupWebView.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onCloseWindow(WebView window) {
                    if (dialog.isShowing()) {
                        dialog.dismiss();
                    }
                    window.destroy();
                }
            });

            dialog.setContentView(popupWebView);
            dialog.show();

            WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
            transport.setWebView(popupWebView);
            resultMsg.sendToTarget();
            return true;
        }
    }
}

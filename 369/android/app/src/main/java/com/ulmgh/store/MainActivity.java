package com.ulmgh.store;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.razorpay.Checkout;
import com.razorpay.PaymentData;
import com.razorpay.PaymentResultWithDataListener;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;

public class MainActivity extends BridgeActivity implements PaymentResultWithDataListener, ModifiedMainActivityForSocialLoginPlugin {

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(RazorpayPlugin.class);
        super.onCreate(savedInstanceState);

        // Preload Razorpay Checkout resources for smooth and instantaneous opening
        try {
            Checkout.preload(getApplicationContext());
        } catch (Exception ignored) {}
    }

    @Override
    public void onPaymentSuccess(String razorpayPaymentId, PaymentData paymentData) {
        RazorpayPlugin plugin = RazorpayPlugin.getInstance();
        if (plugin != null) {
            plugin.handlePaymentSuccess(razorpayPaymentId, paymentData);
        }
    }

    @Override
    public void onPaymentError(int code, String response, PaymentData paymentData) {
        RazorpayPlugin plugin = RazorpayPlugin.getInstance();
        if (plugin != null) {
            plugin.handlePaymentError(code, response, paymentData);
        }
    }
}

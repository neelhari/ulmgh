package com.ulmgh.store;

import android.app.Activity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.razorpay.Checkout;
import com.razorpay.PaymentData;
import org.json.JSONObject;

@CapacitorPlugin(name = "RazorpayPlugin")
public class RazorpayPlugin extends Plugin {

    private static RazorpayPlugin instance;
    private PluginCall activeCall;

    public RazorpayPlugin() {
        instance = this;
    }

    public static RazorpayPlugin getInstance() {
        return instance;
    }

    @PluginMethod
    public void open(PluginCall call) {
        this.activeCall = call;
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Android Activity is not available.");
            return;
        }

        try {
            JSObject data = call.getData();
            String key = data.getString("key");
            if (key == null || key.trim().isEmpty()) {
                call.reject("Razorpay Key ID is required.");
                this.activeCall = null;
                return;
            }

            Checkout checkout = new Checkout();
            checkout.setKeyID(key);

            JSONObject options = new JSONObject(data.toString());
            // Launch the official Razorpay Android native checkout sheet
            checkout.open(activity, options);
        } catch (Exception e) {
            this.activeCall = null;
            call.reject("Failed to initialize Razorpay checkout: " + e.getMessage(), e);
        }
    }

    public void handlePaymentSuccess(String razorpayPaymentId, PaymentData paymentData) {
        if (activeCall != null) {
            JSObject result = new JSObject();
            String paymentId = razorpayPaymentId != null ? razorpayPaymentId : (paymentData != null ? paymentData.getPaymentId() : "");
            String orderId = (paymentData != null && paymentData.getOrderId() != null) ? paymentData.getOrderId() : "";
            String signature = (paymentData != null && paymentData.getSignature() != null) ? paymentData.getSignature() : "";

            result.put("razorpay_payment_id", paymentId);
            result.put("razorpay_order_id", orderId);
            result.put("razorpay_signature", signature);

            activeCall.resolve(result);
            activeCall = null;
        }
    }

    public void handlePaymentError(int code, String response, PaymentData paymentData) {
        if (activeCall != null) {
            JSObject errData = new JSObject();
            errData.put("code", code);
            errData.put("description", response != null ? response : "Payment was cancelled or could not be completed.");
            if (paymentData != null && paymentData.getData() != null) {
                errData.put("data", paymentData.getData().toString());
            }

            activeCall.reject(
                response != null ? response : "Payment was cancelled or could not be completed.",
                String.valueOf(code),
                errData
            );
            activeCall = null;
        }
    }
}


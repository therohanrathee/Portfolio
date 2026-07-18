"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import styles from "./Dashboard.module.css";

// Declare Razorpay on window object
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Dashboard() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePaymentAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Create Order
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
      });
      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // 2. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use NEXT_PUBLIC for client
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Rohan's Consulting",
        description: "Consulting Fee",
        order_id: orderData.order.id,
        handler: async function (response: any) {
          try {
            setIsProcessing(true); // Re-set loading state during server verification
            
            // 3. Verify Signature & Submit Form on Server
            const verifyResponse = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                formData: formData, // Send form data securely after payment
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              // 4. Submit to Web3Forms directly from the browser to bypass Cloudflare bot checks
              const submissionResponse = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify({
                  access_key: process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY,
                  subject: "New Consulting Request (Paid 99 INR)",
                  ...formData
                }),
              });
              
              const submissionResult = await submissionResponse.json();
              if (submissionResult.success) {
                setIsSuccess(true);
              } else {
                throw new Error("Payment succeeded, but failed to send email.");
              }
            } else {
              throw new Error(verifyData.error || "Payment verification failed");
            }
          } catch (err: any) {
            setError(err.message || "An error occurred during verification.");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
        },
        theme: {
          color: "#3b82f6", // Matches --accent-color
        },
        modal: {
          ondismiss: function() {
             setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        setError(`Payment failed: ${response.error.description}`);
        setIsProcessing(false);
      });
      rzp.open();

    } catch (err: any) {
      setError(err.message || "An error occurred starting the payment.");
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.backgroundShapes}>
        <div className={styles.shape1} />
        <div className={styles.shape2} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`glass-panel ${styles.card}`}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '1rem', width: 'fit-content' }}>
          <ArrowLeft size={20} /> Back to Home
        </Link>
        
        {isSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.successMessage}
          >
            <CheckCircle className={styles.successIcon} />
            <h2 className={styles.title}>Payment Successful!</h2>
            <p className={styles.subtitle}>
              Thank you, {formData.name}. Your request has been sent securely. You will be contacted within 1 business day.
            </p>
          </motion.div>
        ) : (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Let's <span className="text-gradient">Work Together</span></h1>
              <p className={styles.subtitle}>
                Please provide your project details below. A consulting fee of ₹99 is required to submit your request and prioritize our discussion.
              </p>
            </div>

            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            <form onSubmit={handlePaymentAndSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="name" className={styles.label}>Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="John Doe"
                  disabled={isProcessing}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="john@example.com"
                  disabled={isProcessing}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="message" className={styles.label}>Project Details</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  className={styles.textarea}
                  placeholder="Tell me about your project, timeline, and goals..."
                  disabled={isProcessing}
                />
              </div>

              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className={styles.loader} /> Processing...
                  </>
                ) : (
                  "Pay ₹99 & Submit"
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

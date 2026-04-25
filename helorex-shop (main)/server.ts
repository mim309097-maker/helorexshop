import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Resend - handle missing key gracefully
  const resendApiKey = process.env.RESEND_API_KEY || "re_9jMchd2o_Eisvc8zm4veBddvGSbAdJWHx";
  const resend = new Resend(resendApiKey);

  console.log(`[SERVER] Email service initialized with key: ${resendApiKey.substring(0, 5)}...`);

  app.use(express.json());

  // Health check for email service
  app.get("/api/email-status", (req, res) => {
    res.json({
      configured: !!resend,
      keyPrefix: resendApiKey ? `${resendApiKey.substring(0, 5)}...` : "not set",
      env: process.env.NODE_ENV
    });
  });

  // API Routes
  app.post("/api/send-confirmation-email", async (req, res) => {
    const { email, orderId, customerName, totalAmount, items } = req.body;

    if (!resend) {
      console.warn("RESEND_API_KEY is not set. Email not sent.");
      return res.json({ success: false, message: "Email service not configured correctly on the server." });
    }

    try {
      const { email, orderId, customerName, totalAmount, items } = req.body;

      if (!email || !orderId || !customerName || !Array.isArray(items)) {
        return res.status(400).json({ success: false, message: "Missing required order information for email." });
      }

      const adminEmail = "md.helalahamed1512@gmail.com"; 

      console.log(`[EMAIL] Attempting to send emails for order: ${orderId} to ${email}`);

      // Safe Total Formatting
      const formattedTotal = typeof totalAmount === 'number' ? totalAmount.toFixed(2) : '0.00';

      // 1. Send confirmation to Customer
      const customerEmailResult = await resend.emails.send({
        from: "onboarding@resend.dev", // Simplified sender
        to: [email],
        subject: `Order Confirmed - #${orderId.substring(0, 8).toUpperCase()}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 20px; overflow: hidden;">
            <div style="background: #ff6b00; padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">HELOREX SHOP</h1>
            </div>
            <div style="padding: 40px;">
              <h2 style="margin-top: 0;">Hi ${customerName},</h2>
              <p>Your order has been successfully placed! We'll notify you as soon as it's shipped.</p>
              
              <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; margin: 30px 0;">
                <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #999;">Order ID</p>
                <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 18px; color: #ff6b00;">#${orderId.substring(0, 8).toUpperCase()}</p>
              </div>

              <h3>Order Summary</h3>
              <ul style="list-style: none; padding: 0;">
                ${items.map((item: any) => `
                  <li style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f1f1;">
                    <span>${item.name} x${item.quantity}</span>
                    <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
                  </li>
                `).join('')}
              </ul>
              
              <div style="text-align: right; margin-top: 20px;">
                <p style="margin: 0; color: #666;">Total Amount</p>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #000;">$${formattedTotal}</p>
              </div>
            </div>
          </div>
        `,
      });

      if (customerEmailResult.error) {
        console.error("[EMAIL] Customer Email Error:", customerEmailResult.error);
      } else {
        console.log("[EMAIL] Customer email sent successfully:", customerEmailResult.data?.id);
      }

      // 2. Send alert to Admin (You)
      const adminEmailResult = await resend.emails.send({
        from: "onboarding@resend.dev", // Simplified sender
        to: [adminEmail],
        subject: `NEW ORDER: #${orderId.substring(0, 8).toUpperCase()}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ff6b00; border-radius: 10px;">
            <h2 style="color: #ff6b00;">You have a new order!</h2>
            <hr />
            <p><strong>Customer Name:</strong> ${customerName}</p>
            <p><strong>Customer Email:</strong> ${email}</p>
            <p><strong>Order ID:</strong> #${orderId.substring(0, 8).toUpperCase()}</p>
            <p><strong>Total Amount:</strong> $${formattedTotal}</p>
            <br />
            <a href="https://console.firebase.google.com/project/helorex-shops/firestore/databases/ai-studio-560f458c-9546-4870-97cd-5e077f50b5ab/data" style="background: #ff6b00; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Database</a>
          </div>
        `,
      });

      if (adminEmailResult.error) {
        console.error("[EMAIL] Admin Email Error:", adminEmailResult.error);
      } else {
        console.log("[EMAIL] Admin alert sent successfully:", adminEmailResult.data?.id);
      }

      res.status(200).json({ 
        success: !adminEmailResult.error, 
        results: {
          customer: customerEmailResult.error ? "error" : "sent",
          admin: adminEmailResult.error ? "error" : "sent"
        },
        error: customerEmailResult.error
      });
    } catch (err) {
      console.error("Email API Error:", err);
      res.status(500).json({ success: false, error: err });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

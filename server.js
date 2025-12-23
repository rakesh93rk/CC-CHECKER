
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// 🔐 ADD YOUR KEYS HERE
const RZP_KEY = "rzp_live_xxxxx";
const RZP_SECRET = "xxxxxxxx";

const stripe = Stripe("sk_live_xxxxx");

app.post("/api/check-payment", async (req, res) => {
  try {
    const { link } = req.body;

    // Razorpay detect
    if (link.includes("rzp.io")) {
      const id = link.match(/rzp\.io\/i\/([a-zA-Z0-9]+)/)?.[1];
      if (!id) return res.json({ ok: false });

      const r = await axios.get(
        `https://api.razorpay.com/v1/payment_links/${id}`,
        { auth: { username: RZP_KEY, password: RZP_SECRET } }
      );

      return res.json({
        ok: true,
        gateway: "Razorpay",
        status: r.data.status,
        amount: r.data.amount / 100,
        currency: r.data.currency
      });
    }

    // Stripe detect
    if (link.includes("stripe") || link.includes("checkout")) {
      const sid = link.match(/cs_[a-zA-Z0-9]+/)?.[0];
      if (!sid) return res.json({ ok: false });

      const session = await stripe.checkout.sessions.retrieve(sid);

      return res.json({
        ok: true,
        gateway: "Stripe",
        status: session.payment_status,
        amount: session.amount_total / 100,
        currency: session.currency
      });
    }

    res.json({ ok: false });
  } catch (e) {
    res.json({ ok: false });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));

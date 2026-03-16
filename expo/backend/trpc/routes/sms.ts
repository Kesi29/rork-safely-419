import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

export const smsRouter = createTRPCRouter({
  send: publicProcedure
    .input(
      z.object({
        to: z.string().min(1),
        message: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        console.log("SMS: Twilio credentials not configured, simulating send");
        console.log(`SMS: To=${input.to}, Message=${input.message}`);
        return {
          success: true,
          simulated: true,
          message: "SMS simulated (Twilio not configured)",
        };
      }

      try {
        const credentials = btoa(`${accountSid}:${authToken}`);
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${credentials}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: input.to,
              From: fromNumber,
              Body: input.message,
            }).toString(),
          }
        );

        const data = await response.json();
        console.log("SMS: Twilio response", JSON.stringify(data).substring(0, 200));

        if (response.ok) {
          return {
            success: true,
            simulated: false,
            sid: data.sid,
            message: "SMS sent successfully",
          };
        } else {
          console.log("SMS: Twilio error", data.message);
          return {
            success: false,
            simulated: false,
            message: data.message || "Failed to send SMS",
          };
        }
      } catch (error) {
        console.log("SMS: Error sending", error);
        return {
          success: false,
          simulated: false,
          message: "Failed to send SMS",
        };
      }
    }),
});

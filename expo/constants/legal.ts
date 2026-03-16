export const TERMS_OF_SERVICE = `
Last updated: March 2026

PLEASE READ THESE TERMS CAREFULLY BEFORE USING SAFELY.

1. ACCEPTANCE OF TERMS
By downloading, installing, or using Safely ("the App"), you agree to be bound by these Terms of Service. If you do not agree, do not use the App.

2. DESCRIPTION OF SERVICE
Safely is a personal safety companion application that shares your GPS location with designated guardians during transit. The App provides location sharing, arrival notifications, and emergency alert features.

3. NOT AN EMERGENCY SERVICE
SAFELY IS NOT AN EMERGENCY SERVICE. THE APP IS NOT A SUBSTITUTE FOR CALLING 911 OR OTHER EMERGENCY SERVICES. IN ANY LIFE-THREATENING EMERGENCY, CALL 911 IMMEDIATELY. Safely does not dispatch emergency responders. Guardian notifications are supplementary to, not a replacement for, official emergency services.

4. NO GUARANTEE OF DELIVERY
Safely cannot guarantee delivery of SMS notifications, push notifications, or location updates. Notification delivery depends on cellular coverage, device settings, carrier reliability, and other factors outside our control. Do not rely solely on Safely for your safety.

5. LOCATION ACCURACY
GPS location data may be inaccurate, delayed, or unavailable due to device limitations, environmental factors, or network conditions. Safely does not warrant the accuracy of any location data.

6. GUARDIAN CONSENT
By adding a guardian, you confirm that you have obtained their consent to receive SMS messages from Safely on your behalf. You are responsible for ensuring your guardian's consent before adding them to the App.

7. USER RESPONSIBILITIES
You agree to:
- Provide accurate personal information including your home address
- Only add guardians who have consented to receive notifications
- Not use the App for any unlawful purpose
- Not use the SOS feature frivolously or falsely
- Maintain a charged device and active data connection when using Safely

8. SOS FEATURE
The SOS feature is intended for genuine emergencies only. Misuse of the SOS feature, including false emergency alerts, may result in account suspension. Safely is not liable for any response or lack of response by your guardian or emergency services.

9. PRIVACY AND LOCATION DATA
Your location data is used solely to provide the safety tracking service. We do not sell your location data to third parties. Location data is deleted after each session ends. Please review our Privacy Policy for complete details.

10. BATTERY AND DEVICE PERFORMANCE
Background location tracking may significantly impact your device's battery life. Safely is not responsible for device battery drain or performance impacts resulting from use of the App.

11. THIRD PARTY SERVICES
Safely uses third party services including Google Maps, Twilio, and Supabase. Your use of the App is also subject to their respective terms of service and privacy policies.

12. LIMITATION OF LIABILITY
TO THE MAXIMUM EXTENT PERMITTED BY LAW, SAFELY AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO PERSONAL INJURY, PROPERTY DAMAGE, OR DEATH, ARISING FROM YOUR USE OF OR INABILITY TO USE THE APP.

SAFELY'S TOTAL LIABILITY TO YOU FOR ALL CLAIMS SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE APP IN THE TWELVE MONTHS PRECEDING THE CLAIM.

13. INDEMNIFICATION
You agree to indemnify and hold harmless Safely and its operators from any claims, damages, or expenses arising from your use of the App, your violation of these Terms, or your violation of any third party rights.

14. DISCLAIMER OF WARRANTIES
THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. SAFELY EXPRESSLY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

15. CHANGES TO TERMS
We reserve the right to modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the new Terms.

16. GOVERNING LAW
These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.

17. CONTACT
For questions about these Terms, contact: legal@getsafely.app
`;

export const PRIVACY_POLICY = `
Last updated: March 2026

1. INFORMATION WE COLLECT

Personal Information:
- Your name (provided during onboarding)
- Your phone number (used for account authentication)
- Your home address and coordinates (used for geofence arrival detection)
- Guardian contact information (name, phone number, relationship)

Location Data:
- GPS coordinates collected during active tracking sessions only
- Location data is transmitted to your designated guardian via tracking link
- Location data is stored for the duration of the active session only
- Location data is permanently deleted when a session ends

Usage Data:
- Session history (dates, durations, outcomes — stored locally on your device)
- App crash reports and performance data (anonymous)

2. HOW WE USE YOUR INFORMATION

We use your information solely to:
- Authenticate your account via SMS verification
- Share your location with your designated guardian during active sessions
- Send SMS notifications to your guardian on your behalf
- Detect your arrival at your home address via geofencing
- Send you check-in notifications when you are late

We do NOT:
- Sell your personal data to any third party
- Use your location data for advertising
- Share your data with law enforcement except as required by law
- Store your location data after your session ends
- Track your location when Safely is not actively in use

3. LOCATION DATA — DETAILED

Background Location: Safely requests "Always" location permission to enable background tracking during active sessions. This permission is used exclusively when a session is active. We do not collect location data at any other time.

Geofencing: We use a 150-meter geofence around your home address to detect arrival. This geofence is registered only during active sessions and removed when the session ends.

Location Precision: We collect location data at approximately 50-meter accuracy intervals to minimize battery drain. We do not collect precise real-time location continuously.

4. GUARDIAN SMS MESSAGES

When you add a guardian, Safely sends them an SMS consent message on your behalf. When you activate a session, Safely sends your guardian SMS notifications including:
- A notification that you are on your way home
- A live tracking link valid for the duration of your session
- An arrival confirmation when you reach home
- A late alert if you do not arrive within your expected time
- An SOS alert if you trigger the emergency feature

Your guardian's phone number is used solely for these notifications and is never shared with third parties.

5. DATA STORAGE AND SECURITY

- Your account data is stored securely using Supabase (PostgreSQL)
- All data transmission uses TLS/HTTPS encryption
- Location data is deleted automatically when sessions end
- We do not store payment information (the App is free)
- Your phone number is used for authentication via one-time passcode only

6. DATA RETENTION

- Account data: retained while your account is active
- Session location data: deleted immediately when session ends
- Session history metadata (date, duration, outcome): stored locally on your device only
- Guardian consent records: retained while the guardian relationship is active

7. YOUR RIGHTS

You have the right to:
- Access your personal data
- Delete your account and all associated data
- Withdraw guardian consent at any time
- Opt out of non-critical notifications
- Request a copy of your data

To exercise these rights contact: privacy@getsafely.app

8. CHILDREN'S PRIVACY

Safely is not intended for users under the age of 18. We do not knowingly collect personal information from minors. If you believe a minor has provided us with personal information, contact us immediately.

9. CALIFORNIA PRIVACY RIGHTS (CCPA)

California residents have additional rights including the right to know what personal information is collected, the right to delete personal information, and the right to opt out of the sale of personal information. We do not sell personal information. For CCPA requests contact: privacy@getsafely.app

10. INTERNATIONAL USERS

Safely is operated from the United States. If you use the App from outside the US, your data will be transferred to and processed in the United States. By using the App you consent to this transfer.

11. CHANGES TO THIS POLICY

We will notify you of material changes to this Privacy Policy via in-app notification or SMS. Continued use of the App after changes constitutes acceptance.

12. CONTACT

Privacy inquiries: privacy@getsafely.app
Data deletion requests: privacy@getsafely.app
`;

export const DISCLAIMER = `
IMPORTANT SAFETY DISCLAIMER

Safely is a supplementary personal safety tool. Please read and understand the following before using this App.

NOT A REPLACEMENT FOR EMERGENCY SERVICES
Safely does not contact emergency services on your behalf. The SOS feature notifies your personal guardian and initiates a phone call to 911 — it does not guarantee emergency responder dispatch. Always call 911 directly in a life-threatening emergency.

NO GUARANTEE OF NOTIFICATION DELIVERY
SMS and push notifications may be delayed or undelivered due to:
- Poor or no cellular coverage
- Your guardian's phone being off or in Do Not Disturb mode
- Carrier delays or outages
- Your device running out of battery
- Network connectivity issues

Do not assume your guardian has received any notification.

LOCATION ACCURACY LIMITATIONS
GPS accuracy may vary. Indoor environments, tall buildings, tunnels, and poor signal areas may significantly reduce location accuracy. Your displayed location on the guardian tracking page may not reflect your exact position.

BATTERY DEPENDENCY
Background location tracking drains battery significantly. Ensure your device is sufficiently charged before activating Safely. A dead phone cannot share your location.

GUARDIAN RESPONSIBILITY
Safely does not verify the identity, reliability, or responsiveness of your chosen guardian. You are responsible for choosing a guardian who is willing and able to respond to alerts.

BY USING SAFELY YOU ACKNOWLEDGE THESE LIMITATIONS AND AGREE THAT SAFELY IS NOT LIABLE FOR ANY HARM ARISING FROM RELIANCE ON THIS APP AS YOUR SOLE SAFETY MEASURE.
`;

export const GUARDIAN_SMS_CONSENT = `
By adding a guardian, you confirm that:
1. You have informed this person that they will receive SMS messages from Safely
2. They have agreed to receive these messages
3. The phone number you provided belongs to this person
4. You understand that standard SMS rates may apply to your guardian

Standard messaging rates may apply to your guardian depending on their mobile carrier plan.
`;

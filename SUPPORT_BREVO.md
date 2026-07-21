# Brevo Support — Delivery / Rate Limit Request

Use this template when contacting Brevo Support about Gmail rate-limiting or IP authorisation issues. Replace placeholders with real values (account email, message-ids, timestamps).

Subject: Delivery blocked / rate-limited — request IP & deliverability assistance

Body:

Hello Brevo Support,

We are sending transactional password-reset emails from our application (account: YOUR_ACCOUNT_EMAIL). We observed delivery failures and Gmail deferrals for messages sent via Brevo. Example Gmail bounce text:

```
421-4.7.28 Gmail has detected an unusual rate of mail originating from your SPF
421-4.7.28 domain [11708864.brevosend.com      35]. To protect our users from
421-4.7.28 spam, mail sent from your domain has been temporarily rate limited.
421-4.7.28 For more information, go to
421-4.7.28  https://support.google.com/mail/?p=UnsolicitedRateLimitError to
421 4.7.28 review our Bulk Email Senders Guidelines. ... - gsmtp
```

We also received this Brevo API response indicating an IP restriction (we have already added the IP to authorised IPs):

```
{"message":"We have detected you are using an unrecognised IP address 205.254.163.206...","code":"unauthorized"}
```

Actions already completed on our side:
- Server IP 205.254.163.206 added to authorised IPs in account settings.
- Confirmed API key is a transactional key (xkeysib-).
- Verified that API calls now return HTTP 200 for `/test-email` and `/forgot-password` endpoints.

Request:
1. Please confirm whether Brevo is currently experiencing shared-IP rate limits affecting Gmail for our account or sending domain.
2. Please lookup recent message-ids and confirm delivery status (message-ids: PASTE_MESSAGE_IDS_HERE).
3. Recommend steps to remove or reduce the Gmail 421 rate limit for our domain. If required, please advise on obtaining a dedicated IP and a warm-up schedule.
4. If there are account-level reputation concerns, please list required remedies.

Warm-up request (if recommended):
- We are prepared to follow a 7–14 day IP warm-up. Please advise a daily send volume schedule appropriate for our current sending volumes.

Thank you,
[Your Name]
[Contact Email / Phone]

--
Notes for the support ticket:
- Attach Brevo message-ids (from Brevo dashboard) and the Gmail bounce text above.
- Provide timestamps (UTC) and example recipient addresses.

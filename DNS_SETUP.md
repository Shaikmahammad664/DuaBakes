# DNS / SPF / DKIM / DMARC Guidance for Brevo

This document provides recommended DNS record templates and verification steps to improve deliverability when sending via Brevo. Replace `yourdomain.com` with your sending domain.

1) SPF (TXT)
- Example (simple):

  Host: @
  Type: TXT
  Value: v=spf1 include:spf.brevo.com ~all

  NOTE: Use the exact SPF value Brevo provides in your account if different.

2) DKIM
- Brevo typically provides DKIM records as CNAME(s) or TXT with a selector. Example CNAME form:

  Host: sib._domainkey (or {selector}._domainkey)
  Type: CNAME
  Value: sib.dkim.brevo.com.

- Example TXT form (if provided):
  Host: sib._domainkey.yourdomain.com
  Type: TXT
  Value: "v=DKIM1; k=rsa; p=MIIBIjANB..."  # public key provided by Brevo

3) DMARC (TXT)
- Start with monitoring mode, then move to quarantine/reject after verification:

  Host: _dmarc
  Type: TXT
  Value: v=DMARC1; p=none; rua=mailto:postmaster@yourdomain.com; pct=100

4) Verification steps in Brevo
- In Brevo dashboard -> Settings -> Senders & Domains -> Add/Verify domain.
- Copy the exact records Brevo shows and add them to your DNS provider.
- After DNS propagation, verify in Brevo and check SPF/DKIM pass/fail status.

5) Testing after DNS changes
- Run `POST /test-email` from your server and verify message-id in logs.
- Use `dig` or online DNS checkers to confirm TXT/CNAME records propagated.

6) Deliverability tips
- Do not use a free mailbox (Gmail) as `SENDER_EMAIL`. Use a verified address on your domain (no-reply@yourdomain.com).
- Separate transactional and marketing flows.
- If using Brevo shared IPs and Gmail still rate-limits, request a dedicated IP and warm-up schedule.

7) Quick commands (local)

curl -s -X POST http://localhost:7788/test-email -H "Content-Type: application/json" -d '{"Email":"you@recipient.com"}' -w "\nHTTP:%{http_code}\n"

8) Resources
- Brevo: https://help.brevo.com (domain verification and DKIM/SPF instructions)
- Google bulk sender guidelines: https://support.google.com/mail/?p=UnsolicitedRateLimitError

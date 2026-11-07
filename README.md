# Daily Jar

A simple notebook for people who love saving money. Tap a day, choose Deposit or Withdraw, type the amount, add a note, save. The app records the date and time (CE years).

- Savings balance, calendar with each day's net amount, full history with notes
- Back up / restore, export CSV, English and Thai
- No account, no login, AdMob banner in the Android app only (test ads until real IDs are put in www/ads-config.json). Data stays on the phone (each device has its own).

Daily Jar is not a bank and does not hold or move real money. It only records numbers you type.

## Play Store checklist
- Package name: `com.augrixs.dailyjar` (permanent once published)
- Privacy policy: https://augrixs.github.io/Daily-Jar/privacy.html (enable Pages: Settings > Pages > Source: GitHub Actions)
- Release build: Actions > "Release AAB (Play Store)" > Run workflow (needs secret `KEYSTORE_PASSWORD`, 12+ characters)

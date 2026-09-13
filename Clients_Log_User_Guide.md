# CLIENTS-LOG
## USER INSTRUCTION GUIDE
**Admin & Field Engineer User Manual**

---

*Version 1.0*  
*Document Date: September 2026*  
*Application: Clients-Log*  
*© 2026 SYED WALEED AHMED. All Rights Reserved.*

---

## TABLE OF CONTENTS
1. [Introduction](#1-introduction)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [How to Access the Application](#3-how-to-access-the-application)
4. [Field Engineer Workflow (Normal User)](#4-field-engineer-workflow-normal-user)
   - [Dashboard Overview](#dashboard-overview)
   - [Starting a New Job (Work Entry)](#starting-a-new-job-work-entry)
   - [Reviewing and Editing Jobs](#reviewing-and-editing-jobs)
   - [Exporting Reports](#exporting-reports)
5. [Administrator Workflow](#5-administrator-workflow)
   - [Accessing the Admin Panel](#accessing-the-admin-panel)
   - [Creating a New User](#creating-a-new-user)
   - [Managing Users (Reset Password, Disable, Delete)](#managing-users)
   - [Admin Global Reports](#admin-global-reports)
6. [Data Backup](#6-data-backup)
7. [Troubleshooting & Common Mistakes](#7-troubleshooting--common-mistakes)
8. [Quick Reference Guide](#8-quick-reference-guide)

---

## 1. INTRODUCTION

Welcome to the **Clients-Log** application. This software is designed to help Field Engineers efficiently log their daily jobs, track travel and work times, and automatically generate professional weekly Excel reports. 

This manual provides complete step-by-step instructions for both **Field Engineers** (normal users) and **Administrators** on how to operate the system.

---

## 2. USER ROLES & PERMISSIONS

The application restricts access based on your assigned user role.

| Feature / Action | Admin | Field Engineer (Normal User) |
| :--- | :---: | :---: |
| **Login to Application** | ✅ | ✅ |
| **Create & Submit Job Entries** | ✅ | ✅ |
| **View Own Dashboard & Stats** | ✅ | ✅ |
| **Edit/Delete Own Job Entries** | ✅ | ✅ |
| **Export Own Weekly Excel Report** | ✅ | ✅ |
| **Access Admin Panel** | ✅ | ❌ |
| **Create New Employee Accounts** | ✅ | ❌ |
| **Change Other Users' Passwords** | ✅ | ❌ |
| **Disable / Enable Users** | ✅ | ❌ |
| **Delete Users** | ✅ | ❌ |
| **Export Global Reports (All Users)** | ✅ | ❌ |

---

## 3. HOW TO ACCESS THE APPLICATION

### Step-by-Step Login

**STEP 01** — Open your web browser (on mobile or desktop) and navigate to the application URL provided by your manager.

**STEP 02** — On the login screen, enter your assigned **Engineer ID** (e.g., *ENG002*).

**STEP 03** — Enter your **Password**.

**STEP 04** — Click the **LOGIN** button.

*Expected Result:* You will be securely authenticated and redirected to your main Dashboard.

> ⚠️ **IMPORTANT NOTE:** If your account has been Disabled by an administrator, your login will be rejected.

---

## 4. FIELD ENGINEER WORKFLOW (NORMAL USER)

### Dashboard Overview
When you log in, you will see the **HOME (Dashboard)** screen.

```text
[ HOME DASHBOARD ]
========================================
📅 Today's Date
👋 Hello, [Your Name]

[ Today's Job Time ]   [ Today's Travel ]
       00h 00m                00h 00m
       
[ 📅 THIS WEEK SUMMARY ]
Job Time  |  Travel Time  |  Entries
00h 00m   |  00h 00m      |  0

Recent Activity
(List of your recent jobs)
========================================
       [HOME]   [ADD +]   [REPORT]   [MORE ⚙️]
```

### Starting a New Job (Work Entry)

To log a new job or activity, you must create a Work Entry.

**STEP 01** — From the bottom navigation bar, tap the large red **[ADD +]** button.

**STEP 02** — **Select Date:** By default, today's date is selected. You can change this if logging a past job.

**STEP 03** — **Select Work Type:** Choose one of the following buttons:
* `Customer`
* `Workshop`
* `Office`
* `Delivery`
* `Other`

**STEP 04** — **Fill Details (If Customer, Delivery, or Other):**
* Enter **Customer / Recipient Name** *(REQUIRED)*.
* Enter **Location** *(REQUIRED)*.

**STEP 05** — **Log Travel Time:**
* Under the `Travel` section, tap the start time button.
* Tap the end time button when you arrive.
* *(You can manually edit the times by clicking the pencil ✏️ icon).*

**STEP 06** — **Log Job Time:**
* Under the `Job` section, tap the start time button when work begins.
* Tap the end time button when work is finished.

**STEP 07** — **Job Category / Work Carried Out:**
* Type a description of the work you performed *(REQUIRED)*.
* You can also tap the quick-add buttons below the text box to easily add standard categories (e.g., *Maintenance*, *Installation*).

**STEP 08** — **Add Job Notes:** (Optional) Enter any extra details.

**STEP 09** — Click the large red **SAVE ENTRY** button at the bottom.

*Expected Result:* The entry is saved, and you are returned to the Dashboard where your daily and weekly totals will instantly update.

### Reviewing and Editing Jobs

To view all your jobs for a specific week:

**STEP 01** — From the bottom navigation bar, tap **[REPORT]**.

**STEP 02** — Use the **<** and **>** buttons at the top to navigate between different weeks.

**STEP 03** — To edit an entry, tap the **Pencil ✏️** icon next to the job. Make your changes and click **SAVE ENTRY**.

**STEP 04** — To delete an entry, tap the **Trash 🗑️** icon and confirm.

### Exporting Reports

You must generate an Excel report at the end of your week.

**STEP 01** — Go to the **[REPORT]** tab.

**STEP 02** — Ensure you are viewing the correct week.

**STEP 03** — Tap the green **Export Excel** button (or the Download icon at the top).

*Expected Result:* A professional Excel file (`Weekly_Report_YourName_Date.xlsx`) will be downloaded to your device, properly formatted for A4 Landscape printing.

---

## 5. ADMINISTRATOR WORKFLOW

Administrators have access to a secure backend panel to manage employees and view global data.

### Accessing the Admin Panel

**STEP 01** — From the bottom navigation bar, tap **[MORE ⚙️]**.

**STEP 02** — A menu will pop up. Click **Admin Panel** (indicated by a purple shield icon).

*Expected Result:* The Admin Panel will open, showing a list of all current users.

```text
[ ADMIN PANEL ]
========================================
< Back      ADMINISTRATION     

[ ADD NEW USER ]
Engineer ID: ________
Full Name: ________
Password: ________
[ CREATE USER ]

[ USERS LIST ]
👤 Ali Khan (ENG002)
[Reset Pass] [Disable] [Delete]
========================================
```

### Creating a New User

**STEP 01** — In the Admin Panel, locate the "Add New User" form on the left/top.

**STEP 02** — Enter the **Engineer ID** (e.g., *ENG003*).

**STEP 03** — Enter the **Full Name** (e.g., *Ali Khan*).

**STEP 04** — Enter a temporary **Password**.

**STEP 05** — Click **CREATE USER**.

*Expected Result:* A success message will appear, and the new user will immediately show up in the Users List. They can now log into the application.

### Managing Users

In the Users List, you will see all registered accounts. Next to each user (other than yourself), you have three controls:

**To Change a Password:**
**STEP 01** — Click **Reset Pass**.
**STEP 02** — Type the new password in the "NEW PASSWORD" and "CONFIRM PASSWORD" fields.
**STEP 03** — Click **CHANGE PASSWORD**.

**To Disable a User (Temporary Suspension):**
**STEP 01** — Click **Disable**.
*Expected Result:* The user immediately loses access to log in. You can click **Enable** to restore their access later.

**To Delete a User (Permanent):**
**STEP 01** — Click the red **Delete** button.
**STEP 02** — Click "OK" on the confirmation prompt.
*Expected Result:* The user profile is permanently destroyed. **Warning: This cannot be undone.**

### Admin Global Reports

Administrators can export data for all employees at once, or filter by specific engineers.

**STEP 01** — Go to the **Admin Panel**.
**STEP 02** — Scroll to the "Export Admin Report" section.
**STEP 03** — Select **"All Engineers"** from the dropdown, or select a specific engineer.
**STEP 04** — Click **EXPORT EXCEL REPORT**.

---

## 6. DATA BACKUP

The application includes an emergency offline data backup feature.

**STEP 01** — Tap **[MORE ⚙️]** from the bottom bar.
**STEP 02** — Click **Backup Data**.
*Expected Result:* A JSON file containing all locally cached system data will download to your device.

---

## 7. TROUBLESHOOTING & COMMON MISTAKES

**"Login Failed"**
*   **Cause:** Incorrect Engineer ID or password.
*   **Solution:** Check your credentials. If you forgot your password, contact your Administrator to reset it.

**"Account Disabled"**
*   **Cause:** An Administrator has suspended your account.
*   **Solution:** Contact management.

**"Please fill Customer/Recipient Name and Location"**
*   **Cause:** You selected "Customer", "Delivery", or "Other" but left the name or location blank.
*   **Solution:** These fields are strictly REQUIRED. Fill them in to save the job.

**"No records found for the selected criteria" (Admin Export)**
*   **Cause:** The selected engineer has not logged any jobs yet.

**"Failed to load users. Are you an Admin?"**
*   **Cause:** You somehow bypassed the UI to reach the Admin Panel, but the secure database rejected you because your account lacks the `ADMIN` role.

---

## 8. QUICK REFERENCE GUIDE

### Normal User (Field Engineer)
*   **Log a Job:** Login → `[ADD +]` → Fill Details → `SAVE ENTRY`
*   **Edit a Job:** Login → `[REPORT]` → Find Job → Click `✏️` → Update → `SAVE ENTRY`
*   **Export Weekly Report:** Login → `[REPORT]` → Ensure correct week is selected → Click `Export Excel`

### Administrator
*   **Create User:** Login → `[MORE ⚙️]` → `Admin Panel` → Fill "Add New User" form → `CREATE USER`
*   **Reset Password:** Login → `[MORE ⚙️]` → `Admin Panel` → Find User → Click `Reset Pass` → Enter New Password
*   **Export All Data:** Login → `[MORE ⚙️]` → `Admin Panel` → Select Engineer → `EXPORT EXCEL REPORT`

---
*End of Document*

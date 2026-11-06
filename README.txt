ENGINEERING PROJECT MANAGER (EPM) – LOCAL NETWORK VERSION
=======================================================

VERSION 2 – same features as the live app: Chat (channels, groups, private messages, photos and
videos), "Online now", multi-work daily reports, section access by role, EPM logo and app icons,
security hardening, and a backup download. Chat privacy is enforced by the server: private
messages and groups are sent only to the people in them.

WHAT THIS IS
A copy of the project manager that runs on one computer in your network. Everyone
else opens it in a web browser. Data is saved on that computer (folder "data").
No internet and no Claude account are needed after installation.

WHAT YOU NEED
Node.js version 18 or newer (free): https://nodejs.org   (choose "LTS")

START IT
  Windows : double-click  start.bat
  Mac/Linux: run  ./start.sh   (or:  node server.js)
The window prints two addresses:
  This computer : http://localhost:3000
  Other devices : http://192.168.x.x:3000      <- give this address to your team
Leave the window open. Press Ctrl+C to stop.

FIRST LOGIN
On the very first start the window prints an administrator User ID (EPM@admin.com, capitals do not matter) and passcode.
If this PC already ran an older version, the old administrator ID (admin@robotjockey.local) is renamed to EPM@admin.com automatically on the next start. The passcode and all data stay the same.
WRITE IT DOWN. Sign in with it, then use "Change passcode" in the left menu.
Lost it? Stop the server, then run (Windows PowerShell example):
  $env:ADMIN_EMAIL="your-admin@email.com"; $env:RESET_PASSCODE="NewPass123"; node server.js

ADD PEOPLE (easiest: Teams page)
Sign in as administrator -> "Teams" in the left menu -> "Add a team member":
  Gmail ID (User ID) = their email address
  Name, Position
  Passcode = you choose (min 8 characters), or press "Generate". Tell them privately.
  Role     = Engineer, Technician, Testing, Procurement, Finance, Accountant, Sales, Marketing, Project Manager, Management, Guest (Sales, Marketing, Management and Guest are view only)
Press "Add member & create login". They can now open the app address, sign in with the
User ID and passcode, and start working. Leave the passcode empty to only list the person.
More options (categories they may see, expiry date, revoke, reset passcode, extra
administrators): left menu -> "Access".

OPEN FROM OTHER DEVICES
- Same Wi-Fi / LAN. Use the "Other devices" address printed at start.
- If it does not open, allow Node.js / port 3000 in the Windows Firewall
  (Windows Defender Firewall -> Allow an app -> Node.js), or run with another port:
  set PORT=8080 (Windows)  /  PORT=8080 node server.js (Mac/Linux)
- Give the computer a fixed IP (router setting) so the address does not change.

KEEP IT RUNNING / START ON BOOT
- Windows: Task Scheduler -> "At startup" -> run start.bat.  Or install PM2: npm i -g pm2 ; pm2 start server.js ; pm2 save
- The computer must be switched on for others to reach it.

BACKUP / RESTORE
- Easiest: sign in as administrator -> "Access" -> Backup -> "Download backup file" (one .json file with
  all data). Photos/videos are separate: they live in data/uploads.
- Full backup: copy the whole "data" folder regularly (database + uploaded files). History is never deleted.
- Restore: stop the server, put the saved "data" folder back (or replace data/db.json), start again.
- Moving to another computer: copy the whole program folder including "data".

INSTALL AS AN APP (optional)
Open the address in Chrome/Edge -> menu -> "Install" / "Add to Home screen". On a phone over plain http
the browser may only create a shortcut; the EPM icon is used either way.

SECURITY NOTES
- Passcodes are stored hashed. Sessions last 12 hours. 5 wrong logins lock that user for 1 minute.
- Traffic is plain HTTP, which is fine on a trusted office network. Do NOT expose port 3000 to the internet.
  For internet or Wi-Fi guests, put it behind an HTTPS reverse proxy (Caddy, nginx) or a VPN.

ATTENDANCE (selfie check-in / check-out)
- Left menu -> Attendance. Press "Check in" (or "Check out"), take a selfie, optionally add a note, confirm.
- The server records the time itself, so it cannot be changed on the device. Records can never be edited or deleted.
- Everyone sees only their own attendance. Administrators and Project Managers also see "Team attendance"
  (filter by dates and person, see selfies, who has not checked in today, total hours) and can Export CSV.
- Camera note: browsers only allow the live camera on https:// or on the server computer itself (localhost).
  On phones/tablets opened through http://192.168.x.x:3000 the app opens the phone's camera app instead
  (take the photo, then confirm) - this works on iPhone and Android. For the live camera on every device, put
  the app behind an HTTPS reverse proxy (Caddy / nginx).
- The administrator can hide the Attendance page per role under Access -> "Access limits by role".

FILES & ATTACHMENTS
- Documents & Attachments accepts any file type (PDF, Word, Excel, CAD, ZIP, firmware, photos, videos) up to 2 GB each.
  To change the limit, set MAX_UPLOAD_MB before starting (example: set MAX_UPLOAD_MB=5000). Files are stored in data/uploads.
- Make sure the computer has enough free disk space. Large uploads over Wi-Fi can take a while; a percentage is shown.

CHAT NOTES
- Channels: General and one per project (everyone). Groups and private messages: only members.
- Photos and videos (up to 60 MB) are stored in data/uploads. Online status shows people who have the app open.
- The administrator can limit chat per role under Settings -> Section access.

NOTIFICATIONS, SOUND AND ICON COUNT
- New chat messages and new alerts (late work, approvals, deadlines) play a short sound, show a pop-up notification
  when the app is in the background, and put an unread count on the browser tab, the tab icon and - when the app is
  installed - on the taskbar / home-screen icon.
- First sign-in on a device shows "Get alerts for new messages?" - press Turn on and allow the browser question.
  Change it any time: Settings -> "Alerts on this device" (sound, volume, pop-ups, hide message text, icon count, test button).
- Inside the chat: a chime when a message arrives (also while that chat is open) and a soft pop when you send one.
- Clicking a pop-up opens that chat. Settings are saved per device.
- Pop-ups and the icon count need a secure address: http://localhost:3000 on the server PC, or https://<ip>:3001 on
  other devices (accept the one-time certificate warning). Over plain http://<ip>:3000 the sound and tab count still work.
- Alerts arrive while the app is open (minimised, background tab or installed app). A fully closed app cannot receive
  them - that would need an internet push service, which this offline LAN version does not use.
- Sidebar fix: "Change passcode" and "Sign out" no longer repeat.

MY TASKS ACCESS LIMITS
- Settings -> Section access -> "My Tasks page" now has three limits per role:
  "Viewing tasks for (pick another person)", "Tasks assigned to me", "Components I am responsible for".
  None = hidden. View = shown but the tick boxes (mark completed) are disabled (Tasks assigned to me only).
- Administrators always see everything. These limits hide the parts of the page; they do not hide the same data elsewhere.

NOTIFICATIONS, INBOX AND E-MAIL (GMAIL)
- Notifications page = only work NOT COMPLETED BY THE END DATE (who, which work, end date, days late, why).
  Inbox = the usual notifications (rework, issues, failed tests, approvals, approaching deadlines) + the Activity feed. Everyone sees their own late work; administrators / project managers see all.
- E-mail: Settings -> "E-mail alerts (Gmail)" (administrator only). Enter the Gmail address and a Gmail App Password
  (steps are shown on the page: Google Account -> Security -> 2-Step Verification -> App passwords), add any number of extra
  recipient addresses, press Save -> Send test e-mail -> Turn on.
- When a NEW item becomes late the server e-mails the full details (who, which work, end date, days late, reason, recent
  activity, link to the app) to: the person responsible (if their User ID is a real e-mail), administrators and project
  managers, and the extra recipients. It checks every 2 minutes, also when nobody has the app open - the server PC must be on
  and have internet. Each late item is e-mailed once (tick "Remind again every day" to repeat daily).
- Turning it on does not e-mail items that are already late; press "Send all late items now" to send those too.
- The App Password is stored only in data/db.json on this PC and is never sent to browsers. Keep the data folder private.
- New file: mail.js (keep it next to server.js).

HOME PAGE ACCESS LIMITS
- Access -> "Access limits by role" now has a "Home" row: untick it to hide the Home page for an account type
  (those users land on My Tasks instead). The administrator always has Home.
- Settings -> Section access -> "Home" controls each Home card per role: Project managers table, My Tasks,
  Online now, Needs attention, Recent activity (None = hidden), and "Assign a project to a project manager".

PHONE LAYOUT
- Chat on phones works like WhatsApp: the list of chats first, tap one to open a full-screen conversation, back arrow to return.
  The conversation fits the screen and keeps the message box above the keyboard.
- The late-work list (Notifications) and My Tasks show as cards on phones instead of wide tables.

AI ASSISTANT (PRIVATE, RUNS ON YOUR OWN PC)
- Left menu -> "AI Assistant". Tabs: Ask (questions about your projects, late work, tasks, issues), Summaries (today / weekly
  report, copy or e-mail to yourself), Write (improve a delay reason, chat message, remark or e-mail reply), Email -> tasks
  (reads unread Gmail, the AI suggests which mails are tasks, you press "Add as task").
- It uses Ollama (free) on this PC, so project data never leaves your network. Install once:
  1) Install Ollama from ollama.com   2) open a command window:  ollama pull qwen2.5:3b
     (8 GB PC: qwen2.5:3b, 16 GB: qwen2.5:7b / llama3.1:8b, better Arabic: qwen2.5:7b)   3) keep Ollama running
  4) AI Assistant page -> AI settings -> type the model name -> Test connection -> Turn AI on.
- The AI address must be this PC or a PC inside your network. Each person only gets answers from data they can see.
- A normal office PC with 16 GB memory answers in about 10-60 seconds. Weak PCs: use the 3b model.
- Reading Gmail needs the Gmail App Password set in Settings -> E-mail alerts, and IMAP turned on in Gmail
  (Gmail Settings -> Forwarding and POP/IMAP -> Enable IMAP). Mails stay unread in Gmail. Only administrators and
  project managers can use the Email -> tasks tab.
- Hide the page for an account type: Access -> Access limits by role -> "AI Assistant".
- New file: ai.js (keep it next to server.js).

WHAT IS INCLUDED AT FIRST START
Both projects (Robot Jockey RJ B, 16 components, and Robot Jockey RC B, 10 components) with all
pictures, remarks, actions and dates imported from your Word files. Anything edited later in the
Claude-hosted version is NOT copied here; this version has its own separate data.

FILES
server.js + mail.js + ai.js (server) | public/ (web page, scripts, PDF/Excel libraries) | seed.json (starting data)
data/ (created on first run: db.json, uploads/)


PROFILE PICTURES
- Everyone: Settings > Profile picture > Upload photo (any photo; it is cropped to a square and shrunk automatically). Remove puts the initials back.
- Administrators can also set or remove the picture of any other user in the same card.
- The picture appears everywhere a name circle was shown: header, chat, online list, tasks, history, comments, approvals, team.
- People can change only their own picture; pictures are stored in data/db.json (about 10 KB each).


ACCESS CONTROL SCREEN (Access page)
- The four access cards are now grouped under one "Access control" panel with four tabs:
  Pages & editing (Access limits by role), Sections (Section access by role), Files (File access by role) and
  Approvals (Approval by a project manager).
- On/off options are switches (green = allowed). The Sections tab has a "Find a setting" box.
- Nothing about how access works changed; all saved settings and data stay exactly as they were.


PROJECT HEADER AND TABS
- The project header now shows a project icon, a progress bar and a clear Delete project button.
- The 12 project tabs are grouped, all visible without sideways scrolling: Work (Project Items, List, Timeline, Calendar),
  Review (Dashboard, Issues / Actions, History, Close-Out) and Records (Files, Costs / BOM, Table, Record Pages).
- Section access limits for tabs still work; a group disappears when all its tabs are hidden for that role. No data changed.


ARABIC
- The Access, Team, Settings (alerts, e-mail, profile picture), AI assistant, Attendance, Budget and Approvals screens are now fully translated.
  Project names, people's names, part numbers and the text you typed yourself are never changed.

SECURITY (added)
- Sign-in: wrong attempts are limited per user and per computer; repeated failures lock that user ID for longer each time (1 to 15 minutes).
  Passcodes are compared in constant time; changing a passcode signs that user out on all other devices.
- Over https://...:3001 the sign-in cookie is also marked Secure and the browser is told to keep using https (HSTS).
- All data replies are marked no-store (not kept in browser or proxy caches).
- Content Security Policy: the app may load scripts, images and files only from this server; it cannot be shown inside another site.
- Camera/microphone are allowed only for this app (needed for attendance selfies); location and payment are off.
- A new passcode must differ from the old one and be at least 8 characters.


PURCHASE REQUESTS (own page + Approvals)
----------------------------------------
Sidebar > "Purchase Requests" is where requests are raised and tracked.
 - "New purchase request" opens a short form in three parts: project & item, quantity & cost
   (the total is calculated as you type), priority & needed-by date, and WHY it is needed
   (required). Each request gets a number such as PR-2026-0001 with who raised it and when.
 - The page shows every request as a card with a Raised > Decision > Ordered progress line,
   who approved or rejected it, the comment, and a full History. Filter by status or project.
 - Approvals page: shows only the purchase requests that are waiting for a decision.
   Administrators and Project Managers can Approve (optional comment) or Reject (reason
   required) there; the Approvals badge counts them. An approved request can be marked Ordered.
 - Other users see only their own requests and can cancel their own while still pending.
 - Nothing is ever deleted; every step is kept in the History with name and time.
 - "Print form" gives an A4 purchase-request form (details, items and total, justification,
   approval decision, signature lines, audit trail) - Print or Save as PDF. "Print register"
   prints the list on screen.
 - Access (Admin > Access): "Page access by role" has a Purchase Requests page switch (hidden
   for Guest by default) and "Section access by role" has two groups:
   Approvals > Purchase requests awaiting decision, and Purchase Requests > Raise a request /
   Request list / Print forms. Set a section to Read only to let a role look but not raise.


COMPANIES (several companies in one app)
----------------------------------------
Use this when one installation serves more than one company. Every company is completely
separate: its own projects and project items, files, team, assignments, approvals, purchase
requests, daily work, inventory, chat (General and project channels) and attendance.
 - The company picker is in the top bar (next to the title). Switching reloads the app and
   shows only that company. The last company you used is remembered.
 - Admin > Access > "Companies": add a company, edit its name/code/head/colour, switch one off
   (never deleted), choose which accounts can work in which company, and move a project from
   one company to another.
 - Existing data was placed in "Main Department" (rename it under Access > Companies > Edit).
   Nothing was changed or deleted.
 - Teams: when you add a team member, tick the companies they work in. "Company membership"
   (Teams page) changes it later. New projects, purchase requests and approvals always belong
   to the company you are working in; the print form shows the company name.
 - Administrators can open every company. Everyone else can open only the companies ticked
   for them, and the server enforces it - other companies' data is not sent to their browser.
 - Shared by all companies: sign-in accounts, role/permission settings (Access), licence and
   e-mail settings.

ARABIC PRINTING OF PURCHASE REQUESTS
------------------------------------
"Print form - Arabic" prints the whole form in Arabic: item, reason, supplier, project name,
comments, names, roles, company, dates and currency. Nothing needs to be typed.
 - The server first asks a free online translation service (needs internet on the server PC;
   only the short request texts are sent). If that is not reachable, a built-in English-Arabic
   dictionary is used, and names are written in Arabic letters.
 - The Arabic is saved with the request, so later prints are the same. "Arabic text" on the
   request card lets the requester or a manager correct any line (names, wording) and print again.
 - Company name: Access > Companies > Edit has "Company name in Arabic".

AI ASSISTANT - PROFESSIONAL EDITION (updated)
- A status bar at the top shows whether the AI is Ready, switched off, Ollama not running, or the model missing, with the exact
  fix (copy buttons for the commands). People who are not administrators get a "Copy a message for the administrator" button.
- Tabs: Assistant (chat; answers appear while they are written, Stop button, attach photos), Board Issue Solver, Summaries,
  Write, Email -> tasks, Help & checks.
- Board Issue Solver: pick the board/component (optional), say where it was noticed, describe the problem, what was tried, and add up to
  4 photos or screenshots. The AI uses that board's record and similar past cases from your own issues, then gives: Summary, Most likely
  causes, Checks in order, Fix, If still not solved, Prevent it. "Save to <ID> as an issue" adds it to the board's Issues / Actions
  (marked "AI-suggested - verify before use"). Follow-up questions keep the case context. Recent cases are kept in this browser.
- Photos need a VISION model (a normal text model cannot see). Install once on the server PC:  ollama pull gemma3:4b
  then AI settings -> Vision model = gemma3:4b -> Save -> Test connection. Text model for an 8 GB PC: qwen2.5:3b.
  The settings card shows this PC's memory and recommends models. Ollama swaps models in memory, so the first photo question is slower.
- Help & checks: "Run checks" tests network, server, AI switch, Ollama, models and connection type; "Send a test question" times a real
  answer; plus a fix guide for common problems (cannot open on phone, sign-in, access, https warning, slow AI, photos).
- Updated files: server.js, ai.js, public/local.js.

ACCESS PAGE - MORE CONTROL (updated)
- Access -> "Access limits by role": now lists every page of the left menu in the same order (Home, My Tasks, Daily Work,
  Attendance, Projects, Inventory, Teams, Inbox, Chat, AI Assistant, Approvals, Purchase Requests, Calendar, Timeline, Reports,
  Dashboard, Notifications, Activity log, Costs / BOM) plus a new row "Switch company". When it is blocked for an account type, that
  person only sees their company name (no switcher) and the server refuses any attempt to change company.
- Access -> "Section access by role": groups follow the left-menu order. New / expanded groups (No access / Read only / Can edit):
  Purchase Requests: raise, list, cancel a pending request, MARK AS ORDERED, print English, print Arabic, edit the Arabic text.
  Approvals: see requests waiting, approve or reject.   AI Assistant: chat, attach photos, Board Issue Solver, save an AI result as an
  issue, summaries, write, email -> tasks, help & checks.
  These are enforced on the server as well as in the page. The Owner/Administrator always has full access.
- Updated files: server.js, public/local.js.


NEW DESIGN - COMMAND CENTER (dark, advanced)
--------------------------------------------
* The whole app has a new dark "command center" look, new duotone icons, a new
  Dashboard (live header, progress rings, pipeline, status bar, category bars,
  milestone track) and a new sign-in screen. It becomes the default once for
  everyone; each person can still pick any other theme in Settings (the old
  themes are all still there). No data is changed by the design.
* Press Ctrl+K (or Cmd+K) anywhere to jump to any page by typing its name.

SERVER ADDRESS & PORT (Settings page, administrators only)
----------------------------------------------------------
* Settings > "Server address & port" shows every link colleagues can use,
  with Copy and a QR code for phones.
* Choose "All networks (recommended)" or one specific network address, and set
  the web port (default 3000) and secure port (default 3001).
* "Save & restart server" saves to data/net.json, restarts the server and
  moves your browser to the new link. Everyone else must use the new link.
* Start the server with start.bat (or start.sh) so it can restart itself.
* If other PCs/phones cannot connect, allow the ports in Windows Firewall
  (Command Prompt as administrator - the exact command is shown on the page):
    netsh advfirewall firewall add rule name="EPM" dir=in action=allow protocol=TCP localport=3000,3001
* Give the server PC a fixed (static) IP so the link never changes.
* To undo: delete data/net.json and restart.


NO NODE.JS NEEDED
-----------------
The folder "runtime" contains node.exe (portable Node.js). start.bat, EPM.vbs and install-windows-app.bat use it automatically, so nothing has to be installed on the PC. Keep the runtime folder next to server.js.

INTERNET / OWN DOMAIN: see DOMAIN-SETUP.txt (Cloudflare Tunnel, tools\cloudflared.exe included).


SHARED FILES (new menu item "Shared Files")
-------------------------------------------
* Files are stored on the server PC in the folder  data\share  (include it in your backups).
* COMMON folder: everyone can upload/download.
* One DEPARTMENT folder per company/department (Main Department, Gulf Robotics ...): only people of that department.
* The administrator can create more main folders (for example "Energy") and choose who may use each one:
  everyone, selected departments, selected roles (Engineer, Procurement ...), or individual people;
  and set it to "download only" if needed.
* Anyone with upload rights can create sub-folders, drag & drop files, rename and delete their own files.
  Administrators can delete anything. Deleted files are not lost: they are moved to data\share\.trash.
* Page access for the menu item can be set per role on the Access page ("Shared Files").
* Access page > "Section access by role" now has a "Shared Files" section: open/download, upload, create sub-folders, delete own files, delete anyone's files (default: Project Manager only). Management is read-only by default.

CHAT ACROSS ALL COMPANIES
-------------------------
* New channel "All companies": everyone in every company/department can read and write there.
* "General" stays for the current company only.
* New direct message / New group now list people from ALL companies and departments (with their role and company).
* Direct messages and groups already worked across companies; project channels still follow project access.

SHARED FILES - OPEN TO ALL COMPANIES: department folders are now open to everyone in all companies/departments by default (like chat). The administrator can tick/untick "Department folders are open to everyone" at the top of the Shared Files page.

FIX: people whose project access is "view only" (for example Procurement on Robot Jockey) can now still use Chat and Shared Files (the read-only lock no longer disables these pages).

PASSCODES & DATA ARE NOW SAFE ACROSS RESTARTS
---------------------------------------------
* A changed passcode (and new users) is written to disk immediately; data is also saved when you press Ctrl+C or close the server.
* Only ONE server can use a data folder at a time. If you start a second copy it stops with a clear message instead of overwriting the first one (this was the usual cause of "my new passcode disappeared").
* If data\db.json is ever damaged, the server restores data\db.json.bak automatically; if there is no backup it refuses to start and changes nothing (it never replaces your data with a blank file).
* Stop the server with Ctrl+C in its window (or end node.exe in Task Manager) before starting it again.

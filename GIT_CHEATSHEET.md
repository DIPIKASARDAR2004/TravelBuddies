# 🚀 The Idiot-Proof Guide to Testing New Code (Git Branches)

Hey team! We are testing out some massive new UI redesigns and refactored code. To make sure we don't break our main working app, we are putting all these crazy new changes on a separate "timeline" called a **branch**.

Think of the `main` branch as the stable, working version of our app. 
Think of the `testing` branch as our sandbox where we try out new things.

Here is exactly how you can hop between them to see the old version and the new version on your own computer.

---

## 1. How to see the NEW redesign (Switching to the `testing` branch)

If you want to see the new changes Soojan and the AI made, follow these exact steps in your terminal:

**Step 1: Download the latest changes from GitHub**
```bash
git fetch
```

**Step 2: Hop over to the testing branch**
```bash
git checkout testing
```
*(You should see a message saying "Switched to branch 'testing'")*

**Step 3: Install any new packages we added**
Because we added new fonts and animation libraries, you **MUST** run this command before starting the app, otherwise it will crash:
```bash
cd frontend
npm install
```

**Step 4: Start the app!**
```bash
npm run dev
```
Now go to your browser (usually `http://localhost:3000`) and enjoy the new premium UI!

---

## 2. How to go back to the OLD version (Switching to the `main` branch)

Don't like the new UI? Need to work on the old stable code? No problem, you can time-travel back to the `main` branch easily.

**Step 1: Stop the app if it's running**
Go to your terminal and press `Ctrl + C` (or `Cmd + C` on Mac) to kill the dev server.

**Step 2: Hop back to the main branch**
```bash
git checkout main
```
*(You should see a message saying "Switched to branch 'main'")*

**Step 3: Revert the installed packages**
Since the old version doesn't have the new animation libraries, you need to sync your packages back:
```bash
cd frontend
npm install
```

**Step 4: Start the app!**
```bash
npm run dev
```
Boom! You are back on the old familiar site.

---

## 💡 Troubleshooting
- **"I have uncommitted changes" error:** If you try to run `git checkout` and Git yells at you about "uncommitted changes", it means you edited some files and Git doesn't want to lose your work.
  - If you **don't** care about your changes and just want to throw them away, run: `git stash` and then try `git checkout` again.
  - If you **do** care about your changes, you need to save them first: `git add .` and then `git commit -m "saving my work"`.

Happy coding! 💻✨

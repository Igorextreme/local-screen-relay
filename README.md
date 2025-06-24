# 📺 Local Screen Share

> A real-time screen sharing system over **local network** — perfect for classrooms, labs, and offline environments.

## 🚀 Overview

**Local Screen Share** is a lightweight and easy-to-use solution for broadcasting your screen to other devices on the same Wi-Fi network — **no internet required**. It's built using modern web technologies and works entirely within the browser.

---

## 🧑‍💻 Getting Started

### 1. Install dependencies

```bash
npm install
```
2. Build the server
```bash
npm run build:server
```
3. Start the development environment
```bash
npm run dev
```
This runs both the frontend (Vite) and backend server simultaneously.

4. Open the app in your browser
```bash

http://localhost:5173
```
If you're on a different device in the same Wi-Fi network, use the local IP of the host machine, e.g.:

```bash

http://192.168.1.12:8080
```
## Features
Screen Broadcasting
📡 Real-time screen sharing over local network

⚙️ Automatic FPS adjustment

🖼️ Live preview of the shared screen

🖱️ Option to share a tab, window, or full screen

Viewer Mode
👁️ Smooth real-time display

🔄 Auto-connect to available stream

🖥️ Fullscreen mode support

## How to Use
To Start a Broadcast:
Click “Transmit” on the homepage.

Click “Start Broadcasting”.

Choose the screen, window, or tab to share in the browser prompt.

Share the server link displayed above the button, e.g.:

```arduino

Server: http://192.168.1.12:8080
```
Others on the network can open this link and click “View Broadcast”.

## Project Motivation
This tool was developed to assist students and teachers in environments where internet connectivity is limited or unavailable.

In many computer science and software development courses, it can be difficult for students to follow along with live demonstrations. Local Screen Share solves this by providing a simple way to share a screen across a local Wi-Fi network without external dependencies — enabling better engagement and hands-on learning.

## Built With
Vite + React + TypeScript

Tailwind CSS + tailwindcss-animate

Radix UI components

React Hook Form + zod for validation

WebSockets (ws) for real-time communication

Node.js backend (compiled with TypeScript)

## Available Scripts
Command	Description
npm run dev	Start Vite and backend server concurrently
npm run build	Build frontend app
npm run build:server	Compile the server using tsconfig.server.json
npm run start	Run only the compiled backend server
npm run lint	Run ESLint on the entire project

## License
This project is open-source and available for educational or personal use.


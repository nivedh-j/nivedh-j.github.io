# 3D Interactive Data Science Portfolio - Nivedh J

This is your new 3D Interactive Professional Portfolio. It is themed around Data Science and Machine Learning.

## 🚀 How to Run Locally

You can open this project in any browser. Since it uses WebGL (Three.js) and scroll animations (GSAP), the best experience is to run it through a local development server:

1. **Using VS Code Live Server (Recommended):**
   * Open this directory (`3d-portfolio`) in VS Code.
   * Right-click on `index.html` and click **"Open with Live Server"**.

2. **Using Python (Simple command line server):**
   * Open your terminal inside this folder.
   * Run the command:
     ```bash
     python -m http.server 8000
     ```
   * Open your browser and navigate to `http://localhost:8000`.

3. **Using Node/NPM (Optional):**
   * If you have `http-server` or any static server installed globally:
     ```bash
     npx http-server ./
     ```

---

## 📁 File Structure

* `index.html` - Core HTML skeleton with CDN dependencies.
* `style.css` - Custom styling sheet (dark theme, glassmorphic grids, responsive structures).
* `main.js` - Three.js WebGL initialization, 3D Data Constellation plexus particle code, and GSAP camera scroll animations.
* `img/` - Directory for images.
  * `portrait.jpg` - Your extracted profile photo (optimized and compressed to 800KB).
* `Nivedh_J_Resume.pdf` - **Placeholder**. Please place your actual resume PDF in this directory named exactly `Nivedh_J_Resume.pdf` so that the download links work!

---

## ⚡ Key 3D Features & Interactions

* **Interactive Constellation background:** Particles float and drift, and connecting lines form dynamically based on coordinate proximity.
* **Parallax mouse tracking:** The camera angle shifts slightly as you move your mouse.
* **Scroll-driven flight path:** The camera zooms and pans through the 3D space as you scroll through different sections of the page.
* **Glow card 3D tilt:** Hovering over the main metrics card in the Hero section tilts the card in 3D space, responding to your cursor.
* **Smooth trailing custom cursor:** Interactive elements scale up and change the border color of your custom cursor ring.

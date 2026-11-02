# ApexCast & RutTrack - Hunting & Fishing Intelligence Platform

Predictive hunting and fishing intelligence platform tailored for Michigan outdoorsmen (LeRoy, Rosebush, Tustin, Lake Mitchell, Rose Lake, East Bay, Lake Skegemog) and any custom coordinate or lake nationwide.

---

## 🚀 How to Deploy on GitHub Pages (Fixing Blank Screen / MIME Type Error)

If you saw the error:
```
Loading module from “https://hayesjo.github.io/src/main.tsx” was blocked because of a disallowed MIME type (“text/html”)
```
This happens because browsers cannot execute raw TypeScript (`.tsx`) files directly from GitHub. GitHub Pages was trying to serve the unbuilt source files instead of the compiled production bundle (`dist/`).

### Quick Fix (Automated Deployment via GitHub Actions - Recommended):

1. **Commit and push** all project files (including `.github/workflows/deploy.yml`) to your GitHub repository:
   ```bash
   git add .
   git commit -m "Configure GitHub Pages build workflow"
   git push origin main
   ```

2. Open your repository on GitHub in your browser.
3. Click **Settings** (top tabs of the repository).
4. In the left sidebar, click **Pages** (under the "Code and automation" section).
5. Under **Build and deployment** > **Source**:
   - Change from **"Deploy from a branch"** to **"GitHub Actions"**.
6. That's it! GitHub will now automatically run the workflow, run `npm run build`, and deploy the production bundle (`dist`) directly to `https://hayesjo.github.io`.
7. You can monitor the deployment under the **Actions** tab in your repository. When the green checkmark appears, your site is live!

---

### Alternative: Manual Deployment (`gh-pages`)

If you prefer deploying from a branch:
1. Build locally:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to the `gh-pages` branch using the `gh-pages` package:
   ```bash
   npx gh-pages -d dist
   ```
3. In **Settings** > **Pages** > **Source**, choose **Deploy from a branch**, select `gh-pages`, and folder `/ (root)`.

---

## Features
- **Hunting Units**: LeRoy MI, Rosebush MI (with aerial parcel & deer stand wind map overlay), and Tustin MI.
- **Fishing Units**: Lake Mitchell (Cadillac, MI), Rose Lake (LeRoy, MI), Grand Traverse East Bay (Traverse City, MI), Lake Skegemog (Williamsburg, MI).
- **Custom Location Search**: Search any city or lake coordinates.
- **Solunar & Moon Engine**: Major/Minor feeding times, moon illumination, rise/set.
- **Rut Phase Calendar**: Peak rut timing, buck movement patterns, and stand placement tactics.
- **Water Conditions**: Surface temperature, barometric trends, water clarity, wind speed/direction, and depth profiles.
- **Tactical Bass Lures & Hotspots**: Recommended lure, retrieve cadence, structure type, and depth based on real-time atmospheric and seasonal conditions.
- **Stand Wind Compass**: Wind direction versus stand orientation scent safety indicator.

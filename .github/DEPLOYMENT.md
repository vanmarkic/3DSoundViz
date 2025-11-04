# Deployment Guide

## GitHub Pages Automatic Deployment

This project is configured to automatically deploy to GitHub Pages using GitHub Actions.

### How it works

1. **Trigger**: Any push to `main` or `master` branch triggers the deployment
2. **Build**: GitHub Actions runs `npm install` and `npm run build`
3. **Deploy**: The built files from `dist/` are deployed to GitHub Pages
4. **Access**: Visit `https://vanmarkic.github.io/3DSoundViz/`

### First-time Setup

1. Go to **Settings** → **Pages** in your repository
2. Under "Build and deployment", select:
   - Source: **GitHub Actions**
3. Push a commit to `main` or `master`
4. Wait 2-3 minutes for the deployment to complete
5. Visit your GitHub Pages URL

### Manual Trigger

You can also trigger a deployment manually:
1. Go to **Actions** tab in your repository
2. Click on "Deploy to GitHub Pages" workflow
3. Click "Run workflow" button
4. Select the branch and click "Run workflow"

### Deployment Status

Check deployment status at:
```
https://github.com/vanmarkic/3DSoundViz/actions
```

Green checkmark ✅ = Deployment successful
Red X ❌ = Deployment failed (check logs)

## Alternative Deployment Options

### Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/vanmarkic/3DSoundViz)

1. Click the button above
2. Connect your GitHub account
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy!

### Vercel

```bash
npm i -g vercel
vercel
```

Follow the prompts to deploy.

### Cloudflare Pages

1. Go to Cloudflare Pages dashboard
2. Connect your GitHub repository
3. Configure:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Deploy!

### Static Hosting (Any Provider)

Build the project locally:
```bash
npm run build
```

Upload the contents of the `dist/` folder to your hosting provider.

## Mobile Testing

### Local Network Testing

Test on your mobile device over local network:

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Find your local IP:
   - **Mac/Linux**: `ifconfig | grep inet`
   - **Windows**: `ipconfig`

3. Access from mobile browser:
   ```
   http://YOUR_IP:5173
   ```

### Production Testing

Test the production build locally:
```bash
npm run build
npm run preview
```

Access at: `http://localhost:4173`

## Troubleshooting

### Build Fails

**Issue**: TypeScript errors
**Solution**: Run `npm run typecheck` locally first

**Issue**: Out of memory
**Solution**: Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`

### GitHub Pages Not Working

**Issue**: 404 Page Not Found
**Solution**:
1. Check if Pages is enabled in Settings
2. Verify base path in `vite.config.ts` matches repo name
3. Wait 5-10 minutes after first deployment

**Issue**: Blank page
**Solution**: Check browser console for errors. Usually a base path issue.

### Mobile Issues

**Issue**: Audio not working on iOS
**Solution**: Safari requires user interaction before audio. Click "Allow Microphone Access" button.

**Issue**: Low FPS on mobile
**Solution**: Quality automatically reduced to "medium" on mobile. This is normal.

**Issue**: UI too small on mobile
**Solution**: UI automatically adapts. Try rotating device or force desktop site mode.

## Security Notes

- Audio access requires user permission
- App runs entirely client-side (no server needed)
- No data is collected or transmitted
- Safe to use on public networks

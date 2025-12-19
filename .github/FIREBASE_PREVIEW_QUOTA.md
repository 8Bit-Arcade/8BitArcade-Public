# Firebase Preview Channel Quota Issue

## Problem

Firebase Hosting has a limit on preview channels (temporary PR preview URLs):

```
Error: HTTP 429 - channel quota reached
```

### Limits:
- **Spark (Free) Plan:** 10 active preview channels
- **Blaze (Pay-as-you-go):** Higher limits but still daily creation caps

## Why This Happens

Every PR creates a new preview channel. Over time, old channels accumulate and hit the quota limit.

## Solution

### Automatic Cleanup (Recommended)

We have a weekly automated cleanup workflow:

**File:** `.github/workflows/cleanup-preview-channels.yml`

- **Runs:** Every Sunday at midnight
- **Action:** Deletes all old preview channels except `live`
- **Manual trigger:** Available via GitHub Actions UI

### Manual Cleanup

#### Option 1: Via GitHub Actions
1. Go to **Actions** tab
2. Select **"Cleanup Preview Channels"** workflow
3. Click **"Run workflow"**
4. Wait ~30 seconds
5. Retry your PR preview deploy

#### Option 2: Local Cleanup
```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Login to Firebase
firebase login

# List all channels
firebase hosting:channel:list --project bitarcade-679b7

# Delete old channels (keeps 'live')
firebase hosting:channel:list --project bitarcade-679b7 --json | \
  jq -r '.result.channels[] | select(.name != "live") | .name' | \
  while read channel; do
    firebase hosting:channel:delete "$channel" --project bitarcade-679b7 --force
  done
```

#### Option 3: Quick Script
```bash
cd .github/scripts
chmod +x cleanup-preview-channels.sh
./cleanup-preview-channels.sh
```

## Graceful Handling

The PR workflow now handles quota errors gracefully:

1. ✅ **Build still succeeds** - Your code is validated
2. ⚠️ **Preview skipped** - No temporary URL created
3. 💬 **PR comment** - Explains what happened and how to fix
4. ✅ **Merge works** - Deploys to production normally

**You don't need to close/reopen PRs** - Just clean up channels and the next push will get a preview.

## Preventing Future Issues

### Best Practices:
1. **Close old PRs** - Don't leave stale PRs open
2. **Run cleanup weekly** - Automated workflow handles this
3. **Upgrade to Blaze** - If you need unlimited channels (costs ~$0)

### Check Current Usage:
```bash
firebase hosting:channel:list --project bitarcade-679b7
```

Should show < 10 channels for free tier.

## FAQ

**Q: Does this break deployments?**
A: No! Only PR previews are affected. Main branch deploys work fine.

**Q: Will my PR still be tested?**
A: Yes! The build runs and validates your code. Only the preview URL is skipped.

**Q: Should I upgrade to Blaze plan?**
A: Only if you regularly have 10+ active PRs. For most projects, weekly cleanup is enough.

**Q: Can I increase the limit?**
A: Yes, upgrade to Blaze plan (requires credit card but may stay free with low usage).

## Related Files

- `.github/workflows/cleanup-preview-channels.yml` - Automated cleanup
- `.github/workflows/firebase-hosting-pull-request.yml` - PR preview deploys
- `.github/scripts/cleanup-preview-channels.sh` - Manual cleanup script

## Support

If cleanup doesn't resolve the issue:
1. Check Firebase console for any stuck deployments
2. Verify you're on the correct project: `bitarcade-679b7`
3. Try manually deleting channels via Firebase console
4. Consider upgrading to Blaze plan if you need more capacity

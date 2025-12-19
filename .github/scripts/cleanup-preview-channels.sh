#!/bin/bash
# Firebase Preview Channel Cleanup Script
# Deletes old/expired preview channels to free up quota

echo "🧹 Cleaning up Firebase Hosting preview channels..."
echo ""

# List all channels
echo "📋 Current channels:"
firebase hosting:channel:list

echo ""
echo "⚠️  Deleting old preview channels..."

# Delete all PR preview channels (you can be more selective if needed)
# This will keep the 'live' channel but remove PR previews
firebase hosting:channel:list --json | jq -r '.result.channels[].name' | grep -v "^live$" | while read channel; do
  echo "Deleting: $channel"
  firebase hosting:channel:delete "$channel" --force
done

echo ""
echo "✅ Cleanup complete!"
echo "📊 Remaining channels:"
firebase hosting:channel:list

#!/bin/bash

# Daily availability update script
# This script should be run daily to advance therapist availability

echo "🕐 Starting daily availability update at $(date)"

# Change to project directory
cd "$(dirname "$0")/.."

# Run the advance availability script
npx ts-node scripts/advance-availability.ts

# Log the update
echo "✅ Daily availability update completed at $(date)" >> logs/availability-updates.log

# Optional: Commit changes to git (uncomment if needed)
# git add data/therapists.json
# git commit -m "Daily availability update - $(date)"
# git push origin main


#!/bin/bash

# Script to add 'use client' directive to the top of all .tsx files in the artifacts/bolt directory
# This ensures all components are properly marked as client components in Next.js

# Directory to process
DIR="src/artifacts/bolt"

# Find all .tsx files in the directory (recursive)
find "$DIR" -name "*.tsx" | while read -r file; do
  # Check if file already has 'use client' directive
  if ! grep -q "^['|\"]use client['|\"]" "$file"; then
    echo "Adding 'use client' to $file"
    # Create a temporary file
    temp_file=$(mktemp)
    # Add 'use client' directive and then the original content
    echo "'use client';" > "$temp_file"
    echo "" >> "$temp_file"
    cat "$file" >> "$temp_file"
    # Replace the original file with the modified content
    mv "$temp_file" "$file"
  else
    echo "Skipping $file - already has 'use client' directive"
  fi
done

echo "Done! Added 'use client' directive to TSX files in $DIR"

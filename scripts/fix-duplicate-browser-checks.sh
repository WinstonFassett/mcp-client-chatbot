#!/bin/bash

# Script to fix duplicate browser environment checks in the Bolt codebase
# This removes redundant isBrowser() && isBrowser() patterns and duplicate function declarations

DIR="src/artifacts/bolt"

# Fix duplicate isBrowser() function declarations
echo "Fixing duplicate isBrowser() function declarations..."
find "$DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  # Count occurrences of isBrowser function declaration
  count=$(grep -c "const isBrowser = () => typeof window !== \"undefined\"" "$file")
  
  if [ "$count" -gt 1 ]; then
    echo "Fixing duplicate function declaration in $file"
    # Create a temporary file
    temp_file=$(mktemp)
    
    # Keep only the first occurrence of the isBrowser function declaration
    awk '
      BEGIN { found = 0 }
      /const isBrowser = \(\) => typeof window !== "undefined";/ {
        if (found == 0) {
          print;
          found = 1;
        } else {
          next;
        }
      }
      !/const isBrowser = \(\) => typeof window !== "undefined";/ { print }
    ' "$file" > "$temp_file"
    
    # Replace the original file
    mv "$temp_file" "$file"
  fi
done

# Fix redundant isBrowser() && isBrowser() patterns
echo "Fixing redundant isBrowser() && isBrowser() patterns..."
find "$DIR" -type f -name "*.ts" -o -name "*.tsx" | xargs grep -l "isBrowser() && isBrowser()" | while read -r file; do
  echo "Fixing redundant checks in $file"
  sed -i '' 's/isBrowser() && isBrowser()/isBrowser()/g' "$file"
done

echo "Done! Fixed duplicate browser environment checks in $DIR"

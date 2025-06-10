#!/bin/bash

# Script to add browser environment checks to files using localStorage in the Bolt codebase
# This ensures that localStorage is only accessed in a browser environment

DIR="src/artifacts/bolt"

# Find all files containing localStorage references
FILES=$(grep -l "localStorage" --include="*.ts" --include="*.tsx" -r "$DIR")

for file in $FILES; do
  echo "Processing $file..."
  
  # Check if the file already has browser environment checks
  if ! grep -q "typeof window !== 'undefined'" "$file"; then
    # Create a temporary file
    temp_file=$(mktemp)
    
    # Add browser check at the top of the file (after imports)
    awk '
      BEGIN { added = 0; in_import = 0; }
      /^import/ { in_import = 1; print; next; }
      /^$/ && in_import && !added { 
        in_import = 0;
        print ""; 
        print "// Helper function to check if code is running in browser environment";
        print "const isBrowser = () => typeof window !== \"undefined\";";
        print "";
        added = 1;
        next;
      }
      { print; }
    ' "$file" > "$temp_file"
    
    # Replace the original file
    mv "$temp_file" "$file"
    
    # Now use sed to replace localStorage access patterns
    sed -i '' -e 's/localStorage\./isBrowser() \&\& localStorage./g' "$file"
    sed -i '' -e 's/typeof localStorage !== .undefined./isBrowser()/g' "$file"
    sed -i '' -e 's/typeof window !== .undefined. ? localStorage/isBrowser() ? localStorage/g' "$file"
    
    echo "Added browser environment checks to $file"
  else
    echo "File $file already has browser environment checks, skipping"
  fi
done

echo "Done! Added browser environment checks to files using localStorage in $DIR"

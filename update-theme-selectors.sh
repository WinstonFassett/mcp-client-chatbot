#!/bin/bash

# Script to update theme selectors in Bolt components
# This script updates data-theme='dark' and data-theme='light' to work with our theme system

echo "Updating theme selectors in Bolt components..."

# Directory containing Bolt components
BOLT_DIR="/Users/winston/dev/personal/try/mcp-client-chatbot/src/artifacts/bolt"

# Update CSS/SCSS files
echo "Updating CSS/SCSS files..."

# 1. Update html[data-theme='light'] to html:not([data-theme*='-dark'])
find "$BOLT_DIR" -type f -name "*.scss" -o -name "*.css" | xargs sed -i '' 's/html\[data-theme='\''light'\''\]/html:not([data-theme*='\''-dark'\''])/g'

# 2. Update :global(html[data-theme='light']) to :global(html:not([data-theme*='-dark']))
find "$BOLT_DIR" -type f -name "*.scss" -o -name "*.css" | xargs sed -i '' 's/:global(html\[data-theme='\''light'\''\])/:global(html:not([data-theme*='\''-dark'\'']))/g'

# 3. Update html[data-theme='dark'] to html[data-theme*='-dark']
find "$BOLT_DIR" -type f -name "*.scss" -o -name "*.css" | xargs sed -i '' 's/html\[data-theme='\''dark'\''\]/html[data-theme*='\''-dark'\'']/g'

# 4. Update :global(html[data-theme='dark']) to :global(html[data-theme*='-dark'])
find "$BOLT_DIR" -type f -name "*.scss" -o -name "*.css" | xargs sed -i '' 's/:global(html\[data-theme='\''dark'\''\])/:global(html[data-theme*='\''-dark'\''])/g'

# Update TypeScript/JavaScript files
echo "Updating TypeScript/JavaScript files..."

# 5. Update data-theme="dark" checks in code
find "$BOLT_DIR" -type f -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' 's/data-theme="dark"/data-theme*="-dark"/g'
find "$BOLT_DIR" -type f -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' 's/data-theme='\''dark'\''/data-theme*='\''-dark'\''/g'

# 6. Update data-theme="light" checks in code
find "$BOLT_DIR" -type f -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' 's/data-theme="light"/data-theme!="*-dark"/g'
find "$BOLT_DIR" -type f -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' 's/data-theme='\''light'\''/data-theme!='\''\*-dark'\''/g'

echo "Theme selector updates complete!"

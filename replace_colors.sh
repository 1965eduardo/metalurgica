#!/bin/bash
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
  -e 's/bg-\[#1A1D20\]/bg-theme-bg/g' \
  -e 's/text-\[#B82020\]/text-theme-primary/g' \
  -e 's/bg-\[#B82020\]/bg-theme-primary/g' \
  -e 's/border-\[#B82020\]/border-theme-primary/g' \
  -e 's/ring-\[#B82020\]/ring-theme-primary/g' \
  -e 's/text-\[#F8F9FA\]/text-theme-title/g' \
  -e 's/text-\[#9BA3AF\]/text-theme-body/g' \
  {} +

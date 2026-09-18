#!/bin/bash
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
  -e 's/bg-\[#151719\]/bg-theme-card/g' \
  -e 's/bg-\[#151719\]\/90/bg-theme-nav/g' \
  -e 's/bg-\[#151719\]\/95/bg-theme-nav/g' \
  {} +

#!/bin/sh
# Package a clean deploy folder (app files only — no Python/SQL tooling).
# Run:  sh build_dist.sh    then drag the dist/ folder to https://app.netlify.com/drop
cd "$(dirname "$0")" || exit 1
rm -rf dist && mkdir dist
cp index.html styles.css app.js data.js catalog.json dist/
echo "dist/ ready — $(ls dist | tr '\n' ' ')"

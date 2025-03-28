#!/bin/bash

URL="$1"

if [ -z "$URL" ]; then
  echo "Usage: $0 <URL>"
  exit 1
fi

curl -X POST "$URL/task" \
  -H "Content-Type: application/json" \
  -d "$(
    jq -n --arg template "$(cat "$(dirname "$0")/../data/template.html")" \
      --arg uuid "$(uuidgen)" \
      --arg now "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
      '{
       taskId: $uuid,
       title: "Effect AI Image Labeler",
       reward: "50000000",
       created: $now,
       template: $template,
       data: [],
       result: ""
     }'
  )"

curl -X POST http://localhost:8888/task \
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

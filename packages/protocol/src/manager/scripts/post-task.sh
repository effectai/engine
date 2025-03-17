curl -X POST http://localhost:8888/task \
  -H "Content-Type: application/json" \
  -d "$(
    jq -n --arg template "$(cat "$(dirname "$0")/../data/template.html")" \
      --arg uuid "$(uuidgen)" \
      '{
       id: $uuid,
       reward: "500",
       created: "2025-01-01T12:00:01Z",
       template: $template,
       data: [],
       result: ""
     }'
  )"

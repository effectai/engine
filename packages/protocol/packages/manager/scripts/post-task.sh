curl -X POST http://localhost:8888/task \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg template "$(cat "$(dirname "$0")/../data/template.html")" '{
       id: "1ae9e442-5f78-40-9987-3f3d745b7e15",
       reward: "500",
       created: "2025-01-01T12:00:01Z",
       template: $template,
       data: [],
       result: ""
     }')"

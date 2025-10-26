## ⚙️ Requirements

- Gh installation:

  ```bash
  brew install gh
  ```

- You must have [GitHub CLI](https://cli.github.com/) installed.
- Logged in:

  ```bash
  gh auth login
  ```

- Also need `jq` installed (Linux/macOS usually has it; on Windows you can install via Chocolatey or Scoop).

---

Here's a GitHub CLI command to delete all workflow runs for a specific workflow file before a certain date:

## For GitHub CLI 2.82.1

```bash
# First, list all workflow runs for ci.yml before 2025-10-23 to verify
gh run list --workflow ci.yml --created "<2025-10-23" --limit 100 --json databaseId

# Then delete them (this will delete ALL runs before 2025-10-23 for ci.yml)
gh run list --workflow ci.yml --created "<2025-10-23" --limit 100 --json databaseId --jq '.[].databaseId' | xargs -I {} gh run delete {}
```

## Alternative approach with more control:

```bash
# Get the workflow ID first
WORKFLOW_ID=$(gh workflow list --limit 200 --json name,id | jq -r '.[] | select(.name == "ci.yml" or .path | endswith("ci.yml")) | .id')

# List runs to confirm
gh api repos/$(gh repo view --json name,owner --jq '"\(.owner.login)/\(.name)")/actions/workflows/$WORKFLOW_ID/runs?created=<2025-10-23&per_page=100' | jq -r '.workflow_runs[] | "\(.id) - \(.created_at) - \(.status)"'

# Delete the runs
gh api repos/$(gh repo view --json name,owner --jq '"\(.owner.login)/\(.name)")/actions/workflows/$WORKFLOW_ID/runs?created=<2025-10-23&per_page=100' | jq -r '.workflow_runs[].id' | xargs -I {} gh api -X DELETE repos/$(gh repo view --json name,owner --jq '"\(.owner.login)/\(.name)")/actions/runs/{}
```

## Step-by-step breakdown:

1. **First, verify which runs will be deleted:**

```bash
gh run list --workflow ci.yml --created "<2025-10-23" --limit 100
```

2. **If you're satisfied with the list, delete them:**

```bash
gh run list --workflow ci.yml --created "<2025-10-23" --limit 100 --json databaseId --jq '.[].databaseId' | xargs -I {} gh run delete {}
```

## Important Notes:

- The `--created "<2025-10-23"` filter uses GitHub's date query syntax
- `--limit 100` sets the maximum number of runs to process (GitHub's default is 30)
- The commands assume you're in the repository directory or have set the repo context
- Make sure you have the necessary permissions to delete workflow runs
- **Always test with the list command first** to verify which runs will be deleted

## For repositories not in current context:

```bash
# Specify repo explicitly
gh run list --repo owner/repo --workflow ci.yml --created "<2025-10-23" --limit 100 --json databaseId --jq '.[].databaseId' | xargs -I {} gh run delete --repo owner/repo {}
```

The first approach using `gh run list` and `gh run delete` is recommended as it's simpler and uses the official CLI commands rather than direct API calls.

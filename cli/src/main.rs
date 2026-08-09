use std::path::{Path, PathBuf};

fn grail_home() -> PathBuf {
    if let Ok(dir) = std::env::var("GRAIL_HOME") {
        PathBuf::from(dir)
    } else {
        dirs::home_dir()
            .expect("Could not determine home directory")
            .join(".grail")
    }
}

#[derive(clap::Parser)]
#[command(name = "grail", about = "Holy Grail skill manager")]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(clap::Subcommand)]
enum Command {
    /// List installed skills
    List,
    /// Install a skill from a GitHub repository
    Add {
        /// GitHub repo (owner/repo)
        repo: String,
        /// Specific skill name in the repo
        #[arg(long)]
        skill: Option<String>,
    },
    /// Uninstall a skill
    Remove {
        /// Skill name to remove
        skill: String,
    },
    /// Regenerate the skills index
    Index,
    /// Search installed skills
    Find {
        /// Optional search query (matches name, description, tags)
        query: Option<String>,
    },
    /// Show detailed information about a skill
    Info {
        /// Skill name to inspect
        skill: String,
    },
    /// Update installed skills to latest version
    Update {
        /// Skill name to update (omit to update all)
        skill: Option<String>,
    },
}

fn cmd_list(home: &PathBuf) {
    let skills_dir = home.join("skills");
    if !skills_dir.exists() {
        println!("No skills installed");
        return;
    }
    let entries = match std::fs::read_dir(&skills_dir) {
        Ok(e) => e,
        Err(_) => {
            println!("No skills installed");
            return;
        }
    };
    let foreign_map = detect_foreign_skills(home);
    let mut count = 0;
    for entry in entries.flatten() {
        if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
            count += 1;
            let name = entry.file_name().to_string_lossy().to_string();
            if let Some(tool) = foreign_map.get(name.as_str()) {
                println!("  {} (foreign: {})", name, tool);
            } else {
                println!("  {}", name);
            }
        }
    }
    if count == 0 {
        println!("No skills installed");
    }
}

/// Detect if we're inside a Holy Grail project and return the project root.
/// Looks for `public/content/` directory (the Vite public dir for generated content).
fn find_holy_grail_project() -> Option<PathBuf> {
    if let Ok(cwd) = std::env::current_dir() {
        // Walk up from cwd looking for public/content/
        let mut current = Some(cwd.as_path());
        while let Some(dir) = current {
            let candidate = dir.join("public").join("content");
            if candidate.exists() && candidate.is_dir() {
                return Some(dir.to_path_buf());
            }
            current = dir.parent();
        }
    }
    None
}

fn cmd_index(home: &PathBuf) {
    let skills_dir = home.join("skills");
    let index_path = home.join("skills-index.json");

    let skills: Vec<serde_json::Value> = if skills_dir.exists() {
        let mut found: Vec<serde_json::Value> = Vec::new();
        if let Ok(entries) = std::fs::read_dir(&skills_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    let skill_slug = entry.file_name().to_string_lossy().to_string();
                    let skill_md = path.join("SKILL.md");
                    let metadata = if skill_md.exists() {
                        read_skill_metadata(&skill_md, &skill_slug)
                    } else {
                        serde_json::json!({
                            "slug": skill_slug,
                            "title": skill_slug,
                            "description": "",
                            "tags": [],
                            "category": "",
                            "parentCategory": "",
                            "views": 0,
                            "uses": 0,
                            "author": "",
                            "authorName": "",
                            "repoLink": "",
                            "skillPath": "",
                            "branch": "main",
                            "addedBy": "",
                            "featured": false,
                            "dateAdded": chrono::Utc::now().to_rfc3339(),
                            "hasLocalContent": false
                        })
                    };
                    found.push(metadata);
                }
            }
        }
        found
    } else {
        Vec::new()
    };

    let json = serde_json::to_string_pretty(&skills).expect("Failed to serialize index");
    fs_err::write(&index_path, &json).expect("Failed to write index");
    println!(
        "Index regenerated at {} ({} skills)",
        index_path.display(),
        skills.len()
    );

    // Option B: Also write to the Holy Grail project's public/content/ when detected.
    // Only write if there are actual skills — never overwrite the committed
    // fallback index with an empty one (the project may rely on the committed
    // fallback when the global CLI index is empty).
    if !skills.is_empty() {
        if let Some(project_root) = find_holy_grail_project() {
            let project_index = project_root.join("public").join("content").join("skills-index.json");
            fs_err::create_dir_all(project_index.parent().unwrap()).ok();
            if let Err(e) = fs_err::write(&project_index, &json) {
                eprintln!("Warning: Could not write project index: {}", e);
            } else {
                println!(
                    "  → Also written to {} ({} skills)",
                    project_index.display(),
                    skills.len()
                );
            }

            // Also write to public/skills-index.json for browser fetch at /skills-index.json
            let root_index = project_root.join("public").join("skills-index.json");
            if let Err(e) = fs_err::write(&root_index, &json) {
                eprintln!("Warning: Could not write root index: {}", e);
            } else {
                println!(
                    "  → Also written to {} ({} skills)",
                    root_index.display(),
                    skills.len()
                );
            }
        }
    }
}

fn read_skill_metadata(path: &std::path::Path, slug: &str) -> serde_json::Value {
    let content = fs_err::read_to_string(path).unwrap_or_default();
    let frontmatter = extract_yaml_frontmatter(&content);

    if let Some(yaml_str) = frontmatter {
        if let Ok(yaml_val) = serde_yaml::from_str::<serde_json::Value>(&yaml_str) {
            let obj = yaml_val.as_object().cloned().unwrap_or_default();
            return fill_skill_json(&obj, slug, &content);
        }
    }

    fallback_skill_json(slug, &content)
}

fn fill_skill_json(obj: &serde_json::Map<String, serde_json::Value>, slug: &str, _content: &str) -> serde_json::Value {
    let date_added = obj
        .get("dateAdded")
        .and_then(|v| v.as_str())
        .map(|s| serde_json::Value::String(s.to_string()))
        .unwrap_or_else(|| serde_json::Value::String(chrono::Utc::now().to_rfc3339()));

    serde_json::json!({
        "slug": obj.get("slug").and_then(|v| v.as_str()).unwrap_or(slug),
        "title": obj.get("title").and_then(|v| v.as_str()).unwrap_or(slug),
        "description": obj.get("description").and_then(|v| v.as_str()).unwrap_or(""),
        "category": obj.get("category").and_then(|v| v.as_str()).unwrap_or(""),
        "parentCategory": obj.get("parentCategory").and_then(|v| v.as_str()).unwrap_or(""),
        "tags": obj.get("tags").and_then(|v| v.as_array()).cloned().unwrap_or_default(),
        "views": obj.get("views").and_then(|v| v.as_i64()).unwrap_or(0),
        "uses": obj.get("uses").and_then(|v| v.as_i64()).unwrap_or(0),
        "author": obj.get("author").and_then(|v| v.as_str()).unwrap_or(""),
        "authorName": obj.get("authorName").and_then(|v| v.as_str()).unwrap_or(""),
        "repoLink": obj.get("repoLink").and_then(|v| v.as_str()).unwrap_or(""),
        "skillPath": obj.get("skillPath").and_then(|v| v.as_str()).unwrap_or(""),
        "branch": obj.get("branch").and_then(|v| v.as_str()).unwrap_or("main"),
        "addedBy": obj.get("addedBy").and_then(|v| v.as_str()).unwrap_or(""),
        "featured": obj.get("featured").and_then(|v| v.as_bool()).unwrap_or(false),
        "dateAdded": date_added,
        "hasLocalContent": obj.get("hasLocalContent").and_then(|v| v.as_bool()).unwrap_or(false)
    })
}

fn fallback_skill_json(slug: &str, content: &str) -> serde_json::Value {
    serde_json::json!({
        "slug": slug,
        "title": slug,
        "description": content.lines().next().unwrap_or(""),
        "tags": [],
        "category": "",
        "parentCategory": "",
        "views": 0,
        "uses": 0,
        "author": "",
        "authorName": "",
        "repoLink": "",
        "skillPath": "",
        "branch": "main",
        "addedBy": "",
        "featured": false,
        "dateAdded": chrono::Utc::now().to_rfc3339(),
        "hasLocalContent": false
    })
}

fn extract_yaml_frontmatter(content: &str) -> Option<String> {
    let content = content.trim();
    if content.starts_with("---") {
        if let Some(end) = content[3..].find("---") {
            return Some(content[3..3 + end].to_string());
        }
    }
    None
}

/// Skills are now in the community registry (skills-registry.json) that ships with
/// the Holy Grail app at public/content/skills-registry.json. The CLI `find` command
/// reads from that file instead of a hardcoded list. Users add repos to the registry
/// via PRs, not CLI changes.

fn github_api_base() -> String {
    std::env::var("GRAIL_GITHUB_API")
        .unwrap_or_else(|_| "https://api.github.com".to_string())
}

/// Read a GitHub personal access token from environment.
/// Checks `GITHUB_TOKEN` first, then `GH_TOKEN` (GitHub CLI convention).
fn github_token() -> Option<String> {
    std::env::var("GITHUB_TOKEN")
        .ok()
        .or_else(|| std::env::var("GH_TOKEN").ok())
        .filter(|t| !t.is_empty())
}

/// Build a reqwest blocking client with GitHub API headers.
/// Includes Authorization if GITHUB_TOKEN or GH_TOKEN is set.
fn build_github_client() -> reqwest::blocking::Client {
    let mut headers = reqwest::header::HeaderMap::new();
    headers.insert(
        reqwest::header::ACCEPT,
        reqwest::header::HeaderValue::from_static("application/vnd.github.v3+json"),
    );
    if let Some(token) = github_token() {
        let mut auth_value =
            reqwest::header::HeaderValue::from_str(&format!("Bearer {}", token))
                .expect("Invalid GITHUB_TOKEN value (must be ASCII)");
        auth_value.set_sensitive(true);
        headers.insert(reqwest::header::AUTHORIZATION, auth_value);
    }
    reqwest::blocking::Client::builder()
        .user_agent("grail-cli/0.1.0")
        .default_headers(headers)
        .build()
        .expect("Failed to build HTTP client")
}

fn is_local_path(repo: &str) -> bool {
    let path = Path::new(repo);
    path.exists()
}

fn parse_github_repo(repo: &str) -> Option<(&str, &str)> {
    // Format: "owner/repo" or full GitHub URL
    if repo.contains("github.com") {
        // Extract owner/repo from URL
        let parts: Vec<&str> = repo.split("github.com/").collect();
        if parts.len() >= 2 {
            let path = parts[1].trim_end_matches('/').trim_end_matches(".git");
            let mut segs = path.split('/');
            if let (Some(owner), Some(repo_name)) = (segs.next(), segs.next()) {
                return Some((owner, repo_name));
            }
        }
        return None;
    }

    // Format: "owner/repo"
    let parts: Vec<&str> = repo.split('/').collect();
    if parts.len() == 2 && !parts[0].is_empty() && !parts[1].is_empty() {
        Some((parts[0], parts[1]))
    } else {
        None
    }
}

/// Fetch skill files from a GitHub repo to a temporary directory.
/// Returns the path to the temp directory containing the downloaded files.
/// Supports GITHUB_TOKEN / GH_TOKEN for authenticated requests (higher rate limit, private repos).
fn fetch_github_repo(owner: &str, repo: &str) -> PathBuf {
    let api_base = github_api_base();
    let client = build_github_client();
    let has_token = github_token().is_some();

    // First, list root contents of the repo
    let root_url = format!("{}/repos/{}/{}/contents/", api_base, owner, repo);
    let root_resp = client.get(&root_url).send().unwrap_or_else(|e| {
        eprintln!("Error: Failed to connect to GitHub: {}", e);
        eprintln!("Check your network connection or GitHub API status at https://www.githubstatus.com");
        std::process::exit(1);
    });

    if !root_resp.status().is_success() {
        match root_resp.status().as_u16() {
            401 => {
                eprintln!(
                    "Error: Bad credentials (HTTP 401).\n\
                     Your GITHUB_TOKEN is invalid or expired.\n\
                     Generate a new token at https://github.com/settings/tokens\n\
                     Required scopes: 'repo' (private repos) or 'public_repo' (public repos)."
                );
            }
            403 if has_token => {
                eprintln!(
                    "Error: Access denied to \"{}/{}\" (HTTP 403).\n\
                     The token may lack permissions, or the repository is private.\n\
                     Ensure your token has the 'repo' scope for private repos.",
                    owner, repo
                );
            }
            403 => {
                eprintln!(
                    "Error: Access denied to \"{}/{}\" (HTTP 403).\n\
                     This is likely GitHub API rate limiting (60 requests/hour unauthenticated).\n\
                     Set GITHUB_TOKEN for 5,000 requests/hour:\n\
                       PowerShell: $env:GITHUB_TOKEN=\"ghp_...\"\n\
                       bash/zsh:   export GITHUB_TOKEN=\"ghp_...\"",
                    owner, repo
                );
            }
            404 => {
                eprintln!(
                    "Error: Repository \"{}/{}\" not found on GitHub (HTTP 404).\n\
                     Check that the repository exists and is spelled correctly.",
                    owner, repo
                );
            }
            code => {
                eprintln!(
                    "Error: Failed to fetch \"{}/{}\" (HTTP {}).",
                    owner, repo, code
                );
            }
        }
        std::process::exit(1);
    }

    let root_entries: Vec<serde_json::Value> = root_resp.json().unwrap_or_else(|e| {
        eprintln!("Error: Failed to parse GitHub response: {}", e);
        std::process::exit(1);
    });

    let tmp_path = create_temp_skill_dir();

    // Find candidate directories (subdirectories that might contain SKILL.md)
    let mut skill_dirs: Vec<String> = Vec::new();
    for entry in &root_entries {
        if entry["type"].as_str() == Some("dir") {
            if let Some(name) = entry["name"].as_str() {
                skill_dirs.push(name.to_string());
            }
        }
        // Also check if there's a SKILL.md at repo root
        if entry["type"].as_str() == Some("file") && entry["name"].as_str() == Some("SKILL.md") {
            skill_dirs.push(String::new()); // empty means root level
        }
    }

    // Also check standard subdirectories: skills/, .agents/skills/, .claude/skills/
    for subdir in &["skills", ".agents/skills", ".claude/skills"] {
        let sub_url = format!(
            "{}/repos/{}/{}/contents/{}",
            api_base, owner, repo, subdir
        );
        if let Ok(resp) = client.get(&sub_url).send() {
            if resp.status().is_success() {
                if let Ok(entries) = resp.json::<Vec<serde_json::Value>>() {
                    for entry in entries {
                        if entry["type"].as_str() == Some("dir") {
                            if let Some(name) = entry["name"].as_str() {
                                skill_dirs.push(format!("{}/{}", subdir, name));
                            }
                        }
                    }
                }
            }
        }
    }

    // For each candidate directory, check for SKILL.md and download it
    for skill_dir in &skill_dirs {
        let contents_url = if skill_dir.is_empty() {
            format!("{}/repos/{}/{}/contents/", api_base, owner, repo)
        } else {
            format!(
                "{}/repos/{}/{}/contents/{}",
                api_base, owner, repo, skill_dir
            )
        };

        if let Ok(resp) = client.get(&contents_url).send() {
            if resp.status().is_success() {
                let entries: Vec<serde_json::Value> = resp.json().unwrap_or_default();
                for entry in entries {
                    if entry["name"].as_str() == Some("SKILL.md") {
                        // Found a SKILL.md! Get the content.
                        let content = if let Some(download_url) = entry["download_url"].as_str() {
                            if !download_url.is_empty() {
                                // Try downloading from the raw URL
                                if let Ok(raw_resp) = client.get(download_url).send() {
                                    if let Ok(text) = raw_resp.text() {
                                        text
                                    } else {
                                        continue;
                                    }
                                } else {
                                    continue;
                                }
                            } else {
                                continue;
                            }
                        } else {
                            continue;
                        };

                        // Determine the slug from the path
                        let path = entry["path"].as_str().unwrap_or("");
                        let slug = path
                            .trim_end_matches("/SKILL.md")
                            .split('/')
                            .last()
                            .unwrap_or("skill");

                        // Create the skill directory in our temp
                        let skill_dir_path = tmp_path.join("skills").join(slug);
                        std::fs::create_dir_all(&skill_dir_path)
                            .expect("Failed to create temp skill dir");
                        std::fs::write(skill_dir_path.join("SKILL.md"), &content)
                            .expect("Failed to write SKILL.md");
                    }
                }
            }
        }
    }

    tmp_path
}

/// Create a temporary directory for downloaded GitHub content.
fn create_temp_skill_dir() -> PathBuf {
    let base = std::env::temp_dir().join(format!("grail-{}", std::process::id()));
    let dir = base.join(uuid_v4_simple());
    std::fs::create_dir_all(&dir).expect("Failed to create temp directory");
    dir
}

/// Generate a simple unique ID (no external dependency needed).
fn uuid_v4_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    format!("{:x}", nanos)
}

/// Find skill directories in a source path (directories that contain SKILL.md).
/// Searches: <source>/<slug>/SKILL.md, <source>/skills/<slug>/SKILL.md,
/// <source>/.agents/skills/<slug>/SKILL.md, <source>/.claude/skills/<slug>/SKILL.md,
/// and <source>/SKILL.md (direct file).
fn find_skills_in_source(source: &Path) -> Vec<(String, PathBuf)> {
    let mut skills: Vec<(String, PathBuf)> = Vec::new();

    // Pattern: <source>/SKILL.md (repo-root level skill)
    let root_skill = source.join("SKILL.md");
    if root_skill.exists() {
        if let Some(name) = source.file_name() {
            skills.push((name.to_string_lossy().to_string(), source.to_path_buf()));
        }
        return skills;
    }

    // Pattern: <source>/<slug>/SKILL.md (most common)
    if let Ok(entries) = std::fs::read_dir(source) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let skill_md = path.join("SKILL.md");
                if skill_md.exists() {
                    let slug = entry.file_name().to_string_lossy().to_string();
                    skills.push((slug, path));
                }
            } else if path.is_file() {
                // Check if the file itself is SKILL.md at root level (already handled above)
            }
        }
    }

    // If no skills found at top level, try subdirectories that match known patterns
    if skills.is_empty() {
        for subdir in &["skills", ".agents/skills", ".claude/skills"] {
            let sub_path = source.join(subdir);
            if sub_path.exists() && sub_path.is_dir() {
                if let Ok(entries) = std::fs::read_dir(&sub_path) {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.is_dir() {
                            let skill_md = path.join("SKILL.md");
                            if skill_md.exists() {
                                let slug = entry.file_name().to_string_lossy().to_string();
                                skills.push((slug, path));
                            }
                        }
                    }
                }
                if !skills.is_empty() {
                    break;
                }
            }
        }
    }

    skills
}

fn copy_skill_dir(source: &Path, dest: &Path) {
    fs_err::create_dir_all(dest).expect("Failed to create skill directory");
    if let Ok(entries) = std::fs::read_dir(source) {
        for entry in entries.flatten() {
            let entry_path = entry.path();
            let file_name = entry.file_name();
            let dest_path = dest.join(&file_name);
            if entry_path.is_file() {
                fs_err::copy(&entry_path, &dest_path).expect("Failed to copy skill file");
            } else if entry_path.is_dir() {
                // Recursively copy subdirectories
                copy_dir_recursive(&entry_path, &dest_path);
            }
        }
    }
}

fn copy_dir_recursive(source: &Path, dest: &Path) {
    fs_err::create_dir_all(dest).expect("Failed to create directory");
    if let Ok(entries) = std::fs::read_dir(source) {
        for entry in entries.flatten() {
            let entry_path = entry.path();
            let file_name = entry.file_name();
            let dest_path = dest.join(&file_name);
            if entry_path.is_file() {
                fs_err::copy(&entry_path, &dest_path).expect("Failed to copy file");
            } else if entry_path.is_dir() {
                copy_dir_recursive(&entry_path, &dest_path);
            }
        }
    }
}

/// Interactive picker: prints a numbered list and reads a selection from stdin.
/// Works with both interactive terminals and piped input (for testing).
fn interactive_select(prompt: &str, items: &[&str]) -> usize {
    eprintln!("{}", prompt);
    for (i, item) in items.iter().enumerate() {
        eprintln!("  {}. {}", i + 1, item);
    }
    eprint!("Enter number (1-{}): ", items.len());
    use std::io::Write;
    std::io::stderr().flush().ok();

    let mut input = String::new();
    std::io::stdin()
        .read_line(&mut input)
        .expect("Failed to read input");

    let trimmed = input.trim();
    if let Ok(num) = trimmed.parse::<usize>() {
        if num >= 1 && num <= items.len() {
            return num - 1;
        }
    }

    // Default to first option on invalid input
    eprintln!("Invalid selection, defaulting to first option.");
    0
}

fn cmd_add(home: &PathBuf, repo: &str, skill_filter: &Option<String>) {
    let skills_dir = home.join("skills");
    fs_err::create_dir_all(&skills_dir).expect("Failed to create skills directory");

    let source_path = if is_local_path(repo) {
        PathBuf::from(repo)
    } else if let Some((owner, repo_name)) = parse_github_repo(repo) {
        fetch_github_repo(owner, repo_name)
    } else {
        eprintln!(
            "Error: '{}' is not a valid path or GitHub repository (owner/repo).",
            repo
        );
        std::process::exit(1);
    };

    let found = find_skills_in_source(&source_path);

    if found.is_empty() {
        eprintln!(
            "Error: No skills found in {}",
            source_path.display()
        );
        std::process::exit(1);
    }

    let to_install: Vec<&(String, PathBuf)> = if let Some(filter) = skill_filter {
        let filtered: Vec<&(String, PathBuf)> =
            found.iter().filter(|(slug, _)| slug == filter).collect();
        if filtered.is_empty() {
            eprintln!(
                "Error: Skill '{}' not found in {}",
                filter,
                source_path.display()
            );
            std::process::exit(1);
        }
        filtered
    } else if found.len() == 1 {
        found.iter().collect()
    } else {
        // Multiple skills found, show interactive picker
        let selected = interactive_select(
            "Multiple skills found. Select one to install:",
            &found.iter().map(|(slug, _)| slug.as_str()).collect::<Vec<&str>>(),
        );
        vec![&found[selected]]
    };

    for (slug, skill_source) in &to_install {
        let dest = skills_dir.join(slug);
        copy_skill_dir(skill_source, &dest);
        println!("Installed skill: {} -> {}", slug, dest.display());
    }

    // Regenerate the index
    cmd_index(home);
}

fn cmd_remove(home: &PathBuf, skill: &str) {
    let skill_dir = home.join("skills").join(skill);
    if skill_dir.exists() {
        // Check if it's a foreign skill
        let foreign_map = detect_foreign_skills(home);
        if let Some(tool) = foreign_map.get(skill) {
            eprintln!(
                "⚠ This skill was installed by {}. Do you want to proceed? (y/N)",
                tool
            );
            let mut input = String::new();
            std::io::stdin().read_line(&mut input).ok();
            let trimmed = input.trim().to_lowercase();
            if trimmed != "y" && trimmed != "yes" {
                println!("Aborted removal of '{}'", skill);
                return;
            }
        }

        fs_err::remove_dir_all(&skill_dir).expect("Failed to remove skill");
        println!("Removed skill: {}", skill);
        // Regenerate the index
        cmd_index(home);
    } else {
        println!("Skill '{}' not found", skill);
    }
}

// ── Phase 2: Find ──

fn cmd_find(home: &PathBuf, query: &Option<String>) {
    let skills_dir = home.join("skills");
    if !skills_dir.exists() {
        println!("No skills installed");
        return;
    }

    // Build a list of installed skills
    let mut entries: Vec<(String, PathBuf)> = Vec::new();
    if let Ok(read_dir) = std::fs::read_dir(&skills_dir) {
        for entry in read_dir.flatten() {
            if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                let slug = entry.file_name().to_string_lossy().to_string();
                entries.push((slug, entry.path()));
            }
        }
    }

    if entries.is_empty() {
        println!("No skills installed");
        return;
    }

    // If no query, show all
    let filtered: Vec<&(String, PathBuf)> = if let Some(q) = query {
        let q_lower = q.to_lowercase();
        entries
            .iter()
            .filter(|(slug, path)| {
                if slug.to_lowercase().contains(&q_lower) {
                    return true;
                }
                // Also search in SKILL.md frontmatter
                let skill_md = path.join("SKILL.md");
                if skill_md.exists() {
                    let content = fs_err::read_to_string(&skill_md).unwrap_or_default();
                    if let Some(fm) = extract_yaml_frontmatter(&content) {
                        if fm.to_lowercase().contains(&q_lower) {
                            return true;
                        }
                    }
                    if content.to_lowercase().contains(&q_lower) {
                        return true;
                    }
                }
                false
            })
            .collect()
    } else {
        entries.iter().collect()
    };

    let foreign_map = detect_foreign_skills(home);

    if filtered.is_empty() {
        let q_display = query.as_deref().unwrap_or("");
        if q_display.is_empty() {
            println!("No skills installed");
        } else {
            println!("No installed skills matching '{}'", q_display);
        }
        println!("Browse all skills at: https://github.com/Drakaniia/holy-grail/tree/grail/public/content/skills-registry.json");
        return;
    }

    println!("Installed skills:");
    for (slug, _path) in &filtered {
        if let Some(tool) = foreign_map.get(slug.as_str()) {
            println!("  {} (foreign: {})", slug, tool);
        } else {
            println!("  {}", slug);
        }
    }
}

fn default_info_fields(slug: &str) -> (String, String, String, String, String, String, String) {
    (
        slug.to_string(),
        "".to_string(),
        "(unknown)".to_string(),
        "(unknown)".to_string(),
        "(unknown)".to_string(),
        "(unknown)".to_string(),
        "(none)".to_string(),
    )
}

// ── Phase 2: Info ──

fn cmd_info(home: &PathBuf, skill: &str) {
    let skill_dir = home.join("skills").join(skill);
    if !skill_dir.exists() {
        eprintln!("Error: Skill '{}' not found.", skill);
        std::process::exit(1);
    }

    let index_path = home.join("skills-index.json");
    let metadata = if index_path.exists() {
        if let Ok(content) = fs_err::read_to_string(&index_path) {
            if let Ok(skills) = serde_json::from_str::<Vec<serde_json::Value>>(&content) {
                skills.into_iter().find(|s| s["slug"].as_str() == Some(skill))
            } else {
                None
            }
        } else {
            None
        }
    } else {
        None
    };

    if let Some(m) = metadata {
        println!("  Name:        {}", m["title"].as_str().unwrap_or(skill));
        println!("  Slug:        {}", m["slug"].as_str().unwrap_or(skill));
        println!("  Description: {}", m["description"].as_str().unwrap_or(""));
        println!("  Category:    {}", m["category"].as_str().unwrap_or(""));
        println!("  Author:      {} ({})", m["authorName"].as_str().unwrap_or(""), m["author"].as_str().unwrap_or(""));
        println!("  Repo:        {}", m["repoLink"].as_str().unwrap_or(""));
        println!("  Tags:        {:?}", m["tags"].as_array().map(|a| {
            a.iter().filter_map(|v| v.as_str()).collect::<Vec<_>>().join(", ")
        }).unwrap_or_default());
        println!("  Featured:    {}", m["featured"].as_bool().unwrap_or(false));
        println!("  Installed:   {}", m["dateAdded"].as_str().unwrap_or(""));
    } else {
        // Fallback: read and parse SKILL.md directly
        let skill_md = skill_dir.join("SKILL.md");
        if skill_md.exists() {
            let content = fs_err::read_to_string(&skill_md).unwrap_or_default();
            let frontmatter = extract_yaml_frontmatter(&content);
            let (title, desc, category, author_name, author, repo, tags) =
                if let Some(yaml_str) = frontmatter {
                    if let Ok(yaml_val) = serde_yaml::from_str::<serde_json::Value>(&yaml_str) {
                        let obj = yaml_val.as_object().cloned().unwrap_or_default();
                        (
                            obj.get("title").and_then(|v| v.as_str()).unwrap_or(skill).to_string(),
                            obj.get("description").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                            obj.get("category").and_then(|v| v.as_str()).unwrap_or("(unknown)").to_string(),
                            obj.get("authorName").and_then(|v| v.as_str()).unwrap_or("(unknown)").to_string(),
                            obj.get("author").and_then(|v| v.as_str()).unwrap_or("(unknown)").to_string(),
                            obj.get("repoLink").and_then(|v| v.as_str()).unwrap_or("(unknown)").to_string(),
                            obj.get("tags").and_then(|v| v.as_array()).map(|a| {
                                a.iter().filter_map(|v| v.as_str()).collect::<Vec<_>>().join(", ")
                            }).unwrap_or_else(|| "(none)".to_string()),
                        )
                    } else {
                        default_info_fields(skill)
                    }
                } else {
                    default_info_fields(skill)
                };
            println!("  Name:        {}", title);
            println!("  Slug:        {}", skill);
            println!("  Description: {}", desc);
            println!("  Category:    {}", category);
            println!("  Author:      {} ({})", author_name, author);
            println!("  Repo:        {}", repo);
            println!("  Tags:        {}", tags);
            println!("  Featured:    false");
        }
    }
}

// ── Phase 2: Update ──

fn cmd_update(home: &PathBuf, skill: &Option<String>) {
    let skills_dir = home.join("skills");
    if !skills_dir.exists() {
        if skill.is_some() {
            eprintln!("Error: Skill '{}' not found.", skill.as_ref().unwrap());
            std::process::exit(1);
        }
        eprintln!("No skills installed");
        std::process::exit(1);
    }

    let to_update: Vec<String> = if let Some(name) = skill {
        let dir = skills_dir.join(name);
        if !dir.exists() {
            eprintln!("Error: Skill '{}' not found.", name);
            std::process::exit(1);
        }
        vec![name.clone()]
    } else {
        let mut all = Vec::new();
        if let Ok(entries) = std::fs::read_dir(&skills_dir) {
            for entry in entries.flatten() {
                if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                    all.push(entry.file_name().to_string_lossy().to_string());
                }
            }
        }
        all
    };

    for name in &to_update {
        let dir = skills_dir.join(name);
        let skill_md = dir.join("SKILL.md");
        if !skill_md.exists() {
            println!("  {}: no SKILL.md found, skipping", name);
            continue;
        }

        // Try to find repoLink from the index
        let index_path = home.join("skills-index.json");
        let mut repo_link = String::new();
        let mut skill_path = String::new();
        if let Ok(content) = fs_err::read_to_string(&index_path) {
            if let Ok(skills) = serde_json::from_str::<Vec<serde_json::Value>>(&content) {
                for s in &skills {
                    if s["slug"].as_str() == Some(name) {
                        if let Some(rl) = s["repoLink"].as_str() {
                            repo_link = rl.to_string();
                        }
                        if let Some(sp) = s["skillPath"].as_str() {
                            skill_path = sp.to_string();
                        }
                        break;
                    }
                }
            }
        }

        if repo_link.is_empty() {
            // Local skill without a remote, just touch the timestamp
            println!("  {}: local skill (no remote to update)", name);
            continue;
        }

        // Parse the repo link and re-fetch
        if let Some((owner, repo_name)) = parse_github_repo(&repo_link) {
            println!("  {}: fetching from {}/{}...", name, owner, repo_name);
            let tmp = fetch_github_repo(owner, repo_name);
            let found = find_skills_in_source(&tmp);
            let found_path = found.iter().find(|(slug, _)| slug == name).map(|(_, p)| p);
            if let Some(src) = found_path {
                copy_skill_dir(src, &dir);
                println!("  {}: updated", name);
            } else if skill_path.is_empty() {
                // Try without skill_path filter — copy everything
                copy_dir_recursive(&tmp.join("skills").join(name), &dir);
                println!("  {}: updated", name);
            } else {
                println!("  {}: skill not found in remote, keeping local copy", name);
            }
        } else {
            println!("  {}: could not parse repo link '{}'", name, repo_link);
        }
    }

    // Regenerate index after updates
    cmd_index(home);
}

// ── Foreign skill detection ──

/// Detect foreign skills by checking for marker files from other tools.
/// Returns a map of skill slug -> tool name.
fn detect_foreign_skills(home: &Path) -> std::collections::HashMap<String, String> {
    let mut foreign: std::collections::HashMap<String, String> = std::collections::HashMap::new();

    // Check for npx skills manifest
    let skills_manifest_paths = vec![
        home.join(".skills-manifest.json"),
        dirs::home_dir().unwrap_or_default().join(".skills").join(".skills-manifest.json"),
    ];
    for path in &skills_manifest_paths {
        if path.exists() {
            if let Ok(content) = fs_err::read_to_string(path) {
                if let Ok(manifest) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(skills) = manifest["skills"].as_array() {
                        for s in skills {
                            if let Some(slug) = s.as_str() {
                                foreign.entry(slug.to_string()).or_insert_with(|| "npx skills".to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    // Check for openskills manifest
    let openskills_paths = vec![
        home.join("openskills.json"),
        dirs::home_dir().unwrap_or_default().join(".openskills").join("openskills.json"),
    ];
    for path in &openskills_paths {
        if path.exists() {
            if let Ok(content) = fs_err::read_to_string(path) {
                if let Ok(manifest) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(skills) = manifest["skills"].as_array() {
                        for s in skills {
                            if let Some(slug) = s.as_str() {
                                foreign.entry(slug.to_string()).or_insert_with(|| "npx openskills".to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    foreign
}

fn main() {
    use clap::Parser;
    let cli = Cli::parse();

    let home = grail_home();

    match cli.command {
        Command::List => cmd_list(&home),
        Command::Add { repo, skill } => cmd_add(&home, &repo, &skill),
        Command::Remove { skill } => cmd_remove(&home, &skill),
        Command::Index => cmd_index(&home),
        Command::Find { query } => cmd_find(&home, &query),
        Command::Info { skill } => cmd_info(&home, &skill),
        Command::Update { skill } => cmd_update(&home, &skill),
    }
}

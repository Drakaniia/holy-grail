use assert_cmd::Command;
use predicates::prelude::PredicateBooleanExt;
use predicates::str::contains;
use std::path::Path;
use tempfile::TempDir;

/// Run a grail command with GRAIL_HOME pointing to a temp directory.
fn grail_with_temp_home() -> (Command, TempDir) {
    let tmp = TempDir::new().unwrap();
    let mut cmd = Command::cargo_bin("grail").unwrap();
    cmd.env("GRAIL_HOME", tmp.path());
    (cmd, tmp)
}

/// Create a minimal skill directory inside the grail home.
fn create_skill(home: &Path, slug: &str) {
    let dir = home.join("skills").join(slug);
    std::fs::create_dir_all(&dir).unwrap();
    let frontmatter = format!(
        r#"---
title: {}
slug: {}
description: "A test skill"
category: AI
tags: [test]
author: testuser
authorName: "Test User"
---
# {}
Test content
"#,
        slug, slug, slug
    );
    std::fs::write(dir.join("SKILL.md"), frontmatter).unwrap();
}

#[test]
fn list_empty_when_no_skills_installed() {
    let (mut cmd, _tmp) = grail_with_temp_home();
    cmd.arg("list")
        .assert()
        .success()
        .stdout(contains("No skills installed"));
}

#[test]
fn list_shows_installed_skills() {
    let (mut cmd, tmp) = grail_with_temp_home();
    create_skill(tmp.path(), "test-skill");

    cmd.arg("list")
        .assert()
        .success()
        .stdout(contains("test-skill"));
}

#[test]
fn index_generates_json_for_empty_dir() {
    let (mut cmd, tmp) = grail_with_temp_home();

    cmd.arg("index")
        .assert()
        .success()
        .stdout(contains("Index regenerated"));

    let index_path = tmp.path().join("skills-index.json");
    assert!(index_path.exists(), "index file should exist");

    let content = std::fs::read_to_string(index_path).unwrap();
    let parsed: Vec<serde_json::Value> = serde_json::from_str(&content).unwrap();
    assert!(parsed.is_empty(), "empty dir should produce empty array");
}

/// Create a source directory simulating a GitHub repo with one or more skills.
fn create_source_repo(base: &Path, skills: &[(&str, &str)]) {
    for (slug, title) in skills {
        let dir = base.join("skills").join(slug);
        std::fs::create_dir_all(&dir).unwrap();
        let frontmatter = format!(
            r#"---
title: {}
slug: {}
description: "A {} skill"
category: AI
tags: [test]
author: testuser
authorName: "Test User"
---
# {}
Skill content for {}
"#,
            title, slug, title, title, slug
        );
        std::fs::write(dir.join("SKILL.md"), frontmatter).unwrap();
    }
}

#[test]
fn add_installs_skill_from_local_repo() {
    let (mut cmd, tmp) = grail_with_temp_home();
    let source = TempDir::new().unwrap();
    create_source_repo(source.path(), &[("vue", "Vue")]);

    cmd.arg("add")
        .arg(source.path().to_str().unwrap())
        .assert()
        .success()
        .stdout(contains("vue"));

    // Skill should now exist in grail home
    let skill_dir = tmp.path().join("skills").join("vue");
    assert!(skill_dir.exists(), "skill directory should be created");
    assert!(
        skill_dir.join("SKILL.md").exists(),
        "SKILL.md should be copied"
    );
}

#[test]
fn add_installs_specific_skill_from_multi_skill_repo() {
    let (mut cmd, tmp) = grail_with_temp_home();
    let source = TempDir::new().unwrap();
    create_source_repo(
        source.path(),
        &[("vue", "Vue"), ("rust", "Rust"), ("typescript", "TypeScript")],
    );

    cmd.arg("add")
        .arg(source.path().to_str().unwrap())
        .arg("--skill")
        .arg("rust")
        .assert()
        .success()
        .stdout(contains("rust"));

    let rust_dir = tmp.path().join("skills").join("rust");
    assert!(rust_dir.exists(), "rust skill should be installed");
    let vue_dir = tmp.path().join("skills").join("vue");
    assert!(!vue_dir.exists(), "vue skill should NOT be installed");
}

#[test]
fn add_with_multi_skill_repo_and_no_flag_prompts_user() {
    let (mut cmd, tmp) = grail_with_temp_home();
    let source = TempDir::new().unwrap();
    create_source_repo(
        source.path(),
        &[("vue", "Vue"), ("rust", "Rust"), ("typescript", "TypeScript")],
    );

    // Pipe "1\n" (select first option) to stdin
    cmd.arg("add")
        .arg(source.path().to_str().unwrap())
        .write_stdin("1\n")
        .assert()
        .success()
        .stdout(contains("rust"));

    // Verify only one skill was installed (the selected one)
    let skills_dir = tmp.path().join("skills");
    let installed: Vec<_> = std::fs::read_dir(&skills_dir)
        .unwrap()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
        .collect();
    assert_eq!(installed.len(), 1, "only one skill should be installed");
    assert_eq!(
        installed[0].file_name().to_string_lossy(),
        "rust",
        "first option should be selected"
    );
}

#[test]
fn add_updates_index_after_install() {
    let (mut cmd, tmp) = grail_with_temp_home();
    let source = TempDir::new().unwrap();
    create_source_repo(source.path(), &[("test-skill", "Test Skill")]);

    cmd.arg("add")
        .arg(source.path().to_str().unwrap())
        .assert()
        .success();

    // Index should now contain the skill
    let index_path = tmp.path().join("skills-index.json");
    assert!(index_path.exists(), "index should exist after add");

    let content = std::fs::read_to_string(index_path).unwrap();
    let parsed: Vec<serde_json::Value> = serde_json::from_str(&content).unwrap();
    assert_eq!(parsed.len(), 1, "should have 1 skill in index");
    assert_eq!(parsed[0]["slug"], "test-skill");
}

#[test]
fn index_generates_json_with_skills() {
    let (mut cmd, tmp) = grail_with_temp_home();
    create_skill(tmp.path(), "vue");
    create_skill(tmp.path(), "rust");

    cmd.arg("index")
        .assert()
        .success()
        .stdout(contains("2 skills"));

    let index_path = tmp.path().join("skills-index.json");
    let content = std::fs::read_to_string(index_path).unwrap();
    let parsed: Vec<serde_json::Value> = serde_json::from_str(&content).unwrap();

    assert_eq!(parsed.len(), 2, "should have 2 skills in index");
    let slugs: Vec<&str> = parsed
        .iter()
        .map(|v| v["slug"].as_str().unwrap())
        .collect();
    assert!(slugs.contains(&"vue"));
    assert!(slugs.contains(&"rust"));

    // Verify the schema matches the Skill interface
    for skill in &parsed {
        assert!(skill["title"].is_string(), "title should be a string");
        assert!(skill["tags"].is_array(), "tags should be an array");
        assert!(skill["featured"].is_boolean(), "featured should be boolean");
    }
}

#[test]
fn remove_existing_skill() {
    let (mut cmd, tmp) = grail_with_temp_home();
    let source = TempDir::new().unwrap();
    create_source_repo(source.path(), &[("test-skill", "Test Skill")]);

    // First install the skill
    cmd.arg("add")
        .arg(source.path().to_str().unwrap())
        .assert()
        .success();

    // Now remove it
    let mut rm_cmd = Command::cargo_bin("grail").unwrap();
    rm_cmd
        .env("GRAIL_HOME", tmp.path())
        .arg("remove")
        .arg("test-skill")
        .assert()
        .success()
        .stdout(contains("Removed"));

    let skill_dir = tmp.path().join("skills").join("test-skill");
    assert!(!skill_dir.exists(), "skill directory should be removed");
}

#[test]
fn remove_updates_index() {
    let (mut cmd, tmp) = grail_with_temp_home();
    let source = TempDir::new().unwrap();
    create_source_repo(source.path(), &[("test-skill", "Test Skill")]);

    // First install the skill
    cmd.arg("add")
        .arg(source.path().to_str().unwrap())
        .assert()
        .success();

    // Now remove it
    let mut rm_cmd = Command::cargo_bin("grail").unwrap();
    rm_cmd
        .env("GRAIL_HOME", tmp.path())
        .arg("remove")
        .arg("test-skill")
        .assert()
        .success();

    // Index should be empty after removal
    let index_path = tmp.path().join("skills-index.json");
    let content = std::fs::read_to_string(index_path).unwrap();
    let parsed: Vec<serde_json::Value> = serde_json::from_str(&content).unwrap();
    assert!(parsed.is_empty(), "index should be empty after removal");
}

#[test]
fn remove_nonexistent_skill_prints_warning() {
    let (mut cmd, _tmp) = grail_with_temp_home();
    cmd.arg("remove")
        .arg("nonexistent-skill")
        .assert()
        .success()
        .stdout(contains("not found"));
}

// ── Phase 2: grail find ──

#[test]
fn find_shows_all_skills_when_no_query() {
    let (mut cmd, tmp) = grail_with_temp_home();
    create_skill(tmp.path(), "vue");
    create_skill(tmp.path(), "rust");

    cmd.arg("find")
        .assert()
        .success()
        .stdout(contains("vue"))
        .stdout(contains("rust"));
}

#[test]
fn find_filters_skills_by_query() {
    let (mut cmd, tmp) = grail_with_temp_home();
    create_skill(tmp.path(), "vue");
    create_skill(tmp.path(), "rust");

    cmd.arg("find")
        .arg("rust")
        .assert()
        .success()
        .stdout(contains("rust"))
        .stdout(contains("vue").not());
}

#[test]
fn find_returns_empty_when_no_match() {
    let (mut cmd, tmp) = grail_with_temp_home();
    create_skill(tmp.path(), "vue");

    cmd.arg("find")
        .arg("nonexistent")
        .assert()
        .success()
        .stdout(contains("No skills found"));
}

#[test]
fn find_shows_message_when_no_skills_installed() {
    let (mut cmd, _tmp) = grail_with_temp_home();
    cmd.arg("find")
        .assert()
        .success()
        .stdout(contains("No skills installed"));
}

// ── Phase 2: grail info ──

#[test]
fn info_shows_skill_details() {
    let (mut cmd, tmp) = grail_with_temp_home();
    create_skill(tmp.path(), "test-skill");

    cmd.arg("info")
        .arg("test-skill")
        .assert()
        .success()
        .stdout(contains("test-skill"))
        .stdout(contains("Test User"))
        .stdout(contains("A test skill"))
        .stdout(contains("AI"));
}

#[test]
fn info_nonexistent_skill_prints_error() {
    let (mut cmd, _tmp) = grail_with_temp_home();
    cmd.arg("info")
        .arg("nonexistent")
        .assert()
        .failure()
        .stderr(contains("not found"));
}

// ── Phase 2: grail update ──

#[test]
fn update_specific_skill() {
    let (mut cmd, tmp) = grail_with_temp_home();
    create_skill(tmp.path(), "test-skill");

    cmd.arg("update")
        .arg("test-skill")
        .assert()
        .success()
        .stdout(contains("test-skill"));
}

#[test]
fn update_all_skills() {
    let (mut cmd, tmp) = grail_with_temp_home();
    create_skill(tmp.path(), "vue");
    create_skill(tmp.path(), "rust");

    cmd.arg("update")
        .assert()
        .success()
        .stdout(contains("vue"))
        .stdout(contains("rust"));
}

#[test]
fn update_nonexistent_skill_prints_error() {
    let (mut cmd, _tmp) = grail_with_temp_home();
    cmd.arg("update")
        .arg("nonexistent")
        .assert()
        .failure()
        .stderr(contains("not found"));
}

// ── Phase 2: Foreign skill detection ──

#[test]
fn remove_warns_on_foreign_skill() {
    let (mut cmd, tmp) = grail_with_temp_home();

    // Simulate a foreign skill installed by another tool (e.g., npx skills)
    let skills_dir = tmp.path().join("skills").join("foreign-skill");
    std::fs::create_dir_all(&skills_dir).unwrap();
    std::fs::write(
        skills_dir.join("SKILL.md"),
        "# Foreign Skill\nNot installed by grail",
    )
    .unwrap();

    // Create a .skills-manifest.json to mark it as foreign
    std::fs::write(
        tmp.path().join(".skills-manifest.json"),
        r#"{"skills": ["foreign-skill"], "tool": "npx skills"}"#,
    )
    .unwrap();

    cmd.arg("remove")
        .arg("foreign-skill")
        .write_stdin("y\n")
        .assert()
        .success()
        .stderr(contains("⚠"))
        .stderr(contains("npx skills"))
        .stdout(contains("Removed"));
}

#[test]
fn list_marks_foreign_skills() {
    let (mut cmd, tmp) = grail_with_temp_home();
    create_skill(tmp.path(), "grail-skill");

    // Create a foreign skill
    let skills_dir = tmp.path().join("skills").join("foreign-skill");
    std::fs::create_dir_all(&skills_dir).unwrap();
    std::fs::write(
        skills_dir.join("SKILL.md"),
        "# Foreign Skill",
    )
    .unwrap();
    std::fs::write(
        tmp.path().join(".skills-manifest.json"),
        r#"{"skills": ["foreign-skill"], "tool": "npx skills"}"#,
    )
    .unwrap();

    cmd.arg("list")
        .assert()
        .success()
        .stdout(contains("grail-skill"))
        .stdout(contains("foreign-skill"))
        .stdout(contains("npx skills"));
}

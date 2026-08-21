use assert_cmd::Command;
use predicates::str::contains;
use tempfile::TempDir;
use wiremock::matchers::{method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

/// Set up a mock GitHub API server that simulates a repo with skills.
async fn setup_mock_github() -> MockServer {
    let server = MockServer::start().await;
    let base = server.uri();

    // Mock: GET /repos/owner/test-skills/contents/ → repo root listing
    Mock::given(method("GET"))
        .and(path("/repos/owner/test-skills/contents/"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!([
            {
                "name": "vue",
                "type": "dir",
                "path": "vue",
                "url": format!("{}/repos/owner/test-skills/contents/vue", base)
            },
            {
                "name": "rust",
                "type": "dir",
                "path": "rust",
                "url": format!("{}/repos/owner/test-skills/contents/rust", base)
            }
        ])))
        .mount(&server)
        .await;

    // Mock: GET /repos/owner/test-skills/contents/vue → vue skill dir
    Mock::given(method("GET"))
        .and(path("/repos/owner/test-skills/contents/vue"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!([
            {
                "name": "SKILL.md",
                "type": "file",
                "path": "vue/SKILL.md",
                "download_url": format!("{}/raw/vue/SKILL.md", base)
            }
        ])))
        .mount(&server)
        .await;

    // Mock: GET /repos/owner/test-skills/contents/rust → rust skill dir
    Mock::given(method("GET"))
        .and(path("/repos/owner/test-skills/contents/rust"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!([
            {
                "name": "SKILL.md",
                "type": "file",
                "path": "rust/SKILL.md",
                "download_url": format!("{}/raw/rust/SKILL.md", base)
            }
        ])))
        .mount(&server)
        .await;

    // Mock: GET /raw/vue/SKILL.md → raw Vue skill content
    Mock::given(method("GET"))
        .and(path("/raw/vue/SKILL.md"))
        .respond_with(
            ResponseTemplate::new(200).set_body_string(
                r#"---
title: Vue
slug: vue
description: Vue 3 skill
category: AI
tags: [vue]
author: testuser
---
# Vue Skill
Content
"#,
            ),
        )
        .mount(&server)
        .await;

    // Mock: GET /raw/rust/SKILL.md → raw Rust skill content
    Mock::given(method("GET"))
        .and(path("/raw/rust/SKILL.md"))
        .respond_with(
            ResponseTemplate::new(200).set_body_string(
                r#"---
title: Rust
slug: rust
description: Rust skill
category: AI
tags: [rust]
author: testuser
---
# Rust Skill
Content
"#,
            ),
        )
        .mount(&server)
        .await;

    server
}

#[tokio::test]
async fn add_installs_skill_from_github() {
    let mock_server = setup_mock_github().await;
    let tmp = TempDir::new().unwrap();

    let mut cmd = Command::cargo_bin("grail").unwrap();
    cmd.env("GRAIL_HOME", tmp.path())
        .env("GRAIL_GITHUB_API", mock_server.uri())
        .arg("add")
        .arg("owner/test-skills")
        .arg("--skill")
        .arg("vue")
        .assert()
        .success()
        .stdout(contains("vue"));

    let skill_dir = tmp.path().join("skills").join("vue");
    assert!(skill_dir.exists(), "vue skill should be installed");
    assert!(
        skill_dir.join("SKILL.md").exists(),
        "SKILL.md should exist"
    );

    // Verify the content was properly downloaded
    let content = std::fs::read_to_string(skill_dir.join("SKILL.md")).unwrap();
    assert!(content.contains("title: Vue"), "should have frontmatter");
    assert!(content.contains("slug: vue"), "should have slug");
}

#!/usr/bin/env python3
"""Collect failed GitHub Actions check logs into a sorted Markdown error table."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.request
from dataclasses import dataclass
from pathlib import Path


ANSI_ESCAPE = re.compile(r"\x1B\[[0-?]*[ -/]*[@-~]")
ERROR_MARKER = re.compile(
    r"(?:\b(?:error|failed|failure|invalid|broken|missing|unreachable|violation)\b|❌)",
    re.IGNORECASE,
)
LOCATION_PATTERNS = (
    re.compile(
        r"(?P<file>(?:\.?/?[\w@.+-]+/)*[\w@.+-]+\.(?:html?|md|css|js|mjs|json|ya?ml|svg|py))"
        r":(?P<line>\d+)(?::\d+)?"
    ),
    re.compile(
        r"(?P<file>(?:\.?/?[\w@.+-]+/)*[\w@.+-]+\.(?:html?|md|css|js|mjs|json|ya?ml|svg|py))"
        r"\((?P<line>\d+)(?:,\d+)?\)"
    ),
)
CHECK_KEYWORDS = {
    "html": "html",
    "markdown": "markdown",
    "spellcheck": "spell",
    "assets": "asset",
    "i18n": "translation",
    "dead-code": "dead code",
    "accessibility": "accessibility",
    "links": "link",
}


@dataclass(frozen=True, order=True)
class QualityError:
    repository: str
    file: str
    line: int
    check: str
    message: str


def api_get(url: str, token: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    with urllib.request.urlopen(request) as response:  # noqa: S310 - GitHub API URL is constructed below.
        return response.read()


def paged_jobs(repository: str, run_id: str, token: str) -> list[dict]:
    jobs: list[dict] = []
    page = 1
    while True:
        url = (
            f"https://api.github.com/repos/{repository}/actions/runs/{run_id}/jobs"
            f"?per_page=100&page={page}"
        )
        payload = json.loads(api_get(url, token))
        jobs.extend(payload.get("jobs", []))
        if len(jobs) >= payload.get("total_count", 0) or not payload.get("jobs"):
            return jobs
        page += 1


def failed_check_keywords(needs_json: str) -> set[str]:
    needs = json.loads(needs_json or "{}")
    return {
        CHECK_KEYWORDS[check]
        for check, value in needs.items()
        if value.get("result") == "failure" and check in CHECK_KEYWORDS
    }


def is_requested_check(job: dict, keywords: set[str]) -> bool:
    name = job.get("name", "").lower()
    return any(keyword in name for keyword in keywords)


def normalise_file(value: str) -> str:
    return value.removeprefix("./").replace("\\", "/")


def clean_message(value: str) -> str:
    value = ANSI_ESCAPE.sub("", value)
    value = re.sub(r"^\d{4}-\d{2}-\d{2}T[^ ]+Z\s+", "", value)
    return " ".join(value.strip().split())[:600]


def find_locations(text: str) -> list[tuple[str, int]]:
    locations: list[tuple[str, int]] = []
    for pattern in LOCATION_PATTERNS:
        for match in pattern.finditer(text):
            locations.append((normalise_file(match.group("file")), int(match.group("line"))))
    return locations


def parse_log(repository: str, check: str, log: str) -> list[QualityError]:
    lines = [ANSI_ESCAPE.sub("", line) for line in log.splitlines()]
    errors: list[QualityError] = []
    source_positions: set[tuple[str, int, str]] = set()

    for index, raw_line in enumerate(lines):
        context = " ".join(lines[max(0, index - 2): min(len(lines), index + 3)])
        locations = find_locations(raw_line)
        if locations and ERROR_MARKER.search(context):
            for file, line in locations:
                key = (file, line, clean_message(raw_line))
                if key in source_positions:
                    continue
                source_positions.add(key)
                errors.append(QualityError(repository, file, line, check, clean_message(raw_line)))

    # Some tools only report an endpoint or a general problem. Retain those as
    # log-line references so a failed check never silently disappears.
    for index, raw_line in enumerate(lines, start=1):
        message = clean_message(raw_line)
        if ERROR_MARKER.search(message) and not find_locations(raw_line):
            errors.append(
                QualityError(repository, f"workflow-log/{check}.log", index, check, message)
            )

    return errors


def markdown_escape(value: str) -> str:
    return value.replace("|", "\\|").replace("`", "\\`")


def write_summary(path: Path, errors: list[QualityError], failed_jobs: list[dict]) -> None:
    with path.open("a", encoding="utf-8") as summary:
        summary.write("\n## Fehlerdetails\n\n")
        if not failed_jobs:
            summary.write("Keine fehlgeschlagenen Qualitätschecks.\n")
            return

        summary.write("Sortiert nach Repository, Datei und Zeile. Ein Eintrag unter "
                      "`workflow-log/` verweist auf die betreffende Zeile im Job-Log, "
                      "wenn ein Tool keine Quelldatei ausgibt.\n\n")
        summary.write("| Repository | Datei | Zeile | Check | Fehler |\n")
        summary.write("|---|---|---:|---|---|\n")
        for error in sorted(set(errors)):
            summary.write(
                f"| `{markdown_escape(error.repository)}` | `{markdown_escape(error.file)}` | "
                f"{error.line} | {markdown_escape(error.check)} | "
                f"{markdown_escape(error.message)} |\n"
            )

        if not errors:
            names = ", ".join(job.get("name", "unbekannter Check") for job in failed_jobs)
            summary.write(f"| `{os.environ['GITHUB_REPOSITORY']}` | `workflow-log` | 0 | "
                          f"Pipeline | Fehlgeschlagene Jobs ohne auslesbare Meldung: "
                          f"{markdown_escape(names)} |\n")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--summary", type=Path, required=True)
    parser.add_argument("--needs-json", required=True)
    arguments = parser.parse_args()

    repository = os.environ["GITHUB_REPOSITORY"]
    run_id = os.environ["GITHUB_RUN_ID"]
    token = os.environ["GITHUB_TOKEN"]
    keywords = failed_check_keywords(arguments.needs_json)
    jobs = paged_jobs(repository, run_id, token)
    failed_jobs = [
        job for job in jobs
        if job.get("conclusion") == "failure" and is_requested_check(job, keywords)
    ]

    errors: list[QualityError] = []
    for job in failed_jobs:
        job_id = job["id"]
        log_url = f"https://api.github.com/repos/{repository}/actions/jobs/{job_id}/logs"
        try:
            log = api_get(log_url, token).decode("utf-8", errors="replace")
        except Exception as error:  # Keep the summary available even if log retrieval is unavailable.
            errors.append(
                QualityError(repository, f"workflow-log/{job_id}", 0, job.get("name", "check"), str(error))
            )
            continue
        errors.extend(parse_log(repository, job.get("name", "check"), log))

    write_summary(arguments.summary, errors, failed_jobs)
    return 0


if __name__ == "__main__":
    sys.exit(main())

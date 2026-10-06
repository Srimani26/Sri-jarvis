#!/usr/bin/env python3
"""
J.A.R.V.I.S. MARK-V Git History Credential Remediator
Uses git-filter-repo to rewrite history:
1. Strips all plaintext credential patterns from all historical blobs.
2. Strips all Base64-obfuscated credential blocks from all historical blobs.
3. Purges .jarvis-keys.json from all commit trees.
4. Scrubs legacy git author/committer emails containing ghp_ personal access tokens.
"""

import sys
import re
import base64
import git_filter_repo

PATTERNS = [
    re.compile(rb'AIza[0-9A-Za-z\-_]{35}'),
    re.compile(rb'gsk_[a-zA-Z0-9]{20,}'),
    re.compile(rb'sk-or-v1-[a-zA-Z0-9]{32,}'),
    re.compile(rb'sk-(?:proj-)?[a-zA-Z0-9]{32,}'),
    re.compile(rb'sk-ant-[a-zA-Z0-9_\-]{20,}'),
    re.compile(rb'mstrl_[a-zA-Z0-9]{20,}'),
    re.compile(rb'hf_[a-zA-Z0-9]{20,}'),
    re.compile(rb'ghp_[a-zA-Z0-9]{30,}'),
]

REDACTED_TEXT = b'[REDACTED_CREDENTIAL]'
REDACTED_B64 = base64.b64encode(REDACTED_TEXT)

def scrub_content(data: bytes) -> bytes:
    # 1. Plaintext pattern replacement
    for pat in PATTERNS:
        data = pat.sub(REDACTED_TEXT, data)

    # 2. Base64 encoded block replacement
    def replace_b64(match):
        quote = match.group(1)
        b64_str = match.group(2)
        try:
            decoded = base64.b64decode(b64_str)
            for pat in PATTERNS:
                if pat.search(decoded):
                    return quote + REDACTED_B64 + quote
        except Exception:
            pass
        return match.group(0)

    data = re.sub(rb'([\'"])([A-Za-z0-9+/=]{40,})([\'"])', replace_b64, data)
    return data

def blob_callback(blob, metadata):
    if blob and blob.data:
        blob.data = scrub_content(blob.data)

def email_callback(email):
    if email and b'ghp_' in email:
        return b'ksrimani46@gmail.com'
    return email

def name_callback(name):
    if name and b'ghp_' in name:
        return b'Srimani Kandan'
    return name

def filename_callback(filename):
    if filename == b'.jarvis-keys.json':
        return None
    return filename

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    print("Starting Git history credential remediation via git-filter-repo...")
    opts = git_filter_repo.FilteringOptions.default_options()
    opts.force = True
    opts.refs = ['refs/heads/main', 'HEAD']

    filter_engine = git_filter_repo.RepoFilter(
        opts,
        blob_callback=blob_callback,
        email_callback=email_callback,
        name_callback=name_callback,
        filename_callback=filename_callback,
    )
    filter_engine.run()
    print("✅ Git history remediation complete.")

if __name__ == '__main__':
    main()

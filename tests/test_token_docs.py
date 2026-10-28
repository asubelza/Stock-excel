#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Focused non-e2e tests for the token-docs parser/generator (rediseño_aws_v2, spec #250).

Covers spec FR-TD-01 / FR-TD-02 and acceptance AC-TD-01:
- FR-TD-01: Parse static/src/css/tokens.css and extract all CSS custom properties
            (--color-*, --spacing-*, --font-*, --radius-*, --shadow-*,
             --transition-*, --z-*, --breakpoint-*)
- FR-TD-02: Output structured JSON { category: { tokenName: { value, description,
            type, darkValue? } } }
- AC-TD-01: Parser extracts all tokens — count tokens in CSS vs JSON = 100% match

Uses only the standard library and Node (to run the parser). No server, no
browser, no DB writes. Token values are never changed — documentation is
descriptive only.
"""

import json
import os
import re
import subprocess
import sys
import unittest

# Add project root to path so sibling modules are importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS_PATH = os.path.join(ROOT, 'static', 'src', 'css', 'tokens.css')
PARSER = os.path.join(ROOT, 'scripts', 'tokens-to-json.js')
JSON_OUT = os.path.join(ROOT, 'docs', 'tokens.json')
MD_OUT = os.path.join(ROOT, 'docs', 'tokens.md')

# Custom-property name: token names keep the leading "--" stripped, e.g.
# --color-brand-500 -> "color-brand-500"
_DECL_RE = re.compile(r'--([a-zA-Z][a-zA-Z0-9-]*)\s*:\s*([^;]*?);', re.DOTALL)


def read_css():
    with open(CSS_PATH, 'r', encoding='utf-8') as f:
        return f.read()


def css_light_values(css):
    """First occurrence of each token = its light-mode value.

    tokens.css declares the light :root block first, then :root[data-theme="dark"]
    overrides and media-query overrides. Taking the first value per name yields
    the base (light) token value, which is what the JSON documents.
    """
    values = {}
    for match in _DECL_RE.finditer(css):
        name = match.group(1)
        value = match.group(2).strip()
        if name not in values:
            values[name] = value
    return values


def load_json():
    with open(JSON_OUT, 'r', encoding='utf-8') as f:
        return json.load(f)


def json_index(data):
    """Flatten {category: {tokenName: entry}} -> {tokenName: entry}."""
    index = {}
    for category, tokens in data.items():
        for token_name, entry in tokens.items():
            index[token_name] = entry
    return index


class TestTokenDocsParserRuns(unittest.TestCase):
    """The generator script runs cleanly and produces both artifacts."""

    def test_parser_exits_zero(self):
        result = subprocess.run(
            ['node', PARSER],
            capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, msg=result.stderr)

    def test_artifacts_exist(self):
        # Ensure artifacts are present (parser already ran in prior test, but
        # make this test independent).
        subprocess.run(['node', PARSER], capture_output=True, text=True)
        self.assertTrue(os.path.exists(JSON_OUT), 'docs/tokens.json missing')
        self.assertTrue(os.path.exists(MD_OUT), 'docs/tokens.md missing')

    def test_parser_is_idempotent(self):
        first = subprocess.run(['node', PARSER], capture_output=True, text=True)
        with open(JSON_OUT, 'rb') as f:
            first_bytes = f.read()
        second = subprocess.run(['node', PARSER], capture_output=True, text=True)
        with open(JSON_OUT, 'rb') as f:
            second_bytes = f.read()
        self.assertEqual(first.returncode, 0)
        self.assertEqual(second.returncode, 0)
        self.assertEqual(first_bytes, second_bytes, 'Parser output is not idempotent')


class TestTokenDocsJsonStructure(unittest.TestCase):
    """FR-TD-02: structured JSON shape { category: { tokenName: {...} }}."""

    def setUp(self):
        self.data = load_json()

    def test_top_level_are_categories(self):
        self.assertIsInstance(self.data, dict)
        for category, tokens in self.data.items():
            self.assertIsInstance(category, str)
            self.assertIsInstance(tokens, dict)

    def test_each_entry_has_required_fields(self):
        for category, tokens in self.data.items():
            for token_name, entry in tokens.items():
                self.assertIn('name', entry)
                self.assertIn('value', entry)
                self.assertIn('description', entry)
                self.assertIn('type', entry)
                self.assertTrue(entry['name'].startswith('--'),
                                f"name must start with '--': {entry['name']}")
                # darkValue is optional, but when present must be a string
                if 'darkValue' in entry:
                    self.assertIsInstance(entry['darkValue'], str)

    def test_no_empty_values(self):
        for category, tokens in self.data.items():
            for token_name, entry in tokens.items():
                self.assertNotEqual(entry['value'], '',
                                    f"empty value for {token_name}")


class TestTokenDocsCoverage(unittest.TestCase):
    """FR-TD-01 + AC-TD-01: every CSS token is in JSON, 100% match, values unchanged."""

    def setUp(self):
        self.css = read_css()
        self.css_values = css_light_values(self.css)
        self.data = load_json()
        self.json_index = json_index(self.data)

    def test_all_css_tokens_present_in_json(self):
        """AC-TD-01: 100% match — every CSS token name appears in JSON."""
        missing = [n for n in self.css_values if n not in self.json_index]
        extra = [n for n in self.json_index if n not in self.css_values]
        self.assertEqual(missing, [],
                         f"{len(missing)} CSS tokens missing from JSON: {missing[:10]}")
        self.assertEqual(extra, [],
                         f"{len(extra)} JSON tokens not in CSS: {extra[:10]}")

    def test_token_count_matches(self):
        """AC-TD-01: count of CSS tokens equals count of JSON entries."""
        self.assertEqual(len(self.css_values), len(self.json_index))

    def test_token_values_unchanged(self):
        """Documented values are identical to the source CSS (descriptive only)."""
        mismatches = []
        for name, css_value in self.css_values.items():
            json_value = self.json_index[name]['value']
            if json_value != css_value:
                mismatches.append((name, css_value, json_value))
        self.assertEqual(mismatches, [],
                         f"{len(mismatches)} value mismatches: {mismatches[:5]}")

    def test_required_categories_present(self):
        """Every spec category (color/spacing/font/radius/shadow/transition/z/breakpoint)
        is represented in the documented tokens."""
        css = self.css
        self.assertIn('--color-brand-500', css)
        self.assertIn('--space-4', css)
        self.assertIn('--font-size-body', css)
        self.assertIn('--radius-md', css)
        self.assertIn('--shadow-level-2', css)
        self.assertIn('--transition-normal', css)
        self.assertIn('--z-index-modal', css)
        self.assertIn('--breakpoint-md', css)
        # And each has a JSON entry
        for name in ['color-brand-500', 'space-4', 'font-size-body', 'radius-md',
                     'shadow-level-2', 'transition-normal', 'z-index-modal',
                     'breakpoint-md']:
            self.assertIn(name, self.json_index, f"missing JSON entry for {name}")

    def test_dark_values_captured(self):
        """Dark-mode overrides are recorded as darkValue where they differ from light."""
        surface = self.json_index['color-surface-card']
        self.assertEqual(surface['darkValue'], 'var(--color-neutral-800)')
        text = self.json_index['color-text-primary']
        self.assertEqual(text['darkValue'], 'var(--color-neutral-50)')
        border = self.json_index['color-border-default']
        self.assertEqual(border['darkValue'], 'var(--color-neutral-700)')
        # Tokens NOT overridden in dark mode have no darkValue
        self.assertNotIn('darkValue', self.json_index['color-brand-500'])

    def test_descriptions_from_source(self):
        """@token comment descriptions are carried into the JSON."""
        self.assertEqual(
            self.json_index['color-brand-50']['description'],
            'Brand color scale extracted from logo, used for primary actions and links',
        )
        self.assertEqual(
            self.json_index['radius-md']['description'],
            'Border radius scale from none to full for component corners',
        )


class TestTokenDocsMarkdown(unittest.TestCase):
    """Human-readable Markdown docs under docs/ contain name, value, category, usage."""

    def setUp(self):
        with open(MD_OUT, 'r', encoding='utf-8') as f:
            self.md = f.read()

    def test_markdown_has_title_and_intro(self):
        self.assertIn('# ECJY Design Tokens', self.md)
        self.assertIn('descriptive only', self.md)
        self.assertIn('token values are **unchanged**', self.md)

    def test_markdown_contains_sample_tokens(self):
        for token in ['--color-brand-500', '--space-4', '--radius-md', '--shadow-level-2',
                      '--transition-normal', '--z-index-modal', '--breakpoint-md']:
            self.assertIn(token, self.md, f"Markdown missing token {token}")

    def test_markdown_has_category_sections(self):
        for section in ['Color tokens', 'Spacing tokens', 'Typography tokens',
                        'Radius tokens', 'Shadow tokens', 'Transition tokens',
                        'Z-index tokens', 'Component tokens', 'Legacy tokens']:
            self.assertIn(section, self.md, f"Markdown missing section {section}")

    def test_markdown_has_table_structure(self):
        self.assertIn('| Token | Value | Type | Usage / Description | Dark value |', self.md)
        self.assertIn('|-------|-------|------|---------------------|------------|', self.md)


if __name__ == '__main__':
    unittest.main(verbosity=2)

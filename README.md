# filedx

CLI tool to monitor source code and large asset file integrity.

## Introduction

**filedx** is a command-line utility designed to help you track and verify the integrity of files in your projects. It creates a database of file hashes and allows you to scan, verify, and diff files against that database to detect changes, corruption, or unauthorized modifications.

Key features:
- Initialize a file integrity database
- Scan files and build a hash database
- Verify file integrity against the database
- Display differences between current files and stored hashes

## Installation

```bash
npm install
```

Or install globally:

```bash
npm install -g .
```

## Usage

```bash
# Initialize the database
filedx init

# Scan files and build the database
filedx scan

# Verify file integrity
filedx verify

# Show differences
filedx diff

```

### Options

Each command supports the `-d, --db <DBPATH>` option to specify a custom database file path (default: `.filedxdb`).

```bash
filedx scan --db /path/to/custom.db
```

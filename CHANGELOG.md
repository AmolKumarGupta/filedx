# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-08-16

### Added
- **init command**: Initialize a new file integrity database (`.filedxdb`) with file existence check and colored output
- **scan command**: Scan files and build a hash database for integrity tracking
- **verify command**: Verify file integrity against the stored hash database
- **diff command**: Display differences between current files and stored hashes
- **compare module**: Compare current file state with database records
- **database module**: SQLite-based database for storing file hashes and metadata
- **scanner module**: Directory traversal with configurable ignore rules
- **hash module**: File hashing utilities using Node.js crypto
- **walk module**: File system walker with basename-only ignore rule support
- **promises module**: Promise-based utilities for async operations
- **CLI framework**: Commander.js based command-line interface with colored output (picocolors)
- **Test suite**: Unit tests for hash, compare, scanner, database, promises, and app modules
- **Biome integration**: Linting and formatting with Biome

### Fixed
- Database file (`.filedxdb`) is now properly ignored during scan operations when using `--db` option
- Input validation and defensive programming improvements across modules
- Replaced `console.log` with `process.stdout.write` for consistent output handling
- Tightened Biome lint rules for better code quality

### Changed
- Applied basename-only ignore rules to file names in walker module
- Improved test coverage for compare module

### Security
- Added input validation to prevent injection attacks
- Implemented defensive programming practices across all modules

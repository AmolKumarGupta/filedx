# Architecture of .filedxdb

### Overall File Layout

```
+--------------------------------------------------+
| Header (56 Bytes)                                |
+--------------------------------------------------+
| File Entry Table (File Count * 46 Bytes)          |
+--------------------------------------------------+
| Path Pool (Variable Length UTF-8 Strings)        |
+--------------------------------------------------+
| Hash Pool (Variable Length Raw Binary Digests)   |
+--------------------------------------------------+

```


### Header Struct (56 Bytes Fixed)

| Offset (Bytes) | Field Name | Data Type | Description |
| --- | --- | --- | --- |
| `0..7` | `magic` | `char[8]` | Signature string (`FILEDX01`) |
| `8..9` | `version` | `uint16` | Schema version (Default: `1`) |
| `10..11` | `flags` | `uint16` | Global index flags |
| `12..15` | `file_count` | `uint32` | Total number of tracked files |
| `16..23` | `created_at` | `uint64` | Creation timestamp (UNIX epoch milliseconds) |
| `24..31` | `updated_at` | `uint64` | Last update timestamp |
| `32..39` | `file_table_offset` | `uint64` | Pointer to start of File Entry Table |
| `40..47` | `path_pool_offset` | `uint64` | Pointer to start of Path Pool |
| `48..55` | `hash_pool_offset` | `uint64` | Pointer to start of Hash Pool |


### File Entry Struct (46 Bytes Fixed)

Each entry represents one file. Fixed sizing allows jumping directly to file `n` via:

```
Offset = HEADER_SIZE + (n * FILE_ENTRY_SIZE)
```

| Offset (Bytes) | Field Name | Data Type | Description |
| --- | --- | --- | --- |
| `0..7` | `path_offset` | `uint64` | Pointer to UTF-8 path location in Path Pool |
| `8..11` | `path_length` | `uint32` | Length of path string in bytes |
| `12..19` | `hash_offset` | `uint64` | Pointer to binary digest location in Hash Pool |
| `20..21` | `hash_length` | `uint16` | Length of raw digest (32 bytes for SHA-256) |
| `22..29` | `file_size` | `uint64` | File size in bytes (Supports >18 Exabytes) |
| `30..37` | `modified_at` | `uint64` | File modification time (`mtime` in ms) |
| `38..41` | `permissions` | `uint32` | UNIX file permissions (e.g., `0o644`) |
| `42..45` | `flags` | `uint32` | Bitwise status flags (`0x01` deleted, `0x02` symlink, etc.) |


### Data Pools & Root Hash

* **Path Pool:** Sequentially stores raw UTF-8 file path strings.
* **Hash Pool:** Stores raw **32-byte binary buffers** instead of 64-character hex strings, saving 50% storage space per hash.


# Module API

### Serialization

```js
function serializeIndex(array<file>): Buffer
```

```ts
type file {
    path: string,
    hash: bytes,
    size: uint64,
    modifiedAt: uint64,
    permissions: uint32,
    flags: uint32,
}
```

### Deserialization

```js
function deserializeIndex(Buffer): array<file>
```
